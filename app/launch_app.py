#!/usr/bin/env python3
import subprocess

# electron_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.bin/electron"
# main_script_path = "/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.dev/main/index.js"
print('test1234')
subprocess.call(['/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/dist/v0.0.1/mac-arm64/GithubVideoCompressor.app/Contents/MacOS/GithubVideoCompressor'])

# import os
# import subprocess

# # Set the current working directory
# abs_path = os.path.dirname(os.path.abspath(__file__))

# # Relative paths to the Electron binary and the main script
# electron_path = f"{abs_path}/node_modules/.bin/electron"
# main_script_path = f"{abs_path}/node_modules/.dev/main/index.js"
# print(electron_path)
# print(main_script_path)


# # Execute the command
# subprocess.call([electron_path, main_script_path])
