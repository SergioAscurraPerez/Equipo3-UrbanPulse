terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.17"
    }
  }

  backend "s3" {
    bucket       = "urbanpulse-tfstate-976991912762"
    key          = "urbanpulse/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}

# El token se lee de la variable de entorno VERCEL_API_TOKEN (cuenta personal, sin team_id).
provider "vercel" {}
