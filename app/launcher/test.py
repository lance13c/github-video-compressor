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

client_id = "TESTESTSET"

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

def on_message(ws, message):
    send_debug_message(ws, f"Received message: {message}", client_id)
    if (message == 'refresh'):
        send_debug_message(ws, "Received refresh message", client_id)

def on_error(ws, error):
    send_debug_message(ws, f"WebSocket error: {error}", client_id)

def on_close(ws, close_status_code, close_msg):
    send_debug_message(ws, f"WebSocket connection closed: {close_msg}", client_id)

def on_open(ws):
    ## Initialize, send start message
    send_as_json_string(ws, "Client started", client_id, 'proxy', message_type="start")

# WebSocket setup
ws_url = "ws://localhost:3333"
ws = websocket.WebSocketApp(ws_url,
  on_open=on_open,
  on_message=on_message,
  on_error=on_error,
  on_close=on_close)

# Start WebSocket connection in a separate thread
wst = threading.Thread(target=ws.run_forever)
wst.start()
