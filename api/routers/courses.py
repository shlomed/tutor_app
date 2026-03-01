from fastapi import APIRouter, Depends, HTTPException, status

from api.deps import get_current_user
from api.schemas import CourseCreate, CourseResponse, CourseUpdate, MessageResponse
from services.syllabus_service import (
    get_all_courses, create_course, delete_course,
    update_course_name, update_course_description,
)

router = APIRouter()


@router.get("", response_model=list[CourseResponse])
def list_courses(current_user: dict = Depends(get_current_user)):
    courses = get_all_courses()
    return [
        {"id": c["id"], "name": c["name"], "description": c.get("description", ""),
         "created_at": c.get("created_at")}
        for c in courses
    ]


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create(req: CourseCreate, current_user: dict = Depends(get_current_user)):
    try:
        course_id = create_course(req.name, req.description)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return {"id": course_id, "name": req.name, "description": req.description}


@router.put("/{course_id}", response_model=MessageResponse)
def update(course_id: int, req: CourseUpdate, current_user: dict = Depends(get_current_user)):
    update_course_name(course_id, req.name)
    update_course_description(course_id, req.description)
    return {"message": "הקורס עודכן"}


@router.delete("/{course_id}", response_model=MessageResponse)
def remove(course_id: int, current_user: dict = Depends(get_current_user)):
    delete_course(course_id)
    return {"message": "הקורס נמחק בהצלחה"}
