@echo off
start chrome http://localhost:5000/card.html --auto-open-devtools-for-tabs 
node server.js
