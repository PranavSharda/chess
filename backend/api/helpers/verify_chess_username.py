import httpx

async def verify_user(username: str) -> httpx.Response:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.chess.com/pub/player/{username}",
            timeout=10.0
        )
    return response