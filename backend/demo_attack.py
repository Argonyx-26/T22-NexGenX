import requests
import time
from datetime import datetime
import random

API_URL = "http://127.0.0.1:8000/api/events"

def run_demo():
    print("--- STARTING SIMULATED DATA INJECTION ---")
    try:
        sources = ["CLOUD", "NETWORK", "AUTH"]
        target_zone = "Zone_A"
        
        attack_types = ["SQL Injection", "Cross-Site Scripting", "DDoS Attempt", "Unauthorized Access", "Malware Sandbox Detection"]
        mitre_tactics = ["TA0001", "TA0002", "TA0003", "TA0004", "TA0005"]
        
        for i in range(3):
            confidence_val = round(random.uniform(0.85, 0.99), 2)
            alert_level = "CRITICAL" if confidence_val > 0.95 else "HIGH"
            attack_cat = random.choice(attack_types)
            
            payload = {
                "type": "NEW_EVENT",
                "data": {
                    "event_id": f"evt_{random.randint(1000, 9999)}",
                    "source": sources[i],
                    "event_type": attack_cat,
                    "location": target_zone,
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "confidence": confidence_val,
                    # Provide realistic coordinates for a threat actor
                    "latitude": 39.9042 + random.uniform(-0.1, 0.1),
                    "longitude": 116.4074 + random.uniform(-0.1, 0.1),
                    "country": "China",
                    "metadata": {
                        "src_ip": f"192.168.1.{random.randint(1, 255)}",
                        "dst_ip": f"10.0.0.{random.randint(1, 255)}",
                        "mitre_tactic": random.choice(mitre_tactics),
                        "detail": f"Simulated {attack_cat} detected originating from suspicious IP."
                    },
                    "alert_level": alert_level
                }
            }
            
            print(f"Injecting: {attack_cat} from {payload['data']['metadata']['src_ip']}")
            requests.post(API_URL, json=payload)
            time.sleep(1.5)
            
        print("--- INJECTION COMPLETED ---")
    except Exception as e:
        print(f"Error executing simulated data demo: {e}")

if __name__ == "__main__":
    run_demo()
