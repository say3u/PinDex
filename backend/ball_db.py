"""
Curated bowling ball database with verified specs.
RG/diff only included when confirmed from manufacturer data.
"""

# Keys are lowercase normalized names (with common aliases)
BALL_DB: dict[str, dict] = {

    # ── STORM ──────────────────────────────────────────────────────────────
    "storm phaze ii": {
        "name": "Storm Phaze II", "brand": "Storm",
        "coverstock": "R2S Pearl", "core": "Velocity (Symmetric)",
        "rg": 2.48, "diff": 0.051, "finish": "1500 Polished",
        "length": "Medium", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Versatile benchmark ball for medium to heavy oil; great all-around choice for league bowlers.",
    },
    "storm phaze iii": {
        "name": "Storm Phaze III", "brand": "Storm",
        "coverstock": "R2S Solid", "core": "Velocity (Symmetric)",
        "rg": 2.48, "diff": 0.051, "finish": "500/2000 Abralon + Reacta Gloss",
        "length": "Medium-Short", "backend": "Medium", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Heavy oil specialist; earlier read and more continuous motion than the Phaze II.",
    },
    "storm nova": {
        "name": "Storm Nova", "brand": "Storm",
        "coverstock": "R2S Pearl", "core": "Pulsar (Asymmetric)",
        "rg": 2.47, "diff": 0.053, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Very Strong", "hook": "Very High",
        "lane_condition": "Oily",
        "recommended_for": "High-rev bowlers and crankers; explosive backend on heavy oil.",
    },
    "storm iq tour": {
        "name": "Storm IQ Tour", "brand": "Storm",
        "coverstock": "Reactor Solid", "core": "Id (Symmetric)",
        "rg": 2.56, "diff": 0.018, "finish": "Reacta Gloss",
        "length": "Long", "backend": "Low", "hook": "Medium",
        "lane_condition": "Dry",
        "recommended_for": "Control ball for medium-dry and dry lanes; smooth, predictable arc.",
    },
    "storm iq tour pearl": {
        "name": "Storm IQ Tour Pearl", "brand": "Storm",
        "coverstock": "Reactor Pearl", "core": "Id (Symmetric)",
        "rg": 2.55, "diff": 0.037, "finish": "1500 Polished",
        "length": "Long", "backend": "Medium", "hook": "Medium",
        "lane_condition": "Dry",
        "recommended_for": "Benchmark control ball for drier lane conditions; clean through the front.",
    },
    "storm axiom": {
        "name": "Storm Axiom", "brand": "Storm",
        "coverstock": "Reactor Solid", "core": "Inverted Fe2 Technology (Symmetric)",
        "rg": 2.49, "diff": 0.058, "finish": "500/2000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Strong symmetric option for heavy oil with a continuous backend motion.",
    },
    "storm hyroad pearl": {
        "name": "Storm Hyroad Pearl", "brand": "Storm",
        "coverstock": "Reactor Pearl", "core": "Reflect (Symmetric)",
        "rg": 2.48, "diff": 0.046, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium",
        "recommended_for": "Great benchmark ball that reads mid-lane and has a defined backend.",
    },
    "storm mix": {
        "name": "Storm Mix", "brand": "Storm",
        "coverstock": "Polyester", "core": "Light Bulb (Symmetric)",
        "rg": 2.70, "diff": 0.014, "finish": "High Gloss",
        "length": "Very Long", "backend": "Low", "hook": "Low",
        "lane_condition": "Dry",
        "recommended_for": "Plastic spare ball; zero hook for picking up corner pins reliably.",
    },

    # ── MOTIV ──────────────────────────────────────────────────────────────
    "motiv venom shock": {
        "name": "Motiv Venom Shock", "brand": "Motiv",
        "coverstock": "Turmoil MFS Pearl", "core": "Turbulent (Asymmetric)",
        "rg": 2.49, "diff": 0.055, "finish": "4000 Grit LSS",
        "length": "Medium", "backend": "Strong", "hook": "Very High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Aggressive asymmetric for medium-heavy oil; popular tournament ball.",
    },
    "motiv trident quest": {
        "name": "Motiv Trident Quest", "brand": "Motiv",
        "coverstock": "Gauntlet Pearl", "core": "Turbulent (Asymmetric)",
        "rg": 2.49, "diff": 0.055, "finish": "3000 Grit SiaAir",
        "length": "Medium-Long", "backend": "Very Strong", "hook": "Very High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Strong asymmetric with a big backend; great on fresh medium-heavy oil.",
    },
    "motiv forge fire": {
        "name": "Motiv Forge Fire", "brand": "Motiv",
        "coverstock": "Propulsion HV Solid", "core": "Catalyst (Asymmetric)",
        "rg": None, "diff": None, "finish": "3000 Grit SiaAir",
        "length": "Medium-Short", "backend": "Medium", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Heavy oil control with strong midlane read.",
    },
    "motiv rebel tank": {
        "name": "Motiv Rebel Tank", "brand": "Motiv",
        "coverstock": "Propulsion MV1 Solid", "core": "Turbulent (Asymmetric)",
        "rg": None, "diff": None, "finish": "500 Grit SiaAir",
        "length": "Short", "backend": "Medium", "hook": "Very High",
        "lane_condition": "Very Oily",
        "recommended_for": "Heavy oil ball with an aggressive coverstock and early roll.",
    },

    # ── ROTO GRIP ──────────────────────────────────────────────────────────
    "roto grip idol": {
        "name": "Roto Grip Idol", "brand": "Roto Grip",
        "coverstock": "MicroTrax-S18 Solid", "core": "Ikon (Symmetric)",
        "rg": 2.49, "diff": 0.048, "finish": "4000 Grit SiaAir",
        "length": "Medium", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Versatile high-performance symmetric for medium-heavy oil; popular benchmark.",
    },
    "roto grip idol pearl": {
        "name": "Roto Grip Idol Pearl", "brand": "Roto Grip",
        "coverstock": "MicroTrax-S18 Pearl", "core": "Ikon (Symmetric)",
        "rg": 2.49, "diff": 0.048, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium",
        "recommended_for": "Cleaner front end than the Idol Solid with a punchy backend reaction.",
    },
    "roto grip hustle ink": {
        "name": "Roto Grip Hustle Ink", "brand": "Roto Grip",
        "coverstock": "RP2 Pearl", "core": "Nucleus (Symmetric)",
        "rg": 2.56, "diff": 0.038, "finish": "1500 Polished",
        "length": "Long", "backend": "Medium", "hook": "Medium",
        "lane_condition": "Medium-Dry",
        "recommended_for": "Entry to intermediate ball for medium to drier conditions; consistent and forgiving.",
    },
    "roto grip rubicon uc2": {
        "name": "Roto Grip Rubicon UC2", "brand": "Roto Grip",
        "coverstock": "UC2 Solid", "core": "Hexion (Asymmetric)",
        "rg": 2.47, "diff": 0.057, "finish": "500/2000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "Very High",
        "lane_condition": "Oily",
        "recommended_for": "Top-of-bag asymmetric for heavy and sport patterns.",
    },

    # ── HAMMER ─────────────────────────────────────────────────────────────
    "hammer black widow 2.0": {
        "name": "Hammer Black Widow 2.0", "brand": "Hammer",
        "coverstock": "Aggression CFI Solid", "core": "Gas Mask (Asymmetric)",
        "rg": 2.48, "diff": 0.060, "finish": "500/1000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "Very High",
        "lane_condition": "Oily",
        "recommended_for": "Iconic high-performance asymmetric for heavy oil; big hook with strong midlane.",
    },
    "hammer black widow ghost": {
        "name": "Hammer Black Widow Ghost", "brand": "Hammer",
        "coverstock": "Aggression CFI Pearl", "core": "Gas Mask (Asymmetric)",
        "rg": 2.49, "diff": 0.058, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Very Strong", "hook": "Very High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Pearl version of the Black Widow for medium-heavy oil with a big backend flip.",
    },
    "hammer scandal s": {
        "name": "Hammer Scandal/S", "brand": "Hammer",
        "coverstock": "Envy Solid", "core": "Arson (Asymmetric)",
        "rg": None, "diff": None, "finish": "500/1000 Abralon",
        "length": "Medium-Short", "backend": "Medium", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Mid-performance asymmetric with smooth arc on medium-heavy oil.",
    },
    "hammer black widow": {
        "name": "Hammer Black Widow", "brand": "Hammer",
        "coverstock": "Aggression CFI Solid", "core": "Gas Mask (Asymmetric)",
        "rg": 2.48, "diff": 0.060, "finish": "500/1000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "Very High",
        "lane_condition": "Oily",
        "recommended_for": "Classic high-performance asymmetric for heavy oil; strong and aggressive.",
    },

    # ── BRUNSWICK ──────────────────────────────────────────────────────────
    "brunswick quantum evo solid": {
        "name": "Brunswick Quantum Evo Solid", "brand": "Brunswick",
        "coverstock": "Durability Enhanced Solid", "core": "EVO Core (Asymmetric)",
        "rg": 2.47, "diff": 0.060, "finish": "500/2000 Abralon + Factory Compound",
        "length": "Medium-Short", "backend": "Strong", "hook": "Very High",
        "lane_condition": "Oily",
        "recommended_for": "Top-tier asymmetric for heavy oil; massive hook potential.",
    },
    "brunswick zenith": {
        "name": "Brunswick Zenith", "brand": "Brunswick",
        "coverstock": "Melee Pearl", "core": "Magnitude (Symmetric)",
        "rg": None, "diff": None, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium",
        "recommended_for": "Mid-performance symmetric with clean front and angular backend.",
    },
    "brunswick rhino": {
        "name": "Brunswick Rhino", "brand": "Brunswick",
        "coverstock": "Reactive Solid", "core": "Light Bulb (Symmetric)",
        "rg": 2.58, "diff": 0.030, "finish": "Compound + Polish",
        "length": "Medium-Long", "backend": "Low", "hook": "Medium",
        "lane_condition": "Medium-Dry",
        "recommended_for": "Entry-level reactive ball; smooth, predictable, great for beginners and dry conditions.",
    },

    # ── DV8 ────────────────────────────────────────────────────────────────
    "dv8 pitbull bite": {
        "name": "DV8 Pitbull Bite", "brand": "DV8",
        "coverstock": "FleX Hybrid", "core": "Pitbull (Asymmetric)",
        "rg": 2.49, "diff": 0.054, "finish": "500/2000 Abralon + Polish",
        "length": "Medium-Long", "backend": "Very Strong", "hook": "Very High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "Aggressive asymmetric with a strong backend on medium-heavy oil.",
    },
    "dv8 hellcat": {
        "name": "DV8 Hellcat", "brand": "DV8",
        "coverstock": "FleX Solid", "core": "Pitbull (Asymmetric)",
        "rg": 2.49, "diff": 0.053, "finish": "500/2000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Solid coverstock version of the Pitbull for heavy oil with earlier read.",
    },

    # ── 900 GLOBAL ─────────────────────────────────────────────────────────
    "900 global zen": {
        "name": "900 Global Zen", "brand": "900 Global",
        "coverstock": "Composite Nano+", "core": "Meditate (Symmetric)",
        "rg": 2.49, "diff": 0.050, "finish": "4000 Grit",
        "length": "Medium", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "High-performance symmetric with strong midlane and smooth backend.",
    },
    "900 global dream on": {
        "name": "900 Global Dream On", "brand": "900 Global",
        "coverstock": "Composite Nano Pearl+", "core": "Meditate (Symmetric)",
        "rg": None, "diff": None, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium",
        "recommended_for": "Pearl version of the Zen; cleaner and more angular backend.",
    },

    # ── COLUMBIA 300 ───────────────────────────────────────────────────────
    "columbia 300 white dot": {
        "name": "Columbia 300 White Dot", "brand": "Columbia 300",
        "coverstock": "Polyester", "core": "Pancake (Symmetric)",
        "rg": 2.73, "diff": 0.008, "finish": "High Gloss",
        "length": "Very Long", "backend": "Low", "hook": "Low",
        "lane_condition": "Dry",
        "recommended_for": "Classic plastic spare ball; zero hook for picking up spares reliably.",
    },
    "columbia 300 messenger": {
        "name": "Columbia 300 Messenger", "brand": "Columbia 300",
        "coverstock": "FX-32 Pearl", "core": "Centripetal HD (Symmetric)",
        "rg": None, "diff": None, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Strong", "hook": "High",
        "lane_condition": "Medium",
        "recommended_for": "Mid-performance pearl for medium oil with angular backend.",
    },

    # ── EBONITE ────────────────────────────────────────────────────────────
    "ebonite maxim": {
        "name": "Ebonite Maxim", "brand": "Ebonite",
        "coverstock": "Polyester", "core": "Maxim (Symmetric)",
        "rg": 2.70, "diff": 0.012, "finish": "High Gloss",
        "length": "Very Long", "backend": "Low", "hook": "Low",
        "lane_condition": "All",
        "recommended_for": "Budget-friendly plastic spare ball with minimal hook; great for beginners and spare shooting.",
    },
    "ebonite turbo r": {
        "name": "Ebonite Turbo/R", "brand": "Ebonite",
        "coverstock": "Reactive Solid", "core": "Gear (Symmetric)",
        "rg": None, "diff": None, "finish": "Factory Polish",
        "length": "Medium-Long", "backend": "Medium", "hook": "Medium",
        "lane_condition": "Medium-Dry",
        "recommended_for": "Entry-level reactive ball for medium to dry conditions.",
    },

    # ── TRACK ──────────────────────────────────────────────────────────────
    "track alias": {
        "name": "Track Alias", "brand": "Track",
        "coverstock": "Amplify Pearl", "core": "Alternate (Asymmetric)",
        "rg": None, "diff": None, "finish": "1500 Polished",
        "length": "Medium-Long", "backend": "Very Strong", "hook": "Very High",
        "lane_condition": "Medium-Oily",
        "recommended_for": "High-performance asymmetric with clean front end and explosive backend.",
    },
    "track c3": {
        "name": "Track C3", "brand": "Track",
        "coverstock": "Amplify Solid", "core": "Alternate (Asymmetric)",
        "rg": None, "diff": None, "finish": "500/2000 Abralon",
        "length": "Medium-Short", "backend": "Strong", "hook": "High",
        "lane_condition": "Oily",
        "recommended_for": "Solid coverstock asymmetric for heavy oil with strong midlane read.",
    },
}

