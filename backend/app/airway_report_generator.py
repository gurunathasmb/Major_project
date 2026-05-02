import os
import qrcode
import io

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image,
    Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4


# =========================
# UI COLORS
# =========================
header_bg_color = colors.HexColor("#e0ecff")
primary_color = colors.HexColor("#1e40af")
soft_bg = colors.HexColor("#f8fafc")
highlight_bg = colors.HexColor("#ecfdf5")
note_bg = colors.HexColor("#fefce8")


def generate_airway_report(
    patient_id,
    metrics,
    image_path,  # This could be a screenshot of the 3D viewer or a slice
    save_path
):

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(save_path, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # =========================
    # STYLES
    # =========================
    title_style = ParagraphStyle(
        name="Title",
        parent=styles["Heading1"],
        fontSize=16,
        alignment=1,
        textColor=colors.HexColor("#0f172a")
    )

    subtitle_style = ParagraphStyle(
        name="Subtitle",
        parent=styles["Normal"],
        fontSize=10,
        alignment=1,
        textColor=colors.grey
    )

    section_style = ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=primary_color,
        spaceAfter=6
    )

    normal_style = ParagraphStyle(
        name="NormalCustom",
        parent=styles["Normal"],
        fontSize=10,
        spaceAfter=4
    )

    highlight_style = ParagraphStyle(
        name="Highlight",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#059669"),
        spaceAfter=4
    )

    # =========================
    # HEADER
    # =========================
    def header():
        logo = ""
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=1.0*inch, height=1.0*inch)

        header_text = [
            Paragraph("<b>Dayananda Sagar College of Dental Sciences</b>", title_style),
            Paragraph("Department of Orthodontics", subtitle_style),
            Paragraph("<b>CephAI 3D Airway Analysis Report</b>", subtitle_style),
        ]

        table = Table([[logo, header_text]], colWidths=[1.2*inch, 4.8*inch])

        table.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("BACKGROUND", (0,0), (-1,-1), header_bg_color),
            ("BOX", (0,0), (-1,-1), 1.2, primary_color),
        ]))

        return table

    # =========================
    # PAGE 1
    # =========================
    page1 = []

    page1.append(header())
    page1.append(Spacer(1, 0.1*inch))
    page1.append(HRFlowable(width="100%", thickness=1))

    # Patient Info
    page1.append(Spacer(1, 0.15*inch))
    page1.append(Paragraph("Patient Information", section_style))

    patient_data = [
        ["Patient ID", patient_id],
        ["Analysis Type", "3D Airway Segmentation"],
        ["Scan Modality", "CBCT / CT (NRRD/DICOM)"],
    ]

    t = Table(patient_data, colWidths=[2.5*inch, 3*inch])
    t.setStyle(TableStyle([
        ("GRID", (0,0), (-1,-1), 0.3, colors.grey),
        ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
        ("BACKGROUND", (0,0), (-1,-1), soft_bg),
        ("BOX", (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
    ]))
    page1.append(t)

    # Airway Metrics
    if metrics:
        page1.append(Spacer(1, 0.15*inch))
        page1.append(Paragraph("3D Airway Metrics", section_style))

        data = [
            ["Metric", "Value"],
            ["Total Volume", f"{metrics.get('volume_cm3', 'N/A')} cm³"],
            ["Average Area", f"{metrics.get('area_mm2', 'N/A')} mm²"],
            ["Upper Airway Width", f"{metrics.get('upper_width_mm', 'N/A')} mm"],
            ["Lower Airway Width", f"{metrics.get('lower_width_mm', 'N/A')} mm"]
        ]

        t2 = Table(data, colWidths=[3*inch, 2*inch])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), primary_color),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID", (0,0), (-1,-1), 0.3, colors.grey),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.whitesmoke, colors.lightgrey]),
            ("ALIGN", (1,1), (-1,-1), "CENTER"),
        ]))
        page1.append(t2)

        airway_class = metrics.get('airway_class', 'Normal')
        page1.append(Spacer(1, 0.1*inch))
        page1.append(Paragraph(
            f"Airway Classification: <b>{airway_class}</b>",
            highlight_style
        ))

        # Interpretation
        page1.append(Spacer(1, 0.2*inch))
        page1.append(Paragraph("Clinical Interpretation", section_style))

        short_text = f"""
        3D Airway analysis indicates a total volume of <b>{metrics.get('volume_cm3', 'N/A')} cm³</b>.
        The overall airway classification is <b>{airway_class}</b>.
        Please review the 3D rendering for anatomical constraints.
        """

        interpret_box = Table([[Paragraph(short_text, normal_style)]], colWidths=[5.5*inch])
        interpret_box.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), highlight_bg),
            ("BOX", (0,0), (-1,-1), 1, colors.green),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
        ]))
        page1.append(interpret_box)

    elements.append(KeepTogether(page1))

    # =========================
    # PAGE 2
    # =========================
    elements.append(PageBreak())

    elements.append(header())
    elements.append(Spacer(1, 0.1*inch))
    elements.append(HRFlowable(width="100%", thickness=1))

    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("3D Airway Visualization", section_style))

    if image_path and os.path.exists(image_path):
        img = Image(image_path)
        img.drawHeight = 5.0 * inch
        img.drawWidth = 5.0 * inch

        img_frame = Table([[img]])
        img_frame.setStyle(TableStyle([
            ("BOX", (0,0), (-1,-1), 1, colors.grey)
        ]))

        elements.append(img_frame)

    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "Figure: 3D Airway Model.",
        subtitle_style
    ))

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Doctor Notes", section_style))

    notes_box = Table([[Paragraph(
        "This AI-generated 3D airway report supports orthodontic and surgical diagnosis. "
        "Final clinical decisions must be made by a licensed professional.",
        normal_style
    )]], colWidths=[5.5*inch])

    notes_box.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), note_bg),
        ("BOX", (0,0), (-1,-1), 1, colors.orange),
    ]))

    elements.append(notes_box)
    elements.append(PageBreak())

    elements.append(header())
    # =========================
    # QR CODE
    # =========================
    try:
        qr_data = f"http://localhost:3000/patient-history/{patient_id}"

        qr = qrcode.make(qr_data)

        qr_buffer = io.BytesIO()
        qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)

        qr_img = Image(qr_buffer)
        qr_img.drawHeight = 1.5 * inch
        qr_img.drawWidth = 1.5 * inch

        qr_table = Table([
            [qr_img, Paragraph(
                f"Scan to view full patient history<br/>{qr_data}",
                subtitle_style
            )]
        ], colWidths=[1.7*inch, 3.8*inch])

        qr_table.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("BOX", (0,0), (-1,-1), 1, colors.grey),
            ("BACKGROUND", (0,0), (-1,-1), colors.whitesmoke),
        ]))

        elements.append(Spacer(1, 0.3*inch))
        elements.append(qr_table)

    except Exception as e:
        print("QR generation failed:", e)

    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph("Signature: ____________________", normal_style))
    elements.append(Paragraph("Date: ____________________", normal_style))

    # =========================
    # BUILD
    # =========================
    doc.build(elements)
