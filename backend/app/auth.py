from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from . import models, schemas, database, utils

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register(u: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == u.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed = utils.hash_password(u.password)
    user = models.User(username=u.username, hashed_password=hashed, role=u.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token_data = {"sub": user.username, "role": user.role}
    access_token = utils.create_access_token(data=token_data, expires_delta=timedelta(hours=24))
    return {"access_token": access_token, "token_type": "bearer"}
