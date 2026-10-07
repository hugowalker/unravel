# Electronics and physical integration — Revision A

This is a proposed design for the supplied hardware list, not a verified assembly schematic. Exact motor ratings, camera SKU, carrier variant, power supplies and mechanics remain unverified. The app shows these uncertainties alongside the diagram.

## Baseline

| Item | Purpose | Remaining verification |
|---|---|---|
| Raspberry Pi 4B, 4 GB | Capture, inference, control | OS, cooling, measured inference latency |
| Arducam Mini | Camera | Exact SKU, connector, supply, logic levels and driver |
| FITO278 stepper | Azimuth | Identifier, phase current, step angle, coil pairs and gearing |
| DRV8825 carrier | Stepper drive | Carrier sense resistors, cooling and current limit |
| MG90S | Pitch | Genuine/variant specification, stall demand, signal compatibility and travel |
| Separate supplies | Pi, servo and motor rails | Ratings, fuses, wire gauge and motor disconnect |

## Proposed logic connections

| Pi physical pin | BCM / rail | Destination |
|---|---|---|
| 11 | GPIO17 | DRV8825 STEP |
| 13 | GPIO27 | DRV8825 DIR |
| 15 | GPIO22 | DRV8825 nENBL; 10 kΩ pull-up to 3.3 V |
| 12 | GPIO18 | MG90S PWM signal |
| 1 | 3V3 | DRV8825 nRESET and nSLEEP held high |
| 6 | GND | Common signal/power reference |

DRV8825 M0, M1 and M2 low selects full-step mode. Verify actual carrier pin labels. Ground unused mode inputs deliberately or verify the carrier's pull-downs. Keep nENBL high until the controller is ready and the mechanism is homed. nRESET/nSLEEP and the enable pull-up are described here and in the inspector; the overview diagram groups signal connections rather than showing every passive part.

## Power and motor connections

- Pi: dedicated nominal 5.1 V USB-C supply suitable for the Pi 4B. Do not backfeed it from a motor rail.
- Servo: separate regulated 4.8–5.0 V rail, sized from measured or documented stall current. Verify that the actual servo accepts 3.3 V PWM; add a suitable buffer if needed.
- Driver: its supported VMOT range is 8.2–45 V. A 12 V rail is a candidate only. Set the phase-current limit to the verified motor rating using the exact carrier's documented sense resistor relationship. No numerical VREF is prescribed without that information.
- Put at least 47 µF bulk capacitance directly across VMOT and power ground; choose capacitor voltage rating for the actual supply and transients. Observe polarity.
- Driver A1/A2 go to one verified motor coil, B1/B2 to the other. Identify pairs with the supply disconnected. Do not rely on wire colours.
- Share ground between logic, driver, servo and supplies. Keep high-current return paths away from camera and GPIO wiring. Do not join positive rails.
- Include a fused motor supply and a physical motor-power disconnect. Select fuse and wire ratings after the loads are known.

## Camera uncertainty

An Arducam Mini described for UNO/Mega boards is often SPI, not CSI. The exact module must be identified before assigning its connector, supply or bus signals. The OpenCV dry-run script supports an existing OpenCV capture device or video file; it is not an SPI camera driver. A verified SPI module needs a vendor-supported capture adapter before integration.

## Mechanical calibration sequence

1. Verify power rails and logic voltages with motors disconnected.
2. Verify the motor ratings and set current limiting. Check driver cooling.
3. Exercise the servo at neutral without a mechanical load, then establish non-binding endpoints.
4. Install a home switch and confirm its stop behavior before automatic stepper scanning. The current driver interface is dry-run only; home-switch pin selection follows the final camera pin map.
5. Measure azimuth steps per degree including gearing and microstepping; verify direction signs.
6. Set cable-safe travel limits. The simulator uses ±160° azimuth and −15° to +55° pitch as demonstration limits, not physical specifications.
7. Implement the physical MotorInterface using deterministic step timing and validated PWM. Stop on stale camera data, lost communication, unhomed state or operator stop.
8. Start with a stationary or hand-moved target before considering flight.

The shipped `DryRunMotors` records bounded angle requests and never imports GPIO libraries. Physical actuation is deliberately not represented as complete.

## Manufacturer references

- [Pololu DRV8825 carrier](https://www.pololu.com/product/2133/)
- [Raspberry Pi hardware documentation](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html)
- [TowerPro MG90S](https://towerpro.com.tw/product/mg90s-3/)
- [Arducam SPI camera documentation](https://docs.arducam.com/Arduino-SPI-camera/Legacy-SPI-camera/FAQ/)
