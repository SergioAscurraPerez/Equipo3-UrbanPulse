# Proyectos de Vercel ya existentes (cuenta personal), importados a Terraform.
# Los valores reflejan la configuración real; solo se declaran atributos con valor.

locals {
  vercel_git_repo = "SergioAscurraPerez/Equipo3-UrbanPulse"

  vercel_projects = {
    host = {
      name           = "equipo3-urban-pulse"
      framework      = null
      root_directory = "src/frontend"
    }
    chatbot = {
      name           = "equipo3-urban-pulse-chatbot"
      framework      = "vite"
      root_directory = "mf-chatbot"
    }
    ajustes = {
      name           = "equipo3-urban-pulse-ajustes"
      framework      = "vite"
      root_directory = "mf-ajustes"
    }
    gestion-incidentes = {
      name           = "equipo3-urban-pulse-gestion-incidentes"
      framework      = "vite"
      root_directory = "mf-gestion-incidentes"
    }
    mapa-urbano = {
      name           = "equipo3-urban-pulse-mapa-urbano"
      framework      = "vite"
      root_directory = "mf-mapa-urbano"
    }
    auth = {
      name           = "equipo3-urban-pulse-auth"
      framework      = "vite"
      root_directory = "mf-auth"
    }
    historial-reportes = {
      name           = "equipo3-urban-pulse-historial-reportes"
      framework      = "vite"
      root_directory = "mf-historial-reportes"
    }
    dashboard = {
      name           = "equipo3-urban-pulse-dashboard"
      framework      = "vite"
      root_directory = "mf-dashboard"
    }
  }
}

resource "vercel_project" "mf" {
  for_each = local.vercel_projects

  name           = each.value.name
  framework      = each.value.framework
  root_directory = each.value.root_directory

  skew_protection = "12 hours"

  git_repository = {
    type = "github"
    repo = local.vercel_git_repo
  }

  lifecycle {
    prevent_destroy = true
  }
}
