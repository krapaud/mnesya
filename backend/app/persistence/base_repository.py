from sqlalchemy.orm import Session
from typing import Generic, TypeVar, Type, List, Optional
from uuid import UUID
from app import SessionLocal

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T]):
        self.model = model
        self.db: Session = SessionLocal()

    def add(self, entity: T) -> T:
        try:
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def get(self, entity_id: UUID) -> Optional[T]:
        return self.db.query(self.model).filter(self.model._id == entity_id).first()

    def get_all(self) -> List[T]:
        return self.db.query(self.model).all()

    def update(self, entity_id: UUID, data: dict) -> Optional[T]:
        try:
            entity = self.get(entity_id)
            if entity:
                for key, value in data.items():
                    if hasattr(entity, f'_{key}'):
                        setattr(entity, key, value)
                self.db.commit()
                self.db.refresh(entity)
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def delete(self, entity_id: UUID) -> bool:
        try:
            entity = self.get(entity_id)
            if entity:
                self.db.delete(entity)
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            raise e

    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
