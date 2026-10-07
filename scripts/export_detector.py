import argparse
from pathlib import Path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Export Kestrel's trained detector for ARM inference."
    )
    parser.add_argument("weights", type=Path)
    args = parser.parse_args()
    if not args.weights.is_file():
        parser.error("Provide your trained best.pt file.")
    from ultralytics import YOLO

    YOLO(str(args.weights)).export(format="ncnn", imgsz=320)
