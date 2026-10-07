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

## Object selection and target-loss recovery — 7 October 2026

Recognition model now connects object selection, synthetic training and Scan room. Selecting Cube and training completed successfully; Scan room moved the camera from -160 degrees through SEARCHING to TRACKING. A complete cube was visibly boxed at about -32 degrees pan and 5 degrees pitch, with approximately 3% centring error in one observation. This is a single functional check, not an accuracy benchmark.

The detector now includes shadowed silhouette pixels and rejects regions clipped by the image boundary. Model cache version two requires retraining old cached models. Similar object appearances can still produce false detections: in a hidden-cube check, another shape was classified as Cube during the later search. Detector output is not ground-truth identity.

The controller remembers the most recent tracked pan and tilt, holds for 0.65 seconds after loss, searches within +/-25 degrees until six seconds after loss, then resumes the wider bounded patrol. A regression test verifies the search bounds, return to patrol, reacquisition and reset. Hide target works for each selected object. Twelve tests, TypeScript checks and the production build pass. PCB layout was removed from navigation and document views at the user's request; five engineering documents remain.

## Final selected-object workflow and live diagram — 7 October 2026

The final implementation retains a binary target model (one target label, 257 weights and one bias), not the earlier seven-class model. Training starts with fresh weights, clears the previous active model/cache, and replaces it on completion. Other shapes are negative training examples; their class models are not retained. A regression test verifies that Cube training rejects the Drone example and does not retain additional classes. Browser views confirmed target-only training states and blocked scanning for an untrained selection.

The camera is at the circular room centre; six shapes surround it on a 3.8 m radius, and the drone orbits above them. Recognition is directly below Flight laboratory in navigation. Drone-only motion controls have exactly Orbit and Stationary options plus flight speed. PCB layout is absent. The training diagram shows rendering, feature extraction, data split, target-weight learning, validation and saving one model.

The live diagram shows the actual silhouette inputs, strongest learned weights, target score and a separate azimuth/pitch feedback controller. Row/column labels identify shape-grid cells; connection order is weight magnitude, not camera direction. Browser tracking displayed live Drone scores and corresponding turn-right/hold-pitch text. The current build had no captured browser errors during the final check. Camera/head orientation shares a rotation matrix and skips unchanged angles.

The preview targets 60 FPS independently of 10 Hz CPU recognition. The measured display was 48 FPS during one final observation; this is not a guarantee of 60 FPS. WebGL renders the 3D scene. GPU capture/readback, CPU classification and browser/display performance remain part of the frame budget. Resource readouts remain estimates without connected Pi telemetry. Fourteen regression tests, TypeScript checks and the production build pass. The live model is a single logistic unit; it has no hidden neural layers or learned motor policy. Drone loss uses a bounded 180-degree/second opposite-side recovery sweep; other objects use nearby search before patrol.


## Learning explanation and weighted camera inputs — 7 October 2026

Recognition now explains the source of the synthetic images and weight updates, including a labelled-example gradient calculation. The live diagram shows horizontal error weighted into azimuth and vertical error weighted into pitch, using the same function as the controller. Fixed gains are distinct from learned appearance weights. Deadband, speed limits and inactive tracking are explicit. A regression test compares the displayed contributions with actual tracking movement.

The numerical example below the live diagram shows two cell contributions and a bias giving a sum of 0.30 and a sigmoid score of 57.4%. Drone altitude follows 3 + 0.25 cos(0.8t) metres in orbit and stationary modes, scaled by flight speed. Browser checks confirmed the explanation and numerical table; live tracking displayed the gain calculations and motor rates. No current-build browser errors were captured. TypeScript, production build and fifteen regression tests pass.


The live view now separates appearance recognition from two error/gain/motor-command node paths and next-move cards. Horizontal error drives azimuth, vertical error drives pitch; patrol/manual states are labelled separately. Pause preserves the last recognition frame, score, motor diagram and cards, and Resume tracking continues the held state. Two successive browser screenshots of the paused diagrams were byte-identical. The user also resumed tracking during verification, and the view returned to active updates.


## Compact live view and azimuth example — 7 October 2026

Recognition and camera-control graphs are arranged side by side on desktop and stacked on smaller screens. The view shows eight strongest appearance weights, a shared status line and compact movement outputs; explanations and the full example are available in an expandable section. Browser inspection confirmed the new layout and the full azimuth example: 10% horizontal error produces approximately +20.5 degrees/second, or +2.05 degrees in a 0.1-second step after acquisition. The example explicitly identifies +1.20 as illustrative; actual recognition weights start at zero and are adjusted during training.


The default worked example now reads the actual saved model and current detected silhouette. One paused Drone observation displayed r10 c8 with input 1.0000 and trained weight 0.4684, total logit 2.7429 and score 93.95%, alongside a 9.31-degree/second azimuth command. These values are one synthetic observation, not fixed model constants. The illustrative round-number example remains collapsed beneath it. Pause also freezes camera capture and preserves the last detection box; browser inspection confirmed a paused Drone box labelled 94%.


## Optional crosshair centring — 7 October 2026

The live recognition panel includes a checked-by-default Centre crosshair on target option. Once a target is acquired, the box centre minus the fixed image-centre crosshair feeds the displayed azimuth and pitch weights. The camera view marks the box centre and connects it to the crosshair. Disabling centring holds both motor axes while a detection is retained; recognition remains active, and the view reports the unapplied correction. Target loss still follows the recovery/patrol routine. Manual mode overrides centring. A regression test verifies lock without movement, correction when enabled, hold when disabled again, and return to search after loss. Sixteen tests, TypeScript and production build pass. Browser inspection verified the checkbox and manual-override message.
