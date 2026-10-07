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
import { LabScene } from "./scene";
import { Controller, type Detection } from "./control";
import { detect, type Model } from "./vision";
import { parts, pinRows, schematic } from "./electronics";

const icon = (name: string) =>
  `<i data-lucide="${name}" aria-hidden="true"></i>`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
document.querySelector("#app")!.innerHTML = `
<aside class="sidebar">
 <a class="brand" href="#lab" aria-label="Kestrel laboratory"><span class="brandmark">K</span><span>kestrel<span class="brand-sub">VISION SYSTEMS / 2026</span></span></a>
 <div class="nav-label">WORKSPACE</div>
 <nav aria-label="Workspace"><button data-tab="lab" class="active">${icon("scan-line")} Flight laboratory</button><button data-tab="electronics">${icon("circuit-board")} Electronics</button><button data-tab="model">${icon("brain-circuit")} Recognition model</button><button data-tab="notebook">${icon("book-open")} Project notebook</button></nav>
 <div class="sidebar-bottom"><div class="hardware-glyph">${icon("cpu")}<span>Raspberry Pi 4B<small>Hardware integration planned</small></span></div><a href="https://github.com/hugowalker/unravel" target="_blank" rel="noreferrer">${icon("github")} Source repository ${icon("external-link")}</a><span class="version">KESTREL v0.1 · SIMULATION</span></div>
</aside>
<main>
 <header><div class="breadcrumb">KESTREL <span>/</span> <b id="crumb">FLIGHT LABORATORY</b></div><div class="header-right"><span class="local-badge">${icon("monitor")} Local simulation</span><button class="icon-button" id="help" aria-label="Open project notebook">${icon("circle-help")}</button></div></header>
 <section class="page active" id="page-lab">
  <div class="page-title"><div><div class="eyebrow">SIMULATED CAMERA CONTROL</div><h1>Drone tracking</h1><p>Train a silhouette classifier and test camera tracking.</p></div><button id="start" class="primary">${icon("play")} Start tracking</button></div>
  <div class="mission-bar"><span class="status" id="status"><span class="status-dot"></span>STANDBY</span><span class="mission-sep"></span><span>SCENE <b>Indoor laboratory</b></span><span>DETECTOR <b id="detector-label">Synthetic classifier</b></span><span class="mission-end">${icon("box")} 12 × 10 m</span></div>
  <div class="lab-grid">
   <article class="panel scene-panel"><div class="panel-title"><span>${icon("orbit")} WORLD VIEW</span><span class="mini">DRAG TO ORBIT · SCROLL TO ZOOM</span></div><div id="scene"><div class="scene-tag"><span class="tiny-square"></span> SIMULATION</div><div class="scene-scale">1 m grid</div></div><div class="scene-footer"><label class="check"><input type="checkbox" id="frustum"> Show camera frustum</label><button class="text-button" id="reset-view">${icon("focus")} Reset view</button></div></article>
   <article class="panel feed-panel"><div class="panel-title"><span>${icon("video")} TRACKING CAMERA</span><span class="mini">320 × 180</span></div><div class="feed-wrap"><canvas id="feed" width="640" height="360" aria-label="Simulated camera feed with learned detections"></canvas><div class="feed-corner">VIRTUAL CAMERA</div><div class="reticle"></div><div class="feed-bottom" id="feed-caption">Camera ready · awaiting start</div></div><div class="telemetry"><div><span>AZIMUTH</span><strong id="pan-value">0.0<small>°</small></strong><div class="meter"><i id="pan-meter"></i></div></div><div><span>PITCH</span><strong id="tilt-value">8.0<small>°</small></strong><div class="meter"><i id="tilt-meter"></i></div></div></div><div class="detection-info"><span id="detection-summary">No active detection</span><span class="mini" id="latency">— ms</span></div></article>
  </div>
  <div class="lower-grid"><article class="panel controls-panel"><div class="panel-title"><span>${icon("sliders-horizontal")} SCENE CONTROLS</span><button class="text-button" id="reset">Reset simulation</button></div><div class="control-grid"><label>Flight path<select id="path"><option value="ellipse">Elliptical patrol</option><option value="figure8">Figure of eight</option><option value="hover">Stationary hover</option></select></label><label>Flight speed <output id="speed-out">1.0×</output><input id="speed" type="range" min="0" max="2" step=".1" value="1"></label><label>Illumination <output id="light-out">100%</output><input id="light" type="range" min=".15" max="1.3" step=".05" value="1"></label></div><div class="toggle-row"><label class="check"><input id="obstacle" type="checkbox"> Add obstruction</label><label class="check"><input id="hide-drone" type="checkbox"> Hide drone</label><label class="check"><input id="manual" type="checkbox"> Manual camera</label></div><div class="manual-controls" hidden><label>Azimuth <input id="manual-pan" type="range" min="-160" max="160" value="0"></label><label>Pitch <input id="manual-tilt" type="range" min="-15" max="55" value="8"></label></div></article><article class="panel error-panel"><div class="panel-title"><span>${icon("activity")} CENTERING ERROR</span><span class="mini">LAST 30 S</span></div><canvas id="error-chart" width="500" height="105" aria-label="Chart of horizontal and vertical centering error"></canvas><div class="chart-legend"><span><i></i> Horizontal</span><span><i></i> Vertical</span><b id="error-value">—</b></div></article></div>
  <div class="notice"><span>${icon("flask-conical")} SYNTHETIC DEMONSTRATION</span><p>The classifier learns rendered silhouettes. Real-world drone recognition needs real camera data and separate validation.</p><button class="text-button" data-go="model">Inspect model</button></div>
 </section>
 <section class="page" id="page-electronics">
  <div class="page-title"><div><div class="eyebrow">PROPOSED WIRING</div><h1>Electronics</h1><p>Explore the components, signal paths, and separate power rails.</p></div><button id="download-schematic" class="secondary">${icon("download")} Download diagram</button></div>
  <div class="schematic-banner">${icon("info")} <span><b>Proposed architecture · Revision A</b> &nbsp; Camera SKU, motor ratings, and supply sizing need verification before assembly.</span></div>
  <div class="electronics-grid"><article class="panel schematic-panel"><div class="panel-title"><span>${icon("circuit-board")} SYSTEM CONNECTIONS</span><span class="mini">SELECT A COMPONENT</span></div><div id="schematic">${schematic()}</div><div class="wire-legend"><span><i class="signal"></i> Logic / PWM</span><span><i class="power"></i> External power</span><span><i class="motor"></i> Motor coils</span><span><i class="ground"></i> Ground</span><span><i class="pending"></i> Unverified</span></div></article><aside class="panel inspector"><div class="eyebrow" id="part-tag"></div><h2 id="part-name"></h2><span class="part-status" id="part-status"></span><p id="part-detail"></p><div class="inspector-pins"><span>CONNECTIONS</span><p id="part-pins"></p></div></aside></div>
  <article class="panel pin-panel"><div class="panel-title"><span>${icon("rows-3")} PROPOSED CONNECTION TABLE</span><span class="mini">BCM ≠ PHYSICAL PIN NUMBER</span></div><div class="table-scroll"><table><thead><tr><th>Physical pin</th><th>BCM / rail</th><th>Function</th><th>Destination</th><th>Design note</th></tr></thead><tbody>${pinRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></article>
  <div class="note-grid"><div><span class="note-number">01</span><h3>Logic is not motor power.</h3><p>The Pi sends 3.3 V signals. Use separate supplies for the stepper and servo, with a common ground reference.</p></div><div><span class="note-number">02</span><h3>Establish position first.</h3><p>A stepper has no absolute position at startup. Add a home switch before autonomous physical scanning; keep travel within cable limits.</p></div><div><span class="note-number">03</span><h3>Check the exact camera.</h3><p>The Arducam Mini interface remains unassigned until its SKU is verified. SPI modules are not interchangeable with CSI cameras.</p></div></div>
 </section>
 <section class="page" id="page-model">
  <div class="page-title"><div><div class="eyebrow">SYNTHETIC TRAINING</div><h1>Drone classifier</h1><p>Logistic regression trained on rendered drone silhouettes.</p></div><button class="secondary" id="export-model">${icon("download")} Export model</button></div>
  <div class="model-grid"><article class="panel model-summary"><div class="panel-title"><span>${icon("brain-circuit")} SYNTHETIC APPEARANCE CLASSIFIER</span><span class="mini">BROWSER / CPU</span></div><div class="model-body"><div class="model-state" id="model-state">Ready to learn</div><h2>Rendered training samples</h2><p>Render positive drone views and negative geometric objects. Turn bright silhouettes into 16 × 16 features, then fit a logistic classifier. At runtime, only camera pixels reach the detector.</p><div class="training-progress"><i id="training-bar"></i></div><div class="training-metrics"><div><span>TRAINING CROPS</span><b id="sample-count">—</b></div><div><span>HELD-OUT ACCURACY</span><b id="model-accuracy">—</b></div><div><span>INPUT FEATURES</span><b>257</b></div></div><button class="primary" id="train-model">${icon("sparkles")} Train on synthetic views</button><p class="small-note">Held-out synthetic crops share the same procedural asset. This score does not measure recognition of unseen real drones.</p></div></article><article class="panel pipeline-panel"><div class="panel-title"><span>${icon("workflow")} INFERENCE PIPELINE</span></div><ol class="pipeline"><li><span>01</span><div><h3>Capture</h3><p>Read a 320 × 180 RGB image from the virtual pan/tilt camera.</p></div></li><li><span>02</span><div><h3>Propose regions</h3><p>Find connected bright regions. This intentionally simple stage assumes a dark synthetic room.</p></div></li><li><span>03</span><div><h3>Classify appearance</h3><p>Predict drone / non-drone from the learned silhouette features.</p></div></li><li><span>04</span><div><h3>Close the loop</h3><p>Use bounding-box error to steer azimuth and pitch, with speed and travel limits.</p></div></li></ol></article></div>
  <article class="panel backend-panel"><div class="panel-title"><span>${icon("server")} REAL-IMAGE DETECTOR</span><span class="mini">OPTIONAL LOCAL PYTHON SERVICE</span></div><div class="backend-body"><div><h3>Bring a trained YOLO model.</h3><p>The Python service accepts camera frames and returns drone boxes. Training and NCNN export scripts are included in the repository. Real-image weights are not bundled.</p></div><div class="backend-connect"><label for="backend-url">Local service address</label><div class="input-row"><input id="backend-url" value="ws://127.0.0.1:8000/ws/detect" aria-label="Local detector WebSocket address"><button id="connect-backend" class="secondary">Connect</button></div><span id="backend-status">Browser classifier selected</span></div></div></article>
  <div class="note-grid"><div><span class="note-number">DATA</span><h3>Use images of drones.</h3><p>Datasets filmed from drones often label cars and pedestrians. Verify that the drone itself is annotated before training.</p></div><div><span class="note-number">SPLITS</span><h3>Separate recordings.</h3><p>Keep complete real recordings in one split. Do not scatter adjacent video frames across training and testing.</p></div><div><span class="note-number">DEPLOY</span><h3>Measure on the Pi.</h3><p>Export a compact model to NCNN, then measure latency and recall with the actual camera before enabling motors.</p></div></div>
 </section>
 <section class="page" id="page-notebook">
  <div class="page-title"><div><div class="eyebrow">ENGINEERING NOTEBOOK / 2026</div><h1>Project notes</h1><p>A visual tracking project that connects machine perception to physical motion.</p></div><a class="secondary" href="/kestrel-dossier.pdf" target="_blank">${icon("file-down")} Technical dossier</a></div>
  <div class="notebook-grid"><article class="panel notebook-main"><span class="eyebrow">THE OBJECTIVE</span><h2>Camera detection and pan/tilt control</h2><p>Use a camera to recognise a drone, then keep it centred by rotating an azimuth stepper and a pitch servo. The browser laboratory makes the feedback loop visible before physical hardware is connected.</p><div class="architecture"><span>Camera pixels</span>${icon("chevron-right")}<span>Detection</span>${icon("chevron-right")}<span>Control error</span>${icon("chevron-right")}<span>Pan + tilt</span></div><h3>What is implemented</h3><ul><li>Interactive 3D room, procedural drone, and virtual tracking camera.</li><li>Browser-trained synthetic silhouette classifier and bounded feedback control.</li><li>Search, acquisition, tracking, lost-target, and manual modes.</li><li>Selectable electronics diagram and proposed GPIO connection table.</li><li>Optional Python inference service, real-image training scripts, and deployment guide.</li></ul><h3>What remains experimental</h3><p>Physical wiring, camera compatibility, real-image model accuracy, motor timing, and mechanical calibration require bench validation. The diagram is a proposed design, not a record of an assembled system.</p><h3>Validation approach</h3><p>Test hover, slow patrol, empty scenes, obstructions, target loss, and stale detections. Measure detector accuracy separately from camera centring. A good synthetic score is not evidence of real-world performance.</p><button class="secondary" id="export-session">${icon("download")} Export session measurements</button></article><aside><article class="panel build-list"><div class="panel-title"><span>${icon("package")} HARDWARE BASELINE</span></div>${[
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
      electronics: "ELECTRONICS",
      model: "RECOGNITION MODEL",
      notebook: "PROJECT NOTEBOOK",
    } as Record<string, string>
  )[name];
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
$("#download-schematic").onclick = () => {
  const svg = $("#schematic svg").cloneNode(true) as SVGElement;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const styles = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "style",
  );
  styles.textContent = `text{font-family:Arial,sans-serif;fill:#c2cbd3}.component rect{fill:#18232e;stroke:#344655}.component .part-accent{fill:#b8ef76;stroke:none}.part-tag{font-size:11px;fill:#9daab5}.part-name{font-size:19px;font-weight:bold}.part-sub{font-size:11px;fill:#a2b1bd}.wire-label{font-size:11px}.schematic-caption{font-size:17px;font-weight:bold}.signal{stroke:#b8ef76}.power{stroke:#efb96c}.motor{stroke:#8fbbed}.ground{stroke:#708290}.pending{stroke:#d2a2d2;stroke-dasharray:5 5}`;
  svg.prepend(styles);
  download(
    "kestrel-electronics-rev-a.svg",
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
  training = false,
  model: Model | null = null,
  last = performance.now(),
  lastVision = 0,
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
  const saved = JSON.parse(localStorage.getItem("kestrel-model-v2") || "null");
  if (
    saved?.version === 1 &&
    saved.weights?.length === 257 &&
    saved.weights.every(Number.isFinite) &&
    Number.isFinite(saved.bias)
  )
    model = saved;
} catch (e) {
  toast(`Model cache could not be read: ${String(e)}`);
}
function updateModel() {
  if (!model) return;
  $("#model-state").textContent = "Trained · synthetic data only";
  $("#sample-count").textContent = String(model.samples);
  $("#model-accuracy").textContent = `${(model.accuracy * 100).toFixed(1)}%`;
  $("#training-bar").style.width = "100%";
  $("#train-model").innerHTML = icon("refresh-cw") + " Retrain model";
  createIcons({ icons });
}
updateModel();
async function learn() {
  if (training) return;
  training = true;
  const wasRunning = running;
  running = false;
  $("#start").setAttribute("disabled", "");
  $("#train-model").setAttribute("disabled", "");
  $("#model-state").textContent = "Rendering views and learning…";
  $("#status").innerHTML = '<span class="status-dot"></span>LEARNING';
  try {
    model = await lab.learn((p) => {
      $("#training-bar").style.width = `${p * 100}%`;
      $("#feed-caption").textContent =
        `Learning synthetic views · ${Math.round(p * 100)}%`;
    });
    try {
      localStorage.setItem("kestrel-model-v2", JSON.stringify(model));
    } catch (e) {
      toast(`Model could not be saved: ${String(e)}`);
    }
    updateModel();
    toast("Synthetic model trained. Real-camera performance is unverified.");
  } catch (e) {
    toast(`Training failed: ${String(e)}`);
  } finally {
    training = false;
    running = wasRunning;
    $("#start").removeAttribute("disabled");
    $("#train-model").removeAttribute("disabled");
  }
}
$("#train-model").onclick = () => void learn();
$("#export-model").onclick = () =>
  model
    ? download("kestrel-synthetic-model.json", JSON.stringify(model, null, 2))
    : toast("Train the synthetic model first.");
function startLabel() {
  $("#start").innerHTML =
    icon(running ? "pause" : "play") +
    (running ? " Pause tracking" : " Start tracking");
  createIcons({ icons });
}
$("#start").onclick = async () => {
  if (!model && !socket) {
    await learn();
    if (!model) return;
  }
  running = !running;
  startLabel();
};
$("#reset").onclick = () => {
  running = false;
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
    ctx.strokeStyle = "#b8ef76";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#b8ef76";
    ctx.fillRect(x, Math.max(0, y - 23), 114, 22);
    ctx.fillStyle = "#142013";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
      `DRONE ${(det.confidence * 100).toFixed(0)}%`,
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
    ["x", "#b8ef76"],
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
function loop(now: number) {
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
  lab.drone.visible = !$<HTMLInputElement>("#hide-drone").checked;
  lab.occluder.visible = $<HTMLInputElement>("#obstacle").checked;
  lab.light.intensity = 2 * Number($<HTMLInputElement>("#light").value);
  if (manual) {
    controller.pan = Number($<HTMLInputElement>("#manual-pan").value);
    controller.tilt = Number($<HTMLInputElement>("#manual-tilt").value);
  }
  if (now - lastVision >= 100) {
    const vdt = Math.min((now - lastVision) / 1000, 0.15);
    lastVision = now;
    lab.orient(controller.pan, controller.tilt);
    lab.capture();
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
      det = running && model ? detect(lab.image, model) : null;
      latency = performance.now() - before;
    }
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
    drawFeed();
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
            : "Scanning for a drone"
      : "Camera ready · awaiting start";
    $("#pan-value").innerHTML = `${controller.pan.toFixed(1)}<small>°</small>`;
    $("#tilt-value").innerHTML =
      `${controller.tilt.toFixed(1)}<small>°</small>`;
    $("#pan-meter").style.width = `${((controller.pan + 160) / 320) * 100}%`;
    $("#tilt-meter").style.width = `${((controller.tilt + 15) / 70) * 100}%`;
    $("#latency").textContent = `${latency.toFixed(1)} ms`;
    $("#detection-summary").textContent = det
      ? `Drone · ${(det.confidence * 100).toFixed(1)}% classifier score`
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
    startLabel();
  }
});
