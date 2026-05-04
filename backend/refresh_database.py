
import asyncio
import logging
import os
from engine import engine
from services.firebase_wrapper import FirebaseWrapper
from services.sports_api import SportsDataService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("RefreshDB")

async def refresh_all():
    """
    Realiza una carga COMPLETA de todas las ligas (17 créditos)
    para asegurar que el usuario vea información real e inmediata.
    """
    logger.info("Iniciando Refresco Total de Base de Datos...")
    
    # Asegurar que el wrapper use el archivo correcto
    os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"] = "serviceAccountKey.json"
    FirebaseWrapper.initialize()
    
    if not FirebaseWrapper.is_connected():
        logger.error("No se pudo conectar a Firebase. Abortando.")
        return

    # Forzar carga real de todas las ligas
    response = await engine.get_current_top10_real()
    
    if response.opportunities:
        logger.info(f"ÉXITO: {len(response.opportunities)} oportunidades reales cargadas y persistidas en Firestore.")
        # Mostrar las primeras 3 para confirmar calidad
        for opp in response.opportunities[:3]:
            logger.info(f" Pick: {opp.home} vs {opp.away} | {opp.market} | CC: {opp.cc}%")
            logger.info(f" Razón: {opp.statisticalReason[:100]}...")
    else:
        logger.warning("ATENCIÓN: No se encontraron partidos activos en este momento en ninguna liga.")

if __name__ == "__main__":
    asyncio.run(refresh_all())
