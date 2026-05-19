from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import games, frames, stats, balls

load_dotenv()

app = FastAPI(title="PinDex API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(frames.router, prefix="/frames", tags=["frames"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(balls.router, prefix="/balls", tags=["balls"])


@app.get("/health")
def health():
    return {"status": "ok"}
