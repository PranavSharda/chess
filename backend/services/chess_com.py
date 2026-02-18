"""Fetch games from the Chess.com public API."""
from datetime import datetime
from typing import List, Literal

import httpx

TIMEFRAME_MONTHS = {
    "3_months": 3,
    "1_year": 12,
    "5_years": 60,
    "10_years": 120,
}

ALLOWED_TIME_CLASSES = frozenset({"rapid", "blitz", "bullet"})
BASE_URL = "https://api.chess.com/pub/player"


def fetch_chess_com_games(
    username: str,
    timeframe: Literal["3_months", "1_year", "5_years", "10_years"] = "3_months",
    game_types: List[str] | None = None,
) -> List[dict]:
    """
    Fetch games from Chess.com API for the given username and timeframe.
    Only rapid, blitz, and bullet games are included.
    """
    if game_types is None:
        game_types = ["rapid", "blitz", "bullet"]
    allowed = ALLOWED_TIME_CLASSES & set(game_types)
    if not allowed:
        allowed = ALLOWED_TIME_CLASSES

    months_to_fetch = TIMEFRAME_MONTHS.get(timeframe, 3)
    now = datetime.utcnow()
    games: List[dict] = []

    with httpx.Client(timeout=30.0) as client:
        year, month = now.year, now.month
        for _ in range(months_to_fetch):
            url = f"{BASE_URL}/{username}/games/{year}/{month:02d}"
            try:
                resp = client.get(url)
                if resp.status_code == 404:
                    pass
                elif resp.status_code != 200:
                    resp.raise_for_status()
                else:
                    data = resp.json()
                    for g in data.get("games") or []:
                        time_class = (g.get("time_class") or "").lower()
                        if time_class not in allowed:
                            continue
                        white = g.get("white") or {}
                        black = g.get("black") or {}
                        games.append({
                            "pgn": g.get("pgn") or "",
                            "tcn": g.get("tcn"),
                            "chess_com_username": username,
                            "chess_com_game_uuid": g.get("uuid"),
                            "end_time": g.get("end_time"),
                            "time_class": time_class,
                            "white_username": white.get("username"),
                            "black_username": black.get("username"),
                            "white_result": white.get("result"),
                            "black_result": black.get("result"),
                            "time_control": g.get("time_control"),
                            "white": white,
                            "black": black,
                            "uuid": g.get("uuid"),
                        })
            except httpx.HTTPError:
                pass

            month -= 1
            if month < 1:
                month = 12
                year -= 1

    return games
