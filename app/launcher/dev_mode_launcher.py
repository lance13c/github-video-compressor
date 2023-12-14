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

        return message, json_message
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
            send_debug_message(ws, f"JSONDecodeError: {str(e)}", client_id)
            data = data.decode('utf-8')
    
    message = json.dumps({
        'type': message_type,
        'source': source,
        'client_id': client_id,
        'data': data
    })
    ws.send(message)

# def read_from_extension(input_queue):
#     while True:
#         data = read_native_message()  # Implement this function
#         input_queue.put(data)

# def write_to_electron(output_queue, proc):
#     while True:
#         data = output_queue.get()  # Blocks until data is available
#         proc.stdin.write(data)
#         proc.stdin.flush()

# def read_from_electron(proc, output_queue):
#     while True:
#         data = proc.stdout.readline()
#         output_queue.put(data)

# Proxy Heartbeat
def run_is_alive(ws, client_id):
    while True:
        send_as_json_string(ws, "proxy is alive", client_id, source="proxy", message_type="is_alive")
        time.sleep(3)

# Dev Server Websocket Connection
def on_message(ws, message):
    # Handle incoming WebSocket messages (optional)
    pass

def on_error(ws, error):
    sys.stderr.write(f"WebSocket error: {error}\n")

def on_close(ws, close_status_code, close_msg):
    sys.stderr.write("WebSocket connection closed\n")

def on_open(ws):
    sys.stderr.write("WebSocket connection opened\n")
    ## Initialize, send start message
    send_as_json_string(ws, "Client started", client_id, 'proxy', message_type="start")

    # Dev Server Path
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
    

    def cleanup():
      proc.stdin.close()
      proc.terminate()
      proc.wait()
      if ws:
        ws.close()

    atexit.register(cleanup)
    proc.wait()



# Generate client id
client_id = generate_identifier()

# WebSocket setup
ws_url = "ws://localhost:3333"
ws = websocket.WebSocketApp(ws_url,
  on_open=on_open,
  on_message=on_message,
  on_error=on_error,
  on_close=on_close)
  
def relay_input_to_subprocess(proc, ws):
    while True:
        raw_data, parsed_data = read_native_message(sys.stdin.buffer, client_id)
        if raw_data:
            if proc.poll() is not None:
                send_debug_message(ws, "Relay stdin subprocess has terminated.", client_id)
                break

            try:
                # Send the raw data directly to subprocess
                proc.stdin.write(raw_data)
                proc.stdin.flush()

                # Send parsed data over WebSocket
                if parsed_data:
                    send_as_json_string(ws, parsed_data, client_id, source="proxy-stdin")
            except Exception as e:
                send_debug_message(ws, f"Error in sending data to subprocess: {str(e)}", client_id)
        else:
            send_debug_message(ws, "No data received.", client_id)
            time.sleep(0.1)


def relay_output_to_stdout(proc, ws):
    send_debug_message(ws, "Output thread started", client_id)
    try: 
        while True:
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
    send_debug_message(ws, "Stderr thread started", client_id)
    try:
        while True:
            if proc.poll() is not None:
                send_debug_message(ws, "Relay stderr subprocess has terminated.", client_id)
                break
            data = proc.stderr.buffer.read1(1024)
            if data:
                sys.stderr.buffer.write(data)
                sys.stderr.buffer.flush()
                # Send this data over WebSocket
                send_as_json_string(ws, data, client_id, source="desktop-app-stderr")
            else:
                time.sleep(0.1)  # Add a short delay to prevent a tight loop
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stderr: {e}\n")

# Start WebSocket connection in a separate thread
ws_thread = threading.Thread(target=ws.run_forever)
ws_thread.start()


