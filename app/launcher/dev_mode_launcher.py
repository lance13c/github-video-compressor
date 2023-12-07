#!/usr/bin/env python3

# import json
# import struct
# import sys
import atexit
import subprocess
import sys
import threading


def relay_input_to_subprocess(proc):
    while True:
        data = sys.stdin.buffer.read1(1024)
        if data:
            proc.stdin.buffer.write(data)
            proc.stdin.buffer.flush()
        else:
            break

def relay_output_to_stdout(proc):
    try:
        while True:
            data = proc.stdout.buffer.read1(1024)
            if data:
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
            else:
                break
    except Exception as e:
        sys.stderr.write(f"Error relaying output to stdout: {e}\n")

electron_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
main_script_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.dev/main/index.js"
proc = subprocess.Popen([electron_path, main_script_path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)

# Start threads to relay data
threading.Thread(target=relay_input_to_subprocess, args=(proc,), daemon=True).start()
threading.Thread(target=relay_output_to_stdout, args=(proc,), daemon=True).start()

def cleanup():
  proc.stdin.close()
  proc.terminate()
  proc.wait()

atexit.register(cleanup)
proc.wait()
