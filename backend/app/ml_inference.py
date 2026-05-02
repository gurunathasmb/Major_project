# Heavy imports moved inside functions for memory efficiency
import os
import pandas as pd
from huggingface_hub import hf_hub_download
from dotenv import load_dotenv

load_dotenv()

# ==================================================
# GLOBAL CONFIG
# ==================================================
IMG_SIZE_19 = 256     # For Segmentation + 19 landmark regression
IMG_SIZE_11 = 320     # For 11 landmark heatmap model
NUM_LANDMARKS = 19

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "downloaded_models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ==================================================
# MODEL PATHS
# ==================================================
SEG_MODEL_PATH = hf_hub_download(
    repo_id="gurunathasmb/cepha-models",
    filename="segmentation_model.h5",
    local_dir=MODEL_DIR
)

REG_MODEL_PATH = hf_hub_download(
    repo_id="gurunathasmb/cepha-models",
    filename="landmark_regressor.h5",
    local_dir=MODEL_DIR
)

HM11_PATH = hf_hub_download(
    repo_id="gurunathasmb/cepha-models",
    filename="ceph_heatmap_model.h5",
    local_dir=MODEL_DIR
)

# 🔥 NEW 19 LANDMARK HEATMAP MODEL (FOR CLOUD)
HM19_PATH = hf_hub_download(
    repo_id="gurunathasmb/cepha-models",
    filename="ceph_19_heatmap_model.h5",
    local_dir=MODEL_DIR
)

_seg_model = None
_reg_model = None
_hm11_model = None
_hm19_model = None

# ==================================================
# LOAD MODELS
# ==================================================
def load_seg_model():
    global _seg_model
    if _seg_model is None:
        import tensorflow as tf
        print("DEBUG: Loading Segmentation Model...")
        _seg_model = tf.keras.models.load_model(SEG_MODEL_PATH, compile=False)
    return _seg_model

def load_reg_model():
    global _reg_model
    if _reg_model is None:
        import tensorflow as tf
        print("DEBUG: Loading Regressor Model...")
        _reg_model = tf.keras.models.load_model(REG_MODEL_PATH, compile=False)
    return _reg_model

def load_hm11_model():
    global _hm11_model
    if _hm11_model is None:
        import tensorflow as tf
        print("DEBUG: Loading Heatmap Model...")
        _hm11_model = tf.keras.models.load_model(HM11_PATH, compile=False)
    return _hm11_model

def load_hm19_model():
    global _hm19_model
    if _hm19_model is None:
        import tensorflow as tf
        print("DEBUG: Loading 19-Landmark Heatmap Model (Cloud Optimized)...")
        _hm19_model = tf.keras.models.load_model(HM19_PATH, compile=False)
    return _hm19_model

def clear_all_models():
    """Clear models from memory if needed (useful for low-memory environments)"""
    global _seg_model, _reg_model, _hm11_model, _hm19_model
    _seg_model = None
    _reg_model = None
    _hm11_model = None
    _hm19_model = None
    try:
        import tensorflow as tf
        tf.keras.backend.clear_session()
    except:
        pass


# ==================================================
# PREPROCESS FOR 19 LANDMARK MODEL (256)
# ==================================================
def preprocess_19(image_bytes):
    from PIL import Image
    import io
    import numpy as np
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img = img.resize((IMG_SIZE_19, IMG_SIZE_19))
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr.reshape(1, IMG_SIZE_19, IMG_SIZE_19, 1)


# ==================================================
# PREPROCESS FOR 11 HEATMAP MODEL (320)
# ==================================================
def preprocess_11(image_bytes):
    from PIL import Image
    import io
    import numpy as np
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img = img.resize((IMG_SIZE_11, IMG_SIZE_11))
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr.reshape(1, IMG_SIZE_11, IMG_SIZE_11, 1)


# ==================================================
# CORE 11 LANDMARK NAMES
# ==================================================
CORE_11 = [
    "P1","P2","P5","P6","P8",
    "P9","P10","P20","P21","P22","P23"
]


# ==================================================
# HEATMAP TO COORDS (320)
# ==================================================
def heatmap_to_coords(hm):
    import numpy as np
    coords = []
    for i in range(hm.shape[-1]):
        y, x = np.unravel_index(np.argmax(hm[..., i]), (IMG_SIZE_11, IMG_SIZE_11))
        coords.append((x / IMG_SIZE_11, y / IMG_SIZE_11))
    return coords


