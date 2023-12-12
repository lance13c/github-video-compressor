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

def generate_identifier():
    color = random.choice(colors)
    animal = random.choice(animals)
    return f"{color} {animal}"

def read_native_message(stdin, ws, client_id):
    """Read a message with length prefix from stdin."""
    try:
        text_length_bytes = stdin.read(4)
        if not text_length_bytes:
            return None
        text_length = struct.unpack('I', text_length_bytes)[0]
        message = stdin.read(text_length)
        if not message:
            return None

        # Send the raw JSON message for debugging
        return message
    except Exception as e:
        send_debug_message(ws, f"Error: {str(e)}", client_id)
        return None
        
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

def read_from_extension(input_queue):
    while True:
        data = read_native_message()  # Implement this function
        input_queue.put(data)

def write_to_electron(output_queue, proc):
    while True:
        data = output_queue.get()  # Blocks until data is available
        proc.stdin.write(data)
        proc.stdin.flush()

def read_from_electron(proc, output_queue):
    while True:
        data = proc.stdout.readline()
        output_queue.put(data)

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
    proc = subprocess.Popen([electron_path, main_script_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)

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
        data = read_native_message(sys.stdin.buffer, ws, client_id)
        if data:
            send_debug_message(ws, f"Received data: {data}", client_id) 
            proc.stdin.buffer.write(data)
            proc.stdin.buffer.flush()
            send_as_json_string(ws, data, client_id, source="extension")
        else:
            send_debug_message(ws, "No data received.", client_id)
            time.sleep(0.1)

def relay_output_to_stdout(proc, ws):
    try:
        while True:
            data = proc.stdout.buffer.read1(1024)
            if data:
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
                send_as_json_string(ws, data, client_id, source="desktop-app")
            else:
                break
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stdout: {e}\n")

def relay_output_to_stderr(proc, ws):
    try:
        while True:
            data = proc.stderr.buffer.read1(1024)
            if data:
                sys.stderr.buffer.write(data)
                sys.stderr.buffer.flush()
                # Send this data over WebSocket
                send_as_json_string(ws, data, client_id, source="desktop-app-stderr")
            else:
                break
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stderr: {e}\n")

# Start WebSocket connection in a separate thread
ws_thread = threading.Thread(target=ws.run_forever)
ws_thread.start()


