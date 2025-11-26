from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# =====================
# 🔹 User Schemas
# =====================
class UserBase(BaseModel):
    username: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# 🔹 Patient Schemas
# =====================
class PatientBase(BaseModel):
    name: str
    dob: Optional[str] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int
    created_at: datetime
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True


# =====================
# 🔹 Prediction Schemas
# =====================
class Landmark(BaseModel):
    name: str
    x: float
    y: float

class PredictionBase(BaseModel):
    patient_id: int
    model_name: Optional[str] = "ceph_landmark_model"
    result: Optional[Any] = None
    image_path: Optional[str] = None
    excel_path: Optional[str] = None

class PredictionOut(PredictionBase):
    id: int
    created_at: datetime
    landmarks: Optional[List[Landmark]] = None
    output_image: Optional[str] = None
    excel_file: Optional[str] = None

    class Config:
        from_attributes = True
