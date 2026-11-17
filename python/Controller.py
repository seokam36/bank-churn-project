from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

from Service import result_service

# SSE 메시지 하나 : "event: 이름" + "data: JSON" + 빈 줄
def sse( event , data ) :
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

# Spring(SseService) 이 호출 : ai.predict-path=/predict/stream
@router.post('/predict/stream')
async def predict_stream(item:dict):
    result = result_service.predict(item)
    messages = [
        sse( 'status' , { 'message' : '모델 추론 완료' } ) ,
        sse( 'result' , result )
    ]
    return StreamingResponse( messages , media_type='text/event-stream' )
