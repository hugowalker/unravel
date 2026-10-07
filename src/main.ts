import {
  createIcons,
  ScanLine,
  CircuitBoard,
  BrainCircuit,
  BookOpen,
  Cpu,
  Github,
  ExternalLink,
  Monitor,
  CircleHelp,
  Play,
  Pause,
  Box,
  Orbit,
  Video,
  Focus,
  SlidersHorizontal,
  Activity,
  FlaskConical,
  Download,
  Info,
  Rows3,
  Workflow,
  Server,
  Sparkles,
  RefreshCw,
  FileDown,
  ChevronRight,
  Package,
} from "lucide";
const icons = {
  ScanLine,
  CircuitBoard,
  BrainCircuit,
  BookOpen,
  Cpu,
  Github,
  ExternalLink,
  Monitor,
  CircleHelp,
  Play,
  Pause,
  Box,
  Orbit,
  Video,
  Focus,
  SlidersHorizontal,
  Activity,
  FlaskConical,
  Download,
  Info,
  Rows3,
  Workflow,
  Server,
  Sparkles,
  RefreshCw,
  FileDown,
  ChevronRight,
  Package,
};
import "./style.css";
import { drawNetwork, drawControlNetwork } from "./network";
import { computeMarkup, estimateCompute } from "./compute";
import { LabScene } from "./scene";
import { Controller, trackingInputs, type Detection } from "./control";
import {
  detect,
  objectLabels,
  features,
  maskImage,
  type Model,
} from "./vision";
import { parts, pinRows, schematic } from "./electronics";
import {
  workspaceViews,
  workspaceExtraPanels,
  wiringDrawing,
} from "./workspace";

const icon = (name: string) =>
  `<i data-lucide="${name}" aria-hidden="true"></i>`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
