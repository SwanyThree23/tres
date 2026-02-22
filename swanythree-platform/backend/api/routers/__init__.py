# SwanyThree Routers
from fastapi import APIRouter
from api.routers.users import router as users_router
from api.routers.streams import router as streams_router
from api.routers.payments import router as payments_router
from api.routers.analytics import router as analytics_router
from api.routers.ai import router as ai_router
from api.routers.notifications import router as notifications_router

root_router = APIRouter(prefix="/api")
root_router.include_router(users_router, prefix="/users", tags=["Users"])
root_router.include_router(streams_router, prefix="/streams", tags=["Streams"])
root_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
root_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
root_router.include_router(ai_router, prefix="/ai", tags=["AI"])
root_router.include_router(notifications_router, tags=["Notifications"])
