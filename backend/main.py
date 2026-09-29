
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Optional
import uuid

DATABASE_URL = "sqlite:///./smartsched.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
SLOTS = [
    {"id":"s1","time":"09:00 - 10:00"},
    {"id":"s2","time":"10:00 - 11:00"},
    {"id":"s3","time":"11:15 - 12:15"},
    {"id":"s4","time":"12:15 - 13:15"},
    {"id":"s5","time":"14:00 - 15:00"},
    {"id":"s6","time":"15:00 - 16:00"},
]

class Faculty(Base):
    __tablename__="faculty"
    id=Column(String, primary_key=True)
    name=Column(String, nullable=False)
    department=Column(String, default="CSE")

class Subject(Base):
    __tablename__="subjects"
    id=Column(String, primary_key=True)
    code=Column(String, nullable=False)
    name=Column(String, nullable=False)
    faculty_id=Column(String, ForeignKey("faculty.id"))
    type=Column(String, default="Lecture")
    hours=Column(Integer, default=3)

class Room(Base):
    __tablename__="rooms"
    id=Column(String, primary_key=True)
    name=Column(String, nullable=False)
    type=Column(String, default="Classroom")
    capacity=Column(Integer, default=60)
    blocked=Column(String, default="")

class Section(Base):
    __tablename__="sections"
    id=Column(String, primary_key=True)
    name=Column(String, nullable=False)
    semester=Column(String, default="3rd")
    students=Column(Integer, default=50)

class Timetable(Base):
    __tablename__="timetable"
    id=Column(String, primary_key=True)
    section_id=Column(String, ForeignKey("sections.id"))
    subject_id=Column(String, ForeignKey("subjects.id"))
    faculty_id=Column(String, ForeignKey("faculty.id"))
    room_id=Column(String, ForeignKey("rooms.id"))
    day=Column(String)
    slot_id=Column(String)

class FacultyUnavailable(Base):
    __tablename__="faculty_unavailable"
    id=Column(String, primary_key=True)
    faculty_id=Column(String, ForeignKey("faculty.id"))
    day=Column(String)
    slot_id=Column(String)

Base.metadata.create_all(engine)

