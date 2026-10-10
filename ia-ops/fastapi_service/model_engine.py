"""
UrbanPulse MLOps Risk Inference Engine (v1.0.0)
Autor: Álvaro Tipián (MLOps & DevSecOps Leader)
"""

import os
import pandas as pd
import logging
from typing import Dict, Any
import mlflow.pyfunc
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mlops_engine")

class RiskModelEngine:
    def __init__(self, version: str = "1.0.0"):
        self.version = version
        self.model_name = "riesgo_vial"
        self.model_stage = "Production"
        self.active_champion = False
        self.model = None
        self.mlflow_uri = os.getenv("MLFLOW_TRACKING_URI")
        
        logger.info(f"MLOps RiskModelEngine inicializado con versión {self.version}")
        self._load_model()

    def _load_model(self):
        """Intenta cargar el modelo desde MLflow (Registro de Modelos)."""
        if not self.mlflow_uri:
            logger.warning("MLFLOW_TRACKING_URI no está configurado. Usando modo fallback.")
            return

        mlflow.set_tracking_uri(self.mlflow_uri)
        model_uri = f"models:/{self.model_name}/{self.model_stage}"
        
        try:
            logger.info(f"Intentando cargar modelo desde: {model_uri}")
            self.model = mlflow.pyfunc.load_model(model_uri)
            self.active_champion = True
            logger.info("Modelo de MLflow cargado exitosamente.")
        except Exception as e:
            logger.warning(f"No se pudo cargar el modelo desde MLflow: {e}")
            logger.warning("Usando heurística de fallback temporal.")
            self.active_champion = False
            self.model = None

    def predict_risk(self, distrito: str, hora: int, densidad_historica: float, es_hora_pico: bool) -> Dict[str, Any]:
        """
        Calcula el nivel de riesgo vial (0.0 a 1.0) usando el modelo de MLflow, o un fallback.
        """
        if self.active_champion and self.model:
            # Preparar los features para el modelo de MLflow (espera un DataFrame o formato soportado)
            input_data = pd.DataFrame([{
                "distrito": distrito,
                "hora": hora,
                "densidad_historica": densidad_historica,
                "es_hora_pico": int(es_hora_pico)
            }])
            
            try:
                prediction_result = self.model.predict(input_data)
                # Asumir que el modelo devuelve una probabilidad en la primera columna/elemento
                probabilidad = float(prediction_result[0])
            except Exception as e:
                logger.error(f"Error durante inferencia con modelo MLflow: {e}")
                return self._fallback_predict(distrito, hora, densidad_historica, es_hora_pico)
        else:
            return self._fallback_predict(distrito, hora, densidad_historica, es_hora_pico)

        # Categorización estandarizada
        if probabilidad >= 0.70:
            nivel_riesgo = "ALTO"
        elif probabilidad >= 0.40:
            nivel_riesgo = "MEDIO"
        else:
            nivel_riesgo = "BAJO"

        return {
            "version_modelo": self.version,
            "probabilidad_riesgo": round(probabilidad, 4),
            "nivel_riesgo": nivel_riesgo,
            "confianza": 0.95, # Placeholder real model confidence
            "champion_active": self.active_champion,
            "metricas_drift": {
                "estado": "Monitoreo externo vía Evidently"
            }
        }

    def _fallback_predict(self, distrito: str, hora: int, densidad_historica: float, es_hora_pico: bool) -> Dict[str, Any]:
        import math
        weight_distrito = 0.35
        weight_hora_pico = 0.30
        weight_densidad = 0.35

        distritos_alto_riesgo = ["LIMA", "LA VICTORIA", "SAN JUAN DE LURIGANCHO", "ATE", "CALLAO"]
        factor_distrito = 0.85 if distrito.upper() in distritos_alto_riesgo else 0.40
        factor_hora = 0.90 if es_hora_pico or (7 <= hora <= 9 or 18 <= hora <= 21) else 0.30
        factor_densidad = min(max(densidad_historica / 100.0, 0.0), 1.0)

        raw_score = (factor_distrito * weight_distrito) + (factor_hora * weight_hora_pico) + (factor_densidad * weight_densidad)
        probabilidad = 1 / (1 + math.exp(- (raw_score - 0.5) * 6))

        if probabilidad >= 0.70:
            nivel_riesgo = "ALTO"
        elif probabilidad >= 0.40:
            nivel_riesgo = "MEDIO"
        else:
            nivel_riesgo = "BAJO"

        return {
            "version_modelo": "fallback-1.0",
            "probabilidad_riesgo": round(probabilidad, 4),
            "nivel_riesgo": nivel_riesgo,
            "confianza": round(0.92 + (probabilidad * 0.06), 4),
            "champion_active": False,
            "metricas_drift": {
                "estado": "Fallback temporal activo"
            }
        }

model_engine = RiskModelEngine(version="1.0.0")
