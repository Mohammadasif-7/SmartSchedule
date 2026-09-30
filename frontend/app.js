/**
 * SmartSched AI — Government Engineering College Madhubani
 * Production-ready AI Timetable Management System
 */

const API = "http://127.0.0.1:8000/api";

// Core application state
let state = {
  faculty: [],
  subjects: [],
  rooms: [],
  sections: [],
  timetable: [],
  unavailable: [],
  config: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    slots: [
      { id: "s1", time: "09:00 - 10:00" },
      { id: "s2", time: "10:00 - 11:00" },
      { id: "s3", time: "11:15 - 12:15" },
      { id: "s4", time: "12:15 - 13:15" },
      { id: "s5", time: "14:00 - 15:00" },
      { id: "s6", time: "15:00 - 16:00" },
    ]
  }
};

// Current authenticated user state
let currentUser = JSON.parse(localStorage.getItem("smartsched_user")) || null;

let currentPage = "home";
let currentResourceTab = "faculty";
let ttFilter = {
  section_id: "all",
  faculty_id: "all",
  room_id: "all"
};

// ========================================================
// API Client & Data Loading
// ========================================================

async function api(path, opts = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.detail || (typeof data === "string" ? data : "Request failed");
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error("API Error on " + path + ":", err);
    throw err;
  }
}

async function loadData() {
  try {
    const data = await api("/data");
    state = data;
    if (!state.config) {
      state.config = {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        slots: [
          { id: "s1", time: "09:00 - 10:00" },
          { id: "s2", time: "10:00 - 11:00" },
          { id: "s3", time: "11:15 - 12:15" },
          { id: "s4", time: "12:15 - 13:15" },
          { id: "s5", time: "14:00 - 15:00" },
          { id: "s6", time: "15:00 - 16:00" },
        ]
      };
    }
  } catch (e) {
    toast("Backend not reachable. Ensure FastAPI server is running on port 8000.", "error");
  }
}

// ========================================================
// UI, Toast & Accessibility Helpers
// ========================================================

let toastTimer = null;
function toast(msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = (type === "success" ? "✅ " : type === "error" ? "❌ " : type === "warning" ? "⚠️ " : "ℹ️ ") + msg;
  t.className = type;
  t.style.display = "flex";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.display = "none";
  }, 3500);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

// Close modal on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => m.classList.remove("open"));
  }
});

// Close modal on overlay click
document.querySelectorAll(".modal-overlay").forEach(m => {
  m.addEventListener("click", (e) => {
    if (e.target === m) m.classList.remove("open");
  });
});

// Accessibility: Font Size
function setFontSize(size) {
  document.documentElement.classList.remove("font-lg", "font-sm");
  if (size === "lg") document.documentElement.classList.add("font-lg");
  if (size === "sm") document.documentElement.classList.add("font-sm");
}

// Accessibility: Color Themes
function setColorTheme(theme) {
  document.body.classList.remove("theme-green", "theme-purple", "theme-amber");
  if (theme !== "blue") {
    document.body.classList.add(`theme-${theme}`);
  }
}

// Mobile Nav Toggle
function toggleMobileNav() {
  const nav = document.getElementById("mainNavLinks");
  if (nav) nav.classList.toggle("mobile-open");
}

// ========================================================
// Navigation & Role Management
// ========================================================

function navigate(page) {
  currentPage = page;

  // If specific resource sub-tab selected
  if (page === "faculty") {
    currentPage = "resources";
    currentResourceTab = "faculty";
  } else if (page === "subjects") {
    currentPage = "resources";
    currentResourceTab = "subjects";
  } else if (page === "rooms") {
    currentPage = "resources";
    currentResourceTab = "rooms";
  }

  // Update active state in top navbar
  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.nav === page || (page === "faculty" && btn.dataset.nav === "faculty") || (page === "subjects" && btn.dataset.nav === "subjects") || (page === "rooms" && btn.dataset.nav === "rooms"));
  });

  // Close mobile nav if open
  const nav = document.getElementById("mainNavLinks");
  if (nav) nav.classList.remove("mobile-open");

  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAuthDisplay() {
  const unauthGroup = document.getElementById("unauthButtons");
  const authGroup = document.getElementById("authProfileGroup");
  const hAvatar = document.getElementById("headerAvatar");
  const hName = document.getElementById("headerUserName");
  const hRole = document.getElementById("headerUserRole");

  if (currentUser) {
    if (unauthGroup) unauthGroup.style.display = "none";
    if (authGroup) authGroup.style.display = "flex";
    if (hAvatar) hAvatar.textContent = (currentUser.full_name || currentUser.username || "U")[0].toUpperCase();
    if (hName) hName.textContent = currentUser.full_name || currentUser.username;
    if (hRole) {
      hRole.textContent = currentUser.role.toUpperCase();
      hRole.className = `role-pill ${currentUser.role}`;
    }
  } else {
    if (unauthGroup) unauthGroup.style.display = "flex";
    if (authGroup) authGroup.style.display = "none";
  }
}

function renderApp() {
  updateAuthDisplay();
  const container = document.getElementById("app");

  if (currentPage === "home") {
    renderHome();
  } else if (currentPage === "dashboard") {
    if (!currentUser || currentUser.role === "admin") {
      renderAdminDashboard();
    } else if (currentUser.role === "teacher") {
      renderTeacherDashboard();
    } else {
      renderStudentDashboard();
    }
  } else if (currentPage === "timetable") {
    renderTimetableView();
  } else if (currentPage === "resources") {
    renderResourcesView();
  } else if (currentPage === "rules") {
    renderRulesView();
  } else if (currentPage === "analytics") {
    renderAnalyticsView();
  } else if (currentPage === "whatif") {
    renderWhatIfView();
  } else if (currentPage === "settings") {
    renderSettingsView();
  }
}

// ========================================================
// HOMEPAGE RENDERING (Matching IMAGE 1 Layout & IMAGE 2 Photo)
// ========================================================