# ==================================================
# PREDICT 19 LANDMARKS (256)
# ==================================================
def predict_landmarks_19(image_bytes):
    # ==================================================
    # GLOBAL MODE (Memory Efficient 19-LM Heatmap)
    # ==================================================
    if os.getenv("STORAGE_MODE") == "s3":
        import numpy as np
        hm19 = load_hm19_model()
        x = preprocess_11(image_bytes) # Uses 320 size
        hm_pred = hm19.predict(x, verbose=0)[0]
        
        coords = []
        for i in range(NUM_LANDMARKS):
            y, xv = np.unravel_index(np.argmax(hm_pred[..., i]), (IMG_SIZE_11, IMG_SIZE_11))
            coords.append({
                "name": f"P{i+1}",
                "x": float(xv / IMG_SIZE_11),
                "y": float(y / IMG_SIZE_11)
            })
        return coords

    # ==================================================
    # LOCAL MODE (High Accuracy 1.3GB Regressor)
    # ==================================================
    seg_model = load_seg_model()
    reg_model = load_reg_model()
    x = preprocess_19(image_bytes)

    mask = seg_model.predict(x, verbose=0)
    x_masked = x * mask

    preds = reg_model.predict(x_masked, verbose=0)[0]

    landmarks = []
    for i in range(NUM_LANDMARKS):
        landmarks.append({
            "name": f"P{i+1}",
            "x": float(preds[2*i]),
            "y": float(preds[2*i+1])
        })
    return landmarks


# ==================================================
# REFINE CORE 11 (320)
# ==================================================
def refine_core_11(image_bytes, landmarks):
    hm11 = load_hm11_model()
    x = preprocess_11(image_bytes)

    hm_pred = hm11.predict(x, verbose=0)[0]
    coords11 = heatmap_to_coords(hm_pred)

    name_map = {p["name"]: p for p in landmarks}

    for name, (xv, yv) in zip(CORE_11, coords11):
        name_map[name] = {
            "name": name,
            "x": float(xv),
            "y": float(yv)
        }

    return list(name_map.values())


# ==================================================
# ANGLE CALCULATION
# ==================================================

def angle(v1, v2):
    import numpy as np
    """
    Returns acute angle between two lines (0–90°)
    Direction ignored (clinical angle)
    """
    denom = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-9
    cos_theta = np.dot(v1, v2) / denom
    cos_theta = np.clip(cos_theta, -1.0, 1.0)

    theta = np.degrees(np.arccos(cos_theta))

    # Ensure acute angle
    if theta > 90:
        theta = 180 - theta

    return theta
def full_angle(v1, v2):
    import numpy as np
    denom = (np.linalg.norm(v1) * np.linalg.norm(v2)) + 1e-9
    cos_theta = np.dot(v1, v2) / denom
    cos_theta = np.clip(cos_theta, -1.0, 1.0)

    theta = np.degrees(np.arccos(cos_theta))

    return theta   # NO conversion

def compute_angles(landmarks, image_bytes):
    from PIL import Image
    import io
    import numpy as np
    """
    Computes cephalometric angles in pixel space to account for image aspect ratio.
    Aligns with frontend live telemetry.
    """
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    # Convert normalized -> pixel coords for accurate angle calculation
    P = {}
    for p in landmarks:
        P[p["name"]] = np.array([float(p["x"]) * w, float(p["y"]) * h])

    try:
        # Lines
        SN = P["P1"] - P["P2"]       # N -> S
        NA = P["P5"] - P["P2"]       # N -> A
        NB = P["P6"] - P["P2"]       # N -> B
        GoGn = P["P9"] - P["P10"]    # Go -> Gn

        # Skeletal angles (using acute angle 0-90 where appropriate)
        SNA = angle(NA, SN)
        SNB = angle(NB, SN)
        ANB = SNA - SNB
        
        # SN to GoGn: use angle() for acute 0-90 consistency with frontend getLineAngle
        SN_GoGn = angle(SN, GoGn)

        # YEN angle: interior angle (0-180) at vertex M (P22)
        YEN = full_angle(
            P["P1"] - P["P22"],  # M -> S
            P["P23"] - P["P22"]  # M -> G
        )

        return {
            "SNA": float(SNA),
            "SNB": float(SNB),
            "ANB": float(ANB),
            "SN_GoGn": float(SN_GoGn),
            "YEN": float(YEN)
        }

    except Exception as e:
        print("Angle computation error:", e)
        return {}

