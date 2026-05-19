from fastapi import APIRouter
from db import get_db
from collections import Counter

router = APIRouter()

# Named splits (bitmask → friendly name). Pin N = bit N-1.
NAMED_LEAVES = {
    0b1001000000: "7-10 split",       # pins 7 & 10 = 64+512 = 576
    0b0001100000: "6-7 split",        # pins 6 & 7  = 32+64  = 96
    0b0100000100: "3-9 split",        # pins 3 & 9  = 4+256  = 260
    0b0010000010: "2-8 split",        # pins 2 & 8  = 2+128  = 130
    0b1000100000: "6-10 split",       # pins 6 & 10 = 32+512 = 544
    0b0001001000: "4-7 split",        # pins 4 & 7  = 8+64   = 72
    0b0100100000: "6-9-10 baby",      # pins 6,9,10 = 32+256+512 = 800
    0b0011000000: "7-8 split",        # pins 7 & 8  = 64+128 = 192
    0b1100000000: "9-10 split",       # pins 9 & 10 = 256+512 = 768
    0b0110000000: "8-9 split",        # pins 8 & 9  = 128+256 = 384
}

def leave_label(bitmask: int) -> str:
    """Return a human-readable name for a leave bitmask."""
    if bitmask == 0:
        return "Strike"
    if bitmask in NAMED_LEAVES:
        return NAMED_LEAVES[bitmask]
    # List individual pin numbers
    pins = [i + 1 for i in range(10) if bitmask & (1 << i)]
    if len(pins) == 1:
        p = pins[0]
        suffix = {5: " (king pin)", 1: " (head pin)"}.get(p, "")
        return f"Pin {p}{suffix}"
    return "-".join(str(p) for p in pins) + " leave"


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
            "label": leave_label(bitmask),
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
