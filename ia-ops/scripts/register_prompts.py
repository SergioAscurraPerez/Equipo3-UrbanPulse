import json
import os
import mlflow
from dotenv import load_dotenv

# Configurar entorno
env_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(env_path)

MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI")
if not MLFLOW_TRACKING_URI:
    raise ValueError("MLFLOW_TRACKING_URI no configurado en .env")

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
print(f"Conectado a MLflow: {MLFLOW_TRACKING_URI}")

def register_prompts():
    registry_path = os.path.join(os.path.dirname(__file__), '../prompts/prompt_registry.json')
    with open(registry_path, 'r', encoding='utf-8') as f:
        registry = json.load(f)
    
    prompts = registry.get('prompts', [])
    for prompt_info in prompts:
        experiment_name = prompt_info.get("mlflow_experiment", "default_prompt_experiment")
        mlflow.set_experiment(experiment_name)
        
        file_path = os.path.join(os.path.dirname(__file__), '../../', prompt_info.get("file_path"))
        
        if not os.path.exists(file_path):
            print(f"Archivo de prompt no encontrado: {file_path}")
            continue
            
        print(f"Registrando prompt '{prompt_info['name']}' en el experimento '{experiment_name}'...")
        
        with mlflow.start_run(run_name=f"prompt_version_{prompt_info['version']}"):
            mlflow.log_param("prompt_id", prompt_info['id'])
            mlflow.log_param("model", prompt_info['model'])
            mlflow.log_param("temperature", prompt_info['temperature'])
            mlflow.log_param("max_output_tokens", prompt_info['max_output_tokens'])
            mlflow.log_param("version", prompt_info['version'])
            
            # Log the prompt file as an artifact
            mlflow.log_artifact(file_path, artifact_path="prompt_templates")
            print(f" -> Prompt {prompt_info['id']} registrado exitosamente.")

if __name__ == "__main__":
    register_prompts()
