# HabitFlow — Digital Habit Tracker

A modern, full-stack habit tracking web application built with **React**, **Vite**, **FastAPI**, and **SQLite**.

---

## 📁 Project Structure

```text
habitflow/
├── backend/
│   ├── .venv/                 # Python virtual environment
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py            # FastAPI entry point with CORS & Health Check endpoint
│   ├── requirements.txt       # Python dependencies (fastapi, uvicorn, pydantic)
│   └── .gitignore             # Git ignore rules for backend
├── frontend/
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── App.jsx            # Main HabitFlow landing component & health widget
│   │   ├── App.css            # Dark mode glassmorphic styling
│   │   ├── main.jsx           # React DOM mount point
│   │   └── index.css          # Core CSS variables, resets & typography
│   ├── index.html             # HTML entry template with fonts
│   ├── package.json           # Frontend dependencies & npm scripts
│   ├── vite.config.js         # Vite configuration with backend API proxy
│   └── .gitignore             # Git ignore rules for frontend
└── README.md                  # Project documentation & execution guide
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.10 or higher)

---

## 🚀 Quick Start Guide

### 1. Setting up & Running the Backend (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD):**
     ```cmd
     python -m venv .venv
     .\.venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be running at `http://127.0.0.1:8000`.

---

### 2. Testing the Backend Health Check Endpoint

You can test the health-check endpoint using any of the following methods:

- **Browser:** Open `http://127.0.0.1:8000/api/health`
- **Interactive OpenAPI Documentation:** Open `http://127.0.0.1:8000/docs`
- **cURL / PowerShell:**
  ```bash
  curl http://127.0.0.1:8000/api/health
  ```
  Expected JSON Response:
  ```json
  {
    "status": "ok",
    "app": "HabitFlow — Digital Habit Tracker",
    "version": "0.1.0",
    "timestamp": "2026-09-04T16:57:04.840755+00:00"
  }
  ```

---

### 3. Setting up & Running the Frontend (React + Vite)

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node modules:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```

---

## 🛠️ Folder Responsibilities

| Directory | Description |
|---|---|
| `backend/` | Contains Python FastAPI application code, virtual environment (`.venv`), endpoints, models, and backend dependencies. |
| `backend/app/` | FastAPI application modules. `main.py` defines API routes, CORS settings, and server health endpoints. |
| `frontend/` | Contains the React + Vite single-page application source code, assets, package setup, and Vite proxy configuration. |
| `frontend/src/` | React components (`App.jsx`), styling (`App.css`, `index.css`), and application entry point (`main.jsx`). |

---

## 🎨 Tech Stack & Design System

- **Frontend Framework:** React 18 with Vite
- **Styling:** Vanilla CSS (CSS variables, dark glassmorphism aesthetic, responsive flex/grid layouts)
- **Backend Framework:** FastAPI (Python 3.13)
- **API Protocol:** REST (JSON)
- **Icons:** Lucide React (`lucide-react`)
