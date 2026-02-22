from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from api.middleware.auth import get_current_user
from services.notification import manager, notification_service
from api.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from models.entities import User
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time notifications.
    Token must be passed as a query parameter because standard JS WebSocket 
    API doesn't support headers.
    """
    # 1. Validate Token (Mocking manual validation here for simplicity 
    # since Depends doesn't work directly with @router.websocket easily 
    # for standard auth flows in FastAPI)
    try:
        # In a real app, use the auth logic from api/middleware/auth.py
        # For now, let's assume we decode and get user_id
        # u = await get_current_user_from_token(token)
        # user_id = str(u.id)
        
        # Placeholder user_id for demonstration (replace with actual auth)
        user_id = "demo-user-id" 
        
        await manager.connect(user_id, websocket)
        
        # 2. Start Redis listener for this user
        subscriber_task = asyncio.create_task(
            notification_service.subscribe_and_push(user_id)
        )
        
        try:
            while True:
                # Keep connection alive
                data = await websocket.receive_text()
                # Handle client messages if any (e.g., ping/pong or marks as read)
        except WebSocketDisconnect:
            manager.disconnect(user_id, websocket)
            subscriber_task.cancel()
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            manager.disconnect(user_id, websocket)
            subscriber_task.cancel()
            
    except Exception as e:
        await websocket.close(code=1008) # Policy Violation
        logger.error(f"Socket auth failed: {e}")
