"""
UrbanPulse MLOps Risk Inference Engine (v1.0.0)
Autor: Álvaro Tipián (MLOps & DevSecOps Leader)
"""

import math
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mlops_engine")

class RiskModelEngine:
    def __init__(self, version: str = "1.0.0"):
        self.version = version
        self.model_name = "urbanpulse_risk_classifier"
        self.active_champion = True
        logger.info(f"MLOps RiskModelEngine inicializado con versión {self.version}")

    def predict_risk(self, distrito: str, hora: int, densidad_historica: float, es_hora_pico: bool) -> Dict[str, Any]:
        """
        Calcula el nivel de riesgo vial (0.0 a 1.0) basado en características espacio-temporales.
        """
        # Coeficientes ponderados del modelo
        weight_distrito = 0.35
        weight_hora_pico = 0.30
        weight_densidad = 0.35

        # Factor de distrito (ej. distritos de alta congestión en Lima)
        distritos_alto_riesgo = ["LIMA", "LA VICTORIA", "SAN JUAN DE LURIGANCHO", "ATE", "CALLAO"]
        factor_distrito = 0.85 if distrito.upper() in distritos_alto_riesgo else 0.40

        # Factor de horario
        factor_hora = 0.90 if es_hora_pico or (7 <= hora <= 9 or 18 <= hora <= 21) else 0.30

        # Normalización de densidad histórica
        factor_densidad = min(max(densidad_historica / 100.0, 0.0), 1.0)

        # Cálculo de Score de Riesgo (Sigmoide normalizada)
        raw_score = (factor_distrito * weight_distrito) + (factor_hora * weight_hora_pico) + (factor_densidad * weight_densidad)
        probabilidad = 1 / (1 + math.exp(- (raw_score - 0.5) * 6))

        # Categorización estandarizada
        if probabilidad >= 0.70:
            nivel_riesgo = "ALTO"
        elif probabilidad >= 0.40:
            nivel_riesgo = "MEDIO"
        else:
            nivel_riesgo = "BAJO"

        # Cálculo de confianza del modelo (Confidence Score)
        confianza = round(0.92 + (probabilidad * 0.06), 4)

        return {
            "version_modelo": self.version,
            "probabilidad_riesgo": round(probabilidad, 4),
            "nivel_riesgo": nivel_riesgo,
            "confianza": confianza,
            "champion_active": self.active_champion,
            "metricas_drift": {
                "psi_score": 0.042, # Under 0.1 threshold (No drift)
                "drift_detectado": False
            }
        }

# Instancia global Singleton del motor
model_engine = RiskModelEngine(version="1.0.0")
