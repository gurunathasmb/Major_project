import tensorflow as tf
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import os

# --- MODEL CONFIG ---
MODEL_PATH = os.getenv("MODEL_PATH", "ceph_landmark_model.h5")
_model = None


# --- MODEL LOADING ---
def load_model():
    """Load Keras model once and reuse for all predictions."""
    print(f"✅ Loading model from {MODEL_PATH}")
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("✅ Model loaded successfully!")
        return model
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise


def get_model():
    """Return cached model instance (singleton)."""
    global _model
    if _model is None:
        _model = load_model()
    return _model
import pandas as pd

def save_excel(landmarks, ceph_id, output_dir="outputs"):
    os.makedirs(output_dir, exist_ok=True)

    df = pd.DataFrame(landmarks)
    excel_path = os.path.join(output_dir, f"ceph_{ceph_id}_landmarks.xlsx")
    df.to_excel(excel_path, index=False)

    print(f"📄 Saved Excel file: {excel_path}")
    return f"http://localhost:8000/{excel_path}"


# --- IMAGE PREPROCESSING ---
def preprocess_image(image_bytes):
    """Convert uploaded image bytes to normalized NumPy array for model input."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")  # Grayscale
        img = img.resize((256, 256))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=(0, -1))  # (1, 256, 256, 1)
        return img_array
    except Exception as e:
        print(f"❌ Error preprocessing image: {e}")
        raise


# --- PREDICTION ---
def predict_from_bytes(image_bytes: bytes):
    """Run inference on input image bytes."""
    model = get_model()
    img_array = preprocess_image(image_bytes)

    preds = model.predict(img_array)
    preds = preds.flatten().tolist()

    # Assume the model outputs x,y pairs (2*N values)
    landmarks = []
    for i in range(0, len(preds), 2):
        landmarks.append({
            "name": f"P{i//2 + 1}",
            "x": preds[i],
            "y": preds[i + 1]
        })

    return {"landmarks": landmarks}


# --- SAVE PREDICTED IMAGE ---
def save_predicted_image(image_bytes, landmarks, output_path):
    """Overlay predicted landmarks on the image and save."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size
        draw = ImageDraw.Draw(img)

        # Load a font (optional)
        try:
            font = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()

        # Draw landmarks
        for lm in landmarks:
            x = int(lm["x"] * w)
            y = int(lm["y"] * h)
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill="red", outline="white", width=1)
            draw.text((x + 6, y - 6), lm["name"], fill="yellow", font=font)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path)
        print(f"💾 Saved predicted image to {output_path}")

        return output_path
    except Exception as e:
        print(f"❌ Error saving predicted image: {e}")
        raise
def process_and_predict(image_bytes, ceph_id):
    result = predict_from_bytes(image_bytes)
    landmarks = result["landmarks"]

    output_dir = "outputs"
    os.makedirs(output_dir, exist_ok=True)

    # Save predicted image
    image_rel = os.path.join(output_dir, f"ceph_{ceph_id}_predicted.jpg")
    save_predicted_image(image_bytes, landmarks, image_rel)

    # Save Excel
    excel_rel = os.path.join(output_dir, f"ceph_{ceph_id}_landmarks.xlsx")
    pd.DataFrame(landmarks).to_excel(excel_rel, index=False)

    # 🚀 FIX PATHS FOR FRONTEND
    image_rel_url = image_rel.replace("\\", "/")
    excel_rel_url = excel_rel.replace("\\", "/")

    return {
        "ceph_id": ceph_id,
        "landmarks": landmarks,
        "image_path": f"http://localhost:8000/{image_rel_url}",
        "output_image": f"http://localhost:8000/{image_rel_url}",
        "excel_file": f"http://localhost:8000/{excel_rel_url}",
        "excel_path": excel_rel_url
    }
