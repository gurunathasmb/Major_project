from fastapi import FastAPI, Depends, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import io
import time
import os
import json
from dotenv import load_dotenv

from . import models, schemas, database, utils, auth, ml_inference
from .report_generator import generate_ceph_report
from .storage import upload_bytes
from .patients import router as patients_router
from .appointments import router as appointments_router
from .master_excel import append_to_master_excel

load_dotenv()

# ==================================================
# CONFIG
# ==================================================
STORAGE_MODE = os.getenv("STORAGE_MODE", "local")

# ==================================================
# INIT
# ==================================================
models.Base.metadata.create_all(bind=database.engine)
app = FastAPI(title="CephAI Backend")

@app.on_event("startup")
async def load_models_on_startup():
    print("DEBUG: Pre-loading all AI models on startup for faster local inference...")
    try:
        from . import ml_inference, airway_inference
        # Pre-load Ceph Models
        ml_inference.load_seg_model()
        ml_inference.load_reg_model()
        ml_inference.load_hm11_model()
        ml_inference.load_hm19_model()
        # Pre-load Airway Model
        airway_inference.get_model()
        print("DEBUG: All models pre-loaded successfully!")
    except Exception as e:
        print(f"DEBUG: Error pre-loading models: {e}")

# ==================================================
# STATIC FILE SERVING
# ==================================================
os.makedirs("local_storage", exist_ok=True)
app.mount(
    "/local_storage",
    StaticFiles(directory="local_storage"),
    name="local_storage"
)

# ==================================================
# CORS
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    # Bypass ngrok browser warning for API calls
    response.headers["ngrok-skip-browser-warning"] = "69420"
    return response

# ==================================================
# DB DEPENDENCY
# ==================================================
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================================================
# INCLUDE ROUTERS
# ==================================================
app.include_router(auth.router)
app.include_router(patients_router)
app.include_router(appointments_router)

