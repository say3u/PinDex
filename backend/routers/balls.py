import os
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
from ball_db import find_ball

router = APIRouter()


class BallQuery(BaseModel):
    name: str


@router.post("/lookup")
def lookup_ball(body: BallQuery):
    # Check curated database first — always accurate
    ball = find_ball(body.name)
    if ball:
        return {**ball, "found": True, "source": "database"}

    # Fall back to AI for unknown balls (clearly labeled)
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    prompt = """You are a bowling ball expert. Return ONLY valid JSON for this ball.
RULES: set rg and diff to null unless you are 100% certain of the exact published spec.
Never invent brand names or model names. If you don't recognize the ball, return {"found": false}.
Fields: name, brand, coverstock (or null), core (or null), rg (number or null), diff (number or null),
finish (or null), length (Short|Medium-Short|Medium|Medium-Long|Long|Very Long),
backend (Low|Medium|Strong|Very Strong), hook (Low|Medium|Medium-High|High|Very High),
recommended_for (string), lane_condition (Oily|Medium|Dry|All), found (true)"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Ball: {body.name}"},
        ],
        temperature=0.1,
        max_tokens=400,
    )
    import json
    try:
        result = json.loads(response.choices[0].message.content)
        if result.get("found"):
            result["source"] = "ai"
        return result
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
