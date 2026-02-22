# SwanyThree Routers
from fastapi import APIRouter
from api.routers.users import router as users_router
from api.routers.streams import router as streams_router

root_router = APIRouter(prefix="/api")
root_router.include_router(users_router, prefix="/users", tags=["Users"])
root_router.include_router(streams_router, prefix="/streams", tags=["Streams"])
