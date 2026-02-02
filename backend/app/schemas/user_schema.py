from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import List, Optional

# Pour créer un user (POST /users)
class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    
    @field_validator('first_name', 'last_name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip()

# Pour mettre à jour un user (PUT /users/{id})
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    
    @field_validator('first_name', 'last_name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip() if v else None

# Pour renvoyer un user (GET /users/{id})
class UserResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    date_of_birth: date
    caregiver_ids: List[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Permet de créer depuis un objet SQLAlchemy

# Pour lister les users (GET /users)
class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
