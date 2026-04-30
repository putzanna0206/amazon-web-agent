#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3.14 -m venv .venv
fi

source .venv/bin/activate
pip install -q -e ".[dev]"

echo "Starting Amazon Web Agent..."
echo "Open http://localhost:8000/static/index.html"
uvicorn app.main:app --reload --port 8000
