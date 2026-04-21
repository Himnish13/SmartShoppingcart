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


def background_detection():
    global current_event

    while True:
        movement = detect_hand_movement()

        if movement == "inside":

            current_event = {
                "type": "add",
                "status": "scanning",
                "barcode": None
            }

            code = scan_barcode()

            if code:
                current_event = {
                    "type": "add",
                    "barcode": code,   # ✅ RETURNED
                    "status": "success"
                }
            else:
                current_event = {
                    "type": "add",
                    "barcode": None,
                    "status": "failed"
                }

        elif movement == "outside":
            current_event = {
                "type": "remove",
                "barcode": None,
                "status": "success"
            }

        time.sleep(1)


# Run detection in background
threading.Thread(target=background_detection, daemon=True).start()


@app.route("/event")
def get_event():
    return jsonify(current_event)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5200, debug=True)