import os
import io
import zipfile
import nrrd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
import tensorflow.keras.backend as K
import pydicom
import skimage.measure
import trimesh
import tempfile
from huggingface_hub import hf_hub_download
from app.storage import upload_bytes

# ===============================
# PARAMETERS
# ===============================
IMG_SIZE = (128, 128, 128)
TARGET_LABEL = 5

# ===============================
# METRICS & LOSS
# ===============================
def dice_coefficient(y_true, y_pred):
    y_true_f = K.flatten(y_true)
    y_pred_f = K.flatten(y_pred)
    intersection = K.sum(y_true_f * y_pred_f)
    return (2. * intersection + 1) / (K.sum(y_true_f) + K.sum(y_pred_f) + 1)

def dice_loss(y_true, y_pred):
    return 1 - dice_coefficient(y_true, y_pred)

def bce_dice_loss(y_true, y_pred):
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    return bce + dice_loss(y_true, y_pred)

# ===============================
# MODEL ARCHITECTURE
# ===============================
def conv_block(x, f):
    x = layers.Conv3D(f, 3, padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Conv3D(f, 3, padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    return x

def build_unet():
    inputs = layers.Input((128, 128, 128, 1))
    c1 = conv_block(inputs, 16)
    p1 = layers.MaxPool3D()(c1)
    c2 = conv_block(p1, 32)
    p2 = layers.MaxPool3D()(c2)
    c3 = conv_block(p2, 64)
    p3 = layers.MaxPool3D()(c3)
    c4 = conv_block(p3, 128)

    u1 = layers.Conv3DTranspose(64, 2, strides=2, padding="same")(c4)
    u1 = layers.concatenate([u1, c3])
    c5 = conv_block(u1, 64)

    u2 = layers.Conv3DTranspose(32, 2, strides=2, padding="same")(c5)
    u2 = layers.concatenate([u2, c2])
    c6 = conv_block(u2, 32)

    u3 = layers.Conv3DTranspose(16, 2, strides=2, padding="same")(c6)
    u3 = layers.concatenate([u3, c1])
    c7 = conv_block(u3, 16)

    outputs = layers.Conv3D(1, 1, activation="sigmoid")(c7)
    return models.Model(inputs, outputs)

# Load the global model instance (lazy load if possible, but let's do it on first call)
_MODEL = None

def get_model():
    global _MODEL
    if _MODEL is None:
        try:
            model_path = hf_hub_download(
                repo_id="gurunathasmb/cepha-models",
                filename="airway_segmentation_model.h5",
                local_dir=os.path.join(os.path.dirname(__file__), "downloaded_models")
            )
            _MODEL = build_unet()
            _MODEL.load_weights(model_path)
            print(f"Loaded airway model from Hugging Face: {model_path}")
        except Exception as e:
            print(f"ERROR downloading airway model: {e}. Using empty weights.")
            _MODEL = build_unet()
    return _MODEL

# ===============================
# DATA PROCESSING
# ===============================
def process_dicom_zip(zip_bytes):
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        dicom_files = [f for f in z.namelist() if f.lower().endswith('.dcm') or not f.startswith('__MACOSX')]
        slices = []
        for f in dicom_files:
            try:
                ds = pydicom.dcmread(z.open(f))
                if hasattr(ds, 'SliceLocation') or hasattr(ds, 'ImagePositionPatient'):
                    slices.append(ds)
            except Exception as e:
                pass
    
    if not slices:
        raise ValueError("No valid DICOM slices found in ZIP.")

    # sort by Z coordinate
    try:
        slices.sort(key=lambda x: x.ImagePositionPatient[2])
    except:
        try:
            slices.sort(key=lambda x: x.SliceLocation)
        except:
            pass

    img_shape = list(slices[0].pixel_array.shape)
    img_shape.append(len(slices))
    volume = np.zeros(img_shape)
    
    for i, s in enumerate(slices):
        volume[:, :, i] = s.pixel_array
        
    pixel_spacing = slices[0].PixelSpacing if hasattr(slices[0], 'PixelSpacing') else [0.5, 0.5]
    slice_thickness = slices[0].SliceThickness if hasattr(slices[0], 'SliceThickness') else 0.5
    
    header = {
        'space directions': np.array([
            [pixel_spacing[0], 0, 0],
            [0, pixel_spacing[1], 0],
            [0, 0, slice_thickness]
        ])
    }
    
    return volume, header

def resize_volume(img):
    import scipy.ndimage
    img = (img - np.min(img)) / (np.max(img) - np.min(img) + 1e-8)
    
    # We must resize the entire volume to (128, 128, 128)
    zoom_factors = (
        128 / img.shape[0],
        128 / img.shape[1],
        128 / img.shape[2]
    )
    img_res = scipy.ndimage.zoom(img, zoom_factors, order=1)
    
    return img_res

# ===============================
# MESH EXTRACTION
# ===============================
def generate_mesh(volume, threshold, output_path, spacing=(1.0, 1.0, 1.0), smooth=True):
    try:
        verts, faces, normals, values = skimage.measure.marching_cubes(volume, level=threshold, spacing=spacing)
        mesh = trimesh.Trimesh(vertices=verts, faces=faces, vertex_normals=normals)
        if smooth:
            try:
                trimesh.smoothing.filter_taubin(mesh, iterations=10)
            except:
                pass
        mesh.export(output_path)
        return True
    except Exception as e:
        print(f"Error generating mesh: {e}")
        return False

# ===============================
# METRICS CALCULATION
# ===============================
def airway_volume(mask, header):
    if "space directions" in header and header["space directions"] is not None:
        try:
            dirs = header["space directions"]
            if isinstance(dirs, np.ndarray) and np.isnan(dirs).any():
                spacing = np.array([0.5, 0.5, 0.5])
            else:
                spacing = np.array([np.linalg.norm(x) for x in dirs if not np.all(np.isnan(x) if isinstance(x, np.ndarray) else x == float('nan'))])
                if len(spacing) < 3: spacing = np.array([0.5, 0.5, 0.5])
        except:
            spacing = np.array([0.5, 0.5, 0.5])
    else:
        spacing = np.array([0.5, 0.5, 0.5])

    voxel_volume = np.abs(spacing[0] * spacing[1] * spacing[2])
    airway_voxels = np.sum(mask)
    volume_mm3 = airway_voxels * voxel_volume
    volume_cm3 = volume_mm3 / 1000
    
    return volume_mm3, volume_cm3, spacing

def calculate_advanced_metrics(mask, header):
    vol_mm3, vol_cm3, spacing = airway_volume(mask, header)
    pixel_area = spacing[0] * spacing[1]
    
    areas = []
    widths = []
    
    for i in range(mask.shape[2]):
        slice_mask = mask[:, :, i]
        if np.sum(slice_mask) > 0:
            areas.append(np.sum(slice_mask) * pixel_area)
            y_indices, x_indices = np.where(slice_mask > 0)
            if len(x_indices) > 0:
                width = (np.max(x_indices) - np.min(x_indices)) * spacing[0]
                widths.append(width)
            
    avg_area = np.mean(areas) if areas else 0
    
    if len(widths) >= 2:
        mid = len(widths) // 2
        upper_width = np.mean(widths[mid:]) # Higher Z
        lower_width = np.mean(widths[:mid])
    else:
        upper_width = np.mean(widths) if widths else 0
        lower_width = upper_width
        
    airway_class = "Normal"
    if vol_cm3 < 10.0:
        airway_class = "Restricted (Class II/III tendency)"
    elif vol_cm3 > 25.0:
        airway_class = "Enlarged"
        
    return {
        "volume_cm3": round(vol_cm3, 2),
        "area_mm2": round(avg_area, 2),
        "upper_width_mm": round(upper_width, 2),
        "lower_width_mm": round(lower_width, 2),
        "airway_class": airway_class
    }

# ===============================
# MAIN PIPELINE
# ===============================
def process_airway_scan(file_bytes, is_zip=False, patient_id=0):
    print("Starting airway inference...")
    
    if is_zip:
        volume, header = process_dicom_zip(file_bytes)
    else:
        # Assuming NRRD
        with tempfile.NamedTemporaryFile(delete=False, suffix=".nrrd") as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name
        volume, header = nrrd.read(temp_path)
        os.remove(temp_path)

    # 1. Resize volume
    img_res = resize_volume(volume)
    
    # 2. Predict
    model = get_model()
    # Model expects (batch, 128, 128, 128, 1)
    input_tensor = np.expand_dims(np.expand_dims(img_res, axis=0), axis=-1)
    pred = model.predict(input_tensor)
    pred_mask = (pred > 0.5).astype(np.uint8).squeeze()
    
    # 3. Calculate metrics
    metrics = calculate_advanced_metrics(pred_mask, header)
    
    # Resize mask back to original shape for perfect alignment in visualization
    orig_shape = volume.shape
    import scipy.ndimage
    zoom_factors = (
        orig_shape[0] / 128.0,
        orig_shape[1] / 128.0,
        orig_shape[2] / 128.0
    )
    # Use order=0 (nearest neighbor) to keep mask binary
    pred_mask_full = scipy.ndimage.zoom(pred_mask, zoom_factors, order=0)
    
    # 4. Save NRRDs for NiiVue
    print("Uploading 3D volumes to cloud...")
    
    # Save original scan
    with tempfile.NamedTemporaryFile(delete=False, suffix=".nrrd") as tmp:
        nrrd.write(tmp.name, volume.astype(np.short), header)
        with open(tmp.name, "rb") as f:
            orig_url = upload_bytes(
                f.read(),
                folder="volumes",
                ext="nrrd",
                content_type="application/octet-stream",
                original_name=f"scan_{patient_id}.nrrd"
            )
        os.remove(tmp.name)

    # 5. Save NRRD Mask
    with tempfile.NamedTemporaryFile(delete=False, suffix=".nrrd") as tmp:
        nrrd.write(tmp.name, pred_mask_full.astype(np.short), header)
        with open(tmp.name, "rb") as f:
            mask_url = upload_bytes(
                f.read(),
                folder="volumes",
                ext="nrrd",
                content_type="application/octet-stream",
                original_name=f"mask_{patient_id}.nrrd"
            )
        os.remove(tmp.name)
    
    return {
        "metrics": metrics,
        "scan_nrrd_url": orig_url,
        "mask_nrrd_url": mask_url
    }
