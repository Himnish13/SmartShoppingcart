import cv2
from pyzbar.pyzbar import decode

def scan_barcode():

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        return None

    frame_count = 0
    MAX_FRAMES = 120

    while frame_count < MAX_FRAMES:

        ret, frame = cap.read()
        if not ret:
            break

        # 🔥 PREPROCESSING (IMPORTANT)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # increase contrast
        gray = cv2.equalizeHist(gray)

        # blur to remove noise
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        # threshold for sharper barcode
        _, thresh = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)

        # try decoding both
        barcodes = decode(thresh) or decode(gray)

        for barcode in barcodes:
            data = barcode.data.decode('utf-8')

            cap.release()
            cv2.destroyAllWindows()

            return data

        frame_count += 1

    cap.release()
    cv2.destroyAllWindows()

    return None