from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict, Any, Set
import asyncio
import uuid
import json
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventData(BaseModel):
    event_id: str
    source: str
    event_type: str
    location: str
    timestamp: str
    confidence: float
    latitude: float
    longitude: float
    country: str
    metadata: Dict[str, Any]
    alert_level: str

class EventPayload(BaseModel):
    type: str
    data: EventData

# State
event_history: List[EventData] = []
active_incidents = {}
zone_states = {
    "Zone_A": "NORMAL",
    "Zone_B": "NORMAL",
    "Zone_C": "NORMAL",
    "Zone_D": "NORMAL"
}

# WebSocket Connections
connected_clients: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Send initial zone state
        await websocket.send_json({
            "type": "ZONE_UPDATE",
            "data": zone_states
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def broadcast(message: dict):
    for client in connected_clients:
        try:
            await client.send_json(message)
        except:
            pass

@app.post("/api/events")
async def receive_event(payload: EventPayload):
    event = payload.data
    event_history.append(event)
    
    # Broadcast raw event to dashboard (if CRITICAL or HIGH, handled by frontend)
    await broadcast({
        "type": "NEW_EVENT",
        "data": event.dict()
    })
    
    # Keep only last 3 events
    if len(event_history) > 3:
        event_history.pop(0)
    
    # Correlation Engine
    if len(event_history) == 3:
        # Check if all 3 from same location
        locations = set(e.location for e in event_history)
        if len(locations) == 1:
            loc = event_history[0].location
            # Check for at least 2 different sources
            sources = set(e.source for e in event_history)
            if len(sources) >= 2:
                # Trigger Incident!
                incident = generate_incident(event_history, loc)
                active_incidents[incident['incident_id']] = incident
                
                # Update Zone Status
                zone_states[loc] = "ACTIVE INCIDENT"
                
                await broadcast({
                    "type": "NEW_INCIDENT",
                    "data": incident
                })
                await broadcast({
                    "type": "ZONE_UPDATE",
                    "data": zone_states
                })
                # Clear history so we don't re-trigger immediately
                event_history.clear()

    return {"status": "success"}

def generate_incident(events: List[EventData], location: str) -> dict:
    sources = list(set(e.source for e in events))
    avg_conf = sum(e.confidence for e in events) / len(events)
    # Using the most severe/recent event as base
    base_event = events[-1]
    
    explanation = [
        f"{e.source} agent detected {e.event_type}." for e in events
    ]
    explanation.append(f"All signals originated from {location}.")
    
    suggestions = [
        f"Block source IP {base_event.metadata.get('src_ip', 'unknown')} immediately.",
        "Isolate the target database server.",
        "Notify the DBA team."
    ]
    
    return {
        "incident_id": f"INCIDENT #{str(uuid.uuid4())[:6].upper()}",
        "title": f"Correlated Attack in {location}",
        "location": location,
        "confidence": round(avg_conf * 100, 2),
        "alert_level": "CRITICAL",
        "sources": sources,
        "status": "ACTIVE",
        "latitude": base_event.latitude,
        "longitude": base_event.longitude,
        "country": base_event.country,
        "explanation": explanation,
        "suggestions": suggestions
    }

from fastapi import BackgroundTasks
import demo_attack

@app.post("/api/demo")
async def trigger_demo(background_tasks: BackgroundTasks):
    background_tasks.add_task(demo_attack.run_demo)
    return {"status": "Demo attack initiated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
