"""Train on a user-reviewed, licensed YOLO dataset; no automatic scraping."""
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True, help="YOLO data.yaml; names must include drone")
    parser.add_argument("--weights", default="yolo26n.pt")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--device", default="cpu")
    args = parser.parse_args()
    if not args.data.is_file():
        parser.error("Dataset YAML not found. See docs/dataset-guide.md.")
    from ultralytics import YOLO
    import yaml
    spec = yaml.safe_load(args.data.read_text(encoding="utf-8"))
    names = spec.get("names", {})
    if "drone" not in (names.values() if isinstance(names, dict) else names):
        parser.error("Dataset must include a class named drone.")
    model = YOLO(args.weights)
    model.train(data=str(args.data.resolve()), epochs=args.epochs, imgsz=320, batch=8,
                device=args.device, seed=2026, deterministic=True, project="runs", name="kestrel")
    model.val(data=str(args.data.resolve()), split="val")

if __name__ == "__main__":
    main()
