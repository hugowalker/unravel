# Third-party software and data

Original application code, procedural drone/room geometry, and diagrams were authored for Kestrel. No private reference documents are included.

| Dependency              | Use                                     | Licence/source                                                      |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Three.js                | WebGL simulation and orbit controls     | MIT, https://github.com/mrdoob/three                                |
| Lucide                  | Interface icons                         | ISC, https://github.com/lucide-icons/lucide                         |
| Vite                    | Development/build tooling               | MIT, https://github.com/vitejs/vite                                 |
| TypeScript              | Type checking                           | Apache-2.0, https://github.com/microsoft/TypeScript                 |
| DM Sans / Space Grotesk | Optional web fonts                      | SIL Open Font License; Google Fonts                                 |
| FastAPI / Uvicorn       | Optional local inference service        | See installed distributions' licence files                          |
| Pillow / NumPy          | Image decoding and numeric data         | See installed distributions' licence files                          |
| Ultralytics             | Optional YOLO training/inference/export | AGPL-3.0 or commercial licence; https://www.ultralytics.com/license |
| ReportLab               | Dossier generation                      | BSD-style licence; https://www.reportlab.com/                       |

This project's MIT licence applies to its original work, not to third-party packages or models. If distributing or hosting an integrated Ultralytics application, comply with the applicable Ultralytics licence. No trained YOLO weights, Kaggle images, Roboflow data, or Sketchfab meshes are redistributed here. Candidate data sources and their verification status are documented in docs/dataset-guide.md.

IBM Plex Sans is loaded from Google Fonts for body text (SIL Open Font License): https://github.com/IBM/plex.
