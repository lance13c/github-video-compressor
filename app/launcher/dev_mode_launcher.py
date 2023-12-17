#!/usr/bin/env python3

import atexit
import json
import queue
import random
import struct
import subprocess
import sys
import threading
import time

import backoff
import websocket

input_queue = queue.Queue()
output_queue = queue.Queue()

colors = ["red", "blue", "green", "yellow", "pink", "black", "white", "purple", "orange", "brown"]
animals = ["lion", "tiger", "bear", "flamingo", "eagle", "dolphin", "shark", "wolf", "fox", "deer"]

# Debug
def send_debug_message(ws, debug_message, client_id):
    try:
        if ws.sock and ws.sock.connected:
            message = json.dumps({
                'type': 'debug',
                'client_id': client_id,
                'source': 'proxy',
                'data': debug_message
            })
            ws.send(message)
        else:
            print("WebSocket is not connected.")
    except Exception as e:
        print(f"WebSocket send error: {e}")

def generate_identifier():
    color = random.choice(colors)
    animal = random.choice(animals)
    return f"{color} {animal}"

# Generate client id
client_id = generate_identifier()


# dataSource can be either stdin or stdout
def read_native_message(dataSource, client_id):
    try:
        text_length_bytes = dataSource.read(4)
        if not text_length_bytes:
            return None, None
        text_length = struct.unpack('I', text_length_bytes)[0]
        message = dataSource.read(text_length)
        if not message:
            return None, None

        # Decode the message and parse as JSON
        try:
            decoded_message = message.decode('utf-8')
            json_message = json.loads(decoded_message)
        except (UnicodeDecodeError, json.JSONDecodeError):
            decoded_message = message.decode('utf-8', errors='ignore')
            json_message = decoded_message  # Send the decoded string as is

        raw_message = text_length_bytes + message
        return raw_message, json_message
    except Exception as e:
        return None, f"Error: {str(e)}"

# Sends native message to chrome extension
# Data should be serializable json
def send_message_to_chrome_extension(data, client_id):
    encoded_message = json.dumps(data).encode('utf-8')
    message_length = len(encoded_message)
    sys.stdout.buffer.write(struct.pack('I', message_length))
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()
        
def send_as_json_string(ws, data, client_id, source, message_type="data"):
    """Send data as a JSON string over WebSocket."""
    if isinstance(data, bytes):
        try:
            # Attempt to parse bytes as JSON
            json_data = json.loads(data.decode('utf-8'))
            data = json.dumps(json_data)
        except json.JSONDecodeError as e:
            # send_debug_message(ws, f"JSONDecodeError: {str(e)}", client_id)
            data = data.decode('utf-8')
    
    message = json.dumps({
        'type': message_type,
        'source': source,
        'client_id': client_id,
        'data': data
    })
    ws.send(message)

# Proxy Heartbeat
def run_is_alive(ws, client_id):
    while True:
        send_as_json_string(ws, "proxy is alive", client_id, source="proxy", message_type="is_alive")
        time.sleep(7)

# Subprocess
# Global variable to keep track of the subprocess
proc = None
input_thread_active = False
output_thread_active = False
stderr_thread_active = False

def cleanup():
    global proc, input_thread_active, output_thread_active, stderr_thread_active
    # Stop the threads
    input_thread_active = False
    output_thread_active = False
    stderr_thread_active = False

    if (proc):
      proc.stdin.close()
      proc.terminate()
      proc.wait()
   

# Start Electron subprocess
def start_subprocess(ws):
    # Dev Server Path
    global proc
    electron_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
    main_script_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.dev/main/index.js"
    # Start Electron subprocess
    proc = subprocess.Popen([electron_path, main_script_path],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        bufsize=0)

    # Start threads to relay data
    threading.Thread(target=run_is_alive, args=(ws, client_id), daemon=True).start()
    threading.Thread(target=relay_input_to_subprocess, args=(proc,ws), daemon=True).start()
    threading.Thread(target=relay_output_to_stdout, args=(proc,ws), daemon=True).start()
    threading.Thread(target=relay_output_to_stderr, args=(proc,ws), daemon=True).start()
    atexit.register(cleanup)
  
# New function to restart the subprocess
def restart_subprocess(ws):
    cleanup()
    start_subprocess(ws)

# Dev Server Websocket Connection


def relay_input_to_subprocess(proc, ws):
    global input_thread_active
    while input_thread_active:
        raw_data, parsed_data = read_native_message(sys.stdin.buffer, client_id)
        if raw_data:
            if proc.poll() is not None:
                send_debug_message(ws, "Relay stdin subprocess has terminated.", client_id)
                restart_subprocess(ws)
                break

            try:
                # Send the raw data directly to subprocess
                proc.stdin.write(raw_data)
                proc.stdin.flush()

                # Send parsed data over WebSocket
                # if parsed_data:
                #     send_as_json_string(ws, parsed_data, client_id, source="proxy-stdin")
            except Exception as e:
                send_debug_message(ws, f"Error in sending data to subprocess: {str(e)}", client_id)
        else:
            send_debug_message(ws, "No data received.", client_id)
            time.sleep(0.1)


def relay_output_to_stdout(proc, ws):
    global stderr_thread_active
    send_debug_message(ws, "Output thread started", client_id)
    try: 
        while stderr_thread_active:
            if proc.poll() is not None:
                send_debug_message(ws, "Relay stdout subprocess has terminated.", client_id)
                break

            # Read the message using the existing read_native_message function
            raw_data, parsed_data = read_native_message(proc.stdout, client_id)
            if raw_data:
                # Write the raw data to the system's stdout
                send_message_to_chrome_extension(parsed_data, client_id)

                # Send the parsed JSON data over WebSocket
                if parsed_data:
                    send_as_json_string(ws, parsed_data, client_id, source="proxy-stdout")
            else:
                time.sleep(0.1)  # Add a short delay to prevent a tight loop
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stdout: {e}\n")


def relay_output_to_stderr(proc, ws):
    global stderr_thread_active
    send_debug_message(ws, "Stderr thread started", client_id)
    try:
        while stderr_thread_active:
            if proc.poll() is not None:
                send_debug_message(ws, "Relay stderr subprocess has terminated.", client_id)
                break
            data: bytes = proc.stderr.read(1024)
            if data:
                sys.stderr.write(data.decode('utf-8'))
                sys.stderr.flush()
                # Send this data over WebSocket
                send_as_json_string(ws, data, client_id, source="desktop-app-stderr")
            else:
                time.sleep(0.1)  # Add a short delay to prevent a tight loop
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stderr: {e}\n")

def on_message(ws, message):
    # Restart subprocess
    if (message == 'refresh'):
        send_debug_message(ws, "Refreshing subprocess", client_id)
        restart_subprocess(ws)
    else:
        send_debug_message(ws, f"Received message: {message}", client_id)
        

def on_error(ws, error):
    send_debug_message(ws, f"WebSocket error: {error}", client_id)

def on_close(ws, close_status_code, close_msg):
    send_debug_message(ws, f"WebSocket connection closed: {close_msg}", client_id)

def on_open(ws):
    ## Initialize, send start message
    send_as_json_string(ws, "Client started", client_id, 'proxy', message_type="start")
    start_subprocess(ws)


# WebSocket setup
ws_url = "ws://localhost:3333"
@backoff.on_exception(backoff.expo, websocket.WebSocketException, max_tries=8)
def reconnect():
    global ws
    ws = websocket.WebSocketApp(ws_url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()
    wst = threading.Thread(target=ws.run_forever)
    wst.start()

# Start WebSocket connection in a separate thread

reconnect()
