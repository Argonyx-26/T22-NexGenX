import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, MapPin, Target, Crosshair, Server, Zap } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const customMarker = L.divIcon({
  className: 'pulsing-marker',
  iconSize: [20, 20]
});

function App() {
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState({
    "Zone_A": "NORMAL",
    "Zone_B": "NORMAL",
    "Zone_C": "NORMAL",
    "Zone_D": "NORMAL"
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws');
    
    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'NEW_EVENT') {
        const newEvent = payload.data;
        if (newEvent.alert_level === 'CRITICAL' || newEvent.alert_level === 'HIGH') {
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      } else if (payload.type === 'NEW_INCIDENT') {
        setIncidents((prev) => [payload.data, ...prev].slice(0, 10));
      } else if (payload.type === 'ZONE_UPDATE') {
        setZones(payload.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const runDemoAttack = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/demo', { method: 'POST' });
    } catch (err) {
      console.error("Failed to run demo:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neon-cyan font-mono flex flex-col p-4 relative overflow-hidden">
      {/* Grid background effect */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00ffcc 1px, transparent 1px), linear-gradient(90deg, #00ffcc 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center border-b border-neon-cyan/30 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-neon-cyan animate-pulse" />
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(0,255,204,0.8)]">CORTEX</h1>
            <p className="text-xs text-neon-cyan/70">Intelligent Threat Detection & Situational Awareness System</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={runDemoAttack}
            className="px-6 py-2 bg-neon-red/20 text-neon-red border border-neon-red rounded hover:bg-neon-red/40 transition-all font-bold tracking-wider shadow-[0_0_15px_rgba(255,0,51,0.5)] flex items-center gap-2"
          >
            <Zap size={18} /> RUN ATTACK DEMO
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm">SYSTEM STATUS:</span>
            {connected ? (
              <span className="flex items-center gap-2 text-neon-cyan bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/30">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-2 text-neon-orange bg-neon-orange/10 px-3 py-1 rounded-full border border-neon-orange/30">
                <span className="w-2 h-2 rounded-full bg-neon-orange"></span>
                OFFLINE
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Zones Row */}
      <div className="relative z-10 grid grid-cols-4 gap-4 mb-6">
        {Object.entries(zones).map(([zone, status]) => (
          <div 
            key={zone} 
            className={`p-4 rounded border flex justify-between items-center ${
              status === 'NORMAL' 
                ? 'border-green-500/30 bg-green-900/20 text-green-400' 
                : 'border-neon-red/50 bg-neon-red/20 text-neon-red shadow-[0_0_15px_rgba(255,0,51,0.3)] animate-pulse'
            }`}
          >
            <span className="font-bold">{zone.replace('_', ' ')}</span>
            {status === 'NORMAL' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          </div>
        ))}
      </div>

      {/* Main Content: 3 Columns */}
      <div className="relative z-10 grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Live Alert Stream */}
        <div className="col-span-3 border border-neon-cyan/30 bg-black/60 rounded flex flex-col backdrop-blur-sm">
          <div className="p-3 border-b border-neon-cyan/30 bg-neon-cyan/10 flex items-center gap-2">
            <Activity className="text-neon-cyan" size={18} />
            <h2 className="font-bold tracking-wider text-white">LIVE EVENT STREAM</h2>
          </div>
          <div className="p-3 overflow-y-auto flex-1 space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-neon-cyan/50 py-10 italic">No events recorded.</div>
            ) : (
              events.map((evt, idx) => (
                <div key={idx} className={`p-3 rounded border text-sm flex flex-col gap-2 ${
                  evt.alert_level === 'CRITICAL' ? 'border-neon-red/50 bg-neon-red/10' : 'border-neon-orange/50 bg-neon-orange/10'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className={`font-bold ${evt.alert_level === 'CRITICAL' ? 'text-neon-red' : 'text-neon-orange'}`}>
                      [{evt.alert_level}] {evt.event_type}
                    </span>
                    <span className="text-xs text-gray-400">{evt.timestamp}</span>
                  </div>
                  <div className="text-gray-300 text-xs">
                    Source: <span className="text-white">{evt.source}</span> | Loc: <span className="text-white">{evt.location}</span>
                  </div>
                  <div className="text-xs text-gray-500 break-words">
                    {JSON.stringify(evt.metadata)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Column: Active Incidents */}
        <div className="col-span-5 border border-neon-cyan/30 bg-black/60 rounded flex flex-col backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,204,0.1)]">
          <div className="p-3 border-b border-neon-cyan/30 bg-neon-cyan/10 flex items-center gap-2">
            <Target className="text-neon-cyan" size={18} />
            <h2 className="font-bold tracking-wider text-white">CORRELATED INCIDENTS</h2>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neon-cyan/30">
                <ShieldCheck size={64} className="mb-4 opacity-50" />
                <p>No active incidents.</p>
                <p className="text-sm">System is secure.</p>
              </div>
            ) : (
              incidents.map((inc, idx) => (
                <div key={idx} className="border border-neon-red/70 bg-[#1a0505] rounded-lg overflow-hidden shadow-[0_0_15px_rgba(255,0,51,0.2)]">
                  <div className="bg-neon-red text-black p-2 font-bold flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} />
                      {inc.incident_id}
                    </div>
                    <span>{inc.status}</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{inc.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {inc.location} ({inc.country})</span>
                        <span className="flex items-center gap-1"><Crosshair size={14}/> Conf: {inc.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-neon-orange font-bold text-sm mb-2 border-b border-neon-orange/30 pb-1">AI EXPLANATION</h4>
                        <ul className="list-disc pl-4 text-xs text-gray-300 space-y-1">
                          {inc.explanation.map((exp, i) => <li key={i}>{exp}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-neon-cyan font-bold text-sm mb-2 border-b border-neon-cyan/30 pb-1">ACTIONABLE SUGGESTIONS</h4>
                        <ul className="list-disc pl-4 text-xs text-gray-300 space-y-1">
                          {inc.suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neon-red/20 flex gap-2">
                      {inc.sources.map(src => (
                        <span key={src} className="px-2 py-1 bg-neon-red/20 text-neon-red text-xs rounded flex items-center gap-1">
                          <Server size={10} /> {src}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Threat Map */}
        <div className="col-span-4 border border-neon-cyan/30 bg-black/60 rounded flex flex-col backdrop-blur-sm overflow-hidden relative min-h-[400px]">
          <div className="p-3 border-b border-neon-cyan/30 bg-neon-cyan/10 flex items-center gap-2 absolute top-0 left-0 right-0 z-[1000] bg-black/80">
            <MapPin className="text-neon-cyan" size={18} />
            <h2 className="font-bold tracking-wider text-white">GLOBAL THREAT MAP</h2>
          </div>
          <div className="absolute inset-0 top-[48px]">
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              style={{ height: '100%', width: '100%', backgroundColor: '#000' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {incidents.map((inc, idx) => (
                <Marker key={idx} position={[inc.latitude, inc.longitude]} icon={customMarker}>
                  <Popup className="bg-black text-white border-neon-red">
                    <strong className="text-neon-red">{inc.title}</strong><br/>
                    {inc.location}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