document.querySelector("#app")!.innerHTML = `
<aside class="sidebar">
 <a class="brand" href="#lab" aria-label="Kestrel laboratory"><span class="brandmark">K</span><span>kestrel<span class="brand-sub">Drone tracking laboratory</span></span></a>
 <div class="nav-label">Workspace</div>
 <nav aria-label="Workspace"><button data-tab="lab" class="active">${icon("scan-line")} Flight laboratory</button><button data-tab="model">${icon("brain-circuit")} Recognition model</button>${workspaceViews.map(([id, label]) => `<button data-workspace-link="${id}">${icon(id === "bom" ? "package" : id === "tests" ? "activity" : id === "block" ? "workflow" : "circuit-board")} ${id === "bom" ? "BOM" : label}</button>`).join("")}<button data-tab="notebook">${icon("book-open")} Project notebook</button></nav>
 <div class="sidebar-bottom"><div class="hardware-glyph">${icon("cpu")}<span>Raspberry Pi 4B<small>Hardware integration planned</small></span></div><a href="https://github.com/hugowalker/unravel" target="_blank" rel="noreferrer">${icon("github")} Source repository ${icon("external-link")}</a><span class="version">KESTREL v0.1 · SIMULATION</span></div>
</aside>
<main>
 <header><div class="breadcrumb">KESTREL <span>/</span> <b id="crumb">FLIGHT LABORATORY</b></div><div class="header-right"><span class="local-badge">${icon("monitor")} WebGL / GPU rendering</span><button class="icon-button" id="help" aria-label="Open project notebook">${icon("circle-help")}</button></div></header>
 <section class="page active" id="page-lab">
  <div class="page-title"><div><h1>Object tracking</h1><p>Train an object in Recognition, then scan from the centre of the room.</p></div><button id="start" class="primary">${icon("play")} Start tracking</button></div>
  <div class="mission-bar"><span class="status" id="status"><span class="status-dot"></span>STANDBY</span><span class="mission-sep"></span><span>SCENE <b>Circular laboratory</b></span><span>DETECTOR <b id="detector-label">Synthetic classifier</b></span><span class="mission-end">${icon("box")} 13 m diameter</span></div>
  <div class="lab-grid">
   <article class="panel scene-panel"><div class="panel-title"><span>${icon("orbit")} Room view</span><span class="mini">DRAG TO ORBIT · SCROLL TO ZOOM</span></div><div id="scene"><div class="scene-tag"><span class="tiny-square"></span> SIMULATION</div><div class="scene-scale">1 m radial grid</div></div><div class="scene-footer"><label class="check"><input type="checkbox" id="frustum"> Show camera frustum</label><button class="text-button" id="reset-view">${icon("focus")} Reset view</button></div></article>
   <article class="panel feed-panel"><div class="panel-title"><span>${icon("video")} Tracking camera</span><span class="mini">320 × 180 · <span id="camera-fps">60 FPS target</span></span></div><div class="feed-wrap"><canvas id="feed" width="640" height="360" aria-label="Simulated camera feed with learned detections"></canvas><div class="feed-corner">VIRTUAL CAMERA</div><div class="reticle"></div><div class="feed-bottom" id="feed-caption">Camera ready · awaiting start</div></div><div class="telemetry"><div><span>AZIMUTH</span><strong id="pan-value">0.0<small>°</small></strong><div class="meter"><i id="pan-meter"></i></div></div><div><span>PITCH</span><strong id="tilt-value">8.0<small>°</small></strong><div class="meter"><i id="tilt-meter"></i></div></div></div><div class="detection-info"><span id="detection-summary">No active detection</span><span class="mini" id="latency">— ms</span></div></article>
  </div>
  <div class="lower-grid"><article class="panel controls-panel"><div class="panel-title"><span>${icon("sliders-horizontal")} Tracking controls</span><button class="text-button" id="reset">Reset simulation</button></div><div class="control-grid"><div class="tracking-target"><span>Object to find</span><strong id="tracking-object-label">Drone</strong><button class="text-button" data-go="model">Change object / train</button><select id="target-object" hidden aria-label="Selected recognition object">${objectLabels.map((label) => `<option value="${label}">${label[0].toUpperCase() + label.slice(1)}</option>`).join("")}</select></div><label class="drone-setting">Drone motion<select id="path"><option value="ellipse">Orbit</option><option value="hover">Stationary</option></select></label><label class="drone-setting">Flight speed <output id="speed-out">1.0×</output><input id="speed" type="range" min="0" max="2" step=".1" value="1"></label><label>Illumination <output id="light-out">100%</output><input id="light" type="range" min=".15" max="1.3" step=".05" value="1"></label></div><div class="toggle-row"><label class="check"><input id="obstacle" type="checkbox"> Add obstruction</label><label class="check"><input id="hide-target" type="checkbox"> Hide target</label><label class="check"><input id="manual" type="checkbox"> Manual camera</label></div><div class="manual-controls" hidden><label>Azimuth <input id="manual-pan" type="range" min="-160" max="160" value="0"></label><label>Pitch <input id="manual-tilt" type="range" min="-15" max="55" value="8"></label></div></article><article class="panel error-panel"><div class="panel-title"><span>${icon("activity")} Centering error</span><span class="mini">LAST 30 S</span></div><canvas id="error-chart" width="500" height="105" aria-label="Chart of horizontal and vertical centering error"></canvas><div class="chart-legend"><span><i></i> Horizontal</span><span><i></i> Vertical</span><b id="error-value">—</b></div><div class="confidence-panel"><div><label for="confidence-meter">Detection confidence</label><output id="confidence-value">No detection</output></div><meter id="confidence-meter" min="0" max="1" value="0" aria-label="Detection confidence"></meter><p>Detector score; not calibrated real-world accuracy.</p></div></article></div>
  <article class="panel live-network"><div class="panel-title"><span>${icon("brain-circuit")} Live recognition network</span><span class="mini">RECOGNITION → AZIMUTH / PITCH</span></div><canvas id="network-canvas" width="680" height="245" aria-label="Live recognition network feeding a feedback controller with azimuth and pitch outputs"></canvas><div class="camera-next"><h3>Next camera move</h3><p>The detected object’s position sets the two motor commands.</p><canvas id="control-network" width="680" height="205" aria-label="Horizontal and vertical error nodes weighted into azimuth and pitch commands"></canvas><p class="small-note">Movement gains are fixed controller settings. Retraining updates the shape-recognition weights above.</p><div class="camera-command-grid"><div class="camera-command"><span>AZIMUTH · LEFT / RIGHT</span><strong id="next-azimuth">Waiting for tracking</strong><p id="azimuth-input">Horizontal error → weighted turn speed</p><small>Tracking limit ±42°/s</small></div><div class="camera-command"><span>PITCH · UP / DOWN</span><strong id="next-pitch">Waiting for tracking</strong><p id="pitch-input">Vertical error → weighted tilt speed</p><small>Tracking limit ±30°/s</small></div></div></div><div class="network-readout"><strong id="network-status">Train an object in Recognition to begin.</strong><div class="network-guide"><div><b>1. See the shape</b><p>Lit cells show the object silhouette from the camera.</p></div><div><b>2. Recognise the pattern</b><p>Learned weights decide which shape details raise or lower the match score. Orange adds; grey subtracts. Thicker lines have a stronger contribution. Connections are ordered from strongest at the top to weakest at the bottom; r/c identifies the input cell’s row and column. Their order is not a camera direction.</p></div><div><b>3. Move the camera</b><p>Horizontal error is weighted into azimuth speed; vertical error is weighted into pitch speed. These fixed controller gains are shown live in the next-move cards. They are separate from the learned shape weights. Errors within 2.5% produce no correction; speed and travel limits bound movement.</p></div></div><details><summary>Show the calculation</summary><p>This is one logistic recognition unit with no hidden layers. Score = sigmoid(weighted input sum + bias). The diagram shows the twelve strongest weights; the score uses all 257 inputs. The detected box feeds a separate camera controller. Inputs and commands update at 10 Hz.</p></details><div class="weight-example"><h3>A numerical example</h3><p><b>r = row, c = column.</b> r3 c7 is row 3, column 7, counted from the top left of the 16 × 16 shape grid. A cell value of 0.75 means the silhouette fills 75% of that cell.</p><div class="table-scroll"><table><thead><tr><th>Cell</th><th>Cell value</th><th>Weight</th><th>Contribution</th></tr></thead><tbody><tr><td>r3 c7</td><td>0.75</td><td>+1.20</td><td>0.75 × 1.20 = +0.90</td></tr><tr><td>r8 c2</td><td>0.50</td><td>−0.80</td><td>0.50 × (−0.80) = −0.40</td></tr></tbody></table></div><p>Add a bias of <b>−0.20</b>: weighted sum = 0.90 − 0.40 − 0.20 = <b>0.30</b>.</p><p>Convert that sum to a score: sigmoid(0.30) = 1 / (1 + e<sup>−0.30</sup>) ≈ <b>57.4%</b>. The positive weight adds evidence for the target; the negative weight subtracts it.</p><p class="small-note">These example numbers show the calculation with two inputs. The live model uses all 257 inputs and its trained weights; its score is not calibrated real-world accuracy.</p></div></div></article>
  ${computeMarkup}
  <div class="notice"><span>${icon("flask-conical")} SYNTHETIC DEMONSTRATION</span><p>The classifier retains only the chosen rendered object. Real-camera recognition and Raspberry Pi deployment need separate validation.</p><button class="text-button" data-go="model">Inspect model</button></div>
 </section>
 <section class="page" id="page-electronics">
  <div class="page-title"><div><h1 id="document-title">Block diagram</h1><p>Architecture, circuits, connections, parts, and test evidence.</p></div><button id="download-schematic" class="secondary">${icon("download")} Download block diagram</button></div>
  <div class="schematic-banner">${icon("info")} <span><b>Proposed architecture · Revision A</b> &nbsp; Camera SKU, motor ratings, and supply sizing need verification before assembly.</span></div>
  <div class="workspace-tabs" role="tablist" aria-label="Engineering documents">${workspaceViews.map(([id, label, description]) => `<button id="tab-${id}" role="tab" data-workspace="${id}" aria-controls="workspace-${id}" aria-selected="${id === "block"}" tabindex="${id === "block" ? 0 : -1}"><b>${label}</b><span>${description}</span></button>`).join("")}</div>
  <section id="workspace-block" class="workspace-view" data-workspace-view="block" role="tabpanel" aria-labelledby="tab-block"><div class="document-heading"><h2>What talks to what</h2><p>System blocks and their signal or power relationships. Select a component to inspect it.</p></div>
  <div class="electronics-grid"><article class="panel schematic-panel"><div class="panel-title"><span>${icon("circuit-board")} System connections</span><span class="mini">SELECT A COMPONENT</span></div><div id="schematic">${schematic()}</div><div class="wire-legend"><span><i class="signal"></i> Logic / PWM</span><span><i class="power"></i> External power</span><span><i class="motor"></i> Motor coils</span><span><i class="ground"></i> Ground</span><span><i class="pending"></i> Unverified</span></div></article><aside class="panel inspector"><div class="eyebrow" id="part-tag"></div><h2 id="part-name"></h2><span class="part-status" id="part-status"></span><p id="part-detail"></p><div class="inspector-pins"><span>CONNECTIONS</span><p id="part-pins"></p></div></aside></div>
  </section><section id="workspace-wiring" class="workspace-view" data-workspace-view="wiring" role="tabpanel" aria-labelledby="tab-wiring" hidden><div class="document-heading"><h2>What wire connects where</h2><p>Point-to-point connection plan. Connector positions, wire colours and gauges are unassigned.</p></div>
  <article class="panel">${wiringDrawing}</article>
  <article class="panel pin-panel"><div class="panel-title"><span>${icon("rows-3")} Proposed connections</span><span class="mini">BCM ≠ PHYSICAL PIN NUMBER</span></div><div class="table-scroll"><table><thead><tr><th>Physical pin</th><th>BCM / rail</th><th>Function</th><th>Destination</th><th>Design note</th></tr></thead><tbody>${pinRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>
  <div class="note-grid"><div><h3>Logic is not motor power.</h3><p>The Pi sends 3.3 V signals. Use separate supplies for the stepper and servo, with a common ground reference.</p></div><div><h3>Establish position first.</h3><p>A stepper has no absolute position at startup. Add a home switch before autonomous physical scanning; keep travel within cable limits.</p></div><div><h3>Check the exact camera.</h3><p>The Arducam Mini interface remains unassigned until its SKU is verified. SPI modules are not interchangeable with CSI cameras.</p></div></div>
  </section>${workspaceExtraPanels()}
 </section>
 <section class="page" id="page-model">
  <div class="page-title"><div><h1>Object recognition</h1><p>Choose an object, train recognition, then scan the room to lock onto it.</p></div><button class="secondary" id="export-model">${icon("download")} Export model</button></div>
  <div class="model-grid"><article class="panel model-summary"><div class="panel-title"><span>${icon("brain-circuit")} Selected-object model</span><span class="mini">BROWSER / CPU</span></div><div class="model-body"><div class="model-state" id="model-state">Choose an object to learn</div><h2>Learn an object, then find it</h2><p>Select the object you want the camera to find. Use labelled views of that object as positives and the other shapes as negatives. Training replaces the saved model; it retains only the selected object. Then scan the room and track the selected object using camera pixels.</p><label class="learning-target">Object to find<select id="learning-object">${objectLabels.map((label) => `<option value="${label}">${label[0].toUpperCase() + label.slice(1)}</option>`).join("")}</select></label><div class="training-progress"><i id="training-bar"></i></div><div class="training-metrics"><div><span>Training crops</span><b id="sample-count">—</b></div><div><span>Held-out accuracy</span><b id="model-accuracy">—</b></div><div><span>Input features</span><b>257</b></div></div><button class="primary" id="train-model">${icon("sparkles")} Train recognition model</button><button class="secondary" id="scan-object" disabled>${icon("scan-line")} Scan room for Drone</button><p id="learning-next" class="small-note" aria-live="polite">Train the model to enable the room scan.</p><p id="target-validation" class="small-note"></p><p class="small-note">Held-out crops share the same seven procedural assets. The score measures synthetic classification, not recognition of unseen real objects.</p></div></article><article class="panel pipeline-panel"><div class="panel-title"><span>${icon("workflow")} Detection steps</span></div><ol class="pipeline"><li><span>01</span><div><h3>Capture</h3><p>Preview a 320 × 180 camera image at a target of 60 FPS with WebGL rendering. CPU recognition samples it at 10 Hz.</p></div></li><li><span>02</span><div><h3>Propose regions</h3><p>Find connected bright regions. This intentionally simple stage assumes a dark synthetic room.</p></div></li><li><span>03</span><div><h3>Classify appearance</h3><p>Score the trained object from silhouette features; reject uncertain regions.</p></div></li><li><span>04</span><div><h3>Close the loop</h3><p>Use bounding-box error to steer azimuth and pitch, with speed and travel limits.</p></div></li></ol></article></div>
  <article class="panel training-diagram"><div class="document-heading"><h2>How the model trains</h2><p>The selected object becomes the positive example. Everything else is a negative example.</p></div><ol class="training-flow" aria-label="Training process diagram">
<li><span class="flow-number">01</span>${icon("box")}<h3>Render labelled views</h3><p>Seven procedural 3D assets, varied orientation and lighting.</p><b>840 RGB crops · 96 × 96 pixels</b></li>
<li><span class="flow-number">02</span>${icon("scan-line")}<h3>Extract a silhouette</h3><p>Threshold bright pixels, crop the object and sample its shape.</p><b>16 × 16 occupancy + aspect ratio</b></li>
<li><span class="flow-number">03</span>${icon("rows-3")}<h3>Split the examples</h3><p>Keep held-out views out of the weight updates.</p><b>672 training · 168 validation</b></li>
<li><span class="flow-number">04</span>${icon("brain-circuit")}<h3>Learn target weights</h3><p>Compare the predicted target score with its label. Adjust weights to reduce the error, balancing target and negative examples.</p><b>180 updates · binary logistic regression</b></li>
<li><span class="flow-number">05</span>${icon("activity")}<h3>Check held-out views</h3><p>Report accuracy, target recall and false positives on other shapes.</p><b>24 target views · 144 other views</b></li>
<li><span class="flow-number">06</span>${icon("cpu")}<h3>Keep one object</h3><p id="diagram-target">Save only the chosen target and its weights. Replace the previous model.</p><b>257 weights + 1 bias · no other class models</b></li>
</ol><div class="inference-flow"><span>Live camera pixels</span>${icon("chevron-right")}<span>Target score ≥ 50%</span>${icon("chevron-right")}<span>Repeated detections</span>${icon("chevron-right")}<span>Pan / tilt tracking</span></div><p class="small-note">WebGL renders the room and camera on the GPU. The CPU extracts silhouettes and scores the trained object at 10 Hz. The controller receives image boxes, not object positions from the 3D scene.</p></article><article class="panel recognition-explainer"><div class="document-heading"><h2>How recognition works</h2><p>Object detection and tracking connects a learned visual label to feedback control.</p></div><ol><li><h3>Where does it learn from?</h3><p>Training images come from the seven 3D objects built into this app: drone, cube, sphere, cylinder, cone, torus and pyramid. The browser renders 840 views with different orientations and lighting. It knows which object it rendered, so it can label the chosen target as 1 and every other object as 0. This training uses synthetic images, not recordings from a connected camera or images downloaded from the internet.</p><h3>How does it learn?</h3><p>Each view becomes 256 silhouette-cell values and one aspect ratio. The model multiplies those inputs by its weights, adds a bias and converts the sum into a target score. It compares that score with the known label, then adjusts the weights and bias to reduce the error over 180 passes through the training set.</p><p>For example, if a drone training view has label 1 but scores 0.30, its prediction error is 0.30 − 1 = −0.70. For a cell filled by 0.75, that example contributes −0.70 × 0.75 = −0.525 to the weight gradient. Subtracting this gradient increases that cell’s weight, making a similar view score higher. The actual update averages a balanced batch and includes regularisation.</p><p>There are 672 training views and 168 held-out validation views. Validation checks views that did not update the weights. Training another object replaces the previous model; it does not keep the old drone model. Real Raspberry Pi recognition will require labelled camera images and separate hardware testing.</p></li><li><h3>Object detection and classification</h3><p>At runtime, the camera captures pixels. Bright connected regions propose candidate boxes. Each silhouette becomes 256 occupancy features plus its aspect ratio. The saved weights produce a score for the trained object only. Candidates need a score of at least 50% to be accepted; the other six object labels are not retained.</p></li><li><h3>Tracking through feedback control</h3><p>The controller compares the detected box centre with the image centre. That error steers azimuth and pitch within bounded speeds and travel. Repeated observations acquire a target. After loss, the camera holds briefly, searches within 25° of its last tracked bearing for up to six seconds, then resumes the wider room patrol. Drone tracking instead uses a rapid 180°/s sweep toward the other side after a brief loss hold; this is a simulation setting, not a tested motor speed.</p></li><li><h3>Repeatable testing and algorithm validation</h3><p>Flight paths, lighting, occlusion and target selection create repeatable testing conditions. Held-out accuracy tests the classifier separately from tracking and centring. Similar silhouettes can still be confused; a high synthetic score is not proof of real-camera performance.</p></li><li><h3>Moving inference to an onboard computer</h3><p>The intended onboard computer captures real frames and runs a separately trained model. Raspberry Pi deployment requires real-image data, measured latency, memory and power, and hardware validation. The compute simulator below the laboratory uses explicit assumptions, not live device measurements.</p></li></ol></article>
  <article class="panel backend-panel"><div class="panel-title"><span>${icon("server")} Real-image detector</span><span class="mini">OPTIONAL LOCAL PYTHON SERVICE</span></div><div class="backend-body"><div><h3>Bring a trained YOLO model.</h3><p>The Python service accepts camera frames and returns drone boxes. Training and NCNN export scripts are included in the repository. Real-image weights are not bundled.</p></div><div class="backend-connect"><label for="backend-url">Local service address</label><div class="input-row"><input id="backend-url" value="ws://127.0.0.1:8000/ws/detect" aria-label="Local detector WebSocket address"><button id="connect-backend" class="secondary">Connect</button></div><span id="backend-status">Browser classifier selected</span></div></div></article>
  <div class="note-grid"><div><span class="note-number">DATA</span><h3>Use images of drones.</h3><p>Datasets filmed from drones often label cars and pedestrians. Verify that the drone itself is annotated before training.</p></div><div><span class="note-number">SPLITS</span><h3>Separate recordings.</h3><p>Keep complete real recordings in one split. Do not scatter adjacent video frames across training and testing.</p></div><div><span class="note-number">DEPLOY</span><h3>Measure on the Pi.</h3><p>Export a compact model to NCNN, then measure latency and recall with the actual camera before enabling motors.</p></div></div>
 </section>
 <section class="page" id="page-notebook">
  <div class="page-title"><div><h1>Project notes</h1><p>A visual tracking project that connects machine perception to physical motion.</p></div><a class="secondary" href="/kestrel-dossier.pdf" target="_blank">${icon("file-down")} Technical dossier · 6 Oct</a></div>
  <div class="notebook-grid"><article class="panel notebook-main"><span class="eyebrow">THE OBJECTIVE</span><h2>Camera detection and pan/tilt control</h2><p>Use a camera to recognise a selected object, then keep it centred by rotating an azimuth stepper and a pitch servo. The browser laboratory makes the feedback loop visible before physical hardware is connected.</p><div class="architecture"><span>Camera pixels</span>${icon("chevron-right")}<span>Detection</span>${icon("chevron-right")}<span>Control error</span>${icon("chevron-right")}<span>Pan + tilt</span></div><h3>What is implemented</h3><ul><li>Circular 3D room, seven procedural object types, and virtual tracking camera.</li><li>Browser-trained recognition of one selected object and bounded feedback control.</li><li>Search, acquisition, tracking, lost-target, and manual modes.</li><li>Selectable electronics diagram and proposed GPIO connection table.</li><li>Optional Python inference service, real-image training scripts, and deployment guide.</li></ul><h3>What remains experimental</h3><p>Physical wiring, camera compatibility, real-image model accuracy, motor timing, and mechanical calibration require bench validation. The diagram is a proposed design, not a record of an assembled system.</p><h3>Validation approach</h3><p>Test hover, slow patrol, empty scenes, obstructions, target loss, and stale detections. Measure detector accuracy separately from camera centring. A good synthetic score is not evidence of real-world performance.</p><button class="secondary" id="export-session">${icon("download")} Export session measurements</button></article><aside><article class="panel build-list"><div class="panel-title"><span>${icon("package")} Hardware baseline</span></div>${[
    ["Raspberry Pi 4B", "Compute · 4 GB"],
    ["Arducam Mini", "Camera · exact SKU pending"],
    ["FITO278 + DRV8825", "Azimuth · rating verification pending"],
    ["TowerPro MG90S", "Pitch · calibrate travel"],
    ["Separate power rails", "Supply sizing pending"],
  ]
    .map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`)
    .join(
      "",
    )}</article><article class="panel sources-panel"><h3>Reference documentation</h3><a href="https://www.pololu.com/product/2133/" target="_blank" rel="noreferrer">DRV8825 carrier ${icon("external-link")}</a><a href="https://www.raspberrypi.com/documentation/computers/raspberry-pi.html" target="_blank" rel="noreferrer">Raspberry Pi hardware ${icon("external-link")}</a><a href="https://towerpro.com.tw/product/mg90s-3/" target="_blank" rel="noreferrer">MG90S manufacturer ${icon("external-link")}</a><a href="https://docs.ultralytics.com/guides/raspberry-pi/" target="_blank" rel="noreferrer">YOLO on Raspberry Pi ${icon("external-link")}</a><a href="https://threejs.org/" target="_blank" rel="noreferrer">Three.js ${icon("external-link")}</a></article></aside></div>
 </section>
 <footer><span>KESTREL <b>/</b> VISUAL TRACKING LABORATORY</span></footer>
