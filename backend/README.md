# SmartSched AI — Intelligent Timetable Management System

SmartSched AI is a production-quality, AI-driven intelligent timetable management platform designed for universities, colleges, and schools. It leverages **Google OR-Tools CP-SAT (Constraint Programming)** alongside intelligent heuristics to generate 100% conflict-free weekly timetables respecting classroom capacities, teacher availabilities, room specialization (lecture vs. lab), and section batch constraints.

---

## 🚀 Key Features

1. **Role-Based Portals & Dashboards**:
   - **Administrator**: Full system orchestrator with AI generation, regeneration, publishing, interactive master timetable grid with click-to-edit manual scheduling, complete CRUD for Faculty/Subjects/Rooms/Sections, dynamic availability matrix, room blocking, workload analytics, what-if simulator, and schedule settings.
   - **Teacher Portal**: Personalized instructor view with "My Weekly Schedule", "Next Up Class", assigned curriculum courses, and dedicated self-service availability editor.
   - **Student Portal**: Cohort-specific view (e.g. CSE-A, CSE-B) with class schedules, room locations, professor names, and print/export tools.

2. **AI Optimization Engine**:
   - Solves multi-dimensional scheduling with **Google OR-Tools CP-SAT**.
   - Zero teacher double-booking conflicts.
   - Zero room occupancy collisions.
   - Zero section/student schedule clashes.
   - Capacity constraint enforcement: Room capacity $\ge$ section student count.
   - Room specialization: Practical laboratory courses mapped to Lab spaces; lectures to Classrooms.
   - Balanced daily distribution: Avoids clustering multiple lectures of the same subject on a single day.
   - Respects faculty unavailable slots and room maintenance blocks.

3. **Manual Scheduling & Conflict Checker**:
   - Click any class on the timetable grid to inspect, edit, or delete.
   - Click empty time slots to manually add classes.
   - Real-time pre-save validation warns immediately if any room, teacher, or section clash occurs.

4. **Export & Print**:
   - 1-click master schedule export to CSV.
   - JSON data backup export.
   - Clean printable view with print stylesheet (`window.print()`).

5. **Context-Aware AI Assistant**:
   - Floating assistant drawer querying live database state for conflict verification, faculty workload distribution, and room utilization stats.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Linked Profile |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | System Administrator |
| **Teacher** | `teacher` | `teacher123` | Dr. Anil Kumar (CSE) |
| **Student** | `student` | `student123` | Alex Student (CSE-A) |

*(Quick 1-click login buttons are also provided in the top navigation bar for immediate testing).*

---

## 🛠️ How to Run the Project

### Option A: Using the One-Click Launcher (Windows)
Double-click `START.bat` located in the `SmartSched_Local` folder. This automatically:
1. Launches the FastAPI backend on `http://127.0.0.1:8000`
2. Launches the frontend web server on `http://127.0.0.1:5500`
3. Opens the browser to the application

### Option B: Manual Execution via Terminal

#### 1. Backend:
```powershell
cd SmartSched_Local\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```
- API Root: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

#### 2. Frontend:
In a second terminal:
```powershell
cd SmartSched_Local\backend
.\.venv\Scripts\python.exe -m http.server 5500 --directory ..\frontend
```
- Open in browser: `http://127.0.0.1:5500`

---

## 📡 API Endpoints Reference

- **Auth**:
  - `POST /api/auth/register` — Create user account
  - `POST /api/auth/login` — Sign in and get session token
  - `GET /api/auth/me` — Current user profile
- **Data & System**:
  - `GET /api/health` — Service health & OR-Tools availability
  - `GET /api/data` — Fetch complete database state
  - `GET /api/settings/config` — Get active working days and period slots
  - `POST /api/settings/config` — Update working days and period slots
- **Resource CRUD**:
  - `POST /api/faculty`, `PUT /api/faculty/{id}`, `DELETE /api/faculty/{id}`
  - `POST /api/subjects`, `PUT /api/subjects/{id}`, `DELETE /api/subjects/{id}`
  - `POST /api/rooms`, `PUT /api/rooms/{id}`, `DELETE /api/rooms/{id}`
  - `POST /api/sections`, `PUT /api/sections/{id}`, `DELETE /api/sections/{id}`
- **Rules & Blocking**:
  - `POST /api/rooms/{room_id}/block` — Toggle room maintenance block
  - `POST /api/faculty/{faculty_id}/availability` — Toggle teacher availability
- **Timetable Operations**:
  - `POST /api/timetable/generate` — Run CP-SAT AI optimizer
  - `POST /api/timetable/publish` — Publish verified timetable
  - `POST /api/timetable/clear` — Clear current timetable
  - `POST /api/timetable/validate` — Validate entry for conflicts
  - `POST /api/timetable/entry` — Create manual class
  - `PUT /api/timetable/entry/{id}` — Update manual class
  - `DELETE /api/timetable/entry/{id}` — Remove scheduled class
- **AI Assistant**:
  - `POST /api/ai` — Natural language query about schedules and workload
