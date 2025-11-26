from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "doctor"

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        orm_mode = True

class PatientCreate(BaseModel):
    name: str
    dob: Optional[str] = None
    notes: Optional[str] = None

class PatientOut(BaseModel):
    id: int
    name: str
    dob: Optional[str]
    notes: Optional[str]
    created_at: datetime
    class Config:
        orm_mode = True
class LandmarkOut(BaseModel):
    name: str
    x: float
    y: float

class PredictionOut(BaseModel):
    id: int
    patient_id: int
    model_name: str
    model_version: Optional[str] = "v1.0"   # ✅ default so not required
    created_at: datetime
    status: str = "completed"               # ✅ default
    processing_time: Optional[float] = None # ✅ default
    num_landmarks: int                      # required but can be calculated
    output_image: str
    excel_file: str
    landmarks: List[LandmarkOut]

    class Config:
        from_attributes = True

