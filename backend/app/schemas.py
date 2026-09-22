
from pydantic import BaseModel, Field

class ReviewRequest(BaseModel):
    status: str = Field(pattern="^(approved|rejected|pending)$")