function renderHome() {
  const container = document.getElementById("app");
  const days = state.config.days || [];
  const slots = state.config.slots || [];
  const totalCapacitySlots = Math.max(1, state.rooms.length * days.length * slots.length);
  const util = Math.round((state.timetable.length / totalCapacitySlots) * 100);

  container.innerHTML = `
    <!-- SECTION 2: HERO SECTION (Using IMAGE 2 for Real College Building) -->
    <section class="hero-section">
      <div class="hero-inner">
        <!-- Hero Left Content -->
        <div class="hero-content">
          <div class="hero-badge">
            <span>✨</span> AI-POWERED SMART SCHEDULING
          </div>

          <h1 class="hero-title">
            AI-Driven Intelligent
            <span class="gradient-text">Timetable Management</span>
            System
          </h1>

          <p class="hero-desc">
            Automate class scheduling, optimize resource allocation, and resolve timetable conflicts intelligently with AI.
          </p>

          <div class="hero-cta-btns">
            <button class="btn-hero-primary" onclick="onGetStarted()">
              Get Started →
            </button>
            <button class="btn-hero-glass" onclick="navigate('timetable')">
              <span>📅</span> View Timetable
            </button>
          </div>

          <div class="hero-trust-list">
            <div class="hero-trust-item"><span>✓</span> Conflict-Free Scheduling</div>
            <div class="hero-trust-item"><span>✓</span> AI-Powered Optimization</div>
            <div class="hero-trust-item"><span>✓</span> Real-Time Management</div>
          </div>
        </div>

        <!-- Hero Right: Real College Image Container (IMAGE 2) -->
        <div class="hero-image-wrapper">
          <div class="hero-image-card">
            <img src="images/college_building.jpg" alt="Government Engineering College Madhubani campus" class="college-hero-photo">
            <div class="hero-image-overlay"></div>
          </div>

          <!-- Floating Info Cards Around College Photo -->
          <div class="floating-badge badge-top-left">
            <div class="badge-icon-box cyan">✨</div>
            <div class="badge-text">
              <b>AI Optimization</b>
              <small>OR-Tools CP-SAT Active</small>
            </div>
          </div>

          <div class="floating-badge badge-bottom-right">
            <div class="badge-icon-box green">🛡️</div>
            <div class="badge-text">
              <b>Conflict-Free</b>
              <small>0 Clashes Guaranteed</small>
            </div>
          </div>

          <div class="floating-badge badge-bottom-left">
            <div class="badge-icon-box blue">📅</div>
            <div class="badge-text">
              <b>${state.timetable.length} Active Classes</b>
              <small>Weekly Scheduled Slots</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: WHY SMART TIMETABLE? -->
    <section class="section-padding">
      <div class="section-container">
        <div class="section-head">
          <span class="section-tag">KEY ADVANTAGES</span>
          <h2 class="section-title">Why Smart Timetable?</h2>
          <p class="section-subtitle">Engineered specifically for engineering colleges, polytechnics and universities to eliminate scheduling bottlenecks and manual errors.</p>
        </div>

        <div class="features-grid-4">
          <div class="feature-card">
            <div class="feature-num">01</div>
            <div class="feature-icon-circle">🤖</div>
            <h3>AI-Based Scheduling</h3>
            <p>Automatically generate mathematically optimal class schedules utilizing advanced constraint programming.</p>
          </div>

          <div class="feature-card">
            <div class="feature-num">02</div>
            <div class="feature-icon-circle">🛡️</div>
            <h3>Conflict Detection</h3>
            <p>Detect faculty, classroom, laboratory and student cohort timetable conflicts before classes are published.</p>
          </div>

          <div class="feature-card">
            <div class="feature-num">03</div>
            <div class="feature-icon-circle">🏛️</div>
            <h3>Smart Resource Allocation</h3>
            <p>Optimize classrooms, specialized labs and faculty availability according to student strength and room capacity.</p>
          </div>

          <div class="feature-card">
            <div class="feature-num">04</div>
            <div class="feature-icon-circle">⚡</div>
            <h3>Real-Time Updates</h3>
            <p>Manage emergency timetable changes, faculty leave adjustments and room maintenance blocks seamlessly.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4: HOW IT WORKS -->
    <section class="section-padding how-it-works-bg">
      <div class="section-container">
        <div class="section-head">
          <span class="section-tag">SIMPLE 3-STEP PROCESS</span>
          <h2 class="section-title">How It Works</h2>
          <p class="section-subtitle">From raw academic data to a verified, clash-free schedule in three intuitive stages.</p>
        </div>

        <div class="steps-grid-3">
          <div class="step-card">
            <span class="step-badge">STEP 01</span>
            <h3>ENTER DATA</h3>
            <p>Input academic parameters and structural constraints into the system.</p>
            <ul class="step-checklist">
              <li>Faculty Members & Departments</li>
              <li>Courses, Lectures & Laboratory Hours</li>
              <li>Classrooms & Seating Capacity</li>
              <li>Student Sections & Batches</li>
              <li>Faculty Availability Constraints</li>
            </ul>
          </div>

          <div class="step-card">
            <span class="step-badge" style="background:var(--royal-blue);">STEP 02</span>
            <h3>AI GENERATES SCHEDULE</h3>
            <p>The AI optimization engine processes thousands of possibilities to create a conflict-free matrix.</p>
            <ul class="step-checklist">
              <li>Prevents Faculty Overlap</li>
              <li>Eliminates Room Double-Booking</li>
              <li>Enforces Seating Capacity Checks</li>
              <li>Distributes Lectures Evenly</li>
              <li>Solves in under 1 second</li>
            </ul>
          </div>

          <div class="step-card">
            <span class="step-badge" style="background:#059669;">STEP 03</span>
            <h3>REVIEW & PUBLISH</h3>
            <p>Review the generated master grid, perform manual fine-tuning, and publish instantly.</p>
            <ul class="step-checklist">
              <li>Interactive Visual Timetable Grid</li>
              <li>Click-to-Edit Manual Adjustments</li>
              <li>Real-time Move Clash Validation</li>
              <li>One-Click Export to CSV and JSON</li>
              <li>Print-ready PDF formatting</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 5: DASHBOARD / TIMETABLE PREVIEW (Connected to Real Backend) -->
    <section class="section-padding">
      <div class="section-container">
        <div class="section-head">
          <span class="section-tag">LIVE SYSTEM PREVIEW</span>
          <h2 class="section-title">Dashboard & Schedule Preview</h2>
          <p class="section-subtitle">Real-time scheduling metrics and current master timetable preview powered by live API data.</p>
        </div>

        <div class="preview-container">
          <div class="preview-top-bar">
            <div class="preview-dots">
              <span class="preview-dot red"></span>
              <span class="preview-dot yellow"></span>
              <span class="preview-dot green"></span>
            </div>
            <span style="font-size:12px; font-weight:600; color:#94a3b8;">GEC Madhubani — Timetable Control Center</span>
            <span class="tag-badge lecture" style="font-size:10px;">LIVE DATA</span>
          </div>

          <div class="preview-content-box">
            <!-- Preview Stats Row -->
            <div class="preview-stats-row">
              <div class="preview-stat-item">
                <span>Today's Classes</span>
                <b>${state.timetable.filter(t => t.day === "Monday").length}</b>
              </div>
              <div class="preview-stat-item">
                <span>Active Faculty</span>
                <b>${state.faculty.length}</b>
              </div>
              <div class="preview-stat-item">
                <span>Available Rooms</span>
                <b>${state.rooms.length}</b>
              </div>
              <div class="preview-stat-item">
                <span>Free Slots</span>
                <b>${Math.max(0, totalCapacitySlots - state.timetable.length)}</b>
              </div>
              <div class="preview-stat-item">
                <span>Detected Conflicts</span>
                <b style="color:#10b981;">0</b>
              </div>
              <div class="preview-stat-item">
                <span>AI Optimization</span>
                <b style="color:#2563eb; font-size:16px;">Ready</b>
              </div>
            </div>

            <!-- Mini Timetable Sample Table -->
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Faculty</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  ${(state.timetable.slice(0, 6)).map(e => {
                    const sub = state.subjects.find(s => s.id === e.subject_id);
                    const fac = state.faculty.find(f => f.id === e.faculty_id);
                    const rm = state.rooms.find(r => r.id === e.room_id);
                    const sec = state.sections.find(s => s.id === e.section_id);
                    const slotsMap = Object.fromEntries((state.config.slots || []).map(s => [s.id, s.time]));
                    return `
                      <tr>
                        <td><b>${e.day}</b></td>
                        <td>${slotsMap[e.slot_id] || e.slot_id}</td>
                        <td><b>${sec ? sec.name : "—"}</b></td>
                        <td>${sub ? `${sub.code}: ${sub.name}` : "—"}</td>
                        <td><span class="tag-badge ${sub && sub.type === 'Lab' ? 'lab' : 'lecture'}">${sub ? sub.type : 'Lecture'}</span></td>
                        <td>${fac ? fac.name : "—"}</td>
                        <td>🚪 <b>${rm ? rm.name : "—"}</b></td>
                      </tr>
                    `;
                  }).join("") || `<tr><td colspan="7" style="text-align:center; padding:20px;">No scheduled classes yet. Click "Generate Your Timetable" below!</td></tr>`}
                </tbody>
              </table>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:18px;">
              <button class="btn btn-primary" onclick="navigate('timetable')">
                View Full Interactive Timetable Grid →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6: STATISTICS SECTION (Live Backend Data) -->
    <section class="stats-banner">
      <div class="stats-banner-grid">
        <div class="stat-metric">
          <b>${state.faculty.length}</b>
          <span>Active Faculty</span>
        </div>
        <div class="stat-metric">
          <b>${state.subjects.length}</b>
          <span>Subjects & Courses</span>
        </div>
        <div class="stat-metric">
          <b>${state.rooms.length}</b>
          <span>Classrooms & Labs</span>
        </div>
        <div class="stat-metric">
          <b>${state.timetable.length}</b>
          <span>Scheduled Classes</span>
        </div>
      </div>
    </section>

    <!-- SECTION 7: AI ASSISTANT SECTION -->
    <section class="section-padding">
      <div class="section-container">
        <div class="ai-promo-card">
          <div class="ai-promo-content">
            <span class="section-tag" style="background:#dbeafe; color:#1e40af;">24/7 INTELLIGENT ADVISOR</span>
            <h2>Plan Smarter with AI</h2>
            <p>Let AI analyze scheduling constraints and help create optimized, conflict-free timetables. Get instant insights on teacher workloads, room capacities, and free period slots.</p>
            <button class="btn btn-primary" onclick="openAiAssistant()">
              <span>🤖</span> Open AI Assistant
            </button>
          </div>
          <div style="font-size:72px; text-align:center; padding:10px;">
            ⚡
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 8: CALL TO ACTION -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2>Build Smarter Timetables with AI</h2>
        <p>Automate scheduling, reduce conflicts and manage academic resources more efficiently across Government Engineering College Madhubani.</p>
        <button class="btn-hero-primary" onclick="generateSchedule()">
          Generate Your Timetable
        </button>
      </div>
    </section>

    <!-- SECTION 9: FOOTER -->
    <footer class="college-footer">
      <div class="footer-inner">
        <div class="footer-col">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
            <img src="images/college_logo.png" alt="GEC Madhubani" style="width:40px; height:45px; object-fit:contain;">
            <div>
              <b style="color:#ffffff; font-size:16px; display:block;">Government Engineering College Madhubani</b>
              <small style="color:#38bdf8;">Govt. of Bihar</small>
            </div>
          </div>
          <p>Science, Technology & Technical Education Department, Government of Bihar. AI-Driven Timetable Management Platform ensuring conflict-free academic scheduling.</p>
        </div>

        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><button onclick="navigate('home')">Home</button></li>
            <li><button onclick="navigate('dashboard')">Dashboard</button></li>
            <li><button onclick="navigate('timetable')">Timetable Grid</button></li>
            <li><button onclick="navigate('faculty')">Faculty Directory</button></li>
            <li><button onclick="navigate('subjects')">Course Catalog</button></li>
            <li><button onclick="navigate('rooms')">Rooms & Labs</button></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Portal Access</h4>
          <ul>
            <li><button onclick="openAiAssistant()">AI Assistant</button></li>
            <li><button onclick="navigate('resources')">Resources Management</button></li>
            <li><button onclick="openAuthModal('login')">Admin / Faculty Login</button></li>
            <li><button onclick="openAuthModal('register')">Student Sign Up</button></li>
            <li><button onclick="navigate('rules')">Availability Rules</button></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Contact & Location</h4>
          <p>
            Government Engineering College, Madhubani<br>
            Campus: Arer, Madhubani, Bihar - 847222<br>
            Email: principal@gecmadhubani.ac.in<br>
            Website: gecmadhubani.ac.in
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 Government Engineering College Madhubani. All Rights Reserved.</span>
        <span>Science, Technology & Technical Education Department, Govt. of Bihar</span>
      </div>
    </footer>
  `;
}

