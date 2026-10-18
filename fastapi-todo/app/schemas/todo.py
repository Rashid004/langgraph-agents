from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TodoCreate(BaseModel):  # what the client sends on POST
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class TodoUpdate(BaseModel):  # what the client sends on PATCH, all optional
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None

    @field_validator("title", "completed")
    @classmethod
    def not_null(cls, v):  # only runs when the client sent the field, so explicit null -> 422 not 500
        if v is None:
            raise ValueError("cannot be null")
        return v


class TodoRead(BaseModel):  # what we send back
    model_config = ConfigDict(from_attributes=True)  # allows building it from a DB object

    id: int
    title: str
    description: Optional[str]
    completed: bool
