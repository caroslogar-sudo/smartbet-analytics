import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("THE_ODDS_API_KEY")

URL = f"https://api.the-odds-api.com/v4/sports/soccer_spain_la_liga/odds/?apiKey={API_KEY}&regions=eu&markets=h2h,totals,spreads&oddsFormat=decimal"

req = urllib.request.Request(URL)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        if data:
            print(f"Match: {data[0]['home_team']} vs {data[0]['away_team']}")
            books = data[0].get('bookmakers', [])
            if books:
                markets = [m['key'] for m in books[0].get('markets', [])]
                print(f"Markets available for bookmaker 1: {markets}")
        else:
            print("No data")
except Exception as e:
    print(f"Error: {e}")
