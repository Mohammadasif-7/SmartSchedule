# SmartSched AI — Local Hackathon Project

Based on the provided PS2605 Intelligent Timetable Management System concept.

## 1. Backend

Open terminal:

```bash
cd backend
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install:
```bash
pip install -r requirements.txt
```

Run:
```bash
uvicorn main:app --reload --port 8000
```

Backend:
http://127.0.0.1:8000

API docs:
http://127.0.0.1:8000/docs

## 2. Frontend

Open `frontend/index.html` using VS Code Live Server.

Expected frontend URL:
http://127.0.0.1:5500/frontend/index.html

The frontend automatically connects to:
http://127.0.0.1:8000

## Note
SQLite is used for a simple local demo. For production/hackathon deployment, replace SQLite with MySQL/PostgreSQL as described in the project concept.
