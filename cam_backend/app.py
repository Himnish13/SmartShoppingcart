from flask import Flask, jsonify
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# GLOBAL STATE (shared with frontend)
current_event = {
    "type": None,   # "add" / "remove"
    "barcode": None,
    "status": None  # "scanning", "failed", "success"
}

# 👇 Import your functions
from track import detect_hand_movement
from barcode import scan_barcode


# Unused: replaced by parallel threads
# def process_scan(event_type):
#     ... 


# Shared event for synchronization
scan_done = threading.Event()

def barcode_listener():
    """
    Dedicated thread for the barcode scanner.
    """
    global current_event
    while True:
        # This will block until a barcode is scanned
        code = scan_barcode()
        
        if code:
            # Determine if this scan is part of a triggered movement or a manual scan
            event_type = current_event.get("type") or "add"
            
            print(f"🛒 [EVENT] Processing {event_type} for barcode: {code}")
            current_event = {
                "type": event_type,
                "barcode": code,
                "status": "success"
            }
            
            # Signal the detection thread that we are done
            scan_done.set()
            
            # Keep the success status for a few seconds so frontend can see it
            time.sleep(3)
            current_event = {"type": None, "barcode": None, "status": None}


def background_detection():
    global current_event
    print("📷 [CAMERA] Hand tracking started...")
    while True:
        movement = detect_hand_movement()

        if movement:
            print(f"✋ [MOVEMENT] Detected: {movement}")
            
            # 1. Update state to tell frontend we are waiting for a scan
            current_event = {
                "type": "add" if movement == "inside" else "remove",
                "status": "waiting_for_scan",
                "barcode": None
            }
            
            # 2. Wait until barcode_listener signals that a scan happened
            scan_done.clear()
            print("⏳ [SYSTEM] Waiting for barcode scan before resuming tracking...")
            scan_done.wait() 
            print("✅ [SYSTEM] Scan complete. Resuming hand tracking.")


# Run both in background threads
threading.Thread(target=background_detection, daemon=True).start()
threading.Thread(target=barcode_listener, daemon=True).start()


@app.route("/event")
def get_event():
    return jsonify(current_event)


if __name__ == "__main__":
    print("🚀 Server running on http://localhost:5200")
    print("💡 TIP: Keep this terminal window focused when scanning!")
    # Disable reloader because it interferes with terminal input (stdin)
    app.run(host="0.0.0.0", port=5200, debug=True, use_reloader=False)