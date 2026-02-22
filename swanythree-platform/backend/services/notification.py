import json
import asyncio
from typing import Dict, List
from fastapi import WebSocket
from redis.asyncio import Redis
from api.config import settings

class ConnectionManager:
    """Manages active WebSocket connections per user."""
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            # Clean up closed connections while iterating
            active = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    active.append(connection)
                except Exception:
                    pass
            self.active_connections[user_id] = active

manager = ConnectionManager()

class NotificationService:
    """Service to persist notifications and broadcast them via Redis/WebSockets."""
    
    def __init__(self):
        self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def broadcast_notification(self, user_id: str, notification_data: dict):
        """Broadcast notification to a specific user via Redis Pub/Sub."""
        channel = f"notifications:{user_id}"
        await self.redis.publish(channel, json.dumps(notification_data))

    async def subscribe_and_push(self, user_id: str):
        """Worker function to bridge Redis Pub/Sub to WebSockets."""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"notifications:{user_id}")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await manager.send_personal_message(data, user_id)
        finally:
            await pubsub.unsubscribe()
            await pubsub.close()

notification_service = NotificationService()