# ==================================================
# AIRWAY
# ==================================================
def compute_airway(landmarks, image_bytes):
    from PIL import Image
    import io
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    # Convert normalized → pixel
    P = {}
    for p in landmarks:
        if p["x"] is None or p["y"] is None:
            continue

        if np.isnan(p["x"]) or np.isnan(p["y"]):
            continue

        px = float(p["x"]) * w
        py = float(p["y"]) * h

        P[p["name"]] = np.array([px, py])

    # ✅ check existence
    if "P20" not in P or "P21" not in P:
        print("Missing P20/P21")
        return {"upper_airway": None}

    p20 = P["P20"]
    p21 = P["P21"]

    # ✅ compute pixel distance
    upper_px = np.linalg.norm(p20 - p21)

    if upper_px < 1:
        print("Too small airway distance")
        return {"upper_airway": None}

    # ✅ dynamic scaling (stable)
    if "P1" in P and "P2" in P:
        sn_px = np.linalg.norm(P["P2"] - P["P1"])
        if sn_px > 10:   # avoid tiny values
            scale = 65.0 / sn_px
        else:
            scale = 0.1
    else:
        scale = 0.1

    upper_mm = upper_px * scale

    return {
        "upper_airway": float(round(upper_mm, 2))
    }
def classify_airway(mm):
    if mm is None:
        return "Unknown"

    elif mm < 10:
        return "Narrow Airway"

    elif mm < 15:
        return "Moderate Airway"

    elif mm <= 25:
        return "Normal Airway"

    else:
        return "Wide Airway"
# ==================================================
# CLINICAL CLASSIFICATION (UNCHANGED)
# ==================================================
def clinical_classify(angles):
    SNA = angles.get("SNA")
    SNB = angles.get("SNB")
    ANB = angles.get("ANB")
    YEN = angles.get("YEN")
    SN_GoGn = angles.get("SN_GoGn")

    if ANB is None:
        skeletal = "Unknown"
    elif YEN < 117:
        skeletal = "Class III"
    elif YEN > 123:
        skeletal = "Class II"
    else:
        skeletal = "Class I"

    if SNA is None:
        maxilla = "Unknown"
    elif SNA > 84:
        maxilla = "Prognathic Maxilla"
    elif SNA < 80:
        maxilla = "Retrognathic Maxilla"
    else:
        maxilla = "Normal Maxilla"

    if SNB is None:
        mandible = "Unknown"
    elif SNB > 82:
        mandible = "Prognathic Mandible"
    elif SNB < 78:
        mandible = "Retrognathic Mandible"
    else:
        mandible = "Normal Mandible"

    if  SN_GoGn is None:
        divergence = "Unknown"
    elif SN_GoGn > 36:
        divergence = "Hyperdivergent"
    elif SN_GoGn < 28:
        divergence = "Hypodivergent"
    else:
        divergence = "Normodivergent"

    return {
        "skeletal_class": skeletal,
        "maxilla_status": maxilla,
        "mandible_status": mandible,
        "divergence_status": divergence
    }


# ==================================================
# DRAW + SAVE IMAGE
# ==================================================
def save_labeled_image(image_bytes, landmarks, path, angles=None):
    from PIL import Image, ImageDraw, ImageFont
    import io

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    draw = ImageDraw.Draw(img)

    # Softer scaling (smaller than before)
    r = max(1, int(min(w, h) * 0.004))   # smaller landmark
    lw = max(1, int(min(w, h) * 0.003))  # thinner lines
    fs = max(8, int(min(w, h) * 0.015))  # smaller font

    try:
        font = ImageFont.truetype("arial.ttf", fs)
    except:
        font = ImageFont.load_default()

    def pt(p):
        return int(p["x"] * w), int(p["y"] * h)

    L = {p["name"]: pt(p) for p in landmarks}

    # ===============================
    # DRAW LANDMARK POINTS
    # ===============================
    for p in landmarks:
        x, y = pt(p)

        # small white outline
        draw.ellipse((x-r-1, y-r-1, x+r+1, y+r+1), fill="white")
        draw.ellipse((x-r, y-r, x+r, y+r), fill="red")

        draw.text((x + r + 2, y - r - 2), p["name"],
                  fill="yellow", font=font)

    # ===============================
    # DRAW LINES
    # ===============================
    def draw_line(a, b, color):
        if a in L and b in L:
            draw.line((L[a], L[b]), fill=color, width=lw)

    draw_line("P1", "P2", "#22c55e")    # SN
    draw_line("P2", "P5", "#3b82f6")    # NA
    draw_line("P2", "P6", "#ef4444")    # NB
    draw_line("P10", "P9", "#f59e0b")   # Mandibular plane
    draw_line("P20", "P21", "#2dc225")  # Airway ref

    # YEN triangle
    draw_line("P1", "P22", "cyan")
    draw_line("P22", "P23", "cyan")
    draw_line("P1", "P23", "cyan")

    # ===============================
    # ANGLE TEXT
    # ===============================
    if angles is not None:

        def write_angle(text, landmark):
            if landmark in L:
                x, y = L[landmark]
                draw.text((x + 6, y + 6), text,
                          fill="white", font=font)

        if "SNA" in angles:
            write_angle(f"SNA: {angles['SNA']:.1f}°", "P2")

        if "SNB" in angles:
            write_angle(f"SNB: {angles['SNB']:.1f}°", "P2")

        if "ANB" in angles:
            write_angle(f"ANB: {angles['ANB']:.1f}°", "P2")

        if "SN_GoGn" in angles:
            write_angle(f"SN-GoGn: {angles['SN_GoGn']:.1f}°", "P10")

        if "YEN" in angles:
            write_angle(f"YEN: {angles['YEN']:.1f}°", "P22")

    img.save(path, quality=95)
    return path
