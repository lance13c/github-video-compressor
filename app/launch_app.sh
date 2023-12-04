#!/bin/bash
/bin/echo "Script started" >> /tmp/launch_app_log.txt
/Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.bin/electron /Users/dominic.cicilio/Documents/repos/github-video-compressor/app/node_modules/.dev/main/index.js
/bin/echo "Script ended" >> /tmp/launch_app_log.txt
