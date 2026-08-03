@echo off
echo ============================================================
echo   Starting AI Digital Twin Stack in One Go...
echo ============================================================
echo [1/3] Starting Database Services (PostgreSQL & Redis)...
docker compose up -d postgres redis

echo [2/3] Launching Node.js Backend, FastAPI Backend, and Frontend...
npx --yes concurrently --kill-others ^
  "npm --prefix node-backend run dev" ^
  "cd fastapi-backend && venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload" ^
  "npm --prefix frontend run dev"
