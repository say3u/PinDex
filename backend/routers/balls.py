import os
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

SYSTEM_PROMPT = """You are a bowling ball expert with deep knowledge of every ball ever made.
When given a ball name, return ONLY a JSON object with these exact fields:
{
  "name": "full official ball name",
  "brand": "brand name",
  "coverstock": "coverstock name and type (solid/pearl/hybrid)",
  "core": "core name",
  "rg": 2.50,
  "diff": 0.050,
  "finish": "factory finish (e.g. 500/2000 Abralon)",
  "length": "Short | Medium-Short | Medium | Medium-Long | Long | Very Long",
  "backend": "Low | Medium | Strong | Very Strong",
  "hook": "Low | Medium | Medium-High | High | Very High",
  "recommended_for": "one sentence on who this ball is best for",
  "lane_condition": "Oily | Medium | Dry | All",
  "found": true
}
If you don't recognize the ball, return {"found": false}.
Return ONLY valid JSON. No markdown, no explanation."""


class BallQuery(BaseModel):
    name: str


@router.post("/lookup")
def lookup_ball(body: BallQuery):
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Ball name: {body.name}"},
        ],
        temperature=0.1,
        max_tokens=400,
    )
    import json
    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"found": False}


@router.post("/recommend")
def recommend_ball(body: dict):
    """
    Given bowler's bag and current session stats, recommend which ball to throw.
    body: { balls: [...], strike_rate: float, recent_leaves: [...], oil_pattern: str, frames_played: int }
    """
    client = Groq(api_key=os.environ["GROQ_API_KEY"])

    prompt = f"""A bowler is currently playing on a {body.get('oil_pattern', 'house')} shot.
Stats so far this session:
- Strike rate: {body.get('strike_rate', 0)}%
- Frames played: {body.get('frames_played', 0)}
- Most common leaves: {', '.join(body.get('recent_leaves', [])) or 'none yet'}
- Average ball speed: {body.get('avg_speed', 'unknown')} mph
- Hook amount: {body.get('avg_hook', 'unknown')}/10

Their bag contains these balls:
{chr(10).join(f"- {b['name']} ({b.get('hook','?')} hook, {b.get('length','?')} length, {b.get('coverstock','?')})" for b in body.get('balls', []))}

Recommend which ball they should use RIGHT NOW and explain why in 2-3 sentences.
Also give one specific adjustment tip (board or target change).
Return ONLY JSON:
{{
  "recommended_ball": "exact ball name from their bag",
  "reason": "2-3 sentence explanation",
  "adjustment": "specific tip e.g. move 2 boards left and target the 2nd arrow"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
    )
    import json
    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"recommended_ball": None, "reason": "Could not generate recommendation.", "adjustment": ""}