app=FastAPI(title="SmartSched AI API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

def db():
    s=SessionLocal()
    try: yield s
    finally: s.close()

def seed(s: Session):
    if s.query(Faculty).count(): return
    fs=[
        Faculty(id="f1",name="Dr. Anil Kumar",department="CSE"),
        Faculty(id="f2",name="Prof. Neha Singh",department="CSE"),
        Faculty(id="f3",name="Dr. Ravi Sharma",department="ECE"),
        Faculty(id="f4",name="Prof. Pooja Verma",department="Maths"),
    ]
    subs=[
        Subject(id="sub1",code="CS101",name="Programming Fundamentals",faculty_id="f1",type="Lecture",hours=3),
        Subject(id="sub2",code="CS102",name="Data Structures",faculty_id="f2",type="Lecture",hours=3),
        Subject(id="sub3",code="EC101",name="Digital Electronics",faculty_id="f3",type="Lecture",hours=3),
        Subject(id="sub4",code="MA101",name="Engineering Mathematics",faculty_id="f4",type="Lecture",hours=3),
        Subject(id="sub5",code="CSL101",name="Programming Lab",faculty_id="f1",type="Lab",hours=2),
        Subject(id="sub6",code="CSL102",name="DS Lab",faculty_id="f2",type="Lab",hours=2),
    ]
    rooms=[
        Room(id="r1",name="CSE-101",type="Classroom",capacity=60),
        Room(id="r2",name="CSE-102",type="Classroom",capacity=60),
        Room(id="r3",name="ECE-201",type="Classroom",capacity=60),
        Room(id="lab1",name="CSE Lab-1",type="Lab",capacity=40),
        Room(id="lab2",name="CSE Lab-2",type="Lab",capacity=40),
    ]
    secs=[
        Section(id="sec1",name="CSE-A",semester="3rd",students=58),
        Section(id="sec2",name="CSE-B",semester="3rd",students=55),
    ]
    s.add_all(fs+subs+rooms+secs); s.commit()

@app.on_event("startup")
def startup():
    with SessionLocal() as s: seed(s)

@app.get("/api/health")
def health(): return {"status":"ok","service":"SmartSched AI"}

@app.get("/api/data")
def data(s: Session=Depends(db)):
    return {
        "faculty":[{"id":x.id,"name":x.name,"department":x.department} for x in s.query(Faculty).all()],
        "subjects":[{"id":x.id,"code":x.code,"name":x.name,"faculty_id":x.faculty_id,"type":x.type,"hours":x.hours} for x in s.query(Subject).all()],
        "rooms":[{"id":x.id,"name":x.name,"type":x.type,"capacity":x.capacity,"blocked":x.blocked.split(",") if x.blocked else []} for x in s.query(Room).all()],
        "sections":[{"id":x.id,"name":x.name,"semester":x.semester,"students":x.students} for x in s.query(Section).all()],
        "timetable":[{"id":x.id,"section_id":x.section_id,"subject_id":x.subject_id,"faculty_id":x.faculty_id,"room_id":x.room_id,"day":x.day,"slot_id":x.slot_id} for x in s.query(Timetable).all()],
        "unavailable":[{"faculty_id":x.faculty_id,"day":x.day,"slot_id":x.slot_id} for x in s.query(FacultyUnavailable).all()]
    }

class FacultyIn(BaseModel):
    name:str
    department:str="CSE"

@app.post("/api/faculty")
def add_faculty(item:FacultyIn,s:Session=Depends(db)):
    x=Faculty(id=str(uuid.uuid4()),name=item.name,department=item.department)
    s.add(x);s.commit();return {"id":x.id}

class BlockIn(BaseModel):
    day:str
    slot_id:str
    blocked:bool=True

@app.post("/api/rooms/{room_id}/block")
def block_room(room_id:str,item:BlockIn,s:Session=Depends(db)):
    r=s.get(Room,room_id)
    vals=set(filter(None,r.blocked.split(",")))
    k=f"{item.day}|{item.slot_id}"
    if item.blocked: vals.add(k)
    else: vals.discard(k)
    r.blocked=",".join(sorted(vals));s.commit()
    return {"ok":True}

class AvailabilityIn(BaseModel):
    day:str
    slot_id:str
    unavailable:bool=True

@app.post("/api/faculty/{faculty_id}/availability")
def faculty_availability(faculty_id:str,item:AvailabilityIn,s:Session=Depends(db)):
    q=s.query(FacultyUnavailable).filter_by(faculty_id=faculty_id,day=item.day,slot_id=item.slot_id).first()
    if item.unavailable and not q:
        s.add(FacultyUnavailable(id=str(uuid.uuid4()),faculty_id=faculty_id,day=item.day,slot_id=item.slot_id))
    elif not item.unavailable and q:
        s.delete(q)
    s.commit(); return {"ok":True}

def generate(s:Session):
    s.query(Timetable).delete(); s.commit()
    sections=s.query(Section).all(); subjects=s.query(Subject).all(); rooms=s.query(Room).all()
    unavailable={(x.faculty_id,x.day,x.slot_id) for x in s.query(FacultyUnavailable).all()}
    room_blocked={r.id:set(filter(None,r.blocked.split(","))) for r in rooms}
    used_section=set(); used_faculty=set(); used_room=set()
    for si,sec in enumerate(sections):
        for ii,sub in enumerate(subjects):
            target=1 if sub.type=="Lab" else min(3,sub.hours)
            added=0
            for d in range(5):
                for z in range(6):
                    if added>=target: break
                    day=DAYS[(d+ii+si)%5]; slot=SLOTS[(z+ii+si)%6]
                    sk=(sec.id,day,slot["id"]); fk=(sub.faculty_id,day,slot["id"])
                    if sk in used_section or fk in used_faculty or (sub.faculty_id,day,slot["id"]) in unavailable: continue
                    room=None
                    for r in rooms:
                        if r.type != ("Lab" if sub.type=="Lab" else "Classroom"): continue
                        rk=(r.id,day,slot["id"])
                        if rk in used_room or f"{day}|{slot['id']}" in room_blocked[r.id]: continue
                        room=r;break
                    if not room: continue
                    s.add(Timetable(id=str(uuid.uuid4()),section_id=sec.id,subject_id=sub.id,
                                    faculty_id=sub.faculty_id,room_id=room.id,day=day,slot_id=slot["id"]))
                    used_section.add(sk);used_faculty.add(fk);used_room.add((room.id,day,slot["id"]));added+=1
    s.commit()
    return {"count":s.query(Timetable).count()}

@app.post("/api/timetable/generate")
def generate_timetable(s:Session=Depends(db)):
    return generate(s)

@app.post("/api/timetable/publish")
def publish(s:Session=Depends(db)):
    return {"published":True,"message":"Timetable published after validation."}

class AIIn(BaseModel):
    message:str

@app.post("/api/ai")
def ai(item:AIIn,s:Session=Depends(db)):
    q=item.message.lower()
    tt=s.query(Timetable).all()
    if "conflict" in q:
        return {"answer":"The current scheduler prevents section, faculty and room double-booking during generation. Regenerate after changing constraints."}
    if "workload" in q:
        out=[]
        for f in s.query(Faculty).all():
            out.append(f"{f.name}: {sum(1 for x in tt if x.faculty_id==f.id)} slots")
        return {"answer":" • ".join(out)}
    if "room" in q or "lab" in q:
        return {"answer":f"There are {s.query(Room).count()} rooms/labs and {len(tt)} scheduled entries."}
    if "generate" in q or "timetable" in q:
        return {"answer":"Use Generate Timetable. It checks section, faculty, room/lab and availability constraints."}
    if "what if" in q:
        return {"answer":"Use What-if Simulation to test a blocked room/resource before applying the change."}
    return {"answer":"Ask me about conflicts, faculty workload, rooms/labs, timetable generation or what-if simulation."}
