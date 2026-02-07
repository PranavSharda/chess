from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize db module first
import db

from api.user import router as user_router

app = FastAPI(
    title="Chess API",
    version="1.0.0",
    description="API for chess game analysis and user management"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
