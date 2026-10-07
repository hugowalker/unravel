"""Generate the user-facing PDF. Requires reportlab; no network access."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, String, Line

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'kestrel-dossier.pdf'
INK=colors.HexColor('#17242e'); MUTED=colors.HexColor('#516372'); GREEN=colors.HexColor('#5a8139'); LINE=colors.HexColor('#d5dfe5'); PALE=colors.HexColor('#eef3f5')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleK',fontName='Helvetica-Bold',fontSize=40,leading=45,textColor=INK,spaceAfter=14))
styles.add(ParagraphStyle(name='Kicker',fontName='Helvetica-Bold',fontSize=9,leading=13,textColor=GREEN,spaceAfter=10))
styles.add(ParagraphStyle(name='HeadK',fontName='Helvetica-Bold',fontSize=23,leading=28,textColor=INK,spaceAfter=16))
styles.add(ParagraphStyle(name='SubK',fontName='Helvetica-Bold',fontSize=12,leading=17,textColor=INK,spaceBefore=15,spaceAfter=7))
styles.add(ParagraphStyle(name='BodyK',fontName='Helvetica',fontSize=10.5,leading=16,textColor=MUTED,spaceAfter=10))
styles.add(ParagraphStyle(name='SmallK',fontName='Helvetica',fontSize=8.5,leading=12,textColor=MUTED,spaceAfter=8))
styles.add(ParagraphStyle(name='CellK',fontName='Helvetica',fontSize=8.7,leading=12,textColor=INK))
styles.add(ParagraphStyle(name='CodeK',fontName='Courier',fontSize=8.4,leading=13,textColor=INK,backColor=PALE,borderPadding=10,spaceBefore=9,spaceAfter=14))
story=[]
def p(text,style='BodyK'): story.append(Paragraph(text,styles[style]))
def heading(n,title): p(f'KESTREL / ENGINEERING DOSSIER / {n:02d}','Kicker');p(title,'HeadK')
def table(rows,widths):
    data=[[Paragraph(str(c),styles['CellK']) for c in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('LINEBELOW',(0,0),(-1,0),1,LINE),('LINEBELOW',(0,1),(-1,-1),.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
    story.append(t);story.append(Spacer(1,9))
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(LINE);canvas.line(44,43,551,43);canvas.setFont('Helvetica',8);canvas.setFillColor(MUTED);canvas.drawString(44,29,'KESTREL  /  REV 0.1  /  6 OCTOBER 2026');canvas.drawRightString(551,29,str(doc.page));canvas.restoreState()

p('VISUAL TRACKING LABORATORY / 2026','Kicker')
p('Kestrel','TitleK')
p('Machine perception.<br/>Two-axis motion.<br/>An inspectable electrical system.','HeadK')
p('Technical project dossier','SubK')
p('A browser-based engineering demonstration that learns the appearance of a procedural drone, follows it with a virtual pan/tilt camera, and explains the proposed Raspberry Pi electronics.')
shot=ROOT/'docs'/'images'/'flight-lab.jpg'
if shot.exists():
    from PIL import Image as PILImage
    with PILImage.open(shot) as im: w,h=im.size
    width=480;height=width*h/w
    if height>370: width*=370/height;height=370
    story.append(Image(str(shot),width=width,height=height,hAlign='LEFT'))
story.append(Spacer(1,14))
p('<b>Release boundary:</b> synthetic demonstration and proposed electronics. Real-camera recognition, wiring and motor actuation are not validated.','SmallK')
p('Source: <link href="https://github.com/hugowalker/unravel" color="#456d32">github.com/hugowalker/unravel</link>','SmallK')
story.append(PageBreak())

heading(2,'Perception and control')
p('The simulation renders a room and quadcopter in Three.js. Its tracking camera captures 320 x 180 RGB images. Runtime detection receives pixels only; it does not read the target position from the scene.')
d=Drawing(507,70)
for i,label in enumerate(['CAMERA','CLASSIFIER','CONTROLLER','PAN + TILT']):
    x=i*129;d.add(Rect(x,20,116,36,fillColor=PALE,strokeColor=LINE,rx=3));d.add(String(x+58,34,label,fontName='Helvetica-Bold',fontSize=9,textAnchor='middle',fillColor=INK))
    if i<3:d.add(Line(x+116,38,x+129,38,strokeColor=GREEN,strokeWidth=1.5))
story.append(d)
p('A small model you can inspect','SubK')
p('720 rendered crops are balanced between drone views and geometric non-drone objects. A fixed seed assigns 576 crops to training and 144 to validation. Views vary yaw, pitch, roll and illumination. The same procedural assets appear in both splits, so the score measures a narrow synthetic task.')
p('Bright connected regions become candidates. Small raster gaps are joined, while the original silhouette supplies 16 x 16 occupancy features plus aspect ratio. Full-batch gradient descent fits a logistic classifier. Model weights can be exported from the app.')
p('State machine and controller','SubK')
table([['State / setting','Behavior'],['SEARCHING','Bounded azimuth sweep with several pitch rows.'],['ACQUIRING','Require three repeated detections before tracking.'],['TRACKING','Steer from bounding-box centre error; 2.5% deadband on each axis.'],['LOST','Hold briefly, then resume searching after 0.65 seconds.'],['Motion limits','42 degrees/s azimuth; 30 degrees/s pitch.'],['Simulated travel','Azimuth -160 to +160 degrees; pitch -15 to +55 degrees.'],['MANUAL / IDLE','Manual sliders or paused motion.']],[132,375])
p('These motion values are demonstration settings. Physical limits depend on the actual mechanism, cabling, driver and calibration.','SmallK')
story.append(PageBreak())

heading(3,'Electrical architecture')
p('The app provides a selectable component diagram, proposed connection table, and downloadable SVG. Revision A is an architecture proposal; the exact camera module, motor ratings and supplies still need verification.')
d=Drawing(507,255)
boxes=[(0,158,108,60,'CAMERA','Arducam Mini / TBD'),(157,148,135,80,'COMPUTE','Raspberry Pi 4B'),(350,176,152,52,'AZIMUTH DRIVER','DRV8825 carrier'),(350,100,152,52,'AZIMUTH MOTOR','FITO278 / verify'),(157,45,135,55,'PITCH MOTOR','MG90S servo'),(0,0,507,29,'EXTERNAL POWER','Separate Pi, servo and motor rails; common ground')]
for x,y,w,h,title,sub in boxes:
    d.add(Rect(x,y,w,h,fillColor=PALE,strokeColor=LINE,rx=3));d.add(String(x+10,y+h-17,title,fontName='Helvetica-Bold',fontSize=8,fillColor=INK));d.add(String(x+(120 if h<35 else 10),y+11,sub,fontSize=7.8,fillColor=MUTED))
for x1,y1,x2,y2 in [(108,185,157,185),(292,200,350,200),(426,176,426,152),(224,148,224,100)]:d.add(Line(x1,y1,x2,y2,strokeColor=GREEN,strokeWidth=1.7))
story.append(d)
p('Supplies and signal boundaries','SubK')
p('Use a dedicated 5.1 V USB-C supply for the Pi, an external regulated 4.8-5.0 V servo rail, and a separate current-limited motor rail. The DRV8825 supports 8.2-45 V at VMOT; 12 V is only a candidate until the motor and current limit are verified. GPIO carries 3.3 V logic, not motor power.')
p('Place at least 47 uF bulk capacitance near VMOT. Set the driver current limit using the actual motor rating and carrier sense resistors. Use a common ground reference, suitable fusing, strain relief and a physical motor-power disconnect. Do not join positive supply rails.')
p('Open hardware questions','SubK')
p('Confirm the Arducam SKU before assigning SPI or CSI connections. Verify the stepper identifier, coil pairs, phase current, step angle and gearing. Confirm the servo variant, stall-current demand and PWM compatibility. Add homing before autonomous physical scanning.')
story.append(PageBreak())

heading(4,'Proposed wiring and integration')
table([['Physical pin','BCM / rail','Destination'],['11','GPIO17','DRV8825 STEP'],['13','GPIO27','DRV8825 DIR'],['15','GPIO22','DRV8825 nENBL; 10 kohm pull-up to 3.3 V'],['12','GPIO18','MG90S PWM; verify signal compatibility'],['1','3V3','DRV8825 nRESET and nSLEEP held high'],['6','GND','Common signal / power reference'],['Unassigned','Camera bus','Verify exact module before wiring']],[79,92,336])
p('Driver details','SubK')
p('M0, M1 and M2 low selects full-step mode. Keep nENBL high until the mechanism is homed. Identify the two motor coil pairs with power disconnected: A1/A2 connect to one pair, B1/B2 to the other. Do not infer pairs from wire colours. The overview schematic groups connections; the component inspector and hardware guide describe the passive parts and enable logic.')
p('Physical integration sequence','SubK')
for text in ['Identify the exact camera, motor and carrier variants. Verify supply voltages before connecting loads.','Set phase-current limiting; establish unloaded servo neutral and travel endpoints.','Install and test a home switch. Measure steps per degree, gearing and direction signs.','Train and benchmark a real-image detector on the Pi using the actual capture interface.','Implement the physical MotorInterface with deterministic step timing, stale-frame stops and calibrated travel.','Validate first with a stationary or hand-moved target.']:
    p('• '+text)
p('<b>Shipped motor adapter:</b> DryRunMotors only records bounded commands. It never imports GPIO or energises a motor. The OpenCV camera dry-run supports an existing capture device or file; it is not a generic SPI driver.','SmallK')
story.append(PageBreak())

heading(5,'Data, software and deployment')
p('Run the browser laboratory','SubK')
p('Install Node.js 22.12+ and pnpm 11+. From the repository root:')
p('pnpm install<br/>pnpm dev<br/><br/>pnpm build<br/>pnpm preview','CodeK')
p('The default demonstration is static and local. It requires WebGL but no Python service. Select Start tracking to train the synthetic model. The model is cached on the current device. Use the model page to retrain or export it.')
p('Move toward real images','SubK')
p('Candidate sources include a downloadable DJI Mavic 2 Pro photogrammetry model on Sketchfab, a labelled Drone Detection dataset on Roboflow, and Amateur Unmanned Air Vehicle Detection on Kaggle. These were located, not incorporated. Verify licences and provenance before using or redistributing any asset. Source links are in docs/dataset-guide.md.')
p('Add real images from the intended room and working distances, including empty scenes. Label the drone itself. Split by recording, not by adjacent frames. Keep the final real test set separate from model selection.')
p('python -m pip install -r backend/requirements-ml.txt<br/>python scripts/train_detector.py --data data/drone/data.yaml<br/>python scripts/export_detector.py runs/kestrel/weights/best.pt','CodeK')
p('Local detector interface','SubK')
p('Set KESTREL_MODEL to a trained local checkpoint and run the FastAPI service on 127.0.0.1:8000. The browser sends JPEG/PNG frames and frame IDs over /ws/detect. The service returns normalised xywh boxes and scores for the drone class. A missing model is reported explicitly; the service never silently downloads weights.')
p('The browser permits one outstanding frame, discards responses older than 400 ms and disconnects after a three-second timeout. The service has no motor access. Optional Ultralytics dependencies have their own AGPL/commercial licensing requirements; see THIRD_PARTY.md.','SmallK')
story.append(PageBreak())

heading(6,'Evidence and next milestones')
p('Automated verification','SubK')
p('Production build and TypeScript checks passed. Six TypeScript tests and five Python tests cover control states, bounds, classifier fitting, image validation, stale input and dry-run motor behavior. Desktop and narrow-screen browser checks verified navigation, training, tracking, component inspection and diagram export.')
p('One recorded synthetic patrol','SubK')
table([['Measurement','Result'],['Samples / simulated flight time','447 / 23.27 seconds at 0.5x flight speed'],['TRACKING / ACQUIRING / LOST','352 / 59 / 36 samples'],['Tracked after settling (2.5 scene seconds)','309 samples'],['Within 10% error on each axis, tracked subset','309 of 309 (100%)'],['Mean pixel-detector processing time','1.19 ms; excludes rendering and capture'],['Held-out synthetic crop accuracy','100% on 144 same-asset crops']],[281,226])
p('The centring criterion was met while tracking, but tracking was not continuous: 78.7% of samples were in TRACKING. Brief classifier dropouts are a known limitation. The synthetic validation score does not establish performance on unseen drone shapes, bright clutter, real cameras or physical motion. Raw measurements are preserved in docs/validation-session.json.','SmallK')
p('Remaining validation','SubK')
p('Real-image precision/recall and false positives; Raspberry Pi throughput; camera compatibility; calibrated motor motion; homing and stop behavior; long-duration and occlusion testing. No physical wiring or flying-drone demonstration has been validated by this release.')
p('Manufacturer and implementation references','SubK')
for label,url in [('DRV8825 carrier documentation','https://www.pololu.com/product/2133/'),('Raspberry Pi hardware','https://www.raspberrypi.com/documentation/computers/raspberry-pi.html'),('TowerPro MG90S','https://towerpro.com.tw/product/mg90s-3/'),('Ultralytics Raspberry Pi deployment','https://docs.ultralytics.com/guides/raspberry-pi/'),('Three.js','https://threejs.org/')]:
    p(f'<link href="{url}" color="#456d32">{label}</link>','SmallK')

OUT.parent.mkdir(parents=True,exist_ok=True)
doc=SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=44,leftMargin=44,topMargin=43,bottomMargin=61,title='Kestrel - Technical dossier',author='Hugo Walker')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
