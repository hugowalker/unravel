"""Validate a supported OpenCV camera/video source without motor actuation."""
import argparse
import time
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.control import PixelController, DryRunMotors

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True)
    parser.add_argument("--source", default="0", help="OpenCV device index or video file; not a generic SPI camera driver")
    args = parser.parse_args()
    import cv2
    from ultralytics import YOLO
    model = YOLO(args.weights, task="detect")
    if "drone" not in [str(n).lower() for n in model.names.values()]:
        parser.error("The model needs a drone class.")
    cap = cv2.VideoCapture(int(args.source) if args.source.isdigit() else args.source)
    if not cap.isOpened():
        raise RuntimeError("Camera unavailable. Verify its interface and capture driver first.")
    motors, controller = DryRunMotors(), PixelController()
    previous = time.monotonic()
    try:
        while True:
            started = time.monotonic()
            ok, frame = cap.read()
            if not ok:
                break
            result = model.predict(frame, imgsz=320, conf=.35, verbose=False)[0]
            boxes = [b for b in result.boxes if str(model.names[int(b.cls.item())]).lower() == "drone"]
            box = None
            if boxes:
                best = max(boxes, key=lambda b: float(b.conf.item()))
                x1,y1,x2,y2 = best.xyxyn[0].tolist()
                box = [x1,y1,x2-x1,y2-y1]
            now = time.monotonic()
            command = controller.update(box, now-previous, now-started)
            previous = now
            if command:
                motors.move_to(*command)
                print(f"DRY RUN pan={command[0]:.2f} tilt={command[1]:.2f} latency={(now-started)*1000:.0f}ms")
            else:
                motors.stop()
            cv2.imshow("Kestrel - dry run, motors disabled", result.plot())
            if cv2.waitKey(1) & 0xff == ord('q'):
                break
    finally:
        motors.stop()
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