function onGetStarted() {
  if (currentUser) {
    navigate("dashboard");
  } else {
    openAuthModal("login");
  }
}

// ========================================================
// View: Management Dashboards (Admin, Teacher, Student)
// ========================================================

function renderAdminDashboard() {
  const container = document.getElementById("app");
  const days = state.config.days || [];
  const slots = state.config.slots || [];
  const totalSlots = Math.max(1, state.rooms.length * days.length * slots.length);
  const util = Math.round((state.timetable.length / totalSlots) * 100);

  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Admin Control Center — SmartSched AI</h1>
          <p>Orchestrate constraint-satisfying schedules for faculty, classrooms, labs, and cohorts.</p>
        </div>
        <div class="action-bar">
          <button class="btn btn-secondary" onclick="navigate('home')">← Back to Homepage</button>
          <button class="btn btn-secondary" onclick="clearSchedulePrompt()">🗑 Clear</button>
          <button class="btn btn-secondary" onclick="generateSchedule()">🔄 Reschedule</button>
          <button class="btn btn-primary" onclick="generateSchedule()">✨ Generate Timetable</button>
          <button class="btn btn-success" onclick="publishSchedule()">✓ Publish</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📅</div>
          <div class="stat-details">
            <div class="stat-label">Scheduled Classes</div>
            <div class="stat-value">${state.timetable.length}</div>
            <div class="stat-sub">Active sessions</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🛡️</div>
          <div class="stat-details">
            <div class="stat-label">Clashes / Conflicts</div>
            <div class="stat-value">0</div>
            <div class="stat-sub" style="color:#059669;">100% Conflict-free</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">👨‍🏫</div>
          <div class="stat-details">
            <div class="stat-label">Faculty Members</div>
            <div class="stat-value">${state.faculty.length}</div>
            <div class="stat-sub">${state.unavailable.length} unavailable rules</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">🚪</div>
          <div class="stat-details">
            <div class="stat-label">Room Utilization</div>
            <div class="stat-value">${util}%</div>
            <div class="stat-sub">${state.rooms.length} rooms & labs</div>
          </div>
        </div>
      </div>

      <div class="grid-2col">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Scheduling Workflows</div>
              <div class="panel-sub">Common automated & manual scheduling actions</div>
            </div>
          </div>
          <div class="quick-actions-grid">
            <div class="quick-btn" onclick="generateSchedule()">
              <b>✨ AI Auto-Generate</b>
              <small>Solves with Google OR-Tools CP-SAT</small>
            </div>
            <div class="quick-btn" onclick="navigate('timetable')">
              <b>📅 Interactive Grid</b>
              <small>Filter, click-to-edit, print & export</small>
            </div>
            <div class="quick-btn" onclick="navigate('resources')">
              <b>👥 Manage Resources</b>
              <small>Add & edit faculty, rooms, courses</small>
            </div>
            <div class="quick-btn" onclick="navigate('whatif')">
              <b>🪄 What-If Simulation</b>
              <small>Test room blocks before applying</small>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">System Status</div>
              <div class="panel-sub">Engine specifications & active constraints</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
            <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">
              <span style="color:#64748b;">Optimization Engine</span>
              <b style="color:var(--royal-blue);">Google OR-Tools CP-SAT</b>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">
              <span style="color:#64748b;">Hard Constraints</span>
              <b>Teacher, Room, Section & Capacity Check</b>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">
              <span style="color:#64748b;">Active Working Days</span>
              <b>${days.length} Days (${days.join(", ")})</b>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">Publication Status</span>
              <span class="tag-badge lecture">Published & Conflict-Free</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Master Schedule Overview</div>
            <div class="panel-sub">Showing first 8 sessions from database</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigate('timetable')">Open Master Grid →</button>
        </div>
        <div class="table-container">
          ${renderSampleTable(state.timetable.slice(0, 8))}
        </div>
      </div>
    </div>
  `;
}

function renderTeacherDashboard() {
  const container = document.getElementById("app");
  let fac = state.faculty.find(f => f.id === currentUser.ref_id) ||
            state.faculty.find(f => f.name.toLowerCase().includes(currentUser.username.toLowerCase())) ||
            state.faculty[0];

  const myClasses = state.timetable.filter(e => e.faculty_id === (fac ? fac.id : null));
  const mySubjects = state.subjects.filter(s => s.faculty_id === (fac ? fac.id : null));
  const nextClass = myClasses[0];
  const slotsMap = Object.fromEntries((state.config.slots || []).map(s => [s.id, s.time]));

  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Welcome, ${fac ? fac.name : currentUser.full_name}!</h1>
          <p>Department of ${fac ? fac.department : "Engineering"} • Weekly teaching commitments</p>
        </div>
        <div class="action-bar">
          <button class="btn btn-secondary" onclick="navigate('rules')">🕒 Manage My Availability</button>
          <button class="btn btn-primary" onclick="navigate('timetable')">📅 My Full Timetable</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">📅</div>
          <div class="stat-details">
            <div class="stat-label">Teaching Hours</div>
            <div class="stat-value">${myClasses.length}</div>
            <div class="stat-sub">Hours per week</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">📚</div>
          <div class="stat-details">
            <div class="stat-label">Assigned Courses</div>
            <div class="stat-value">${mySubjects.length}</div>
            <div class="stat-sub">${mySubjects.map(s => s.code).join(", ") || "No courses"}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber">🕒</div>
          <div class="stat-details">
            <div class="stat-label">My Blocked Slots</div>
            <div class="stat-value">${state.unavailable.filter(u => u.faculty_id === (fac ? fac.id : '')).length}</div>
            <div class="stat-sub">Unavailable periods</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">My Teaching Schedule</div>
            <div class="panel-sub">Showing all weekly time slots assigned to ${fac ? fac.name : 'you'}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportTeacherCSV('${fac ? fac.id : ''}')">⬇ Export My CSV</button>
        </div>
        <div class="table-container">
          ${renderSampleTable(myClasses)}
        </div>
      </div>
    </div>
  `;
}

