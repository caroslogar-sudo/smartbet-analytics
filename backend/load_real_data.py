"""
Carga inicial de datos reales en Firestore.
Ejecuta get_current_top10_real() UNA sola vez: consume 1 credito exacto.
Usar manualmente tras actualizar la API key.
"""
import asyncio
import os
import sys

# Asegura que el path incluye el directorio del backend
sys.path.insert(0, os.path.dirname(__file__))

async def main():
    from engine import engine
    from services.firebase_wrapper import FirebaseWrapper

    print("Inicializando Firebase...")
    FirebaseWrapper.initialize()

    print("Llamando a la API real (1 credito para cuotas)...")
    result = await engine.get_current_top10_real()

    from services.sports_api import SportsDataService
    print("Obteniendo marcadores en directo (créditos según ligas)...")
    raw_scores = await SportsDataService.fetch_live_scores()
    
    live_matches = []
    finished_matches = []
    
    for s in raw_scores:
        score_data = {
            "id": s.get("id"),
            "home": s.get("home_team"),
            "away": s.get("away_team"),
            "sport": "Fútbol" if "soccer" in s.get("sport_key", "") else "Baloncesto",
            "league": s.get("sport_title"),
            "completed": s.get("completed", False),
            "scores": s.get("scores", []),
            "last_update": s.get("last_update")
        }
        if score_data["completed"]:
            finished_matches.append(score_data)
        else:
            live_matches.append(score_data)
            
    FirebaseWrapper.set_live_data(live_matches, finished_matches)
    print(f"Directos actualizados: {len(live_matches)} en juego, {len(finished_matches)} finalizados.")

    real_opps = [o for o in result.opportunities if o.bookmaker_odds]
    print(f"\nResultado:")
    print(f"  Total oportunidades: {len(result.opportunities)}")
    print(f"  Con cuotas reales  : {len(real_opps)}")
    print(f"  Fuente de datos    : {'API REAL' if engine._is_real_data else 'Fallback'}")
    print()

    for o in result.opportunities[:5]:
        print(f"  [{o.cc}% CC] {o.home} vs {o.away} — {o.market}: {o.prediction} @ {o.odds}")

    print(f"\nDatos persistidos en Firestore: {result.timestamp}")

if __name__ == "__main__":
    asyncio.run(main())
