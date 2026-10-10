"""
UrbanPulse MLOps FastAPI Infeference Service (HT-47 T02)
Líder MLOps & DevSecOps: Álvaro Tipián
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import time

from model_engine import model_engine

app = FastAPI(
    title="UrbanPulse MLOps Inference Engine",
    description="Servicio de Inferencia de Riesgo Vial y Monitoreo MLOps en Tiempo Real",
    version=model_engine.version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración de CORS estricto
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Modelos Pydantic de Validación Estricta
class RiskPredictionRequest(BaseModel):
    distrito: str = Field(..., example="Miraflores", description="Nombre del distrito")
    hora: int = Field(..., ge=0, le=23, example=18, description="Hora del día (0-23)")
    densidad_historica: float = Field(..., ge=0.0, le=500.0, example=85.5, description="Densidad vehicular histórica")
    es_hora_pico: Optional[bool] = Field(default=False, description="Flag de hora pico")

class RiskPredictionResponse(BaseModel):
    version_modelo: str
    probabilidad_riesgo: float
    nivel_riesgo: str
    confianza: float
    champion_active: bool
    metricas_drift: Dict[str, Any]
    tiempo_procesamiento_ms: float

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Endpoint de salud del servicio FastAPI para AWS Lightsail y Kubernetes."""
    return {
        "status": "healthy",
        "service": "urbanpulse-mlops-api",
        "version": model_engine.version,
        "champion_status": "ONLINE"
    }

@app.get("/model/info", status_code=status.HTTP_200_OK)
def model_info():
    """Retorna los metadatos del modelo activo en producción y su versión MLflow."""
    return {
        "model_name": model_engine.model_name,
        "active_version": model_engine.version,
        "stage": model_engine.model_stage,
        "champion_active": model_engine.active_champion,
        "tracking_server": "DagsHub" if model_engine.mlflow_uri else "Local"
    }

@app.post("/predict", response_model=RiskPredictionResponse, status_code=status.HTTP_200_OK)
def predict_risk(request: RiskPredictionRequest):
    """
    Endpoint de Inferencia de Riesgo Vial con Guardrails de Seguridad.
    """
    start_time = time.time()
    
    # Inferencia del modelo
    try:
        prediction = model_engine.predict_risk(
            distrito=request.distrito,
            hora=request.hora,
            densidad_historica=request.densidad_historica,
            es_hora_pico=request.es_hora_pico
        )
        
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        prediction["tiempo_procesamiento_ms"] = elapsed_ms
        
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en inferencia MLOps: {str(e)}"
        )
