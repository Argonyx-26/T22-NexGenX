import requests
import time
from datetime import datetime
from datasets import load_dataset
import random

API_URL = "http://127.0.0.1:8000/api/events"

def run_demo():
    print("--- FETCHING DATA FROM HUGGING FACE: SALAD-SOC ---")
    try:
        # Load the dataset in streaming mode to save memory
        ds = load_dataset("nutthakorn7/SALAD-SOC", split="train", streaming=True)
        
        samples = []
        for row in ds:
            if str(row.get('is_malicious', '0')) == '1' or row.get('is_malicious') == 1:
                samples.append(row)
                if len(samples) >= 3:
                    break
                    
        print("--- STARTING REAL DATA INJECTION ---")
        
        # We assign different sources but the same zone to force the correlation engine to trigger
        sources = ["CLOUD", "NETWORK", "AUTH"]
        target_zone = "Zone_A"
        
        for i, row in enumerate(samples):
            # Parse confidence and alert level safely
            conf = row.get('confidence')
            confidence_val = float(conf) if conf and str(conf).strip() and str(conf).lower() != 'nan' else 0.95
            
            sev = str(row['severity']).upper()
            alert_level = "CRITICAL" if sev in ['HIGH', 'CRITICAL', '3', '4', 'SEVERE'] else "HIGH"
            
            attack_cat = str(row['attack_category'])
            if attack_cat == "nan" or not attack_cat:
                attack_cat = str(row['alert_type'])
                
            payload = {
                "type": "NEW_EVENT",
                "data": {
                    "event_id": str(row['alert_id']),
                    "source": sources[i],
                    "event_type": attack_cat,
                    "location": target_zone,
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "confidence": confidence_val,
                    # Provide realistic coordinates for a threat actor
                    "latitude": 39.9042,
                    "longitude": 116.4074,
                    "country": "China",
                    "metadata": {
                        "src_ip": str(row['src_ip']),
                        "dst_ip": str(row['dst_ip']),
                        "mitre_tactic": str(row['mitre_tactic']),
                        "detail": str(row['alert_description'])[:50] + "..."
                    },
                    "alert_level": alert_level
                }
            }
            
            print(f"Injecting: {attack_cat} from {row['src_ip']}")
            requests.post(API_URL, json=payload)
            time.sleep(1.5)
            
        print("--- INJECTION COMPLETED ---")
    except Exception as e:
        print(f"Error executing real data demo: {e}")

if __name__ == "__main__":
    run_demo()
