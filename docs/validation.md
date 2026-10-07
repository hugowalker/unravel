# Validation record

Date: 6 October 2026. Environment: local Windows development machine, Chromium-based browser, synthetic procedural scene. No physical hardware was connected.

## Automated checks

- TypeScript compilation and production Vite build: passed.
- Six TypeScript tests: acquisition, correction signs, loss-to-search transition, travel limits, deadband/paused behavior, time-step bounds, silhouette features and fitting a separable classifier.
- Five Python tests: image validation, stale-frame rejection, bounded correction, dry-run motor behavior and explicit missing-model status.

## Browser observations

- Start tracking renders the training views and fits the browser model. In the observed run, the same-asset held-out crop accuracy was 100% on 144 crops; this is a limited synthetic result, not a real-world accuracy claim.
- Hover scenario: acquired and tracked a stationary drone; observed image-centre error settled around 1-2% in a spot check.
- Hide drone: returned to searching with no active detection. Restore drone: acquisition resumed. This is an interactive check, not a measured false-positive-rate benchmark.
- Component selection updates the electronics inspector. SVG diagram download succeeded and was reopened as a saved file.
- Model, electronics, laboratory and notebook navigation work. Desktop screenshots are in `docs/images`.
- A 390 x 844 requested viewport produced a 375 CSS-pixel content viewport with `scrollWidth === clientWidth` in both laboratory and electronics views. The schematic and pin table scroll inside their own containers.

## Recorded slow-patrol run

Source: `validation-session.json`. Settings: elliptical patrol, 0.5x flight speed, default illumination, no obstruction, automatic camera. This is one short run, not a statistical benchmark.

| Measurement | Observed value |
|---|---:|
| Samples | 447 |
| Simulated flight time | 23.27 seconds |
| Samples in TRACKING | 352 (78.7%) |
| Samples in ACQUIRING | 59 |
| Samples in LOST | 36 |
| Tracked samples after 2.5 simulated seconds | 309 |
| Of those, within 10% error on both axes | 309 / 309 (100%) |
| Mean pixel-detector processing time | 1.19 ms |

The 0.5x flight-speed setting scales scene time. Exported `time` is simulated time, not wall-clock duration. Detector timing excludes GPU capture, rendering, and any camera or motor delay. The short sample met the centring criterion when tracking, but did not maintain uninterrupted tracking; the dropout count must accompany the centring result.

## Unverified

- Generalisation to real drones, unseen drone geometries, bright clutter or arbitrary rooms.
- Real-image YOLO training, checkpoint quality, precision/recall and false-positive rate.
- Inference performance on Raspberry Pi or NCNN export execution on target hardware.
- Arducam capture compatibility, GPIO wiring, current limits, motor timing, homing and physical travel.
- Long-duration reliability, multiple-target identity persistence and flying-drone performance.

The model and hardware boundaries are visible in the app. Physical motor actuation is not implemented or implied.

## Workspace and interface checks — 7 October 2026

The production build, TypeScript checks and eight control/classifier tests passed. The Workspace tab exposes block, circuit, wiring, conceptual panel layout, BOM/schedules and test evidence. All six panels were opened in the browser; one panel is exposed at a time. The point-to-point wiring SVG downloaded successfully. The schematic view had no page overflow at the requested 390 × 844 viewport.

The confidence meter showed a live detector score while tracking and reset to no detection when the drone was hidden. The black/grey/orange interface and orange K favicon were included in the build. Updated screenshots are in docs/images/flight-lab.jpg and docs/images/workspace.jpg. These checks add no physical hardware validation.

## Seven-class laboratory and typography — 7 October 2026

The production build, TypeScript checks and ten control/classifier/resource-estimate tests passed. The circular room contains a drone, cube, sphere, cylinder, cone, torus and pyramid. One browser training run reported 85.1% held-out classification accuracy on 168 synthetic crops from the same procedural assets, with 672 training crops. This is not a real-camera accuracy measurement. Drone tracking displayed an active confidence score in the browser; target confusion remains a limitation of silhouette classification.

The six engineering documents are direct main-navigation items; the Workspace parent button was removed. Schematic navigation updates both its page heading and breadcrumb. Michroma is bundled under the SIL Open Font License for headings, and IBM Plex Sans is restored for body text and navigation. Laboratory and Recognition views had no page overflow at the requested 390 x 844 viewport; the final schematic also had equal page scroll/client widths (375 CSS pixels). The compact navigation scrolls within its own container.

The Raspberry Pi panel displays assumption-based RAM, power and throughput estimates, including 768.5 MiB reserved/model/frame memory, 2 W assumed idle power and 4.4 W under the default active workload. These are formula outputs, not board telemetry or measured benchmarks. Updated screenshots: docs/images/flight-lab-current.png and docs/images/workspace-current.png. The downloadable 6 October PDF remains an archived dossier.