</main><div class="toast" role="status" id="toast"></div>`;
createIcons({ icons });
let tab = "lab";
function showTab(name: string) {
  tab = name;
  document
    .querySelectorAll("[data-tab]")
    .forEach((el) =>
      el.classList.toggle("active", (el as HTMLElement).dataset.tab === name),
    );
  document
    .querySelectorAll(".page")
    .forEach((el) => el.classList.toggle("active", el.id === `page-${name}`));
  $("#crumb").textContent = (
    {
      lab: "FLIGHT LABORATORY",
      electronics: "WORKSPACE",
      model: "RECOGNITION MODEL",
      notebook: "PROJECT NOTEBOOK",
    } as Record<string, string>
  )[name];
  if (name === "electronics") selectWorkspace(workspaceView);
  else
    document
      .querySelectorAll<HTMLElement>("[data-workspace-link]")
      .forEach((el) => {
        el.classList.remove("selected");
        el.removeAttribute("aria-current");
      });
  history.replaceState(null, "", `#${name}`);
  window.dispatchEvent(new Event("resize"));
}
document
  .querySelectorAll<HTMLElement>("[data-tab]")
  .forEach((el) => (el.onclick = () => showTab(el.dataset.tab!)));
document
  .querySelectorAll<HTMLElement>("[data-go]")
  .forEach((el) => (el.onclick = () => showTab(el.dataset.go!)));
