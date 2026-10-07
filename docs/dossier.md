# Kestrel — Technical dossier

**Revision:** 0.1 / 6 October 2026

**Repository:** https://github.com/hugowalker/unravel

**Development stage:** synthetic simulation and proposed electronics

## Objective

Recognise a drone in a camera image, estimate its image-centre error, and steer a two-axis camera mount to keep it centred. Make the perception, control, and electronics understandable through one interactive web application.

## Architecture

Three.js renders a room and procedural quadcopter. A perspective tracking camera produces 320 × 180 RGB frames. The default detector extracts bright connected regions, joins small raster gaps, normalises each silhouette into 256 features, adds aspect ratio, and applies a learned binary logistic classifier.

The controller receives only normalised image boxes and scores. It does not read the drone's 3D position. The simulator knows object identity during supervised training, as required to construct labelled samples. That information is not passed to runtime inference.

The controller requires three detections before tracking, uses a 2.5% image-axis deadband, caps azimuth motion at 42°/s and pitch at 30°/s, and clamps simulated travel to ±160° and −15°/+55°. After loss it holds briefly, then performs a bounded search. These are simulation settings, not approved physical limits.

## Learning experiment

720 procedural crops are rendered with a fixed random seed: 576 training, 144 held-out validation, balanced positive and negative. The drone rotates through yaw and varied pitch/roll; geometric negatives include boxes, spheres, cylinders and tori. Full-batch gradient descent fits logistic regression. Scores are uncalibrated.

Synthetic accuracy measures the same procedural asset family. It does not demonstrate real drone recognition. The proposal stage requires strong brightness contrast; real deployment should replace it with a trained image detector, supported through the optional local YOLO service.

## Service interface

`GET /health` reports service identity, model readiness and an explicit missing-model message.

`WS /ws/detect` accepts `{id: integer, image: JPEG-or-PNG-data-URL}` and returns `{id, detections: [{box: [x,y,width,height], confidence}]}`. Coordinates are normalised to the image. Errors carry the matching id when available. Only the drone class is returned, sorted by score.

The browser sends at most one outstanding frame. It discards stale detections after 400 ms and disconnects on a three-second response timeout. The server validates image payloads and permits local browser origins. The service performs inference only; it never actuates hardware.

## Electronics

The baseline uses a Raspberry Pi 4B, an Arducam Mini requiring SKU confirmation, a FITO278 stepper requiring electrical verification, a DRV8825 carrier, and an MG90S pitch servo. Separate power rails share a ground reference. The web app contains a selectable architecture schematic and proposed pin table. See hardware.md for full connection notes and prerequisites.

## Evaluation

Unit tests cover acquisition, direction, deadband, target loss, travel limits, time-step bounds, silhouette extraction, classifier fitting, invalid images, stale frames, and non-actuating motor commands. Browser tests verify interaction, training, camera rendering, hover tracking and lost-target behavior. See validation.md for measured observations and outstanding checks.

The acceptance target for a future controlled run is acquisition within one search sweep and centring within 10% of each frame axis for at least 90% of tracked frames after settling. That target must be evaluated on exported sessions; it is not automatically implied by unit-test success.

## Road to hardware

Identify the camera and motor variants; verify power; train with licensed real images and separately held-out recordings; benchmark the model on the Pi; calibrate motor mechanics; install homing and stop controls; implement the physical motor adapter; then validate with a hand-moved target. No physical performance or general drone-recognition claim is made by this release.
