#!/usr/bin/env python3

import atexit
import json
import random
import subprocess
import sys
import threading
import time

import websocket

colors = ["red", "blue", "green", "yellow", "pink", "black", "white", "purple", "orange", "brown"]
animals = ["lion", "tiger", "bear", "flamingo", "eagle", "dolphin", "shark", "wolf", "fox", "deer"]

def generate_identifier():
    color = random.choice(colors)
    animal = random.choice(animals)
    return f"{color} {animal}"

def read_native_message(stdin):
    """Read a message with length prefix from stdin."""
    text_length_bytes = stdin.read(4)
    if not text_length_bytes:
        return None
    text_length = struct.unpack('I', text_length_bytes)[0]
    return stdin.read(text_length)

def send_as_json_string(ws, data, client_id, source, message_type="data"):
    """Send data as a JSON string over WebSocket."""
    try:
        # Attempt to parse bytes as JSON
        json_data = json.loads(data.decode('utf-8', errors='ignore'))
        data = json.dumps(json_data)
    except json.JSONDecodeError:
        # If it's not JSON, send it as a plain string
        data = data.decode('utf-8', errors='ignore')

    message = json.dumps({
        'type': message_type,
        'source': source,  # Indicate the source of the message
        'client_id': client_id,
        'data': data
    })
    ws.send(message)

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
        data = read_native_message(sys.stdin.buffer)
        if data:
            # Forward raw data to the Electron app
            proc.stdin.buffer.write(data)
            proc.stdin.buffer.flush()

            # Send processed data to WebSocket, indicating it's from the extension
            send_as_json_string(ws, data, client_id, source="extension")
        else:
            break

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


# Start WebSocket connection in a separate thread
ws_thread = threading.Thread(target=ws.run_forever)
ws_thread.start()

# Dev Server Path
electron_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
main_script_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.dev/main/index.js"
# Start Electron subprocess
proc = subprocess.Popen([electron_path, main_script_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)

# Start threads to relay data
threading.Thread(target=relay_input_to_subprocess, args=(proc,ws), daemon=True).start()
threading.Thread(target=relay_output_to_stdout, args=(proc,ws), daemon=True).start()

time.sleep(1)
## Initialize, send start message
send_as_json_string(ws, "Client started", client_id, message_type="start")

def cleanup():
  proc.stdin.close()
  proc.terminate()
  proc.wait()
  if ws:
    ws.close()

atexit.register(cleanup)
proc.wait()
