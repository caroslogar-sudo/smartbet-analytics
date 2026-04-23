import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from engine import engine
from models import StatusResponse
from scheduler import run_engine_cycle_loop
from services.firebase_wrapper import FirebaseWrapper
from services.sports_api import SportsDataService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)):
    """Valida el Firebase ID Token enviado en la cabecera Authorization."""
    try:
        decoded_token = auth.verify_id_token(res.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token inválido: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida de la aplicación.
    - Startup: Inicializa Firebase + carga datos fallback (0 créditos) + arranca scheduler.
    - Shutdown: Cancela el scheduler limpiamente.
    """
    # ── Startup ──
    FirebaseWrapper.initialize()
    logger.info("Firebase inicializado")

    # Carga inicial con fallback (0 créditos de API)
    try:
        await engine.get_current_top10_from_cache()
        logger.info(f"Estado inicial cargado: {len(engine.current_state)} oportunidades (fallback)")
    except Exception as exc:
        logger.warning(f"Carga inicial fallida: {exc}")

    # Arrancar el scheduler en background (modo conservador, 0 créditos automáticos)
    scheduler_task = asyncio.create_task(run_engine_cycle_loop())
    logger.info("Scheduler iniciado en modo conservador (0 creditos automaticos)")

    yield  # La aplicación está corriendo

    # ── Shutdown ──
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        logger.info("Scheduler detenido limpiamente")


app = FastAPI(title="SmartBet Analytics API", version="3.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── REST Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/status", response_model=StatusResponse, tags=["Engine"])
async def get_engine_status(user=Depends(get_current_user)):
    """Estado actual del engine, fuente de datos y créditos restantes de API."""
    from datetime import datetime
    quota = SportsDataService.quota_status()
    return StatusResponse(
        status="running",
        last_update=datetime.utcnow().isoformat() + "Z",
        opportunity_count=len(engine.current_state),
        engine_cycles=engine.cycle_count,
        firebase_connected=FirebaseWrapper.get_db() is not None,
    )


@app.get("/api/top10", tags=["Engine"])
async def get_top10(user=Depends(get_current_user)):
    """
    Devuelve las oportunidades actuales (desde caché/Firestore).
    NO consume créditos de API.
    """
    response = await engine.get_current_top10_from_cache()
    return response.model_dump()


@app.post("/api/refresh-manual", tags=["Engine"])
async def refresh_manual(user=Depends(get_current_user)):
    """
    Solicita datos REALES de la API de cuotas.
    COSTE: 1 crédito de The Odds API.

    Usar con moderación. En el plan gratuito (500 créditos/mes):
    - 1 click = 1 crédito
    - 500 activaciones disponibles al mes
    - Recomendado: máximo 2 veces al día
    """
    response = await engine.get_current_top10_real()
    real_count = sum(1 for o in response.opportunities if o.bookmaker not in ["Bet365", "Bwin", "Betfair", "Sportium", "Pinnacle"])
    quota = SportsDataService.quota_status()

    return {
        "success": True,
        "message": "Predicciones reales actualizadas correctamente",
        "real_predictions": real_count,
        "total_predictions": len(response.opportunities),
        "api_credits_remaining": quota["remaining"],
        "last_api_call": quota["last_call"],
        "timestamp": response.timestamp,
    }


@app.post("/api/refresh", tags=["Engine"])
async def force_refresh_legacy(user=Depends(get_current_user)):
    """
    Endpoint legacy. Redirige al modo caché (0 créditos).
    Para datos reales, usa /api/refresh-manual.
    """
    response = await engine.get_current_top10_from_cache()
    return {
        "message": "Estado refrescado desde caché (0 créditos consumidos)",
        "opportunity_count": len(response.opportunities),
        "timestamp": response.timestamp,
    }


@app.get("/api/quota", tags=["Engine"])
async def get_api_quota(user=Depends(get_current_user)):
    """
    Consulta el estado de la cuota de The Odds API sin consumir créditos.
    Nota: El conteo proviene de la última llamada real. Si no hubo ninguna, aparece como -1.
    """
    quota = SportsDataService.quota_status()
    return {
        "credits_remaining": quota["remaining"],
        "last_real_call": quota["last_call"],
        "is_real_data_loaded": engine._is_real_data,
        "real_data_timestamp": engine._real_data_timestamp,
        "note": (
            "Registra una nueva key gratuita en https://the-odds-api.com "
            "si el saldo es 0 o hay errores 401."
        ),
    }


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/top10")
async def websocket_top10(websocket: WebSocket):
    await websocket.accept()
    logger.info("Cliente WebSocket conectado")
    try:
        while True:
            # El WebSocket sirve datos desde caché (0 créditos)
            data = await engine.get_current_top10_from_cache()
            await websocket.send_json(data.model_dump())
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logger.info("Cliente WebSocket desconectado")
