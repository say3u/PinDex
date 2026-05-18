from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from db import get_db

router = APIRouter()

# Pin bitmask: pins 1-10 mapped to bits 0-9
# e.g. all pins standing = 0b1111111111 = 1023
# after knocking down pins 1,3,5 = pins 2,4,6 remain, etc.

class FrameCreate(BaseModel):
    game_id: str
    frame_number: int          # 1-10
    ball1_pins: int            # bitmask of pins knocked on ball 1 (0-1023)
    ball2_pins: int | None = None
    ball3_pins: int | None = None  # 10th frame only

    @field_validator("frame_number")
    @classmethod
    def valid_frame(cls, v):
        if not 1 <= v <= 10:
            raise ValueError("frame_number must be 1-10")
        return v

    @field_validator("ball1_pins", "ball2_pins", "ball3_pins")
    @classmethod
    def valid_pins(cls, v):
        if v is not None and not 0 <= v <= 1023:
            raise ValueError("pin bitmask must be 0-1023")
        return v


def is_strike(ball1_pins: int) -> bool:
    return ball1_pins == 1023


def is_spare(ball1_pins: int, ball2_pins: int | None) -> bool:
    if ball2_pins is None:
        return False
    return (ball1_pins | ball2_pins) == 1023 and not is_strike(ball1_pins)


def pins_left_standing(ball1_pins: int) -> int:
    """Return bitmask of pins still standing after ball 1."""
    return (~ball1_pins) & 1023


@router.post("/")
def log_frame(body: FrameCreate):
    db = get_db()

    strike = is_strike(body.ball1_pins)
    spare = is_spare(body.ball1_pins, body.ball2_pins)
    leave = pins_left_standing(body.ball1_pins)

    result = db.table("frames").insert({
        "game_id": body.game_id,
        "frame_number": body.frame_number,
        "ball1_pins": body.ball1_pins,
        "ball2_pins": body.ball2_pins,
        "ball3_pins": body.ball3_pins,
        "is_strike": strike,
        "is_spare": spare,
        "leave_bitmask": leave,
    }).execute()

    return result.data[0]


@router.get("/game/{game_id}")
def get_game_frames(game_id: str):
    db = get_db()
    result = (
        db.table("frames")
        .select("*")
        .eq("game_id", game_id)
        .order("frame_number")
        .execute()
    )
    return result.data
