
import asyncio
import logging
from engine import engine

# Configurar logging para ver el progreso
logging.basicConfig(level=logging.INFO)

async def main():
    print("Iniciando actualizacion manual de datos REALES...")
    # Forzar la captura de datos reales (usara SportScore + The Odds API)
    response = await engine.get_current_top10_real()
    
    opps = response.opportunities
    print(f"\nProceso finalizado. Se han capturado {len(opps)} oportunidades reales.")
    
    # Mostrar un resumen de lo capturado
    sports = {}
    for o in opps:
        sports[o.sport] = sports.get(o.sport, 0) + 1
    
    print("Resumen por deporte:")
    for s, count in sports.items():
        print(f"- {s}: {count}")

if __name__ == "__main__":
    asyncio.run(main())
