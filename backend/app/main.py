from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from typing import List
from . import models, schemas, database, utils, auth, ml_inference

# --- DATABASE INIT ---
models.Base.metadata.create_all(bind=database.engine)

# --- FASTAPI APP CONFIG ---
app = FastAPI(title="CephAI Backend (TensorFlow)")
os.makedirs("outputs", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.include_router(auth.router)

# 🧍 Create Patient
@app.post("/patients", response_model=schemas.PatientOut)
def create_patient(
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(utils.get_current_user)
):
    username = token.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    patient = models.Patient(
        name=payload.name,
        dob=payload.dob,
        notes=payload.notes,
        owner_id=user.id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


# 📋 List Patients
@app.get("/patients", response_model=List[schemas.PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    token: dict = Depends(utils.get_current_user)
):
    username = token.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role == "admin":
        return db.query(models.Patient).all()

    return db.query(models.Patient).filter(models.Patient.owner_id == user.id).all()


# 🆕 📌 Get Cephalogram + Latest Prediction
@app.get("/cephalogram/{ceph_id}")
def get_cephalogram(
    ceph_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(utils.get_current_user)
):
    username = token.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    patient = db.query(models.Patient).filter(models.Patient.id == ceph_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Cephalogram not found")

    pred = (
        db.query(models.Prediction)
        .filter(models.Prediction.patient_id == ceph_id)
        .order_by(models.Prediction.created_at.desc())
        .first()
    )

    def fix(path):
        return path.replace("\\", "/") if path else None

    return {
        "id": patient.id,
        "fileName": patient.name,
        "dob": patient.dob,
        "notes": patient.notes,
        "landmarks": pred.result if pred else None,
        "image_url": f"http://localhost:8000/{fix(pred.image_path)}" if pred else None,
        "excel_file": f"http://localhost:8000/{fix(pred.excel_path)}" if pred else None,
    }


# 🧠 Predict Cephalogram
@app.post("/predict/{patient_id}", response_model=schemas.PredictionOut)
async def predict(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token: dict = Depends(utils.get_current_user)
):
    username = token.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    contents = await file.read()

    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{patient_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(contents)

    # 🧠 Run ML inference
    result = ml_inference.process_and_predict(contents, patient_id)

    pred = models.Prediction(
        patient_id=patient.id,
        model_name="ceph_landmark_model",
        result=result["landmarks"],
        image_path=result["output_image"].replace("http://localhost:8000/", ""),
        excel_path=result["excel_file"].replace("http://localhost:8000/", "")
    )

    db.add(pred)
    db.commit()
    db.refresh(pred)

    return {
        "id": pred.id,
        "patient_id": patient.id,
        "model_name": pred.model_name,
        "created_at": pred.created_at,
        "landmarks": result["landmarks"],
        "output_image": result["output_image"],
        "excel_file": result["excel_file"],
        "image_path": pred.image_path,
        "result": pred.result
    }


# 🔍 List Predictions Per Patient
@app.get("/patients/{patient_id}/predictions", response_model=List[schemas.PredictionOut])
def list_predictions(
    patient_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(utils.get_current_user)
):
    preds = db.query(models.Prediction).filter(models.Prediction.patient_id == patient_id).all()
    return preds