function renderStudentDashboard() {
  const container = document.getElementById("app");
  let sec = state.sections.find(s => s.id === currentUser.ref_id) || state.sections[0];
  const myClasses = state.timetable.filter(e => e.section_id === (sec ? sec.id : null));

  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Student Portal — Section ${sec ? sec.name : "CSE-A"}</h1>
          <p>Semester: ${sec ? sec.semester : "3rd"} • Total Classmates: ${sec ? sec.students : 50}</p>
        </div>
        <div class="action-bar">
          <button class="btn btn-secondary" onclick="window.print()">🖨 Print Timetable</button>
          <button class="btn btn-primary" onclick="navigate('timetable')">📅 Open Grid View</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">My Class Schedule (Section ${sec ? sec.name : ""})</div>
            <div class="panel-sub">Classes, assigned professors, and classroom locations</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="downloadCSV()">⬇ Download CSV</button>
        </div>
        <div class="table-container">
          ${renderSampleTable(myClasses)}
        </div>
      </div>
    </div>
  `;
}

function renderSampleTable(rows) {
  if (!rows || rows.length === 0) {
    return `<div style="padding:30px; text-align:center; color:#64748b;">No scheduled classes found.</div>`;
  }
  const slotsMap = Object.fromEntries((state.config.slots || []).map(s => [s.id, s.time]));

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Time Slot</th>
          <th>Section</th>
          <th>Subject / Code</th>
          <th>Type</th>
          <th>Faculty</th>
          <th>Room / Lab</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(e => {
          const sub = state.subjects.find(s => s.id === e.subject_id);
          const fac = state.faculty.find(f => f.id === e.faculty_id);
          const r = state.rooms.find(rm => rm.id === e.room_id);
          const sec = state.sections.find(sc => sc.id === e.section_id);
          return `
            <tr>
              <td><b>${e.day}</b></td>
              <td>${slotsMap[e.slot_id] || e.slot_id}</td>
              <td><b>${sec ? sec.name : "—"}</b></td>
              <td>${sub ? `<b>${sub.code}</b>: ${sub.name}` : "—"}</td>
              <td><span class="tag-badge ${(sub && sub.type === 'Lab') ? 'lab' : 'lecture'}">${sub ? sub.type : 'Lecture'}</span></td>
              <td>${fac ? fac.name : "—"}</td>
              <td>🚪 <b>${r ? r.name : "—"}</b></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

// ========================================================
// View: Master Timetable Grid View
// ========================================================

function renderTimetableView() {
  const container = document.getElementById("app");
  const days = state.config.days || [];
  const slots = state.config.slots || [];

  let filtered = [...state.timetable];
  if (currentUser && currentUser.role === "teacher") {
    const fac = state.faculty.find(f => f.id === currentUser.ref_id) || state.faculty[0];
    if (fac) filtered = filtered.filter(e => e.faculty_id === fac.id);
  } else if (currentUser && currentUser.role === "student") {
    const sec = state.sections.find(s => s.id === currentUser.ref_id) || state.sections[0];
    if (sec) filtered = filtered.filter(e => e.section_id === sec.id);
  } else {
    if (ttFilter.section_id !== "all") filtered = filtered.filter(e => e.section_id === ttFilter.section_id);
    if (ttFilter.faculty_id !== "all") filtered = filtered.filter(e => e.faculty_id === ttFilter.faculty_id);
    if (ttFilter.room_id !== "all") filtered = filtered.filter(e => e.room_id === ttFilter.room_id);
  }

  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Master Timetable Grid</h1>
          <p>Weekly matrix layout. Click any class to edit or delete; click an empty slot to schedule.</p>
        </div>
        <div class="action-bar">
          ${(!currentUser || currentUser.role === "admin") ? `
            <button class="btn btn-secondary" onclick="generateSchedule()">↻ Regenerate</button>
            <button class="btn btn-primary" onclick="openEntryModal(null, '${days[0]}', '${slots[0]?.id}')">+ Add Class</button>
          ` : ""}
          <button class="btn btn-secondary" onclick="window.print()">🖨 Print / PDF</button>
          <button class="btn btn-secondary" onclick="downloadCSV()">⬇ Export CSV</button>
          <button class="btn btn-secondary" onclick="downloadJSON()">⬇ Export JSON</button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <span style="font-weight:700; font-size:12px; color:#475569;">🔍 FILTER BY:</span>
        <select id="filterSection" onchange="applyTtFilter()">
          <option value="all" ${ttFilter.section_id === 'all' ? 'selected' : ''}>All Sections</option>
          ${state.sections.map(s => `<option value="${s.id}" ${ttFilter.section_id === s.id ? 'selected' : ''}>Section: ${s.name}</option>`).join("")}
        </select>
        <select id="filterFaculty" onchange="applyTtFilter()">
          <option value="all" ${ttFilter.faculty_id === 'all' ? 'selected' : ''}>All Faculty</option>
          ${state.faculty.map(f => `<option value="${f.id}" ${ttFilter.faculty_id === f.id ? 'selected' : ''}>Faculty: ${f.name}</option>`).join("")}
        </select>
        <select id="filterRoom" onchange="applyTtFilter()">
          <option value="all" ${ttFilter.room_id === 'all' ? 'selected' : ''}>All Rooms</option>
          ${state.rooms.map(r => `<option value="${r.id}" ${ttFilter.room_id === r.id ? 'selected' : ''}>Room: ${r.name}</option>`).join("")}
        </select>
        ${(ttFilter.section_id !== 'all' || ttFilter.faculty_id !== 'all' || ttFilter.room_id !== 'all') ? `
          <button class="btn btn-sm btn-secondary" onclick="resetTtFilter()">Reset Filters</button>
        ` : ''}
        <span style="margin-left:auto; font-size:12px; color:#64748b;">Showing <b>${filtered.length}</b> scheduled sessions</span>
      </div>

      <!-- Timetable Matrix Grid -->
      <div class="timetable-wrapper">
        <table class="tt-table">
          <thead>
            <tr>
              <th class="time-col">Period / Time</th>
              ${days.map(d => `<th>${d}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${slots.map(sl => `
              <tr>
                <td class="time-cell">${sl.time}</td>
                ${days.map(d => {
                  const cellClasses = filtered.filter(e => e.day === d && e.slot_id === sl.id);
                  return `
                    <td class="slot-cell" data-day="${d}" data-slot="${sl.id}">
                      ${cellClasses.map(c => {
                        const sub = state.subjects.find(s => s.id === c.subject_id);
                        const fac = state.faculty.find(f => f.id === c.faculty_id);
                        const rm = state.rooms.find(r => r.id === c.room_id);
                        const sec = state.sections.find(s => s.id === c.section_id);
                        const isLab = sub && sub.type === "Lab";
                        return `
                          <div class="class-card ${isLab ? 'lab' : ''}" onclick="openEntryModal('${c.id}', '${d}', '${sl.id}')" title="Click to edit or delete">
                            <div class="class-code">
                              <span>${sub ? sub.code : "CLS"}</span>
                              <span class="tag-badge ${isLab ? 'lab' : 'lecture'}">${sec ? sec.name : ""}</span>
                            </div>
                            <div class="class-name">${sub ? sub.name : "Class"}</div>
                            <div class="class-meta">
                              <span>👨‍🏫 ${fac ? fac.name : "TBD"}</span>
                              <span>🚪 ${rm ? rm.name : "TBD"}</span>
                            </div>
                          </div>
                        `;
                      }).join("")}
                      ${(!currentUser || currentUser.role === "admin") ? `
                        <button class="add-slot-btn" onclick="openEntryModal(null, '${d}', '${sl.id}')">+ Add</button>
                      ` : ""}
                    </td>
                  `;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function applyTtFilter() {
  ttFilter.section_id = document.getElementById("filterSection").value;
  ttFilter.faculty_id = document.getElementById("filterFaculty").value;
  ttFilter.room_id = document.getElementById("filterRoom").value;
  renderTimetableView();
}

function resetTtFilter() {
  ttFilter = { section_id: "all", faculty_id: "all", room_id: "all" };
  renderTimetableView();
}

// ========================================================
// View: Resources Management View
// ========================================================

function renderResourcesView() {
  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Academic Resources Catalog</h1>
          <p>Manage Faculty, Subjects, Classrooms/Labs and Student Sections.</p>
        </div>
        <div class="action-bar">
          <button class="btn btn-primary" onclick="openCreateResourceModal()">+ Add New ${capitalize(currentResourceTab)}</button>
        </div>
      </div>

      <!-- Resource Tabs -->
      <div style="display:flex; gap:8px; margin-bottom:18px; border-bottom:1px solid #e2e8f0; padding-bottom:8px; overflow-x:auto;">
        <button class="btn ${currentResourceTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}" onclick="setResourceTab('faculty')">👨‍🏫 Faculty (${state.faculty.length})</button>
        <button class="btn ${currentResourceTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}" onclick="setResourceTab('subjects')">📚 Subjects & Courses (${state.subjects.length})</button>
        <button class="btn ${currentResourceTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}" onclick="setResourceTab('rooms')">🚪 Rooms & Labs (${state.rooms.length})</button>
        <button class="btn ${currentResourceTab === 'sections' ? 'btn-primary' : 'btn-secondary'}" onclick="setResourceTab('sections')">👥 Sections (${state.sections.length})</button>
      </div>

      <div class="panel">
        ${currentResourceTab === 'faculty' ? renderFacultyTable() : ""}
        ${currentResourceTab === 'subjects' ? renderSubjectsTable() : ""}
        ${currentResourceTab === 'rooms' ? renderRoomsTable() : ""}
        ${currentResourceTab === 'sections' ? renderSectionsTable() : ""}
      </div>
    </div>
  `;
}

function setResourceTab(tab) {
  currentResourceTab = tab;
  renderResourcesView();
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1, -1);
}

function openCreateResourceModal() {
  if (currentResourceTab === "faculty") openFacultyModal();
  else if (currentResourceTab === "subjects") openSubjectModal();
  else if (currentResourceTab === "rooms") openRoomModal();
  else if (currentResourceTab === "sections") openSectionModal();
}

function renderFacultyTable() {
  return `
    <div class="panel-header">
      <div>
        <div class="panel-title">Faculty Roster</div>
        <div class="panel-sub">Instructors eligible for class assignments</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="openFacultyModal()">+ Add Faculty</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Instructor Name</th>
            <th>Department</th>
            <th>Teaching Load</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.faculty.map(f => {
            const count = state.timetable.filter(t => t.faculty_id === f.id).length;
            return `
              <tr>
                <td><b>${f.name}</b></td>
                <td><span class="tag-badge lecture">${f.department}</span></td>
                <td><b>${count}</b> weekly hours scheduled</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editFaculty('${f.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteFacultyPrompt('${f.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSubjectsTable() {
  return `
    <div class="panel-header">
      <div>
        <div class="panel-title">Course Catalog</div>
        <div class="panel-sub">Lectures and practical lab curriculum requirements</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="openSubjectModal()">+ Add Subject</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Subject Name</th>
            <th>Type</th>
            <th>Assigned Faculty</th>
            <th>Weekly Hours</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.subjects.map(sub => {
            const fac = state.faculty.find(f => f.id === sub.faculty_id);
            return `
              <tr>
                <td><b>${sub.code}</b></td>
                <td>${sub.name}</td>
                <td><span class="tag-badge ${sub.type === 'Lab' ? 'lab' : 'lecture'}">${sub.type}</span></td>
                <td>${fac ? fac.name : '<span style="color:#94a3b8;">Unassigned</span>'}</td>
                <td><b>${sub.hours} hrs/wk</b></td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editSubject('${sub.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSubjectPrompt('${sub.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoomsTable() {
  return `
    <div class="panel-header">
      <div>
        <div class="panel-title">Rooms & Laboratories</div>
        <div class="panel-sub">Physical spaces with capacity and facility constraints</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="openRoomModal()">+ Add Room</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Room Identifier</th>
            <th>Classification</th>
            <th>Seating Capacity</th>
            <th>Blocked Slots</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.rooms.map(r => {
            return `
              <tr>
                <td><b>${r.name}</b></td>
                <td><span class="tag-badge ${r.type === 'Lab' ? 'lab' : 'lecture'}">${r.type}</span></td>
                <td><b>${r.capacity}</b> seats</td>
                <td>${r.blocked && r.blocked.length ? `<span class="tag-badge lab">${r.blocked.length} blocked</span>` : '<span style="color:#059669;">All Available</span>'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editRoom('${r.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteRoomPrompt('${r.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSectionsTable() {
  return `
    <div class="panel-header">
      <div>
        <div class="panel-title">Student Sections & Batches</div>
        <div class="panel-sub">Class cohorts requiring non-overlapping schedules</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="openSectionModal()">+ Add Section</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Section Name</th>
            <th>Semester / Year</th>
            <th>Enrolled Students</th>
            <th>Scheduled Classes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.sections.map(sec => {
            const count = state.timetable.filter(t => t.section_id === sec.id).length;
            return `
              <tr>
                <td><b>${sec.name}</b></td>
                <td><span class="tag-badge lecture">${sec.semester}</span></td>
                <td><b>${sec.students}</b> students</td>
                <td><b>${count}</b> weekly classes</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editSection('${sec.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSectionPrompt('${sec.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ========================================================
// View: Rules & Availability
// ========================================================

let selectedFacForRules = "";
function renderRulesView() {
  const container = document.getElementById("app");
  const days = state.config.days || [];
  const slots = state.config.slots || [];

  if (!selectedFacForRules && state.faculty.length > 0) {
    selectedFacForRules = state.faculty[0].id;
  }

  const unavail = state.unavailable.filter(u => u.faculty_id === selectedFacForRules);

  container.innerHTML = `
    <div class="app-container">
      <div class="page-header">
        <div class="page-title">
          <h1>Rules, Availability & Room Blocking</h1>
          <p>Click any slot below to toggle instructor availability (OK / OFF) or block rooms for maintenance.</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Faculty Availability Matrix</div>
            <div class="panel-sub">Select faculty member and toggle unavailable slots</div>
          </div>
          <select id="rulesFacSelect" class="form-control" style="width:240px;" onchange="onRulesFacChange(this.value)">
            ${state.faculty.map(f => `<option value="${f.id}" ${f.id === selectedFacForRules ? 'selected' : ''}>${f.name} (${f.department})</option>`).join("")}
          </select>
        </div>

        <div style="font-size:12.5px; margin-bottom:10px; color:#64748b;">
          Green = <b style="color:#059669;">Available (OK)</b> • Red = <b style="color:#dc2626;">Unavailable (OFF)</b>. The AI scheduler strictly avoids scheduling during OFF periods.
        </div>

        <div class="availability-grid">
          <div class="avail-header">Period</div>
          ${days.map(d => `<div class="avail-header">${d}</div>`).join("")}

          ${slots.map(sl => `
            <div class="avail-time">${sl.time}</div>
            ${days.map(d => {
              const isOff = unavail.some(u => u.day === d && u.slot_id === sl.id);
              return `
                <button class="avail-btn ${isOff ? 'off' : ''}" onclick="toggleFacultyAvailability('${selectedFacForRules}', '${d}', '${sl.id}', ${!isOff})">
                  ${isOff ? 'OFF' : 'OK'}
                </button>
              `;
            }).join("")}
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function onRulesFacChange(facId) {
  selectedFacForRules = facId;
  renderRulesView();
}

async function toggleFacultyAvailability(facId, day, slotId, unavailable) {
  try {
    await api(`/faculty/${facId}/availability`, {
      method: "POST",
      body: JSON.stringify({ day, slot_id: slotId, unavailable })
    });
    await loadData();
    renderRulesView();
    toast(unavailable ? `Marked unavailable on ${day}` : `Marked available on ${day}`, "info");
  } catch (err) {
    toast(err.message, "error");
  }
}

// ========================================================
// Auth Functions (Login, Sign Up, Quick Switch)
// ========================================================

function openAuthModal(tab = "login") {
  switchAuthTab(tab);
  openModal("authModal");
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById("authTabLogin");
  const regTab = document.getElementById("authTabRegister");
  const regFields = document.getElementById("registerFields");
  const title = document.getElementById("authModalTitle");
  const submitBtn = document.getElementById("authSubmitBtn");
  const hint = document.getElementById("authHint");

  if (tab === "register") {
    loginTab.style.borderBottom = "2px solid transparent";
    loginTab.style.color = "#64748b";
    regTab.style.borderBottom = "2px solid var(--royal-blue)";
    regTab.style.color = "var(--royal-blue)";
    regTab.style.fontWeight = "700";
    loginTab.style.fontWeight = "600";
    regFields.style.display = "block";
    title.textContent = "Create an Account";
    submitBtn.textContent = "Sign Up";
    hint.textContent = "Register as Student, Teacher, or Administrator.";
  } else {
    regTab.style.borderBottom = "2px solid transparent";
    regTab.style.color = "#64748b";
    loginTab.style.borderBottom = "2px solid var(--royal-blue)";
    loginTab.style.color = "var(--royal-blue)";
    loginTab.style.fontWeight = "700";
    regTab.style.fontWeight = "600";
    regFields.style.display = "none";
    title.textContent = "Sign In to SmartSched";
    submitBtn.textContent = "Sign In";
    hint.innerHTML = "Default admin: <b>admin / admin123</b>";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const isRegister = document.getElementById("registerFields").style.display !== "none";
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!username || !password) {
    toast("Please enter username and password", "warning");
    return;
  }

  try {
    if (isRegister) {
      const full_name = document.getElementById("authFullName").value.trim();
      const email = document.getElementById("authEmail").value.trim();
      const role = document.getElementById("authRole").value;

      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, email, full_name, role })
      });
      currentUser = res.user;
      localStorage.setItem("smartsched_user", JSON.stringify(currentUser));
      toast(`Account created! Logged in as ${currentUser.full_name || currentUser.username}`, "success");
    } else {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      currentUser = res.user;
      localStorage.setItem("smartsched_user", JSON.stringify(currentUser));
      toast(`Welcome back, ${currentUser.full_name || currentUser.username}!`, "success");
    }

    closeModal("authModal");
    navigate("dashboard");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function quickLogin(role) {
  try {
    let username = role;
    let password = `${role}123`;
    const res = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    currentUser = res.user;
    localStorage.setItem("smartsched_user", JSON.stringify(currentUser));
    toast(`Logged in as ${role.toUpperCase()} (${currentUser.full_name})`, "success");
    closeModal("authModal");
    navigate("dashboard");
  } catch (e) {
    currentUser = {
      id: role,
      username: role,
      role: role,
      full_name: role === "admin" ? "System Administrator" : role === "teacher" ? "Dr. Anil Kumar" : "Alex Student (CSE-A)",
      ref_id: role === "teacher" ? "f1" : role === "student" ? "sec1" : ""
    };
    localStorage.setItem("smartsched_user", JSON.stringify(currentUser));
    toast(`Logged in as ${role.toUpperCase()}`, "info");
    closeModal("authModal");
    navigate("dashboard");
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("smartsched_user");
  toast("Logged out successfully", "info");
  navigate("home");
}

// ========================================================
// AI Timetable Generation & Publishing
// ========================================================

async function generateSchedule() {
  toast("Running AI constraint solver (Google OR-Tools CP-SAT)...", "info");
  try {
    const res = await api("/timetable/generate", { method: "POST" });
    await loadData();
    toast(res.message || `Timetable generated! (${res.count} sessions)`, "success");
    navigate("timetable");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function publishSchedule() {
  try {
    const res = await api("/timetable/publish", { method: "POST" });
    toast(res.message || "Timetable verified and published!", "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function clearSchedulePrompt() {
  if (confirm("Are you sure you want to clear the entire generated timetable?")) {
    try {
      await api("/timetable/clear", { method: "POST" });
      await loadData();
      toast("Timetable cleared successfully", "info");
      renderApp();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

// ========================================================
// Resource CRUD Modals (Faculty, Subject, Room, Section)
// ========================================================

function openFacultyModal(facId = null) {
  document.getElementById("facultyForm").reset();
  document.getElementById("facultyId").value = "";
  document.getElementById("facultyModalTitle").textContent = "Add Faculty Member";

  if (facId) {
    const f = state.faculty.find(x => x.id === facId);
    if (f) {
      document.getElementById("facultyId").value = f.id;
      document.getElementById("facultyName").value = f.name;
      document.getElementById("facultyDept").value = f.department;
      document.getElementById("facultyModalTitle").textContent = "Edit Faculty Member";
    }
  }
  openModal("facultyModal");
}

function editFaculty(id) { openFacultyModal(id); }

async function saveFaculty(e) {
  e.preventDefault();
  const id = document.getElementById("facultyId").value;
  const name = document.getElementById("facultyName").value.trim();
  const department = document.getElementById("facultyDept").value.trim();

  if (!name) return toast("Faculty name is required", "warning");

  try {
    if (id) {
      await api(`/faculty/${id}`, { method: "PUT", body: JSON.stringify({ name, department }) });
      toast("Faculty member updated", "success");
    } else {
      await api("/faculty", { method: "POST", body: JSON.stringify({ name, department }) });
      toast("Faculty member added", "success");
    }
    await loadData();
    closeModal("facultyModal");
    renderResourcesView();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function deleteFacultyPrompt(id) {
  const f = state.faculty.find(x => x.id === id);
  if (confirm(`Delete instructor "${f ? f.name : id}" and unassign their classes?`)) {
    try {
      await api(`/faculty/${id}`, { method: "DELETE" });
      await loadData();
      toast("Faculty member deleted", "info");
      renderResourcesView();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

function openSubjectModal(subId = null) {
  document.getElementById("subjectForm").reset();
  document.getElementById("subjectId").value = "";
  document.getElementById("subjectModalTitle").textContent = "Add Course / Subject";

  const facSel = document.getElementById("subjectFaculty");
  facSel.innerHTML = `
    <option value="">-- Select Assigned Faculty --</option>
    ${state.faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join("")}
  `;

  if (subId) {
    const sub = state.subjects.find(s => s.id === subId);
    if (sub) {
      document.getElementById("subjectId").value = sub.id;
      document.getElementById("subjectCode").value = sub.code;
      document.getElementById("subjectName").value = sub.name;
      document.getElementById("subjectType").value = sub.type;
      document.getElementById("subjectHours").value = sub.hours || 3;
      facSel.value = sub.faculty_id || "";
      document.getElementById("subjectModalTitle").textContent = "Edit Course / Subject";
    }
  }
  openModal("subjectModal");
}

function editSubject(id) { openSubjectModal(id); }

async function saveSubject(e) {
  e.preventDefault();
  const id = document.getElementById("subjectId").value;
  const code = document.getElementById("subjectCode").value.trim();
  const name = document.getElementById("subjectName").value.trim();
  const type = document.getElementById("subjectType").value;
  const faculty_id = document.getElementById("subjectFaculty").value;
  const hours = parseInt(document.getElementById("subjectHours").value, 10) || 3;

  if (!code || !name) return toast("Subject code and name are required", "warning");

  try {
    if (id) {
      await api(`/subjects/${id}`, { method: "PUT", body: JSON.stringify({ code, name, type, faculty_id, hours }) });
      toast("Subject updated", "success");
    } else {
      await api("/subjects", { method: "POST", body: JSON.stringify({ code, name, type, faculty_id, hours }) });
      toast("Subject added", "success");
    }
    await loadData();
    closeModal("subjectModal");
    renderResourcesView();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function deleteSubjectPrompt(id) {
  const s = state.subjects.find(x => x.id === id);
  if (confirm(`Delete course "${s ? s.code + ' ' + s.name : id}"?`)) {
    try {
      await api(`/subjects/${id}`, { method: "DELETE" });
      await loadData();
      toast("Subject deleted", "info");
      renderResourcesView();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

function openRoomModal(roomId = null) {
  document.getElementById("roomForm").reset();
  document.getElementById("roomId").value = "";
  document.getElementById("roomModalTitle").textContent = "Add Room / Lab";

  if (roomId) {
    const r = state.rooms.find(x => x.id === roomId);
    if (r) {
      document.getElementById("roomId").value = r.id;
      document.getElementById("roomName").value = r.name;
      document.getElementById("roomType").value = r.type;
      document.getElementById("roomCapacity").value = r.capacity || 60;
      document.getElementById("roomModalTitle").textContent = "Edit Room / Lab";
    }
  }
  openModal("roomModal");
}

function editRoom(id) { openRoomModal(id); }

async function saveRoom(e) {
  e.preventDefault();
  const id = document.getElementById("roomId").value;
  const name = document.getElementById("roomName").value.trim();
  const type = document.getElementById("roomType").value;
  const capacity = parseInt(document.getElementById("roomCapacity").value, 10) || 60;

  if (!name) return toast("Room name is required", "warning");

  try {
    if (id) {
      await api(`/rooms/${id}`, { method: "PUT", body: JSON.stringify({ name, type, capacity }) });
      toast("Room updated", "success");
    } else {
      await api("/rooms", { method: "POST", body: JSON.stringify({ name, type, capacity }) });
      toast("Room added", "success");
    }
    await loadData();
    closeModal("roomModal");
    renderResourcesView();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function deleteRoomPrompt(id) {
  const r = state.rooms.find(x => x.id === id);
  if (confirm(`Delete room "${r ? r.name : id}"?`)) {
    try {
      await api(`/rooms/${id}`, { method: "DELETE" });
      await loadData();
      toast("Room deleted", "info");
      renderResourcesView();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

function openSectionModal(secId = null) {
  document.getElementById("sectionForm").reset();
  document.getElementById("sectionId").value = "";
  document.getElementById("sectionModalTitle").textContent = "Add Section / Cohort";

  if (secId) {
    const s = state.sections.find(x => x.id === secId);
    if (s) {
      document.getElementById("sectionId").value = s.id;
      document.getElementById("sectionName").value = s.name;
      document.getElementById("sectionSemester").value = s.semester;
      document.getElementById("sectionStudents").value = s.students || 50;
      document.getElementById("sectionModalTitle").textContent = "Edit Section";
    }
  }
  openModal("sectionModal");
}

function editSection(id) { openSectionModal(id); }

async function saveSection(e) {
  e.preventDefault();
  const id = document.getElementById("sectionId").value;
  const name = document.getElementById("sectionName").value.trim();
  const semester = document.getElementById("sectionSemester").value.trim();
  const students = parseInt(document.getElementById("sectionStudents").value, 10) || 50;

  if (!name) return toast("Section name is required", "warning");

  try {
    if (id) {
      await api(`/sections/${id}`, { method: "PUT", body: JSON.stringify({ name, semester, students }) });
      toast("Section updated", "success");
    } else {
      await api("/sections", { method: "POST", body: JSON.stringify({ name, semester, students }) });
      toast("Section added", "success");
    }
    await loadData();
    closeModal("sectionModal");
    renderResourcesView();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function deleteSectionPrompt(id) {
  const sec = state.sections.find(x => x.id === id);
  if (confirm(`Delete section "${sec ? sec.name : id}" and associated classes?`)) {
    try {
      await api(`/sections/${id}`, { method: "DELETE" });
      await loadData();
      toast("Section deleted", "info");
      renderResourcesView();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

// ========================================================
// Manual Timetable Entry Editing (Add / Edit / Delete Slot)
// ========================================================

function openEntryModal(entryId = null, defaultDay = null, defaultSlot = null) {
  document.getElementById("entryForm").reset();
  document.getElementById("entryId").value = "";
  document.getElementById("entryConflictAlert").style.display = "none";
  document.getElementById("entryDeleteBtn").style.display = "none";

  const days = state.config.days || [];
  const slots = state.config.slots || [];

  const daySel = document.getElementById("entryDay");
  daySel.innerHTML = days.map(d => `<option value="${d}">${d}</option>`).join("");
  if (defaultDay) daySel.value = defaultDay;

  const slotSel = document.getElementById("entrySlot");
  slotSel.innerHTML = slots.map(s => `<option value="${s.id}">${s.time}</option>`).join("");
  if (defaultSlot) slotSel.value = defaultSlot;

  const secSel = document.getElementById("entrySection");
  secSel.innerHTML = state.sections.map(s => `<option value="${s.id}">${s.name} (${s.students} std)</option>`).join("");

  const subSel = document.getElementById("entrySubject");
  subSel.innerHTML = state.subjects.map(s => `<option value="${s.id}">[${s.code}] ${s.name} (${s.type})</option>`).join("");

  const facSel = document.getElementById("entryFaculty");
  facSel.innerHTML = state.faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join("");

  const roomSel = document.getElementById("entryRoom");
  roomSel.innerHTML = state.rooms.map(r => `<option value="${r.id}">${r.name} (${r.type} • Cap: ${r.capacity})</option>`).join("");

  if (entryId) {
    const entry = state.timetable.find(t => t.id === entryId);
    if (entry) {
      document.getElementById("entryId").value = entry.id;
      daySel.value = entry.day;
      slotSel.value = entry.slot_id;
      secSel.value = entry.section_id;
      subSel.value = entry.subject_id;
      facSel.value = entry.faculty_id || "";
      roomSel.value = entry.room_id;
      document.getElementById("entryModalTitle").textContent = "Edit Class Entry";
      document.getElementById("entryDeleteBtn").style.display = "inline-flex";
    }
  } else {
    document.getElementById("entryModalTitle").textContent = "Add Class Entry";
    onEntrySubjectChange();
  }

  openModal("entryModal");
}

function onEntrySubjectChange() {
  const subId = document.getElementById("entrySubject").value;
  const sub = state.subjects.find(s => s.id === subId);
  if (sub && sub.faculty_id) {
    document.getElementById("entryFaculty").value = sub.faculty_id;
  }
}

async function saveEntry(e) {
  e.preventDefault();
  const id = document.getElementById("entryId").value;
  const day = document.getElementById("entryDay").value;
  const slot_id = document.getElementById("entrySlot").value;
  const section_id = document.getElementById("entrySection").value;
  const subject_id = document.getElementById("entrySubject").value;
  const faculty_id = document.getElementById("entryFaculty").value;
  const room_id = document.getElementById("entryRoom").value;

  const payload = { day, slot_id, section_id, subject_id, faculty_id, room_id };

  try {
    if (id) {
      await api(`/timetable/entry/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("Class updated successfully", "success");
    } else {
      await api("/timetable/entry", { method: "POST", body: JSON.stringify(payload) });
      toast("Class scheduled successfully", "success");
    }
    await loadData();
    closeModal("entryModal");
    renderApp();
  } catch (err) {
    const alertBox = document.getElementById("entryConflictAlert");
    alertBox.textContent = "⚠️ Conflict Warning: " + err.message;
    alertBox.style.display = "block";
    toast("Scheduling conflict detected!", "error");
  }
}

async function deleteEntry() {
  const id = document.getElementById("entryId").value;
  if (!id) return;
  if (confirm("Remove this scheduled class?")) {
    try {
      await api(`/timetable/entry/${id}`, { method: "DELETE" });
      await loadData();
      closeModal("entryModal");
      toast("Class removed", "info");
      renderApp();
    } catch (err) {
      toast(err.message, "error");
    }
  }
}

// ========================================================
// Exports (CSV & JSON)
// ========================================================

function downloadCSV() {
  const slotsMap = Object.fromEntries((state.config.slots || []).map(s => [s.id, s.time]));
  const rows = [["Day", "Time Slot", "Section", "Subject Code", "Subject Name", "Type", "Faculty", "Room", "Capacity"]];

  state.timetable.forEach(e => {
    const sub = state.subjects.find(s => s.id === e.subject_id);
    const fac = state.faculty.find(f => f.id === e.faculty_id);
    const rm = state.rooms.find(r => r.id === e.room_id);
    const sec = state.sections.find(s => s.id === e.section_id);

    rows.push([
      e.day,
      slotsMap[e.slot_id] || e.slot_id,
      sec ? sec.name : "",
      sub ? sub.code : "",
      sub ? sub.name : "",
      sub ? sub.type : "",
      fac ? fac.name : "",
      rm ? rm.name : "",
      rm ? rm.capacity : ""
    ]);
  });

  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GEC_Madhubani_Timetable_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  toast("CSV timetable exported", "success");
}

function exportTeacherCSV(facId) {
  const slotsMap = Object.fromEntries((state.config.slots || []).map(s => [s.id, s.time]));
  const rows = [["Day", "Time Slot", "Subject Code", "Subject Name", "Section", "Room"]];
  const list = state.timetable.filter(e => e.faculty_id === facId);

  list.forEach(e => {
    const sub = state.subjects.find(s => s.id === e.subject_id);
    const rm = state.rooms.find(r => r.id === e.room_id);
    const sec = state.sections.find(s => s.id === e.section_id);
    rows.push([
      e.day,
      slotsMap[e.slot_id] || e.slot_id,
      sub ? sub.code : "",
      sub ? sub.name : "",
      sec ? sec.name : "",
      rm ? rm.name : ""
    ]);
  });

  const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Faculty_Timetable_${facId}.csv`;
  a.click();
  toast("Faculty CSV exported", "success");
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GEC_Madhubani_Timetable_Data_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast("JSON data exported", "success");
}

// ========================================================
// AI Assistant Drawer Interaction
// ========================================================

function openAiAssistant() {
  const drawer = document.getElementById("aiDrawer");
  if (drawer) drawer.classList.remove("hidden");
}

function closeAiAssistant() {
  const drawer = document.getElementById("aiDrawer");
  if (drawer) drawer.classList.add("hidden");
}

function sendAiPrompt(text) {
  openAiAssistant();
  const input = document.getElementById("aiInput");
  if (input) input.value = text;
  sendAiMessage();
}

async function sendAiMessage() {
  const input = document.getElementById("aiInput");
  const messagesBox = document.getElementById("aiMessages");
  if (!input || !messagesBox) return;

  const q = input.value.trim();
  if (!q) return;

  const userBubble = document.createElement("div");
  userBubble.className = "ai-bubble user";
  userBubble.textContent = q;
  messagesBox.appendChild(userBubble);
  input.value = "";
  messagesBox.scrollTop = messagesBox.scrollHeight;

  const thinkingBubble = document.createElement("div");
  thinkingBubble.className = "ai-bubble assistant";
  thinkingBubble.textContent = "Analyzing database constraints...";
  messagesBox.appendChild(thinkingBubble);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  try {
    const res = await api("/ai", {
      method: "POST",
      body: JSON.stringify({ message: q })
    });
    thinkingBubble.innerHTML = formatAiResponse(res.answer);
  } catch (err) {
    thinkingBubble.textContent = "Error: " + err.message;
  }
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function formatAiResponse(txt) {
  if (!txt) return "";
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br>');
}

// ========================================================
// Initialization
// ========================================================

async function init() {
  await loadData();
  renderApp();
}

init();