# ==================================================
# CLINICAL PIPELINE
# ==================================================
def predict_clinical_landmarks_only(image_bytes, ceph_id):
    hm11 = load_hm11_model()
    x = preprocess_11(image_bytes)

    hm_pred = hm11.predict(x, verbose=0)[0]
    coords11 = heatmap_to_coords(hm_pred)

    landmarks = []
    for name, (xv, yv) in zip(CORE_11, coords11):
        landmarks.append({
            "name": name,
            "x": float(xv),
            "y": float(yv)
        })

    os.makedirs("outputs", exist_ok=True)
    preview_path = f"outputs/ceph_{ceph_id}_clinical_preview.jpg"

    save_labeled_image(image_bytes, landmarks, preview_path)

    return {
        "landmarks": landmarks,
        "preview_image": preview_path
    }

def process_clinical_finalize(image_bytes, ceph_id, edited_landmarks):

    angles = compute_angles(edited_landmarks, image_bytes)
    clinical_results = clinical_classify(angles)
    airway = compute_airway(edited_landmarks, image_bytes)
    airway_class = classify_airway(airway["upper_airway"])

    os.makedirs("outputs", exist_ok=True)

    img_path = f"outputs/ceph_{ceph_id}_clinical.jpg"
    save_labeled_image(image_bytes, edited_landmarks, img_path, angles)

    excel_path = f"outputs/ceph_{ceph_id}_clinical.xlsx"
    pd.DataFrame(edited_landmarks).to_excel(excel_path, index=False)

    return {
        "landmarks": edited_landmarks,
        "angles": angles,
        "mode_used": "clinical",
        "skeletal_class": clinical_results["skeletal_class"],
        "maxilla_status": clinical_results["maxilla_status"],
        "mandible_status": clinical_results["mandible_status"],
        "divergence_status": clinical_results["divergence_status"],
        "airway": airway,
        "airway_class": airway_class,
        "output_image": img_path,
        "excel_file": excel_path
    }
# ==================================================
# ML STAGE 1
# ==================================================
def predict_landmarks_only(image_bytes, ceph_id):

    landmarks19 = predict_landmarks_19(image_bytes)
    landmarks = refine_core_11(image_bytes, landmarks19)

    os.makedirs("outputs", exist_ok=True)

    preview_path = f"outputs/ceph_{ceph_id}_preview.jpg"
    save_labeled_image(image_bytes, landmarks, preview_path)

    return {
        "landmarks": landmarks,
        "preview_image": preview_path
    }


# ==================================================
# ML FINAL (AFTER MANUAL EDIT)
# ==================================================
def process_ml_finalize(image_bytes, ceph_id, landmarks):

    angles = compute_angles(landmarks, image_bytes)
    clinical_results = clinical_classify(angles)
    airway = compute_airway(landmarks, image_bytes)
    airway_class = classify_airway(airway["upper_airway"])
    os.makedirs("outputs", exist_ok=True)

    img_path = f"outputs/ceph_{ceph_id}_ml.jpg"
    save_labeled_image(image_bytes, landmarks, img_path, angles)

    excel_path = f"outputs/ceph_{ceph_id}_ml.xlsx"
    df = pd.DataFrame(landmarks)
    df["angle_SNA"] = angles.get("SNA", 0)
    df["angle_SNB"] = angles.get("SNB", 0)
    df["angle_ANB"] = angles.get("ANB", 0)
    df["angle_SN_GoGn"] = angles.get("SN_GoGn", 0)
    df["angle_YEN"] = angles.get("YEN", 0)
    df["upper_airway"] = airway.get("upper_airway", 0)
    df["airway_class"] = airway_class
    df.to_excel(excel_path, index=False)

    return {
        "landmarks": landmarks,
        "angles": angles,
        "mode_used": "ml",
        "skeletal_class": clinical_results["skeletal_class"],
        "maxilla_status": clinical_results["maxilla_status"],
        "mandible_status": clinical_results["mandible_status"],
        "divergence_status": clinical_results["divergence_status"],
        "airway": airway,
        "airway_class": airway_class,
        "output_image": img_path,
        "excel_file": excel_path
    }