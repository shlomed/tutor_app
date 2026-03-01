from typing import Optional

from pydantic import BaseModel, Field


# --- Auth ---
class RegisterRequest(BaseModel):
    username: str
    name: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str


class UserResponse(BaseModel):
    user_id: int
    username: str
    name: str


# --- Courses ---
class CourseCreate(BaseModel):
    name: str


class CourseResponse(BaseModel):
    id: int
    name: str
    created_at: Optional[str] = None


# --- Syllabus ---
class RawTextRequest(BaseModel):
    raw_text: str


class NameUpdate(BaseModel):
    name: str


class SubtopicCreate(BaseModel):
    name: str


class SyllabusSaveCounts(BaseModel):
    subjects: int
    topics: int
    subtopics: int


# --- Learning ---
class IDoRequest(BaseModel):
    subtopic_name: str


class IDoResponse(BaseModel):
    content: str


class ChatRequest(BaseModel):
    message: str
    subtopic_id: int
    subtopic_name: str


class ChatResponse(BaseModel):
    response: str


# --- Progress ---
class ProgressUpdate(BaseModel):
    subtopic_id: int
    status: str
    xp_earned: int = 0
    assistance_level_used: int = 0


# --- Evaluation ---
class EvaluateRequest(BaseModel):
    student_answer: str
    subtopic_name: str
    subtopic_id: int
    hints_used: int
    save_progress: bool = True


class EvaluateResponse(BaseModel):
    is_correct: bool
    feedback: str
    xp_earned: int


# --- Generic ---
class MessageResponse(BaseModel):
    message: str
