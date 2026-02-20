"""Base Repository module.

This module provides the generic repository pattern implementation for data access.
All specific repositories inherit from BaseRepository to get standard CRUD operations.
"""

from sqlalchemy.orm import Session
from typing import Generic, TypeVar, Type, List, Optional
from uuid import UUID

T = TypeVar('T')  # Generic type for the model class


class BaseRepository(Generic[T]):
    """Generic base repository providing standard CRUD operations.

    This class implements the Repository pattern for database access,
    providing a consistent interface for all entity types.

    Type Parameters:
        T: The model class this repository manages

    Attributes:
        model (Type[T]): The SQLAlchemy model class
        db (Session): Database session for queries

    Note:
        The session is automatically closed when the repository is destroyed.
    """

    def __init__(self, model: Type[T], db: Session):
        """Initialize the repository with a model class.

        Args:
            model (Type[T]): The SQLAlchemy model class to manage
        """
        self.model = model
        self.db = db

    def add(self, entity: T) -> T:
        """Add a new entity to the database.

        Args:
            entity (T): The entity instance to add

        Returns:
            T: The added entity with populated ID and timestamps

        Raises:
            Exception: If database operation fails (transaction is rolled back)
        """
        try:
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)  # Reload to get generated values
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def get(self, entity_id: UUID) -> Optional[T]:
        """Retrieve a single entity by its ID.

        Args:
            entity_id (UUID): The unique identifier of the entity

        Returns:
            Optional[T]: The entity if found, None otherwise
        """
        return self.db.query(self.model).filter(
            self.model._id == entity_id).first()

    def get_all(self) -> List[T]:
        """Retrieve all entities of this type.

        Returns:
            List[T]: List of all entities (may be empty)

        Warning:
            Use with caution on large tables - consider pagination
        """
        return self.db.query(self.model).all()

    def update(self, entity_id: UUID, data: dict) -> Optional[T]:
        """Update an existing entity with new data.

        Args:
            entity_id (UUID): The unique identifier of the entity to update
            data (dict): Dictionary of field names and new values

        Returns:
            Optional[T]: The updated entity if found, None if not found

        Raises:
            Exception: If database operation fails (transaction is rolled back)

        Note:
            Only updates fields that exist in the model (prefixed with underscore)
            Uses property setters which include validation
        """
        try:
            entity = self.get(entity_id)
            if entity:
                # Update each field using property setters for validation
                for key, value in data.items():
                    if hasattr(entity, f'_{key}'):
                        setattr(entity, key, value)
                self.db.commit()
                self.db.refresh(entity)  # Reload updated values
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def delete(self, entity_id: UUID) -> bool:
        """Delete an entity by its ID.

        Args:
            entity_id (UUID): The unique identifier of the entity to delete

        Returns:
            bool: True if entity was found and deleted, False if not found

        Raises:
            Exception: If database operation fails (transaction is rolled back)
        """
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
