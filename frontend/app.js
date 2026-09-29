const API="http://127.0.0.1:8000/api";
let state={faculty:[],subjects:[],rooms:[],sections:[],timetable:[],unavailable:[]};

async function api(path,opts={}){
  const r=await fetch(API+path,{headers:{"Content-Type":"application/json"},...opts});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function load(){state=await api("/data");render("dashboard");}
function toast(x){const t=document.getElementById("toast");t.textContent=x;t.style.display="block";setTimeout(()=>t.style.display="none",2200)}
function nav(page){
 document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 render(page);
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>nav(b.dataset.page));

function render(page){
 if(page==="dashboard")dashboard();
 if(page==="timetable")timetable();
 if(page==="resources")resources();
 if(page==="rules")rules();
 if(page==="analytics")analytics();
 if(page==="whatif")whatif();
}

function dashboard(){
 const util=Math.round(state.timetable.length/(Math.max(1,state.rooms.length*30))*100);
 document.getElementById("app").innerHTML=`
 <div class="title"><div><h1>Build a conflict-free timetable.</h1><p>Automatically schedule faculty, rooms, labs and sections.</p></div>
 <div class="actions"><button class="primary" onclick="generate()">✨ Generate Timetable</button><button class="success" onclick="publish()">✓ Publish</button></div></div>
 <div class="cards">
 <div class="card">📅<span>Scheduled Classes</span><b>${state.timetable.length}</b></div>
 <div class="card">⚠️<span>Conflicts / Warnings</span><b>0</b></div>
 <div class="card">👨‍🏫<span>Faculty</span><b>${state.faculty.length}</b></div>
 <div class="card">🚪<span>Room Utilization</span><b>${util}%</b></div>
 </div>
 <div class="grid2">
 <div class="panel"><h3>Quick Actions</h3><p class="muted">Common scheduling workflows</p><div class="quick">
 <button onclick="generate()">✨ Generate Timetable<br><small>Automatic scheduling</small></button>
 <button onclick="generate()">🔄 Dynamic Reschedule<br><small>Recover blocked resources</small></button>
 <button onclick="downloadCSV()">⬇ Export Timetable<br><small>Download CSV</small></button>
 <button onclick="nav('whatif')">🪄 What-if Simulation<br><small>Test changes</small></button>
 </div></div>
 <div class="panel"><h3>System Status</h3>
 <div class="status"><span>Scheduling engine</span><b>Ready</b></div>
 <div class="status"><span>Faculty</span><b>${state.faculty.length}</b></div>
 <div class="status"><span>Rooms & labs</span><b>${state.rooms.length}</b></div>
 <div class="status"><span>Publication</span><b>Draft</b></div>
 </div></div>
 <div class="panel"><h3>Latest Scheduled Classes</h3><div class="table-wrap">${tableHTML(state.timetable.slice(0,8))}</div></div>`;
}
function tableHTML(rows){
 return `<table><tr><th>Day</th><th>Time</th><th>Section</th><th>Subject</th><th>Faculty</th><th>Room</th></tr>`+
 rows.map(e=>{let s=state.subjects.find(x=>x.id===e.subject_id),f=state.faculty.find(x=>x.id===e.faculty_id),r=state.rooms.find(x=>x.id===e.room_id),sec=state.sections.find(x=>x.id===e.section_id),slot={"s1":"09:00 - 10:00","s2":"10:00 - 11:00","s3":"11:15 - 12:15","s4":"12:15 - 13:15","s5":"14:00 - 15:00","s6":"15:00 - 16:00"}[e.slot_id];return `<tr><td>${e.day}</td><td>${slot}</td><td>${sec?.name||""}</td><td>${s?.name||""}</td><td>${f?.name||""}</td><td>${r?.name||""}</td></tr>`}).join("")+"</table>";
}
async function generate(){await api("/timetable/generate",{method:"POST"});await load();toast("Timetable generated");nav("timetable")}
async function publish(){await api("/timetable/publish",{method:"POST"});toast("Timetable published")}
function timetable(){
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday"],slots=[["s1","09:00 - 10:00"],["s2","10:00 - 11:00"],["s3","11:15 - 12:15"],["s4","12:15 - 13:15"],["s5","14:00 - 15:00"],["s6","15:00 - 16:00"]];
 document.getElementById("app").innerHTML=`<div class="title"><div><h1>Timetable</h1><p>Weekly section, faculty and room schedule.</p></div><div class="actions"><button onclick="generate()">↻ Regenerate</button><button onclick="window.print()">🖨 Print / PDF</button><button onclick="downloadCSV()">⬇ CSV</button></div></div><div class="panel tt"><table><tr><th>Time</th>${days.map(x=>`<th>${x}</th>`).join("")}</tr>${slots.map(sl=>`<tr><th>${sl[1]}</th>${days.map(day=>`<td>${state.timetable.filter(e=>e.day===day&&e.slot_id===sl[0]).map(e=>{let s=state.subjects.find(x=>x.id===e.subject_id),f=state.faculty.find(x=>x.id===e.faculty_id),r=state.rooms.find(x=>x.id===e.room_id);return `<div class="class"><b>${s?.code||""}</b><span>${s?.name||""}</span><span>👨‍🏫 ${f?.name||""}</span><span>🚪 ${r?.name||""}</span></div>`}).join("")}</td>`).join("")}</tr>`).join("")}</table></div>`;
}
function resources(){
 document.getElementById("app").innerHTML=`<div class="title"><div><h1>Resources</h1><p>Manage faculty, subjects, rooms/labs and sections.</p></div></div>
 <div class="panel"><h3>Add Faculty</h3><div class="form"><input id="fname" placeholder="Faculty name"><input id="fdept" placeholder="Department"><button class="primary" onclick="addFaculty()">+ Add</button></div>${tableHTMLFaculty()}</div>
 <div class="panel"><h3>Subjects</h3>${tableSubjects()}</div><div class="panel"><h3>Rooms / Labs</h3>${tableRooms()}</div><div class="panel"><h3>Sections</h3>${tableSections()}</div>`;
}
function tableHTMLFaculty(){return `<table><tr><th>Name</th><th>Department</th></tr>${state.faculty.map(x=>`<tr><td>${x.name}</td><td>${x.department}</td></tr>`).join("")}</table>`}
function tableSubjects(){return `<table><tr><th>Code</th><th>Subject</th><th>Faculty</th><th>Type</th></tr>${state.subjects.map(x=>`<tr><td>${x.code}</td><td>${x.name}</td><td>${state.faculty.find(f=>f.id===x.faculty_id)?.name||""}</td><td>${x.type}</td></tr>`).join("")}</table>`}
function tableRooms(){return `<table><tr><th>Room</th><th>Type</th><th>Capacity</th></tr>${state.rooms.map(x=>`<tr><td>${x.name}</td><td>${x.type}</td><td>${x.capacity}</td></tr>`).join("")}</table>`}
function tableSections(){return `<table><tr><th>Section</th><th>Semester</th><th>Students</th></tr>${state.sections.map(x=>`<tr><td>${x.name}</td><td>${x.semester}</td><td>${x.students}</td></tr>`).join("")}</table>`}
async function addFaculty(){let name=document.getElementById("fname").value.trim(),department=document.getElementById("fdept").value.trim()||"CSE";if(!name)return;await api("/faculty",{method:"POST",body:JSON.stringify({name,department})});await load();nav("resources");toast("Faculty added")}
function rules(){
 document.getElementById("app").innerHTML=`<div class="title"><div><h1>Rules & Availability</h1><p>Set faculty availability and room/lab blocking.</p></div></div>
 <div class="panel"><h3>Faculty Availability</h3><select id="facSel">${state.faculty.map(f=>`<option value="${f.id}">${f.name}</option>`).join("")}</select><div id="availability"></div></div>
 <div class="panel"><h3>Room / Lab Blocking</h3><div class="rooms">${state.rooms.map(r=>`<div class="room"><b>${r.name}</b><p class="muted">${r.type}</p><button onclick="blockRoom('${r.id}')">Block Monday 09:00</button></div>`).join("")}</div></div>`;
 document.getElementById("facSel").onchange=drawAvailability;drawAvailability();
}
function drawAvailability(){
 let f=document.getElementById("facSel").value,off=state.unavailable.filter(x=>x.faculty_id===f),days=["Monday","Tuesday","Wednesday","Thursday","Friday"],slots=[["s1","09:00"],["s2","10:00"],["s3","11:15"],["s4","12:15"],["s5","14:00"],["s6","15:00"]];
 document.getElementById("availability").innerHTML=`<div class="availability"><span></span>${days.map(d=>`<b>${d.slice(0,3)}</b>`).join("")}${slots.map(sl=>`<span>${sl[1]}</span>${days.map(d=>{let x=off.some(o=>o.day===d&&o.slot_id===sl[0]);return `<button class="${x?"off":""}" onclick="availability('${f}','${d}','${sl[0]}',${!x})">${x?"OFF":"OK"}</button>`}).join("")}`).join("")}</div>`;
}
async function availability(faculty_id,day,slot_id,unavailable){await api(`/faculty/${faculty_id}/availability`,{method:"POST",body:JSON.stringify({day,slot_id,unavailable})});await load();nav("rules")}
async function blockRoom(id){await api(`/rooms/${id}/block`,{method:"POST",body:JSON.stringify({day:"Monday",slot_id:"s1",blocked:true})});await load();toast("Room blocked");nav("rules")}
function analytics(){
 let util=Math.round(state.timetable.length/(Math.max(1,state.rooms.length*30))*100);
 document.getElementById("app").innerHTML=`<div class="title"><div><h1>Analytics</h1><p>Faculty workload and room utilization.</p></div></div><div class="grid2"><div class="panel"><h3>Faculty Workload</h3>${state.faculty.map(f=>{let n=state.timetable.filter(x=>x.faculty_id===f.id).length;return `<div class="bar"><div class="barhead"><span>${f.name}</span><b>${n}</b></div><div class="barbg"><div class="barfill" style="width:${Math.min(100,n*15)}%"></div></div></div>`}).join("")}</div><div class="panel"><h3>Room Utilization</h3><p class="muted">Overall utilization: ${util}%</p>${state.rooms.map(r=>{let n=state.timetable.filter(x=>x.room_id===r.id).length;return `<div class="bar"><div class="barhead"><span>${r.name}</span><b>${n}</b></div><div class="barbg"><div class="barfill" style="width:${Math.min(100,n*10)}%"></div></div></div>`}).join("")}</div></div>`;
}
function whatif(){
 document.getElementById("app").innerHTML=`<div class="title"><div><h1>What-if Simulation</h1><p>Test a blocked room before applying a change.</p></div></div><div class="panel"><h3>Room Blockage Scenario</h3><p class="muted">Select a room and simulate Monday 09:00–10:00 blockage.</p><select id="simRoom">${state.rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}</select> <button class="primary" onclick="simulate()">🪄 Run Simulation</button><div id="sim"></div></div>`;
}
function simulate(){let id=document.getElementById("simRoom").value,affected=state.timetable.filter(e=>e.room_id===id&&e.day==="Monday"&&e.slot_id==="s1").length;document.getElementById("sim").innerHTML=`<div class="cards" style="margin-top:15px"><div class="card"><span>Selected Room</span><b>${state.rooms.find(r=>r.id===id)?.name}</b></div><div class="card"><span>Current Classes</span><b>${state.timetable.length}</b></div><div class="card"><span>Affected</span><b>${affected}</b></div><div class="card"><span>Action</span><b style="font-size:16px">${affected?"Reschedule":"No impact"}</b></div></div>`}
function downloadCSV(){let lines=["Day,Time,Section,Subject,Faculty,Room"];state.timetable.forEach(e=>{let s=state.subjects.find(x=>x.id===e.subject_id),f=state.faculty.find(x=>x.id===e.faculty_id),r=state.rooms.find(x=>x.id===e.room_id),sec=state.sections.find(x=>x.id===e.section_id);lines.push([e.day,e.slot_id,sec?.name,s?.name,f?.name,r?.name].map(x=>`"${x||""}"`).join(","))});let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\\n")],{type:"text/csv"}));a.download="SmartSched-Timetable.csv";a.click()}
document.getElementById("aiOpen").onclick=()=>document.getElementById("aiPanel").classList.remove("hidden");
document.getElementById("aiClose").onclick=()=>document.getElementById("aiPanel").classList.add("hidden");
document.getElementById("aiSend").onclick=askAI;
document.getElementById("aiInput").onkeydown=e=>{if(e.key==="Enter")askAI()};
async function askAI(){let input=document.getElementById("aiInput"),q=input.value.trim();if(!q)return;let body=document.getElementById("aiBody");body.innerHTML+=`<div class="bubble user">${q}</div>`;let r=await api("/ai",{method:"POST",body:JSON.stringify({message:q})});body.innerHTML+=`<div class="bubble">${r.answer}</div>`;input.value="";body.scrollTop=body.scrollHeight}
load().catch(e=>{document.getElementById("app").innerHTML=`<div class="panel"><h2>Backend not running</h2><p>Start FastAPI with <b>uvicorn main:app --reload --port 8000</b> inside the backend folder.</p></div>`});
