from typing import Generic, TypeVar, Type, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""
    
    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session
    
    def get_by_id(self, id: Any) -> Optional[ModelType]:
        """Get a record by its primary key."""
        return self.session.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Get all records with pagination."""
        return self.session.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, **kwargs) -> ModelType:
        """Create a new record."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        self.session.commit()
        self.session.refresh(instance)
        return instance
    
    def update(self, id: Any, **kwargs) -> Optional[ModelType]:
        """Update a record by ID."""
        instance = self.get_by_id(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            self.session.commit()
            self.session.refresh(instance)
        return instance
    
    def delete(self, id: Any) -> bool:
        """Delete a record by ID."""
        instance = self.get_by_id(id)
        if instance:
            self.session.delete(instance)
            self.session.commit()
            return True
        return False
    
    def filter_by(self, **filters) -> List[ModelType]:
        """Filter records by given criteria."""
        return self.session.query(self.model).filter_by(**filters).all()
    
    def filter(self, *criterion) -> List[ModelType]:
        """Filter records using SQLAlchemy expressions."""
        return self.session.query(self.model).filter(*criterion).all()
    
    def first(self, **filters) -> Optional[ModelType]:
        """Get the first record matching the filters."""
        return self.session.query(self.model).filter_by(**filters).first()
    
    def exists(self, **filters) -> bool:
        """Check if a record exists matching the filters."""
        return self.session.query(self.model).filter_by(**filters).first() is not None
    
    def count(self, **filters) -> int:
        """Count records matching the filters."""
        query = self.session.query(self.model)
        if filters:
            query = query.filter_by(**filters)
        return query.count()
    
    def bulk_create(self, instances: List[Dict[str, Any]]) -> List[ModelType]:
        """Create multiple records at once."""
        objects = [self.model(**instance) for instance in instances]
        self.session.bulk_save_objects(objects)
        self.session.commit()
        return objects
    
    def bulk_update(self, mappings: List[Dict[str, Any]]) -> None:
        """Update multiple records at once using mappings."""
        self.session.bulk_update_mappings(self.model, mappings)
        self.session.commit()

