import cv2

def detect_hand_movement():

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Camera error")
        return None

    frame_width = int(cap.get(3))
    frame_height = int(cap.get(4))

    backSub = cv2.createBackgroundSubtractorMOG2(
        history=800,
        varThreshold=40,
        detectShadows=True
    )

    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

    LINE_Y = frame_height // 2
    MIN_AREA = 2500

    prev_y = None
    direction = ""
    frame_count = 0

    while True:

        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (7, 7), 0)

        fg_mask = backSub.apply(blur)
        _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)

        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel_open, iterations=2)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel_close, iterations=3)
        fg_mask = cv2.dilate(fg_mask, None, iterations=2)

        frame_count += 1
        if frame_count < 30:
            continue

        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_contour = None
        best_score = -1

        for cnt in contours:
            area = cv2.contourArea(cnt)

            if area < MIN_AREA or area > frame_width * frame_height * 0.5:
                continue

            x, y, w, h = cv2.boundingRect(cnt)

            if w < 30 or h < 30:
                continue

            center_y = y + h // 2
            score = area + (center_y * 25)

            if score > best_score:
                best_score = score
                best_contour = cnt

        if best_contour is not None:
            x, y, w, h = cv2.boundingRect(best_contour)
            center_y = y + h // 2

            # Direction detection
            if prev_y is not None:
                if center_y > prev_y + 5:
                    direction = "DOWN"
                elif center_y < prev_y - 5:
                    direction = "UP"

            prev_y = center_y

            # 🔥 RETURN EVENTS
            if direction == "DOWN" and center_y > LINE_Y + 10:
                cap.release()
                return "inside"

            elif direction == "UP" and center_y < LINE_Y - 10:
                cap.release()
                return "outside"

    cap.release()
    return None