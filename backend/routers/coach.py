import os
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter()


class CoachRequest(BaseModel):
    frames_played: int
    strikes: int
    spares: int
    opens: int
    recent_leaves: list[str]       # last 5 leave labels
    spare_conversion_rate: float   # 0-100
    avg_speed: float | None = None
    avg_hook: float | None = None
    oil_pattern: str = "house"
    ball_name: str | None = None
    hand_style: str | None = None
    # last 5 frame outcomes e.g. ["strike","spare","open","strike","spare"]
    last_frames: list[str] = []


@router.post("/")
def get_coaching(body: CoachRequest):
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    leave_summary = ", ".join(body.recent_leaves) if body.recent_leaves else "none recorded"
    frame_summary = " → ".join(body.last_frames[-5:]) if body.last_frames else "not enough data"

    prompt = f"""You are an experienced bowling coach giving real-time advice to a league bowler mid-game.

CURRENT SESSION:
- Frames played: {body.frames_played}/10
- Strikes: {body.strikes} | Spares: {body.spares} | Opens: {body.opens}
- Spare conversion: {body.spare_conversion_rate:.0f}%
- Recent leaves: {leave_summary}
- Last frames: {frame_summary}
- Lane condition: {body.oil_pattern} shot
- Ball: {body.ball_name or "unknown"}
- Style: {body.hand_style or "unknown"}
- Avg speed: {f"{body.avg_speed:.1f} mph" if body.avg_speed else "not recorded"}
- Hook amount: {f"{body.avg_hook:.1f}/10" if body.avg_hook else "not recorded"}

Give this bowler 2-3 sentences of specific, actionable coaching advice. Focus on what the data shows they're struggling with most. Be direct and encouraging — like a coach talking to a player between frames.

Then give ONE specific adjustment tip (move X boards, target the Y arrow, adjust speed/hook).

Return ONLY valid JSON:
{{
  "headline": "6-word max summary of the issue (e.g. 'Leaving 10-pin — move feet left')",
  "advice": "2-3 sentences of coaching",
  "adjustment": "one specific thing to try on the next shot",
  "is_doing_well": true/false
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=300,
    )
    import json
    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {
            "headline": "Keep your head in it",
            "advice": "Focus on your process and trust your release. Every bowler has tough stretches — your mechanics will carry you through.",
            "adjustment": "Take a breath and commit fully to your next target board.",
            "is_doing_well": False,
        }
