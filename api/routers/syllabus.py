from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user
from api.schemas import (
    RawTextRequest,
    NameUpdate,
    SubtopicCreate,
    SyllabusSaveCounts,
    MessageResponse,
)
from services.syllabus_service import (
    get_course_syllabus,
    db_syllabus_to_flat_rows,
    parse_syllabus_to_json,
    save_syllabus_to_db,
    delete_course_syllabus,
    update_subject_name,
    update_topic_name,
    update_subtopic_name,
    add_subtopic,
    remove_subtopic,
    syllabus_to_flat_rows,
)

router = APIRouter()


@router.get("/{course_id}")
def get_tree(course_id: int, current_user: dict = Depends(get_current_user)):
    return get_course_syllabus(course_id)


@router.get("/{course_id}/flat")
def get_flat(course_id: int, current_user: dict = Depends(get_current_user)):
    rows = db_syllabus_to_flat_rows(course_id)
    return [
        {
            "subject_id": r.get("subject_id", r.get("מקצוע_id")),
            "subject_name": r.get("subject_name", r.get("מקצוע")),
            "topic_id": r.get("topic_id", r.get("נושא_id")),
            "topic_name": r.get("topic_name", r.get("נושא")),
            "subtopic_id": r.get("subtopic_id", r.get("תת-נושא_id")),
            "subtopic_name": r.get("subtopic_name", r.get("תת-נושא")),
        }
        for r in rows
    ]


@router.post("/parse")
def parse(req: RawTextRequest, current_user: dict = Depends(get_current_user)):
    parsed = parse_syllabus_to_json(req.raw_text)
    return parsed.model_dump()


@router.post("/{course_id}/save", response_model=SyllabusSaveCounts)
def save(course_id: int, body: dict, current_user: dict = Depends(get_current_user)):
    from services.syllabus_service import SyllabusSchema
    syllabus = SyllabusSchema(**body)
    counts = save_syllabus_to_db(syllabus, course_id)
    return counts


@router.delete("/{course_id}", response_model=MessageResponse)
def delete_syllabus(course_id: int, current_user: dict = Depends(get_current_user)):
    delete_course_syllabus(course_id)
    return {"message": "הסילבוס נמחק בהצלחה"}


@router.put("/subject/{subject_id}", response_model=MessageResponse)
def update_subject(subject_id: int, req: NameUpdate, current_user: dict = Depends(get_current_user)):
    update_subject_name(subject_id, req.name)
    return {"message": "עודכן"}


@router.put("/topic/{topic_id}", response_model=MessageResponse)
def update_topic(topic_id: int, req: NameUpdate, current_user: dict = Depends(get_current_user)):
    update_topic_name(topic_id, req.name)
    return {"message": "עודכן"}


@router.put("/subtopic/{subtopic_id}", response_model=MessageResponse)
def update_subtopic(subtopic_id: int, req: NameUpdate, current_user: dict = Depends(get_current_user)):
    update_subtopic_name(subtopic_id, req.name)
    return {"message": "עודכן"}


@router.post("/topic/{topic_id}/subtopic")
def create_subtopic(topic_id: int, req: SubtopicCreate, current_user: dict = Depends(get_current_user)):
    new_id = add_subtopic(topic_id, req.name)
    return {"id": new_id}


@router.delete("/subtopic/{subtopic_id}", response_model=MessageResponse)
def delete_subtopic(subtopic_id: int, current_user: dict = Depends(get_current_user)):
    remove_subtopic(subtopic_id)
    return {"message": "נמחק"}


@router.put("/{course_id}/reimport")
def reimport(course_id: int, req: RawTextRequest, current_user: dict = Depends(get_current_user)):
    delete_course_syllabus(course_id)
    parsed = parse_syllabus_to_json(req.raw_text)
    counts = save_syllabus_to_db(parsed, course_id)
    return counts
