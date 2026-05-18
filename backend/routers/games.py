from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter()


class GameCreate(BaseModel):
    bowler_id: str
    lane: int | None = None
    league: str | None = None


@router.post("/")
def create_game(body: GameCreate):
    db = get_db()
    result = db.table("games").insert({
        "bowler_id": body.bowler_id,
        "lane": body.lane,
        "league": body.league,
    }).execute()
    return result.data[0]


@router.get("/{game_id}")
def get_game(game_id: str):
    db = get_db()
    result = db.table("games").select("*, frames(*)").eq("id", game_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Game not found")
    return result.data


@router.get("/bowler/{bowler_id}")
def get_bowler_games(bowler_id: str, limit: int = 20):
    db = get_db()
    result = (
        db.table("games")
        .select("*")
        .eq("bowler_id", bowler_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data
