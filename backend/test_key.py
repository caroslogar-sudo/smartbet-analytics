import httpx
import asyncio

async def test_key():
    key = "9d0fca5ede6f816bc6ba4d2a6c80fca1"
    url = f"https://api.the-odds-api.com/v4/sports/?apiKey={key}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Key is valid!")
            print(f"Remaining: {resp.headers.get('x-requests-remaining')}")
        else:
            print(f"Error: {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_key())
