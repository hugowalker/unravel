# Kestrel

A browser-based visual tracking laboratory: teach a small model the silhouette of a 3D drone, watch a two-axis camera follow it, and explore the electronics behind a Raspberry Pi implementation.

**Status:** working synthetic demonstration. Real-camera recognition, physical motor control, and the proposed wiring require further validation. No real-image detector weights are bundled. No hardware is actuated by this repository.

## Run the web app

Requires Node.js 22.12+ and pnpm 11+.

```sh
pnpm install
pnpm dev
```

Open the local address shown by Vite. Select **Start tracking** to render 720 labelled crops and train the browser classifier. The model is cached on this device. Use **Recognition model** to retrain or export it.

```sh
pnpm build
pnpm preview
pnpm test
```

The static build is in `dist`. It can run on any static web host; the default demo requires no Python server. It needs WebGL and a browser with hardware acceleration. Fonts load from Google Fonts, with local system fallbacks.

## Explore

- **Flight laboratory:** orbitable 3D room, simulated camera feed, pan/tilt telemetry, centering-error chart, hover/patrol/figure-eight paths, occlusion, lighting, target visibility, and manual steering.
- **Electronics:** selectable system schematic, component inspector, proposed BCM/physical-pin table, power rails, and downloadable SVG.
- **Recognition model:** live synthetic training, model export, and optional connection to a trained local YOLO detector.
- **Project notebook:** implementation boundaries, hardware baseline, session measurements, and a downloadable technical dossier.

The browser detector receives RGB pixels, not simulator target coordinates. It proposes bright connected regions, extracts a 16 x 16 silhouette plus aspect ratio, and classifies them with logistic regression. It is deliberately restricted to high-contrast synthetic scenes. It is not a general drone detector.

## Optional Python detector

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
```

Without weights the service starts, reports `model_ready: false`, and explicitly refuses inference. For a trained model:

```sh
python -m pip install -r backend/requirements-ml.txt
# PowerShell:
$env:KESTREL_MODEL = "runs/kestrel/weights/best.pt"
# bash: export KESTREL_MODEL=runs/kestrel/weights/best.pt
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
```

Use **Connect** in Recognition model. Only local WebSocket addresses are accepted by the app. The server accepts local browser origins, processes frames serially per connection, and returns normalized boxes. It has no GPIO access. Use only trusted model files.

See [dataset preparation](docs/dataset-guide.md), [hardware integration](docs/hardware.md), [technical dossier](docs/dossier.md), and [validation record](docs/validation.md).

## Tests

```sh
pnpm test
python -m pip install pytest
python -m pytest tests/test_backend.py -q
```

## Project structure

```text
src/        Browser simulation, pixel classifier, controller, and electronics UI
backend/    Local YOLO inference API and non-actuating control boundary
scripts/    Real-image training, NCNN export, camera dry run, dossier generation
docs/       Engineering guide, data provenance, hardware and validation notes
public/     Favicon and user-facing technical dossier
tests/      Controller, feature extraction and backend input tests
```

Original code and procedural geometry are MIT licensed. Third-party dependencies and optional models retain their own licences; see [THIRD_PARTY.md](THIRD_PARTY.md). Private reference documents, credentials, bulk datasets, and model checkpoints are excluded from Git.