$("#help").onclick = () => showTab("notebook");
function toast(text: string) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function download(name: string, data: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function selectPart(id: string) {
  const p = parts.find((p) => p.id === id)!;
  $("#part-tag").textContent = p.tag;
  $("#part-name").textContent = p.name;
  $("#part-detail").textContent = p.detail;
  $("#part-pins").textContent = p.pins;
  $("#part-status").textContent = p.status;
  document
    .querySelectorAll<HTMLElement>("[data-part]")
    .forEach((el) => el.classList.toggle("selected", el.dataset.part === id));
}
document.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
  el.onclick = () => selectPart(el.dataset.part!);
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectPart(el.dataset.part!);
    }
  };
});
selectPart("pi");
let workspaceView = "block";
function selectWorkspace(id: string) {
  workspaceView = id;
  document
    .querySelectorAll<HTMLElement>("[data-workspace-view]")
    .forEach((el) => (el.hidden = el.dataset.workspaceView !== id));
  document.querySelectorAll<HTMLElement>("[data-workspace]").forEach((el) => {
    const active = el.dataset.workspace === id;
    el.setAttribute("aria-selected", String(active));
    el.tabIndex = active ? 0 : -1;
  });
  document
    .querySelectorAll<HTMLElement>("[data-workspace-link]")
    .forEach((el) => {
      const active = tab === "electronics" && el.dataset.workspaceLink === id;
      el.classList.toggle("selected", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  const label =
    id === "bom" ? "BOM" : workspaceViews.find((view) => view[0] === id)![1];
  $("#document-title").textContent = label;
  if (tab === "electronics") $("#crumb").textContent = label.toUpperCase();
  const button = $("#download-schematic");
  button.hidden = !["block", "circuit", "wiring"].includes(id);
  button.innerHTML = `${icon("download")} Download ${id === "block" ? "block diagram" : id === "circuit" ? "schematic" : "wiring diagram"}`;
  createIcons({ icons });
}
document.querySelectorAll<HTMLElement>("[data-workspace-link]").forEach(
  (el) =>
    (el.onclick = () => {
      showTab("electronics");
      selectWorkspace(el.dataset.workspaceLink!);
    }),
);
selectWorkspace("block");

document
  .querySelectorAll<HTMLElement>("[data-workspace]")
  .forEach((el, index) => {
    el.onclick = () => selectWorkspace(el.dataset.workspace!);
    el.onkeydown = (e) => {
      let next = index;
      if (e.key === "ArrowRight") next = (index + 1) % workspaceViews.length;
      else if (e.key === "ArrowLeft")
        next = (index + workspaceViews.length - 1) % workspaceViews.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = workspaceViews.length - 1;
      else return;
      e.preventDefault();
      selectWorkspace(workspaceViews[next][0]);
      $(`#tab-${workspaceViews[next][0]}`).focus();
    };
  });
$("#download-schematic").onclick = () => {
  const svg = $(
    workspaceView === "block"
      ? "#schematic svg"
      : `#workspace-${workspaceView} svg`,
  ).cloneNode(true) as SVGElement;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const styles = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "style",
  );
  styles.textContent = `text{font-family:"IBM Plex Sans",Arial,sans-serif;fill:#c2cbd3}.component rect{fill:#18232e;stroke:#344655}.component .part-accent{fill:#ff9955;stroke:none}.part-tag{font-size:11px;fill:#9daab5}.part-name{font-size:19px;font-weight:bold}.part-sub{font-size:11px;fill:#a2b1bd}.wire-label{font-size:11px}.schematic-caption{font-size:17px;font-weight:bold}.signal{stroke:#ff9955}.power{stroke:#efb96c}.motor{stroke:#8fbbed}.ground{stroke:#708290}.pending{stroke:#d2a2d2;stroke-dasharray:5 5}`;
  svg.prepend(styles);
  download(
    `kestrel-${workspaceView}-rev-a.svg`,
    new XMLSerializer().serializeToString(svg),
    "image/svg+xml",
  );
};

const controller = new Controller();
let lab: LabScene;
try {
  lab = new LabScene($("#scene"));
} catch (e) {
  $("#scene").innerHTML =
    '<div class="webgl-error">WebGL could not start. Enable hardware acceleration or try a browser with WebGL support. The electronics and project documentation remain available.</div>';
  $("#start").setAttribute("disabled", "");
  throw e;
}
const ctx = $<HTMLCanvasElement>("#feed").getContext("2d")!;
const frameCanvas = document.createElement("canvas");
frameCanvas.width = 320;
frameCanvas.height = 180;
const frameCtx = frameCanvas.getContext("2d")!;
let running = false,
  networkPaused = false,
  training = false,
  model: Model | null = null,
  last = performance.now(),
  lastVision = 0,
  lastCapture = 0,
  fpsWindow = 0,
  capturedFrames = 0,
  lastCompute = 0,
  det: Detection | null = null,
  latency = 0;
let socket: WebSocket | null = null,
  pending = false,
  sentAt = 0,
  receivedAt = 0,
  frameId = 0,
  pendingId = 0;
const session: {
  time: number;
  mode: string;
  pan: number;
  tilt: number;
  errorX: number | null;
  errorY: number | null;
  confidence: number | null;
  latencyMs: number;
}[] = [];
const chart: { x: number | null; y: number | null }[] = [];
try {
  const saved = JSON.parse(
    localStorage.getItem("kestrel-model-target-v1") || "null",
  );
  if (
    saved?.version === 1 &&
    !saved.classes &&
    objectLabels.includes(saved.targetLabel) &&
    saved.weights?.length === 257 &&
    saved.weights.every(Number.isFinite) &&
    Number.isFinite(saved.bias)
  )
    model = saved;
} catch (e) {
  toast(`Model cache could not be read: ${String(e)}`);
}
function targetReady() {
  return (
    !!model &&
    model.targetLabel === $<HTMLSelectElement>("#learning-object").value
  );
}
function updateModel() {
  networkPaused = false;
  const target =
    $<HTMLSelectElement>("#learning-object").selectedOptions[0].text;
  const ready = targetReady();
  $("#tracking-object-label").textContent = target;
  document
    .querySelectorAll<HTMLElement>(".drone-setting")
    .forEach(
      (el) =>
        (el.hidden =
          $<HTMLSelectElement>("#learning-object").value !== "drone"),
    );
  $("#diagram-target").textContent =
    `Save ${target} only, with its weights. Replace the previous model; other object classes are not retained.`;
  $("#model-state").textContent = ready
    ? `Trained for ${target} only · synthetic data`
    : `Train a model for ${target}`;
  $<HTMLButtonElement>("#scan-object").disabled = !ready;
  $("#scan-object").innerHTML = icon("scan-line") + ` Scan room for ${target}`;
  $("#learning-next").textContent = ready
    ? `Only ${target} is retained. Scan the room to find it; the other objects are ignored.`
    : `Training will replace the previous model with ${target}-only recognition.`;
  $("#sample-count").textContent = ready ? String(model!.samples) : "—";
  $("#model-accuracy").textContent = ready
    ? `${(model!.accuracy * 100).toFixed(1)}%`
    : "—";
  $("#training-bar").style.width = ready ? "100%" : "0%";
  $("#target-validation").textContent =
    ready &&
    Number.isFinite(model?.targetRecall) &&
    Number.isFinite(model?.falsePositiveRate)
      ? `Held-out target recall: ${(model!.targetRecall! * 100).toFixed(1)}% · false positives on other shapes: ${(model!.falsePositiveRate! * 100).toFixed(1)}%.`
      : "";
  $("#train-model").innerHTML =
    icon(ready ? "refresh-cw" : "sparkles") +
    (ready ? ` Retrain ${target}` : ` Train ${target}`);
  startLabel();
  createIcons({ icons });
}
if (model?.targetLabel) {
  $<HTMLSelectElement>("#learning-object").value = model.targetLabel;
  $<HTMLSelectElement>("#target-object").value = model.targetLabel;
}
updateModel();
async function learn() {
  if (training) return;
  training = true;
  model = null;
  try {
    localStorage.removeItem("kestrel-model-target-v1");
  } catch (e) {
    toast(`Old saved model could not be cleared: ${String(e)}`);
  }
  running = false;
  det = null;
  controller.reset();
  startLabel();
  $("#scan-object").setAttribute("disabled", "");
  $("#learning-object").setAttribute("disabled", "");
  $("#target-object").setAttribute("disabled", "");
  $("#start").setAttribute("disabled", "");
  $("#train-model").setAttribute("disabled", "");
  $("#model-state").textContent =
    `Learning to distinguish ${$<HTMLSelectElement>("#learning-object").selectedOptions[0].text}…`;
  $("#learning-next").textContent =
    "Rendering labelled views and training the classifier…";
  $("#status").innerHTML = '<span class="status-dot"></span>LEARNING';
  try {
    model = await lab.learn((p) => {
      $("#training-bar").style.width = `${p * 100}%`;
      $("#feed-caption").textContent =
        `Learning synthetic views · ${Math.round(p * 100)}%`;
    }, $<HTMLSelectElement>("#learning-object").value);
    try {
      localStorage.setItem("kestrel-model-target-v1", JSON.stringify(model));
      ["kestrel-model-seven-v1", "kestrel-model-seven-v2"].forEach((key) =>
        localStorage.removeItem(key),
      );
    } catch (e) {
      toast(`Model could not be saved: ${String(e)}`);
    }
    updateModel();
    toast("Synthetic model trained. Real-camera performance is unverified.");
  } catch (e) {
    toast(`Training failed: ${String(e)}`);
  } finally {
    training = false;
    $("#learning-object").removeAttribute("disabled");
    $("#target-object").removeAttribute("disabled");
    if (model) updateModel();
    else
      $("#learning-next").textContent =
        "Training did not complete. Try training again.";
    $("#start").removeAttribute("disabled");
    $("#train-model").removeAttribute("disabled");
  }
}
$("#train-model").onclick = () => void learn();
function selectTarget(value: string) {
  $<HTMLSelectElement>("#target-object").value = value;
  $<HTMLSelectElement>("#learning-object").value = value;
  det = null;
  controller.reset();
  running = false;
  $<HTMLInputElement>("#hide-target").checked = false;
  startLabel();
  if (socket) {
    socket.close();
    socket = null;
    toast("Object selection uses the browser classifier.");
  }
  const label = value[0].toUpperCase() + value.slice(1);
  $("#scan-object").innerHTML = icon("scan-line") + ` Scan room for ${label}`;
  updateModel();
  createIcons({ icons });
}
$("#target-object").onchange = () =>
  selectTarget($<HTMLSelectElement>("#target-object").value);
$("#learning-object").onchange = () =>
  selectTarget($<HTMLSelectElement>("#learning-object").value);
$("#scan-object").onclick = () => {
  if (!targetReady() || training) return;
  if (socket) {
    socket.close();
    socket = null;
    pending = false;
  }
  controller.reset();
  controller.pan = -160;
  det = null;
  lastVision = 0;
  $<HTMLInputElement>("#manual").checked = false;
  $<HTMLElement>(".manual-controls").hidden = true;
  running = true;
  networkPaused = false;
  startLabel();
  showTab("lab");
};
$("#export-model").onclick = () =>
  model
    ? download("kestrel-synthetic-model.json", JSON.stringify(model, null, 2))
    : toast("Train the synthetic model first.");
function startLabel() {
  const target =
    $<HTMLSelectElement>("#learning-object").selectedOptions[0].text;
  $("#start").innerHTML =
    icon(running ? "pause" : "scan-line") +
    (running
      ? " Pause patrol"
      : networkPaused
        ? " Resume tracking"
        : targetReady()
          ? ` Scan room for ${target}`
          : " Set up recognition");
  if (networkPaused) {
    $("#network-status").textContent = "Paused · last recognition frame held";
    $("#status").innerHTML = '<span class="status-dot"></span>PAUSED';
    $("#feed-caption").textContent =
      "Paused · recognition and camera control held";
  }
  createIcons({ icons });
}
$("#start").onclick = () => {
  if (running) {
    running = false;
    networkPaused = true;
    startLabel();
    return;
  }
  if (!targetReady()) {
    showTab("model");
    return;
  }
  if (networkPaused) {
    running = true;
    networkPaused = false;
    lastVision = performance.now();
    startLabel();
    return;
  }
  $("#scan-object").click();
};
$("#reset").onclick = () => {
  running = false;
  networkPaused = false;
  controller.reset();
  lab.setTime(0);
  det = null;
  chart.length = 0;
  session.length = 0;
  startLabel();
  toast("Simulation reset.");
};
$("#reset-view").onclick = () => {
  lab.overview.position.set(10, 9, 12);
  lab.controls.target.set(0, 1.2, 0);
};
for (const [id, out, format] of [
  ["speed", "speed-out", (v: number) => `${v.toFixed(1)}×`],
  ["light", "light-out", (v: number) => `${Math.round(v * 100)}%`],
] as const) {
  $<HTMLInputElement>(`#${id}`).oninput = () => {
    $(`#${out}`).textContent = format(
      Number($<HTMLInputElement>(`#${id}`).value),
    );
  };
}
$("#manual").onchange = () => {
  $<HTMLElement>(".manual-controls").hidden =
    !$<HTMLInputElement>("#manual").checked;
};
$("#export-session").onclick = () =>
  download(
    "kestrel-session.json",
    JSON.stringify(
      {
        schema: 1,
        environment: "synthetic",
        detector: socket ? "external-yolo" : "synthetic-logistic",
        modelAccuracy: model?.accuracy,
        measurements: session,
      },
      null,
      2,
    ),
  );
$("#connect-backend").onclick = () => {
  if (socket) {
    socket.close();
    socket = null;
    $("#connect-backend").textContent = "Connect";
    $("#backend-status").textContent = "Browser classifier selected";
    $("#detector-label").textContent = "Synthetic classifier";
    pending = false;
    det = null;
    return;
  }
  if ($<HTMLSelectElement>("#target-object").value !== "drone") {
    toast(
      "The external detector supports drones. Select Drone before connecting.",
    );
    return;
  }
  const url = $<HTMLInputElement>("#backend-url").value;
  try {
    const parsed = new URL(url);
    if (
      !["ws:", "wss:"].includes(parsed.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
    )
      throw Error("Use a local ws:// or wss:// service.");
    socket = new WebSocket(url);
  } catch (e) {
    toast(String(e));
    socket = null;
    return;
  }
  $("#backend-status").textContent = "Connecting…";
  socket.onopen = () => {
    $("#backend-status").textContent = "Connected · awaiting model status";
    $("#connect-backend").textContent = "Disconnect";
  };
  socket.onmessage = (event) => {
    try {
      const m = JSON.parse(event.data);
      if (m.id !== pendingId) return;
      if (m.error) {
        $("#backend-status").textContent = m.error;
        det = null;
        pending = false;
        return;
      }
      pending = false;
      receivedAt = performance.now();
      latency = receivedAt - sentAt;
      const candidate = m.detections?.[0];
      const valid =
        candidate &&
        Array.isArray(candidate.box) &&
        candidate.box.length === 4 &&
        candidate.box.every(
          (v: unknown) =>
            typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1,
        ) &&
        Number.isFinite(candidate.confidence) &&
        candidate.confidence >= 0 &&
        candidate.confidence <= 1 &&
        candidate.box[2] > 0 &&
        candidate.box[3] > 0 &&
        candidate.box[0] + candidate.box[2] <= 1.001 &&
        candidate.box[1] + candidate.box[3] <= 1.001;
      det = valid && latency <= 400 ? candidate : null;
      $("#backend-status").textContent =
        latency > 400
          ? "Response too old · detection discarded"
          : !Array.isArray(m.detections) || (m.detections.length > 0 && !valid)
            ? "Invalid detector response · detection discarded"
            : "YOLO service active";
      $("#detector-label").textContent = "External YOLO";
    } catch (e) {
      det = null;
      pending = false;
      $("#backend-status").textContent =
        `Invalid detector response: ${String(e)}`;
    }
  };
  socket.onerror = () => {
    $("#backend-status").textContent =
      "Could not reach the service. Start the Python backend first.";
  };
  socket.onclose = () => {
    socket = null;
    pending = false;
    det = null;
    $("#connect-backend").textContent = "Connect";
    $("#detector-label").textContent = "Synthetic classifier";
    $("#backend-status").textContent =
      "Disconnected · browser classifier selected";
  };
};
function drawFeed() {
  frameCtx.putImageData(lab.image, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(frameCanvas, 0, 0, 640, 360);
  if (det && running) {
    const [x, y, w, h] = det.box.map((n, i) => n * (i % 2 ? 360 : 640));
    ctx.strokeStyle = "#ff9955";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#ff9955";
    ctx.fillRect(x, Math.max(0, y - 23), 114, 22);
    ctx.fillStyle = "#181310";
    ctx.font = 'bold 12px "IBM Plex Sans", sans-serif';
    ctx.fillText(
      `${$<HTMLSelectElement>("#target-object").value.toUpperCase()} ${(det.confidence * 100).toFixed(0)}%`,
      x + 8,
      Math.max(15, y - 8),
    );
  }
}
function drawChart() {
  const c = $<HTMLCanvasElement>("#error-chart"),
    g = c.getContext("2d")!,
    w = c.width,
    h = c.height;
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "#27313a";
  g.lineWidth = 1;
  for (const y of [15, h / 2, h - 15]) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  for (const [key, color] of [
    ["x", "#ff9955"],
    ["y", "#8ab6df"],
  ] as const) {
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.beginPath();
    let active = false;
    chart.forEach((p, i) => {
      if (p[key] === null) {
        active = false;
        return;
      }
      const x = (i / 299) * w,
        y = h / 2 + p[key]! * h * 0.85;
      if (!active) g.moveTo(x, y);
      else g.lineTo(x, y);
      active = true;
    });
    g.stroke();
  }
}
function updateCompute() {
  const fps = Number($<HTMLInputElement>("#compute-fps").value),
    ms = Math.max(1, Number($<HTMLInputElement>("#compute-ms").value) || 30),
    reserve = Math.max(
      0,
      Number($<HTMLInputElement>("#compute-reserve").value) || 0,
    ),
    budget = Number($<HTMLSelectElement>("#compute-budget").value);
  const weightCount = model ? model.weights.length + 1 : 0;
  const value = estimateCompute(
    fps,
    ms,
    reserve,
    weightCount,
    budget,
    running || training,
  );
  $("#compute-fps-out").textContent = `${fps} fps`;
  $("#compute-ram").textContent = `${value.memoryMiB.toFixed(1)} / 4096 MiB`;
  $<HTMLMeterElement>("#compute-ram-meter").value = value.memoryMiB;
  $("#compute-power").textContent = `${value.powerW.toFixed(1)} W`;
  const power = $<HTMLMeterElement>("#compute-power-meter");
  power.max = budget;
  power.value = value.powerW;
  $("#compute-rate").textContent = `${value.throughput.toFixed(1)} fps`;
  $("#compute-load").textContent =
    `${Math.round(value.utilisation * 100)}% modelled utilisation`;
  $("#compute-stage").textContent = training
    ? "Synthetic training in browser"
    : running
      ? "Capture → features → classify → control"
      : "Idle · start tracking to apply the workload";
  $("#compute-warning").textContent =
    value.memoryMiB > 4096
      ? "Reserved memory exceeds the modelled 4 GB capacity."
      : value.overloaded
        ? "Requested frame rate exceeds the assumed processing capacity."
        : "No Raspberry Pi telemetry connection. Values are estimates.";
}
function loop(now: number) {
  if (now - lastCompute >= 250) {
    updateCompute();
    lastCompute = now;
  }
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (training) return;
  const manual = $<HTMLInputElement>("#manual").checked;
  if (running)
    lab.setTime(
      lab.flightTime + dt * Number($<HTMLInputElement>("#speed").value),
      $<HTMLSelectElement>("#path").value,
    );
  lab.objects.forEach((object, i) => {
    object.visible =
      objectLabels[i] !== $<HTMLSelectElement>("#target-object").value ||
      !$<HTMLInputElement>("#hide-target").checked;
  });
  lab.occluder.visible = $<HTMLInputElement>("#obstacle").checked;
  lab.light.intensity = 2 * Number($<HTMLInputElement>("#light").value);
  if (manual) {
    controller.pan = Number($<HTMLInputElement>("#manual-pan").value);
    controller.tilt = Number($<HTMLInputElement>("#manual-tilt").value);
  }
  // Preview runs independently of the 10 Hz recognition/control loop.
  if (now - lastCapture >= (tab === "lab" ? 1000 / 60 - 1 : 100)) {
    lastCapture = now;
    lab.orient(controller.pan, controller.tilt);
    lab.capture();
    drawFeed();
    capturedFrames++;
    if (now - fpsWindow >= 1000) {
      $("#camera-fps").textContent =
        `${Math.round((capturedFrames * 1000) / (now - fpsWindow))} FPS · target 60`;
      capturedFrames = 0;
      fpsWindow = now;
    }
  }
  if (!networkPaused && now - lastVision >= 100) {
    const vdt = Math.min((now - lastVision) / 1000, 0.15);
    lastVision = now;
    if (socket?.readyState === WebSocket.OPEN && running) {
      if (!pending) {
        frameCtx.putImageData(lab.image, 0, 0);
        pending = true;
        pendingId = ++frameId;
        sentAt = now;
        socket.send(
          JSON.stringify({
            id: pendingId,
            image: frameCanvas.toDataURL("image/jpeg", 0.8),
          }),
        );
      }
      if (now - receivedAt > 400) det = null;
      if (pending && now - sentAt > 3000) {
        socket.close();
        toast("Detector timed out; returned to browser mode.");
      }
    } else {
      const before = performance.now();
      det =
        running && model
          ? detect(
              lab.image,
              model,
              0.5,
              $<HTMLSelectElement>("#target-object").value,
            )
          : null;
      latency = performance.now() - before;
    }
    controller.fastRecovery =
      $<HTMLSelectElement>("#target-object").value === "drone";
    const previousPan = controller.pan,
      previousPitch = controller.tilt;
    controller.update(det, vdt, running, manual);
    const ex = det ? det.box[0] + det.box[2] / 2 - 0.5 : null,
      ey = det ? det.box[1] + det.box[3] / 2 - 0.5 : null;
    if (running) {
      chart.push({ x: ex, y: ey });
      if (chart.length > 300) chart.shift();
      session.push({
        time: lab.flightTime,
        mode: controller.mode,
        pan: controller.pan,
        tilt: controller.tilt,
        errorX: ex,
        errorY: ey,
        confidence: det?.confidence ?? null,
        latencyMs: latency,
      });
      if (session.length > 36000) session.shift();
    }
    const networkInput = det
      ? features(maskImage(lab.image), lab.image.width, lab.image.height, [
          Math.round(det.box[0] * lab.image.width),
          Math.round(det.box[1] * lab.image.height),
          Math.round(det.box[2] * lab.image.width),
          Math.round(det.box[3] * lab.image.height),
        ])
      : null;
    drawNetwork(
      $<HTMLCanvasElement>("#network-canvas"),
      model,
      networkInput,
      running && det ? det.confidence : null,
    );
    const turn =
      Math.abs(controller.pan - previousPan) < 0.02
        ? "hold azimuth"
        : controller.pan > previousPan
          ? "turn right"
          : "turn left";
    const pitchAction =
      Math.abs(controller.tilt - previousPitch) < 0.02
        ? "hold pitch"
        : controller.tilt > previousPitch
          ? "tilt up"
          : "tilt down";
    const command = trackingInputs(ex ?? 0, ey ?? 0);
    const tracking =
      controller.mode === "TRACKING" && ex !== null && ey !== null;
    const azimuthRate = tracking
      ? command.azimuthRate
      : (controller.pan - previousPan) / Math.max(vdt, 0.001);
    const pitchRate = tracking
      ? command.pitchRate
      : (controller.tilt - previousPitch) / Math.max(vdt, 0.001);
    drawControlNetwork(
      $<HTMLCanvasElement>("#control-network"),
      tracking ? ex : null,
      tracking ? ey : null,
      azimuthRate,
      pitchRate,
      controller.mode,
    );
    $("#next-azimuth").textContent = running
      ? `${Math.abs(azimuthRate) < 0.01 ? "Hold" : azimuthRate > 0 ? "Turn right" : "Turn left"} · ${Math.abs(azimuthRate).toFixed(1)}°/s`
      : "Waiting for tracking";
    $("#next-pitch").textContent = running
      ? `${Math.abs(pitchRate) < 0.01 ? "Hold" : pitchRate > 0 ? "Tilt up" : "Tilt down"} · ${Math.abs(pitchRate).toFixed(1)}°/s`
      : "Waiting for tracking";
    $("#azimuth-input").textContent = tracking
      ? `${(ex * 100).toFixed(1)}% horizontal error × ${command.azimuthWeight.toFixed(1)} gain`
      : `${controller.mode} · ${controller.pan.toFixed(1)}° azimuth`;
    $("#pitch-input").textContent = tracking
      ? `${(ey * 100).toFixed(1)}% vertical error × ${command.pitchWeight.toFixed(1)} gain`
      : `${controller.mode} · ${controller.tilt.toFixed(1)}° pitch`;
    $("#network-status").textContent = !model
      ? "Train an object in Recognition to begin."
      : networkInput
        ? `Matched ${model.targetLabel} · ${turn} · ${pitchAction}`
        : running
          ? `Looking for ${model.targetLabel} · ${controller.fastSearching ? "rapid sweep" : controller.reacquiring ? "searching near the last position" : "patrolling the room"}`
          : `Ready to find ${model.targetLabel} · start a room scan`;
    drawChart();
    $("#status").innerHTML =
      `<span class="status-dot ${running ? "on" : ""}"></span>${running ? controller.mode : "STANDBY"}`;
    $("#feed-caption").textContent = running
      ? controller.mode === "TRACKING"
        ? "Target acquired · closed-loop tracking"
        : controller.mode === "MANUAL"
          ? "Manual steering enabled"
          : controller.mode === "LOST"
            ? "Target lost · preparing to scan"
            : `${controller.fastSearching ? "Rapid sweep to reacquire" : controller.reacquiring ? "Searching near last tracked position for" : "Patrolling room for"} ${$<HTMLSelectElement>("#target-object").value}`
      : "Camera ready · awaiting start";
    $("#pan-value").innerHTML = `${controller.pan.toFixed(1)}<small>°</small>`;
    $("#tilt-value").innerHTML =
      `${controller.tilt.toFixed(1)}<small>°</small>`;
    $("#pan-meter").style.width = `${((controller.pan + 160) / 320) * 100}%`;
    $("#tilt-meter").style.width = `${((controller.tilt + 15) / 70) * 100}%`;
    $("#latency").textContent = `${latency.toFixed(1)} ms`;
    const confidence = running && det ? det.confidence : null;
    $<HTMLMeterElement>("#confidence-meter").value = confidence ?? 0;
    $("#confidence-value").textContent =
      confidence === null
        ? "No detection"
        : `${(confidence * 100).toFixed(1)}%`;
    $("#detection-summary").textContent = det
      ? `${$<HTMLSelectElement>("#target-object").selectedOptions[0].text} · ${(det.confidence * 100).toFixed(1)}% classifier score`
      : "No active detection";
    $("#error-value").textContent =
      ex !== null && ey !== null
        ? `${(Math.hypot(ex, ey) * 100).toFixed(1)}%`
        : "—";
  }
  lab.orient(controller.pan, controller.tilt);
  if (tab === "lab") lab.render($<HTMLInputElement>("#frustum").checked);
}
requestAnimationFrame(loop);
const hash = location.hash.slice(1);
if (["lab", "electronics", "model", "notebook"].includes(hash)) showTab(hash);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running) {
    running = false;
    networkPaused = true;
    startLabel();
  }
});