# ==================================================
# GET CEPHALOGRAM
# ==================================================
@app.get("/cephalogram/{pred_id}")
def get_cephalogram(
    pred_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    pred = db.query(models.Prediction).filter(
        models.Prediction.id == pred_id
    ).first()

    if not pred:
        raise HTTPException(404, "Cephalogram not found")

    return {
        "id": pred.id,
        "patient_id": pred.patient_id,
        "model_name": pred.model_name,
        "mode_used": pred.mode_used,
        "landmarks": pred.result,
        "angles": pred.angles,
        "skeletal_class": pred.skeletal_class,
        "maxilla_status": pred.maxilla_status,
        "mandible_status": pred.mandible_status,
        "divergence_status": pred.divergence_status,
        "airway": pred.airway,
        "airway_class": pred.airway_class,
        "image_url": pred.image_path,
        "excel_file": pred.excel_path,
        "pdf_report": pred.pdf_path,
        "created_at": pred.created_at
    }

# ==================================================
# ================= CLINICAL ======================
# ==================================================

# ---------------- STAGE 1 (Preview Only) ----------------
@app.post("/clinical-preview/{patient_id}")
async def clinical_preview(
    patient_id: int,
    file: UploadFile = File(...),
    user: models.User = Depends(utils.get_current_user)
):
    image_bytes = await file.read()

    return ml_inference.predict_clinical_landmarks_only(
        image_bytes=image_bytes,
        ceph_id=patient_id
    )

# ---------------- STAGE 2 (Finalize After Edit) ----------------
@app.post("/clinical-finalize/{patient_id}", response_model=schemas.PredictionOut)
async def clinical_finalize(
    patient_id: int,
    landmarks: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    start = time.time()
    image_bytes = await file.read()

    try:
        parsed_landmarks = json.loads(landmarks)
    except:
        raise HTTPException(400, "Invalid landmarks")

    result = ml_inference.process_clinical_finalize(
        image_bytes=image_bytes,
        ceph_id=patient_id,
        edited_landmarks=parsed_landmarks
    )

    return await finalize_prediction(
        result,
        file,
        patient_id,
        db,
        start,
        user.id
    )

# ==================================================
# ================= ML ============================
# ==================================================

@app.post("/ml-predict/{patient_id}")
async def ml_predict(
    patient_id: int,
    file: UploadFile = File(...),
    user: models.User = Depends(utils.get_current_user)
):
    image_bytes = await file.read()

    return ml_inference.predict_landmarks_only(
        image_bytes=image_bytes,
        ceph_id=patient_id
    )

@app.post("/ml-finalize/{patient_id}", response_model=schemas.PredictionOut)
async def ml_finalize(
    patient_id: int,
    landmarks: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    start = time.time()
    image_bytes = await file.read()

    try:
        parsed_landmarks = json.loads(landmarks)
    except:
        raise HTTPException(400, "Invalid landmarks")

    result = ml_inference.process_ml_finalize(
        image_bytes=image_bytes,
        ceph_id=patient_id,
        landmarks=parsed_landmarks
    )

    return await finalize_prediction(
        result,
        file,
        patient_id,
        db,
        start,
        user.id
    )

# ==================================================
# ================= 3D AIRWAY =====================
# ==================================================
from . import airway_inference
from . import airway_report_generator

@app.post("/airway-predict/{patient_id}")
async def airway_predict(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    start = time.time()
    file_bytes = await file.read()
    
    is_zip = file.filename.lower().endswith(".zip")
    
    try:
        # Run inference
        result = airway_inference.process_airway_scan(file_bytes, is_zip=is_zip, patient_id=patient_id)
        
        # Save placeholder screenshot for report (or we can use the original image)
        # We don't have a 2D screenshot of the 3D yet, so we will skip image_path for now
        image_url = ""
        excel_url = ""
        
        pdf_buffer = io.BytesIO()
        airway_report_generator.generate_airway_report(
            patient_id=patient_id,
            metrics=result["metrics"],
            image_path=None,
            save_path=pdf_buffer
        )
        pdf_buffer.seek(0)

        pdf_url = upload_bytes(
            pdf_buffer.getvalue(),
            folder="reports",
            ext="pdf",
            content_type="application/pdf",
            original_name=f"airway_{patient_id}.pdf"
        )
        
        prediction_data = dict(
            patient_id=patient_id,
            mode_used="3D_airway",
            model_name="airway_unet_3d",
            result="{}",  # Not applicable
            angles={},
            skeletal_class=result["metrics"].get("airway_class", "Normal"),
            airway=result["metrics"],
            airway_class=result["metrics"].get("airway_class", "Normal"),
            image_path=result["scan_nrrd_url"] + "," + result["mask_nrrd_url"], 
            excel_path=excel_url,
            pdf_path=pdf_url
        )
        
        if hasattr(models.Prediction, "doctor_id"):
            prediction_data["doctor_id"] = user.id
            
        pred = models.Prediction(**prediction_data)
        db.add(pred)
        db.commit()
        db.refresh(pred)
        
        return {
            "id": pred.id,
            "patient_id": patient_id,
            "model_name": pred.model_name,
            "mode_used": pred.mode_used,
            "metrics": result["metrics"],
            "scan_nrrd_url": result["scan_nrrd_url"],
            "mask_nrrd_url": result["mask_nrrd_url"],
            "pdf_report": pdf_url,
            "status": "completed"
        }
    except Exception as e:
        print("Airway prediction error:", str(e))
        raise HTTPException(500, f"Airway processing failed: {str(e)}")


# ==================================================
# FINALIZE FUNCTION (UNCHANGED)
# ==================================================
async def finalize_prediction(
    result,
    file,
    patient_id,
    db,
    start,
    doctor_id
):
    if not result:
        raise HTTPException(500, "ML result is None")

    try:
        print(f"DEBUG: Processing final results for patient {patient_id}...")
        
        with open(result["output_image"], "rb") as f:
            img_start = time.time()
            image_url = upload_bytes(
                f.read(),
                folder="images",
                ext="jpg",
                content_type="image/jpeg",
                original_name=file.filename
            )
            print(f"DEBUG: Image processing/upload total: {round(time.time() - img_start, 2)}s")

        with open(result["excel_file"], "rb") as f:
            exc_start = time.time()
            excel_url = upload_bytes(
                f.read(),
                folder="excels",
                ext="xlsx",
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                original_name=file.filename
            )
            print(f"DEBUG: Excel upload total: {round(time.time() - exc_start, 2)}s")

        pdf_start = time.time()
        pdf_buffer = io.BytesIO()

        generate_ceph_report(
            patient_id,
            result["angles"],
            result["skeletal_class"],
            result["output_image"],
            pdf_buffer,
            result.get("maxilla_status"),
            result.get("mandible_status"),
            result.get("divergence_status"),
            result.get("airway"),
            result.get("airway_class")
        )

        pdf_buffer.seek(0)
        print(f"DEBUG: PDF generation took {round(time.time() - pdf_start, 2)}s")

        pdf_up_start = time.time()
        pdf_url = upload_bytes(
            pdf_buffer.getvalue(),
            folder="reports",
            ext="pdf",
            content_type="application/pdf",
            original_name=file.filename
        )
        print(f"DEBUG: PDF upload took {round(time.time() - pdf_up_start, 2)}s")

        append_to_master_excel(file.filename, result)

        prediction_data = dict(
            patient_id=patient_id,
            mode_used=result["mode_used"],
            model_name=f"ceph_model_{result['mode_used']}",
            result=result["landmarks"],
            angles=result["angles"],
            skeletal_class=result["skeletal_class"],
            maxilla_status=result.get("maxilla_status"),
            mandible_status=result.get("mandible_status"),
            divergence_status=result.get("divergence_status"),
            airway=result["airway"],
            airway_class=result.get("airway_class"),

            image_path=image_url,
            excel_path=excel_url,
            pdf_path=pdf_url
        )

        if hasattr(models.Prediction, "doctor_id"):
            prediction_data["doctor_id"] = doctor_id

        db_start = time.time()
        pred = models.Prediction(**prediction_data)

        db.add(pred)
        db.commit()
        db.refresh(pred)
        print(f"DEBUG: Database commit took {round(time.time() - db_start, 2)}s")

        total_proc = round(time.time() - start, 3)
        print(f"DEBUG: TOTAL process time: {total_proc}s")

        return {
            "id": pred.id,
            "patient_id": patient_id,
            "model_name": pred.model_name,
            "mode_used": pred.mode_used,
            "created_at": pred.created_at,
            "status": "completed",
            "processing_time": total_proc,
            "num_landmarks": len(result["landmarks"]),
            "landmarks": result["landmarks"],
            "angles": result["angles"],
            "skeletal_class": result["skeletal_class"],
            "maxilla_status": result.get("maxilla_status"),
            "mandible_status": result.get("mandible_status"),
            "divergence_status": result.get("divergence_status"),
            "airway": result["airway"],
            "airway_class": result.get("airway_class"),
            "output_image": image_url,
            "excel_file": excel_url,
            "pdf_report": pdf_url
        }

    except Exception as e:
        print("Finalize prediction error:", str(e))
        raise HTTPException(500, "Prediction processing failed")

# ==================================================
# DOCTOR DASHBOARD
# ==================================================
@app.get("/doctor/predictions")
def doctor_predictions(
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    predictions = (
        db.query(models.Prediction)
        .join(models.Patient)
        .filter(models.Patient.owner_id == user.id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )

    return predictions
# ==================================================
# PATIENT FULL HISTORY (QR USE)
# ==================================================
@app.get("/patients/{patient_id}/full-history")
def get_patient_full_history(
    patient_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    # Get patient
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.owner_id == user.id
    ).first()

    if not patient:
        raise HTTPException(404, "Patient not found")

    # Get all predictions for that patient
    predictions = db.query(models.Prediction).filter(
        models.Prediction.patient_id == patient_id
    ).order_by(models.Prediction.created_at.desc()).all()

    return {
        "patient": patient,
        "predictions": predictions
    }

# ==============================
# ADMIN - GET ALL PATIENTS
# ==============================
@app.get("/admin/patients")
def admin_get_all_patients(
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    if user.role != "admin":
        raise HTTPException(403, "Not authorized")

    patients = db.query(models.Patient).all()

    result = []

    for p in patients:
        predictions = db.query(models.Prediction).filter(
            models.Prediction.patient_id == p.id
        ).order_by(models.Prediction.created_at.desc()).all()

        result.append({
            "id": p.id,
            "name": p.name,
            "created_at": p.created_at,
            "owner_id": p.owner_id,
            "predictions": [
                {
                    "id": pr.id,
                    "skeletal_class": pr.skeletal_class,
                    "created_at": pr.created_at
                }
                for pr in predictions
            ]
        })

    return result

# ==============================
# ADMIN - GET ALL PREDICTIONS
# ==============================
@app.get("/admin/predictions")
def admin_get_all_predictions(
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    if user.role != "admin":
        raise HTTPException(403, "Not authorized")

    preds = db.query(models.Prediction).all()

    result = []

    for p in preds:
        # ================= PATIENT =================
        patient = db.query(models.Patient).filter(
            models.Patient.id == p.patient_id
        ).first()

        patient_name = patient.name if patient else "Unknown"

        # ================= DOCTOR =================
        doctor_name = "Unknown"

        if patient and patient.owner_id:
            doctor = db.query(models.User).filter(
                models.User.id == patient.owner_id
            ).first()

            if doctor:
                doctor_name = doctor.full_name or doctor.username

        result.append({
            "id": p.id,
            "patient_id": p.patient_id,
            "patient_name": patient_name,
            "model_name": p.model_name,
            "created_at": p.created_at,
            "skeletal_class": p.skeletal_class,
            "angles": p.angles,
            "maxilla_status": p.maxilla_status,
            "mandible_status": p.mandible_status,
            "divergence_status": p.divergence_status,
            "airway": p.airway,
            "airway_class": p.airway_class,

            "doctor_name": doctor_name,

            "image_path": p.image_path,
            "pdf_path": p.pdf_path
        })

    return result
@app.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    if user.role != "admin":
        raise HTTPException(403, "Not authorized")

    users = db.query(models.User).all()

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "is_approved": u.is_approved,
            "full_name": u.full_name
        }
        for u in users
    ]
@app.get("/admin/master-excel-data")
def get_excel_data():
    import pandas as pd
    import numpy as np

    df = pd.read_excel("local_storage/master_sheet.xlsx")

    # 🔥 Convert everything to pure Python types
    df = df.astype(object)

    # 🔥 Replace invalid values
    df = df.replace([np.nan, np.inf, -np.inf], None)

    # 🔥 Convert safely
    data = df.to_dict(orient="records")

    return data
@app.put("/admin/toggle-user/{user_id}")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # ✅ Only admin allowed
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # ✅ Find user
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Toggle active/inactive
    user.is_active = not user.is_active

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "is_active": user.is_active
    }
@app.get("/admin/doctors")
def get_all_doctors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Not authorized")

    doctors = db.query(models.User).filter(models.User.role == "doctor").all()

    result = []

    for d in doctors:
        patient_count = db.query(models.Patient).filter(
            models.Patient.owner_id == d.id
        ).count()

        result.append({
    "id": d.id,
    "username": d.username,
    "email": d.email if d.email else d.username,  # ✅ FIX
    "phone": d.phone,
    "full_name": d.full_name,
    "is_active": d.is_active,
    "is_approved": d.is_approved,
    "patient_count": patient_count
})

    return result
@app.get("/admin/doctor/{doctor_id}/patients")
def get_doctor_patients(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Not authorized")

    patients = db.query(models.Patient).filter(
        models.Patient.owner_id == doctor_id
    ).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "age": p.dob,   # you used dob instead of age
            "created_at": p.created_at
        }
        for p in patients
    ]
@app.get("/user/profile")
def get_profile(user: models.User = Depends(utils.get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": getattr(user, "full_name", None),
        "phone": getattr(user, "phone", None),
        "role": user.role,
        "is_profile_complete": getattr(user, "is_profile_complete", False)
    }

@app.put("/user/profile")
def update_profile(
    full_name: str = Form(...),
    phone: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # ✅ Fetch user again in THIS session
    user = db.query(models.User).filter(models.User.id == current_user.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Update fields
    user.full_name = full_name
    user.phone = phone
    user.is_profile_complete = True

    db.commit()
    db.refresh(user)

    return {"message": "Profile updated"}
@app.get("/admin/predictions/debug")
def admin_predictions_debug(db: Session = Depends(get_db)):
    preds = db.query(models.Prediction).all()

    return [
        {
            "id": p.id,
            "pdf_path": p.pdf_path,
            "image_path": p.image_path
        }
        for p in preds
    ]

# ==================================================
# ADMIN PDF REPORTS
# ==================================================
from . import admin_report_generator
from fastapi.responses import FileResponse

@app.get("/admin/reports/advanced")
def get_advanced_report(
    source: str = "db",
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    if user.role != "admin":
        raise HTTPException(403, "Not authorized")
    
    data = []
    if source == "db":
        # Direct call to existing function
        data = admin_get_all_predictions(db, user)
    else:
        # Excel
        data = get_excel_data()

    os.makedirs("local_storage/reports", exist_ok=True)
    report_path = f"local_storage/reports/Admin_Advanced_Insights_{source}.pdf"
    admin_report_generator.generate_advanced_report(report_path, source, data)
    
    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=f"CephAI_Insights_{source}.pdf"
    )

@app.get("/admin/reports/simple")
def get_simple_report(
    db: Session = Depends(get_db),
    user: models.User = Depends(utils.get_current_user)
):
    if user.role != "admin":
        raise HTTPException(403, "Not authorized")

    patients = db.query(models.Patient).count()
    preds = db.query(models.Prediction).all()
    doctors = db.query(models.User).filter(models.User.role == "doctor").count()

    dist = {"Class I": 0, "Class II": 0, "Class III": 0, "Unknown": 0}
    for p in preds:
        sc = p.skeletal_class or "Unknown"
        if sc in dist:
            dist[sc] += 1
        else:
            dist["Unknown"] += 1

    stats = {
        "total_patients": patients,
        "total_predictions": len(preds),
        "total_doctors": doctors,
        "class_distribution": dist
    }

    os.makedirs("local_storage/reports", exist_ok=True)
    report_path = "local_storage/reports/Admin_Activity_Report.pdf"
    admin_report_generator.generate_simple_report(report_path, stats)

    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename="CephAI_Activity_Report.pdf"
    )