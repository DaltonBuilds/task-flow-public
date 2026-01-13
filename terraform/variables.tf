# Input variables for Terraform configuration

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = "CLOUDFLARE_ACCOUNT_ID" 
}

variable "project_name" {
  description = "Cloudflare Worker script name"
  type        = string
  default     = "task-flow"
}

variable "database_name" {
  description = "D1 database name"
  type        = string
  default     = "task-flow-db"
}

variable "environment" {
  description = "Deployment environment (development/staging/production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production"
  }
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = ""
}

variable "access_allowed_emails" {
  description = "List of email addresses allowed to access the application via Cloudflare Access"
  type        = list(string)
  default     = []
}