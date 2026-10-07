import base64
import io
import pytest
from PIL import Image
from backend.server import decode_image, health
from backend.control import DryRunMotors, PixelController

def test_image_decode_and_invalid_input():
    stream=io.BytesIO()
    Image.new('RGB',(32,18)).save(stream,format='JPEG')
    image=decode_image('data:image/jpeg;base64,'+base64.b64encode(stream.getvalue()).decode())
    assert image.size==(32,18)
    for bad in ['bad', 'data:image/jpeg;base64,%%%','data:image/jpeg;base64,AA==',None]:
        with pytest.raises(ValueError):
            decode_image(bad)

def test_stale_frame_does_not_command_motors():
    c=PixelController()
    assert c.update([.7,.2,.1,.1],.1,age_seconds=.5) is None
    assert c.pan==0
    assert c.update(None,.1) is None

def test_controller_direction_and_limits():
    c=PixelController()
    for _ in range(1000): c.update([.8,0,.1,.1],.1)
    assert c.pan==160 and c.tilt==55
    with pytest.raises(ValueError): c.update([float('nan'),0,.1,.1],.1)

def test_dry_run_never_actuates():
    m=DryRunMotors()
    m.move_to(999,-999)
    assert m.commands==[(160,-15)]
    m.stop()
    assert m.stopped

def test_missing_model_is_explicit():
    result=health()
    if not result['model_ready']:
        assert result['detail']
