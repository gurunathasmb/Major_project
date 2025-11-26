"""
ceph_report.py
Generate a polished PDF cephalometric report from:
 - original image (numpy array or path)
 - detected landmarks (dict: idx -> (x_pixel, y_pixel))  -- x = row, y = col as used earlier
 - angles (dict of angle_name -> degrees)
 - interpretations (dict of measurement_name -> diagnosis)
 - optional heatmaps (torch tensor / numpy array) shaped (1, channels, H, W) or (channels, H, W)
Produces a PDF saved to output_path.
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import tempfile
import os
import io
from datetime import datetime

# --- Helpers ---------------------------------------------------------------

def ensure_rgb_array(img):
    """Accept PIL Image, file path, or numpy array; return RGB uint8 numpy array."""
    if isinstance(img, str):
        img = Image.open(img).convert("RGB")
        return np.array(img)
    if isinstance(img, Image.Image):
        return np.array(img.convert("RGB"))
    arr = np.array(img)
    if arr.ndim == 2:
        arr = np.stack([arr]*3, axis=-1)
    if arr.shape[2] == 4:
        arr = arr[:, :, :3]
    return arr.astype(np.uint8)

def annotate_image_numpy(img_np, landmarks, circlesize=6, color=(255,0,0), show_index=True, font_path=None):
    """Return a PIL image with landmarks drawn.
    landmarks: dict idx -> (x, y) in pixel coords (row, col). We draw at (y,x).
    """
    pil = Image.fromarray(img_np).convert("RGB")
    draw = ImageDraw.Draw(pil)
    w,h = pil.size
    # choose colors per landmark for variety
    cmap = [
        (255,0,0),(0,255,0),(0,0,255),(255,165,0),(128,0,128),(0,255,255),
        (255,192,203),(165,42,42),(34,139,34),(75,0,130),(255,215,0)
    ]
    try:
        font = ImageFont.truetype(font_path or "DejaVuSans-Bold.ttf", 14)
    except Exception:
        font = ImageFont.load_default()

    for i, (k,(xr, yc)) in enumerate(landmarks.items()):
        # xr = x row (vertical), yc = y col (horizontal)
        x = int(yc); y = int(xr)  # PIL coordinate (x,y)
        col = cmap[i % len(cmap)]
        # circle
        r = circlesize
        draw.ellipse((x-r, y-r, x+r, y+r), fill=col, outline=(0,0,0))
        if show_index:
            draw.text((x+r+2, y-r-2), str(k+1), fill=(0,0,0), font=font)
    return pil

def heatmap_to_thumbnail_grid(heatmaps, ncols=5, thumb_size=(160,120)):
    """
    heatmaps: numpy array shaped (C,H,W) or (1,C,H,W) or torch tensor.
    Returns PIL image grid of thumbnails (colormap applied).
    """
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    if hasattr(heatmaps, "cpu"):
        heatmaps = heatmaps.detach().cpu().numpy()
    heatmaps = np.array(heatmaps)
    if heatmaps.ndim == 4 and heatmaps.shape[0] == 1:
        heatmaps = heatmaps[0]
    C = heatmaps.shape[0]
    nrows = (C + ncols - 1) // ncols
    thumbs = []
    for i in range(C):
        hm = heatmaps[i]
        # normalize
        mmin, mmax = hm.min(), hm.max()
        if mmax > mmin:
            nm = (hm - mmin) / (mmax - mmin + 1e-9)
        else:
            nm = np.zeros_like(hm)
        # convert to colored image via plt.cm
        fig = plt.figure(figsize=(thumb_size[0]/80, thumb_size[1]/80), dpi=80)
        ax = fig.add_axes([0,0,1,1])
        ax.imshow(nm, cmap='viridis')
        ax.axis('off')
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        thumb = Image.open(buf).convert('RGB').resize(thumb_size)
        thumbs.append(thumb)
    # fill remaining slots
    while len(thumbs) < nrows*ncols:
        thumbs.append(Image.new('RGB', thumb_size, color=(240,240,240)))
    # compose grid
    grid_w = ncols * thumb_size[0]
    grid_h = nrows * thumb_size[1]
    grid = Image.new('RGB', (grid_w, grid_h), (255,255,255))
    for idx,t in enumerate(thumbs):
        r = idx // ncols
        c = idx % ncols
        grid.paste(t, (c*thumb_size[0], r*thumb_size[1]))
    return grid

# --- PDF generation -------------------------------------------------------

def generate_ceph_pdf(
    image,                     # numpy array or path or PIL
    landmarks,                 # dict idx -> (x_row, y_col) pixel coords (0-indexed)
    angles,                    # dict angle_name -> float
    interpretations,           # dict measurement_name -> string
    output_path,               # where to save PDF
    patient_name=None,
    patient_id=None,
    heatmaps=None,             # optional: heatmaps tensor or array (C,H,W) or (1,C,H,W)
    notes=None
):
    # sanitize image
    img_np = ensure_rgb_array(image)
    # annotate
    ann_pil = annotate_image_numpy(img_np, landmarks, circlesize=max(4, int(min(img_np.shape[:2]) * 0.01)))
    # create thumbnails
    heatmap_grid = None
    if heatmaps is not None:
        try:
            heatmap_grid = heatmap_to_thumbnail_grid(heatmaps, ncols=5, thumb_size=(160,120))
        except Exception as e:
            heatmap_grid = None

    # Temporary saved images
    tmpdir = tempfile.mkdtemp(prefix="ceph_pdf_")
    ann_path = os.path.join(tmpdir, "annotated.png")
    ann_pil.save(ann_path, format="PNG")

    if heatmap_grid is not None:
        heatmap_path = os.path.join(tmpdir, "heatmaps.png")
        heatmap_grid.save(heatmap_path, format="PNG")
    else:
        heatmap_path = None

    # PDF layout using ReportLab
    # Use landscape A4 for wide cephalograms
    pagesize = landscape(A4)
    c = canvas.Canvas(output_path, pagesize=pagesize)
    W, H = pagesize

    # Header
    title = "Cephalometric Analysis Report"
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W/2, H - 50, title)
    c.setFont("Helvetica", 10)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.drawRightString(W - 40, H - 40, f"Generated: {ts}")

    # Patient info block
    y = H - 80
    left_x = 40
    if patient_name or patient_id:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(left_x, y, "Patient:")
        c.setFont("Helvetica", 11)
        if patient_name:
            c.drawString(left_x + 70, y, str(patient_name))
        if patient_id:
            c.drawString(left_x + 300, y, f"ID: {patient_id}")
        y -= 20

    # Annotated image placement (left area)
    img_reader = ImageReader(ann_path)
    # compute max box for image
    img_box_w = W * 0.5 - 80
    img_box_h = H * 0.75
    # preserve aspect
    pil_w, pil_h = ann_pil.size
    scale = min(img_box_w / pil_w, img_box_h / pil_h)
    draw_w, draw_h = pil_w * scale, pil_h * scale
    img_x = left_x
    img_y = y - draw_h - 10
    c.drawImage(img_reader, img_x, img_y, width=draw_w, height=draw_h)

    # Right column: angles table + interpretations
    col_x = left_x + img_box_w + 40
    col_y = H - 120

    styles = getSampleStyleSheet()
    # Angles table
    c.setFont("Helvetica-Bold", 12)
    c.drawString(col_x, col_y, "Angular Measurements")
    col_y -= 18

    # Compose angles table data
    angle_items = list(angles.items())
    if len(angle_items) == 0:
        angle_table_data = [["(no angles)", ""]]
    else:
        angle_table_data = [["Measurement", "Degrees"]]
        for k,v in angle_items:
            angle_table_data.append([str(k), f"{float(v):.2f}"])

    table = Table(angle_table_data, colWidths=[140, 60])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f0f0f0")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONT', (0,0), (-1,-1), 'Helvetica', 10),
        ('ALIGN', (1,1), (-1,-1), 'RIGHT'),
    ]))
    # draw table onto canvas
    tw, th = table.wrapOn(c, 300, 400)
    table.drawOn(c, col_x, col_y - th)
    col_y = col_y - th - 12

    # Interpretations
    c.setFont("Helvetica-Bold", 12)
    c.drawString(col_x, col_y, "Interpretation / Diagnosis")
    col_y -= 16
    c.setFont("Helvetica", 10)
    for k,v in interpretations.items():
        # wrap text if long
        para = Paragraph(f"<b>{k}:</b> {v}", styles['Normal'])
        w, h_para = para.wrap(260, 200)
        para.drawOn(c, col_x, col_y - h_para)
        col_y -= h_para + 6

    # Optional heatmaps below right column (if present)
    if heatmap_path:
        # place heatmap thumbnails centered under interpretations
        hm_reader = ImageReader(heatmap_path)
        hm_w = 320
        hm_h = 160
        hm_x = col_x
        hm_y = img_y
        c.drawImage(hm_reader, hm_x, hm_y, width=hm_w, height=hm_h)

    # Footer: small table summary and notes
    footer_y = 40
    c.setFont("Helvetica", 9)
    c.drawString(left_x, footer_y+20, f"Report generated by CephaAI")
    if notes:
        c.drawString(left_x + 200, footer_y+20, f"Notes: {notes}")
    c.drawRightString(W - 40, footer_y+20, f"Total landmarks: {len(landmarks)}")

    c.showPage()
    c.save()

    # cleanup temp dir
    try:
        for f in os.listdir(tmpdir):
            os.remove(os.path.join(tmpdir, f))
        os.rmdir(tmpdir)
    except Exception:
        pass

    return output_path
