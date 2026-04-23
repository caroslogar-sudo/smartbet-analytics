"""
Test real con la nueva API key.
Hace UNA sola llamada a The Odds API y muestra los partidos proximos reales.
Coste: 1 credito.
"""
import urllib.request
import json
from datetime import datetime, timezone

API_KEY = "9d0fca5ede6f816bc6ba4d2a6c80fca1"

# Endpoint: LaLiga con h2h + totals
URL = (
    "https://api.the-odds-api.com/v4/sports/soccer_spain_la_liga/odds/"
    f"?apiKey={API_KEY}&regions=eu&markets=h2h,totals&oddsFormat=decimal"
)

print("=" * 55)
print("  TEST API KEY NUEVA — 1 credito consumido")
print("=" * 55)

req = urllib.request.Request(URL)
try:
    with urllib.request.urlopen(req, timeout=12) as resp:
        headers = dict(resp.headers)
        data = json.loads(resp.read())
except urllib.error.HTTPError as e:
    print(f"\nERROR {e.code}: {e.reason}")
    if e.code == 401:
        print("La clave sigue invalida. Verifica en the-odds-api.com")
    raise SystemExit(1)

remaining = headers.get("x-requests-remaining", "?")
used = headers.get("x-requests-used", "?")

print(f"\nCreditos RESTANTES : {remaining}")
print(f"Creditos USADOS    : {used}")
print(f"Partidos en LaLiga : {len(data)}")

now_utc = datetime.now(timezone.utc)
futures = []
for p in data:
    try:
        dt = datetime.fromisoformat(p["commence_time"].replace("Z", "+00:00"))
        if dt > now_utc:
            futures.append((dt, p))
    except Exception:
        pass

futures.sort(key=lambda x: x[0])
print(f"Partidos PROXIMOS  : {len(futures)}")
print()

for dt, p in futures[:5]:
    fecha = dt.strftime("%d/%m/%Y  %H:%M UTC")
    home = p.get("home_team", "?")
    away = p.get("away_team", "?")
    books = p.get("bookmakers", [])
    print(f"  {home} vs {away}")
    print(f"  Fecha : {fecha}")
    print(f"  Casas de apuestas con cuotas: {len(books)}")
    if books:
        bk = books[0]
        for mkt in bk.get("markets", []):
            if mkt["key"] == "h2h":
                cuotas = "  |  ".join(
                    f"{o['name']}: {o['price']}"
                    for o in mkt["outcomes"]
                )
                print(f"  Cuotas ({bk['title']}): {cuotas}")
    print()

print("=" * 55)
print(f"CONCLUSION: {'OK - API funcionando con datos reales' if futures else 'Sin partidos proximos en LaLiga'}")
print("=" * 55)
