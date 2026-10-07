"""Pixel-error controller and non-actuating motor boundary for bench integration."""
from dataclasses import dataclass
from typing import Protocol
import math

def clamp(value, low, high):
    return max(low, min(high, value))

class MotorInterface(Protocol):
    def move_to(self, pan_deg: float, tilt_deg: float) -> None: ...
    def stop(self) -> None: ...

class DryRunMotors:
    """Records commands only. No GPIO is imported or powered."""
    def __init__(self):
        self.commands = []
        self.stopped = True

    def move_to(self, pan_deg, tilt_deg):
        if not all(math.isfinite(v) for v in (pan_deg, tilt_deg)):
            raise ValueError("Angles must be finite.")
        self.commands.append((clamp(pan_deg, -160, 160), clamp(tilt_deg, -15, 55)))
        self.stopped = False

    def stop(self):
        self.stopped = True

@dataclass
class PixelController:
    pan: float = 0
    tilt: float = 8

    def update(self, box, dt, age_seconds=0):
        if box is None or age_seconds > .4:
            return None
        if len(box) != 4 or not all(math.isfinite(v) for v in box):
            raise ValueError("Expected finite normalized xywh.")
        x, y, w, h = box
        if min(x, y, w, h) < 0 or w == 0 or h == 0 or x + w > 1.001 or y + h > 1.001:
            raise ValueError("Box must lie inside the frame.")
        dt = clamp(dt, 0, .15)
        ex, ey = x + w / 2 - .5, y + h / 2 - .5
        hfov = math.degrees(2 * math.atan(math.tan(math.radians(55 / 2)) * 16 / 9))
        self.pan = clamp(self.pan + clamp(ex * hfov * 2.4 if abs(ex) > .025 else 0, -42, 42) * dt, -160, 160)
        self.tilt = clamp(self.tilt + clamp(-ey * 55 * 2.4 if abs(ey) > .025 else 0, -30, 30) * dt, -15, 55)
        return self.pan, self.tilt
