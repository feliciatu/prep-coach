#!/bin/bash
cd "$(dirname "$0")"

pkill -f "node.*server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

node server.js > /tmp/prep-server.log 2>&1 &
disown $!
echo "Express started (PID $!)"

npx vite > /tmp/prep-vite.log 2>&1 &
disown $!
echo "Vite started (PID $!)"

sleep 4
echo ""
echo "=== Server log ==="
cat /tmp/prep-server.log
echo ""
echo "=== Vite log ==="
cat /tmp/prep-vite.log
