#!/usr/bin/env node
const path = require('path');
const { exec } = require('child_process');

// Set the current working directory
const absPath = path.dirname(__filename);

// Relative paths to the Electron binary and the main script
const electronPath = path.join(absPath, 'node_modules', '.bin', 'electron');
const mainScriptPath = path.join(absPath, 'node_modules', '.dev', 'main', 'index.js');

console.log(electronPath);
console.log(mainScriptPath);

// Execute the command
exec(`"${electronPath}" "${mainScriptPath}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});
