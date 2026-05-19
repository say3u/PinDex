import os
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

SYSTEM_PROMPT = """You are a bowling ball expert. When given a ball name, identify the ball and return ONLY a JSON object.

CRITICAL RULES:
- For rg and diff: only return real numbers if you are 100% certain of the exact spec. Otherwise use null.
- For finish, core, coverstock name: only return the real value if you are certain. Otherwise use null.
- Do NOT invent or estimate numbers. A null is better than a wrong number.
- The descriptive fields (length, backend, hook, lane_condition, recommended_for) are general categories — use your best judgment for these.
- If you cannot confidently identify the ball, return {"found": false}.

Return ONLY valid JSON with these exact fields (no markdown, no explanation):
{
  "name": "full official ball name",
  "brand": "brand name",
  "coverstock": "coverstock name and type (solid/pearl/hybrid) or null if unsure",
  "core": "core name or null if unsure",
  "rg": null,
  "diff": null,
  "finish": "factory finish or null if unsure",
  "length": "Short | Medium-Short | Medium | Medium-Long | Long | Very Long",
  "backend": "Low | Medium | Strong | Very Strong",
  "hook": "Low | Medium | Medium-High | High | Very High",
  "recommended_for": "one sentence on who this ball is best for",
  "lane_condition": "Oily | Medium | Dry | All",
  "found": true
}"""


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
