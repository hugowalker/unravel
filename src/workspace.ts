import { parts, pinRows } from "./electronics";

export const workspaceViews = [
  ["block", "Block diagram", "What talks to what"],
  ["circuit", "Schematic", "How the circuit works"],
  ["wiring", "Wiring diagram", "What wire connects where"],
  ["bom", "BOM / schedules", "What parts and connections exist"],
  ["tests", "Test documentation", "Proof that it works"],
] as const;

const table = (head: string[], rows: string[][]) =>
  `<div class="table-scroll"><table><thead><tr>${head.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const sheet = (title: string, description: string, body: string) =>
  `<article class="panel document-sheet"><div class="document-heading"><h2>${title}</h2><p>${description}</p></div>${body}</article>`;
const svg = (label: string, content: string) =>
  `<div class="drawing-scroll"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 660" role="img" aria-label="${label}"><style>text{font-family:"IBM Plex Sans",Arial,sans-serif;fill:#dedede;font-size:15px}.small{font-size:12px;fill:#aaa}.title{font-size:21px;font-weight:bold}.line{stroke:#ff9955;stroke-width:2;fill:none}.symbol{stroke:#ddd;stroke-width:2;fill:none}.box{fill:#222;stroke:#777;stroke-width:1.5}.node{fill:#ff9955}</style><rect width="1100" height="660" fill="#171717"/>${content}</svg></div>`;

export const wiringDrawing = svg(
  "Point-to-point proposed Pi and motor wiring map",
  `
<text class="title" x="35" y="40">Point-to-point connection map</text><text class="small" x="35" y="67">Pi physical pins are shown separately from BCM identifiers. Connector orientation is not assigned.</text>
<rect class="box" x="50" y="100" width="360" height="410"/><text x="75" y="134">Raspberry Pi GPIO header</text>
<rect class="box" x="700" y="100" width="340" height="300"/><text x="725" y="134">DRV8825 carrier</text>
${[
  ["11 / BCM17", "STEP"],
  ["13 / BCM27", "DIR"],
  ["15 / BCM22", "nENBL"],
  ["1 / 3V3", "nRESET + nSLEEP"],
  ["6 / GND", "GND"],
]
  .map(([from, to], i) => {
    const y = 180 + i * 45;
    return `<text x="75" y="${y + 5}">${from}</text><path class="line" d="M410 ${y}H700"/><circle class="node" cx="410" cy="${y}" r="3"/><circle class="node" cx="700" cy="${y}" r="3"/><text x="725" y="${y + 5}">${to}</text>`;
  })
  .join("")}
<rect class="box" x="700" y="425" width="340" height="85"/><text x="725" y="452">MG90S servo</text><text x="75" y="475">12 / BCM18</text><path class="line" d="M410 470H700"/><text x="725" y="482">PWM signal</text>
<text x="50" y="553">External power and motor leads</text><text class="small" x="50" y="582">Motor rail → fused disconnect → VMOT. C1 connects VMOT to GND near the carrier.</text><text class="small" x="50" y="607">A1/A2 → coil A; B1/B2 → coil B. Servo external 4.8–5.0 V → V+; all grounds share a reference.</text><text class="small" x="50" y="632">Camera, home switch, harness connectors, wire colours and gauges: pending verification.</text>`,
);

export const circuitDrawing = svg(
  "Proposed DRV8825 carrier interface schematic with enable pull-up, bulk capacitor, motor coil nets and servo connections",
  `
<text class="title" x="35" y="40">Carrier interface schematic</text><text class="small" x="35" y="66">Proposed external circuit. Carrier internals are documented by its manufacturer.</text>
<rect class="box" x="410" y="150" width="230" height="345"/><text x="435" y="180">U1 — DRV8825 carrier</text>
<path class="line" d="M110 220H410M110 260H410M110 300H410"/><text x="110" y="209">BCM17 / STEP</text><text x="110" y="249">BCM27 / DIR</text><text x="110" y="289">BCM22 / nENBL</text>
<path class="line" d="M290 110V140M290 195V300"/><rect class="symbol" x="281" y="140" width="18" height="55"/><circle class="node" cx="290" cy="300" r="4"/><text x="256" y="103">3V3</text><text x="315" y="163">R1</text><text x="315" y="185">10 kΩ</text>
<path class="line" d="M350 325V380H410M350 340H410"/><circle class="node" cx="350" cy="340" r="4"/><text x="316" y="317">3V3</text><text class="small" x="425" y="344">nRESET</text><text class="small" x="425" y="384">nSLEEP</text>
<path class="symbol" d="M340 420H410M340 420V455M325 455H355M329 462H351M335 469H345"/><text class="small" x="425" y="424">M0 / M1 / M2 → low</text>
<path class="symbol" d="M410 460H380V488M365 488H395M369 495H391M375 502H385"/><text class="small" x="425" y="464">GND</text>
<path class="line" d="M640 220H940M760 220V290"/><circle class="node" cx="760" cy="220" r="4"/><text x="805" y="201">VMOT — candidate 12 V</text><text class="small" x="805" y="243">Fused supply + physical disconnect</text><path class="symbol" d="M744 290H776M744 300H776M760 300V340M745 340H775M749 347H771M755 354H765"/><text x="779" y="289">C1 ≥ 47 µF</text><text class="small" x="779" y="311">+ at VMOT; rating TBD</text>
<path class="line" d="M640 265H710M640 305H710M640 390H710M640 430H710"/><text x="660" y="258">A1</text><text x="660" y="298">A2</text><text x="660" y="383">B1</text><text x="660" y="423">B2</text>
<text x="825" y="395">M1 — FITO278</text><text class="small" x="825" y="420">A1/A2: identify coil A</text><text class="small" x="825" y="443">B1/B2: identify coil B</text><text class="small" x="825" y="466">No wire colours assigned</text>
<rect class="box" x="410" y="535" width="230" height="90"/><text x="435" y="559">M2 — MG90S</text><path class="line" d="M110 575H410M110 600H410"/><text x="110" y="565">BCM18 / PWM</text><text x="110" y="621">External 4.8–5.0 V</text><path class="symbol" d="M640 600H720V620M705 620H735M709 627H731M715 634H725"/>
<text class="small" x="35" y="650">All GND symbols share one reference. Camera and home-switch circuits remain unassigned.</text>`,
);

