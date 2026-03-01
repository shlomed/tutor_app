from fastapi import APIRouter, Depends

from api.deps import get_current_user
from api.schemas import IDoRequest, IDoResponse, ChatRequest, ChatResponse, MessageResponse
from services.pedagogy_service import (
    get_i_do_content,
    process_we_do_chat,
    process_you_do_hint,
    clear_chat_history,
)

router = APIRouter()


@router.post("/i-do", response_model=IDoResponse)
def i_do(req: IDoRequest, current_user: dict = Depends(get_current_user)):
    content = get_i_do_content(req.subtopic_name, req.subtopic_id)
    return {"content": content}


@router.post("/we-do", response_model=ChatResponse)
def we_do(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    response = process_we_do_chat(
        user_message=req.message,
        user_id=current_user["user_id"],
        subtopic_id=req.subtopic_id,
        subtopic_name=req.subtopic_name,
    )
    return {"response": response}


@router.post("/you-do", response_model=ChatResponse)
def you_do(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    response = process_you_do_hint(
        user_message=req.message,
        user_id=current_user["user_id"],
        subtopic_id=req.subtopic_id,
        subtopic_name=req.subtopic_name,
    )
    return {"response": response}


@router.delete("/chat/{subtopic_id}", response_model=MessageResponse)
def clear_chat(subtopic_id: int, current_user: dict = Depends(get_current_user)):
    clear_chat_history(current_user["user_id"], subtopic_id)
    return {"message": "היסטוריית הצ'אט נמחקה"}
