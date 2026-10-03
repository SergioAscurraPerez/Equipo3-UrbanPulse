# Servicio de contenedores de n8n (ya existe: se importa, no se recrea).
# Los despliegues de imagen los hace GitHub Actions (deploy-lightsail-n8n.yml);
# Terraform solo administra el servicio.
resource "aws_lightsail_container_service" "n8n" {
  name  = "urbanpulse-n8n"
  power = "micro"
  scale = 1
}
