from fastapi import APIRouter
from db import get_db
from collections import Counter

router = APIRouter()

PIN_NAMES = {
    0b0000000001: "1 (head pin)",
    0b0000000010: "2",
    0b0000000100: "3",
    0b0000001000: "4",
    0b0000010000: "5 (king pin)",
    0b0000100000: "6",
    0b0001000000: "7",
    0b0010000000: "8",
    0b0100000000: "9",
    0b1000000000: "10",
    0b1000000001: "7-10 split",
    0b0001100000: "6-7 split",
    0b0100000100: "3-9 split",
    0b0010000010: "2-8 split",
}


@router.get("/{bowler_id}/summary")
def get_summary(bowler_id: str):
    db = get_db()

    frames = (
        db.table("frames")
        .select("*, games!inner(bowler_id)")
        .eq("games.bowler_id", bowler_id)
        .execute()
    ).data

    if not frames:
        return {"message": "No data yet"}

    total = len(frames)
    strikes = sum(1 for f in frames if f["is_strike"])
    spares = sum(1 for f in frames if f["is_spare"])

    # Count leave patterns (non-strike frames only)
    leave_counter = Counter(
        f["leave_bitmask"] for f in frames
        if not f["is_strike"] and f["leave_bitmask"] != 0
    )
    top_leaves = [
        {
            "bitmask": bitmask,
            "label": PIN_NAMES.get(bitmask, f"pins {bin(bitmask)}"),
            "count": count,
        }
        for bitmask, count in leave_counter.most_common(5)
    ]

    # Spare conversion: frames where ball2 converted the leave
    spare_attempts = [f for f in frames if not f["is_strike"] and f["ball2_pins"] is not None]
    conversions = sum(
        1 for f in spare_attempts
        if f["is_spare"]
    )
    spare_pct = round(conversions / len(spare_attempts) * 100, 1) if spare_attempts else 0

    return {
        "total_frames": total,
        "strike_rate": round(strikes / total * 100, 1),
        "spare_conversion_rate": spare_pct,
        "top_leaves": top_leaves,
    }