# Aliases for common name variations
ALIASES: dict[str, str] = {
    "phaze ii": "storm phaze ii",
    "phaze 2": "storm phaze ii",
    "phaze iii": "storm phaze iii",
    "phaze 3": "storm phaze iii",
    "nova": "storm nova",
    "iq tour": "storm iq tour",
    "iq tour pearl": "storm iq tour pearl",
    "axiom": "storm axiom",
    "hyroad pearl": "storm hyroad pearl",
    "hyroad": "storm hyroad pearl",
    "mix": "storm mix",
    "venom shock": "motiv venom shock",
    "trident quest": "motiv trident quest",
    "idol": "roto grip idol",
    "idol pearl": "roto grip idol pearl",
    "hustle ink": "roto grip hustle ink",
    "rubicon": "roto grip rubicon uc2",
    "black widow": "hammer black widow 2.0",
    "black widow 2.0": "hammer black widow 2.0",
    "black widow ghost": "hammer black widow ghost",
    "scandal": "hammer scandal s",
    "rhino": "brunswick rhino",
    "pitbull": "dv8 pitbull bite",
    "pitbull bite": "dv8 pitbull bite",
    "zen": "900 global zen",
    "white dot": "columbia 300 white dot",
    "maxim": "ebonite maxim",
    "alias": "track alias",
}


def find_ball(name: str) -> dict | None:
    """Look up a ball by name. Returns None if not found."""
    key = name.lower().strip()
    # Direct match
    if key in BALL_DB:
        return BALL_DB[key]
    # Alias match
    if key in ALIASES:
        return BALL_DB[ALIASES[key]]
    # Partial match — check if key is contained in any DB key
    for db_key, ball in BALL_DB.items():
        if key in db_key or db_key in key:
            return ball
    # Brand-stripped partial match
    for alias_key, db_key in ALIASES.items():
        if key in alias_key or alias_key in key:
            return BALL_DB[db_key]
    return None
