from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


# --------------------------
# 👤 USER TABLE
# --------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="doctor")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patients = relationship("Patient", back_populates="owner")


# --------------------------
# 🧍 PATIENT TABLE
# --------------------------
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="patients")
    predictions = relationship("Prediction", back_populates="patient")


# --------------------------
# 🧠 PREDICTION TABLE
# --------------------------
class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    # Model metadata
    model_name = Column(String, default="ceph_landmark_model")

    # Prediction results
    result = Column(JSON, nullable=True)  # Landmark list (JSON)
    image_path = Column(String, nullable=True)  # Saved cephalometric image
    excel_path = Column(String, nullable=True)  # Excel file path

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="predictions")
