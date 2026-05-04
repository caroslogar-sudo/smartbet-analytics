import httpx
import asyncio

async def test_rapid_key():
    key = "f8349b8032mshec8ae9a4cb8086cp1f0989jsn510f191c9b78"
    host = "sportscore1.p.rapidapi.com"
    url = f"https://{host}/sports"
    headers = {
        "x-rapidapi-key": key,
        "x-rapidapi-host": host
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("RapidAPI Key is valid!")
        else:
            print(f"Error: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_rapid_key())