export function workspaceExtraPanels() {
  const bomRows = parts.map((p) => [
    p.id === "power"
      ? "PS1–PS3"
      : (
          {
            pi: "U2",
            driver: "U1",
            stepper: "M1",
            servo: "M2",
            camera: "CAM1",
          } as Record<string, string>
        )[p.id],
    p.name,
    p.id === "power" ? "3 rails" : "1",
    p.status,
  ]);
  bomRows.push(
    ["R1", "10 kΩ nENBL pull-up", "1", "Proposed"],
    ["C1", "VMOT bulk capacitor ≥47 µF", "1", "Voltage rating / variant TBD"],
    [
      "F1 / SW1",
      "Motor fuse / physical disconnect",
      "TBD",
      "Select after load and wire ratings",
    ],
    ["HOME1", "Azimuth home switch", "1 planned", "Pin and switch type TBD"],
    [
      "J / harness",
      "Connectors, wire and strain relief",
      "TBD",
      "No procurement schedule yet",
    ],
  );
  return `<section id="workspace-circuit" class="workspace-view" data-workspace-view="circuit" role="tabpanel" aria-labelledby="tab-circuit" hidden>${sheet("How the circuit works", "External carrier circuit, Revision A. Not a verified assembly schematic.", circuitDrawing)}<div class="document-notes"><p>R1 holds nENBL high at startup. C1 supplies local bulk decoupling at VMOT. nRESET and nSLEEP are held high; mode inputs select full steps. Set current limiting from the exact carrier and motor ratings.</p><p>Servo signal compatibility, camera interface, supply sizing and homing remain unverified. <a href="https://www.pololu.com/product/2133" target="_blank" rel="noreferrer">Read the carrier schematic and current-limit documentation ↗</a></p></div></section>
<section id="workspace-bom" class="workspace-view" data-workspace-view="bom" role="tabpanel" aria-labelledby="tab-bom" hidden>${sheet("Parts schedule", "Proposed quantities and reference identifiers. Ratings and procurement details are still open.", table(["Reference", "Part / specification", "Quantity", "Status"], bomRows))}${sheet("Connection schedule", "Logical nets and physical Pi pins. Harness connectors and wire sizes are unassigned.", table(["Pi physical pin", "BCM / rail", "Function", "Destination", "Constraint"], pinRows))}</section>
<section id="workspace-tests" class="workspace-view" data-workspace-view="tests" role="tabpanel" aria-labelledby="tab-tests" hidden>${sheet(
    "Evidence and test status",
    "Software checks and one recorded synthetic run. No physical hardware has been tested.",
    table(
      ["Evidence", "Result", "Scope"],
      [
        [
          "Production build / TypeScript",
          "Passed, 7 October 2026",
          "Browser application",
        ],
        [
          "Control / classifier tests",
          "10 passed, 7 October 2026",
          "Control bounds, seven-class learning, resource estimates",
        ],
        [
          "Python backend tests",
          "5 passed, 7 October 2026",
          "Image validation, stale input, dry-run control",
        ],
        [
          "Recorded slow patrol",
          "352 / 447 samples tracking",
          "6 October; 0.5× speed, synthetic room",
        ],
        [
          "Centering after 2.5 s",
          "309 / 309 tracked samples within 10%",
          "Both axes; does not include lost-target samples",
        ],
        [
          "Mean detector time",
          "1.19 ms",
          "Pixel processing only; excludes capture/render",
        ],
        [
          "Physical electrical tests",
          "Not run",
          "Supply rails, enable state, current limit",
        ],
        [
          "Physical motion / homing",
          "Not run",
          "Calibration, stop behavior, cable travel",
        ],
        [
          "Real-camera detection",
          "Not validated",
          "Camera SKU, real model and Pi benchmark",
        ],
      ],
    ),
  )}<div class="document-notes"><p>The recorded run had 59 acquiring samples and 36 lost samples. Synthetic performance does not establish real-drone recognition.</p><p><a href="https://github.com/hugowalker/unravel/blob/main/docs/validation.md" target="_blank" rel="noreferrer">Validation record ↗</a> · <a href="https://github.com/hugowalker/unravel/blob/main/docs/validation-session.json" target="_blank" rel="noreferrer">Raw recorded session ↗</a></p></div></section>`;
}
