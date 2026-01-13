# Terraform configuration for Cloudflare infrastructure
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# Configure the Cloudflare Provider
provider "cloudflare" {
  # api_token = var.cloudflare_api_token (using GitLab CI/CD variables)
}
