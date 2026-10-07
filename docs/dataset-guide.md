# Data and recognition

## Included synthetic experiment

The original quadcopter geometry is rendered through full yaw rotation with varied pitch, roll and directional lighting. Negative views contain boxes, spheres, cylinders and tori. A fixed seed creates 720 crops: 576 training and 144 held-out validation crops, balanced between drone and non-drone.

The validation views use the same assets and rendering domain as training. They test interpolation within the synthetic setup, not transfer to a real drone. Runtime region proposals depend on brightness contrast and can fail on bright clutter, dark drones, small distant objects, or severe occlusion. The classifier score is not calibrated probability.

The browser model export contains the learned weights, bias, sample count, timestamp and held-out accuracy. Training labels may use known scene objects; inference does not receive their location or identity.

## Candidate external sources

These sources were found during research, but no third-party mesh or dataset is bundled or represented as licensed for redistribution:

1. [DJI Mavic 2 Pro photogrammetry model, I_SHLV](https://sketchfab.com/3d-models/dji-mavic-2-pro-photogrammetry-4496df7bf13841698f9a2a150a49cbfd). Candidate downloadable 3D scan. Verify its current licence and download terms before use. A scan of one drone supplies useful viewpoints but is not sufficient real-world validation.
2. [Drone Detection, Roboflow Universe](https://universe.roboflow.com/drone-detection-g4d3g/drone-detection-a1tsf). Candidate labelled drone images. Review provenance, class labels, export version and licence before training or redistribution.
3. [Amateur Unmanned Air Vehicle Detection, Kaggle](https://www.kaggle.com/dsv/1019970). The dataset page cites the original Mendeley dataset DOI `10.17632/zcsj2g2m4c.4`. Prefer the original publisher for attribution and licence verification.

Do not use a dataset solely because its title includes “drone”: many datasets contain views captured by drones, with labels for vehicles and people rather than the drone itself.

## Real-image training procedure

1. Obtain a dataset with a licence covering the intended use. Record source URL, creator, version, licence text and download date in a local manifest.
2. Add camera images of the intended target at the actual working distances and lighting conditions, including empty scenes and visually similar non-drone objects.
3. Label the drone bounding boxes and audit a representative sample manually.
4. Keep each recording or capture session entirely in one split. Use approximately 70% training, 15% validation, 15% test by recording; no near-duplicate frames across splits. Keep the final real test recordings untouched during model selection.
5. Put the YOLO dataset under ignored `data/drone/`. Create a `data.yaml` with this structure:

```yaml
path: /absolute/path/to/data/drone
train: images/train
val: images/val
test: images/test
names:
  0: drone
```

6. Install the optional ML requirements and train:

```sh
python scripts/train_detector.py --data data/drone/data.yaml --epochs 50 --device cpu
```

The first run may download the official `yolo26n.pt` initialization. On an available supported GPU, pass its device identifier. Adjust batch size in the script if memory is insufficient. Record software versions and training settings.

7. Evaluate the final checkpoint on the separate test split. Report precision, recall, mAP, false positives per minute on empty-room recordings, and per-frame latency. Report synthetic and real metrics separately.
8. Export and validate on the actual Pi:

```sh
python scripts/export_detector.py runs/kestrel/weights/best.pt
```

The default image size is 320. Measure performance before choosing a final frame rate or motor speed. NCNN output is not claimed to have been bench-tested by this project.
