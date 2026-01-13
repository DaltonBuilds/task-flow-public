# Output values for Terraform resources

output "d1_database_id" {
  description = "D1 database ID"
  value       = cloudflare_d1_database.task-flow_db.id
}

output "d1_database_name" {
  description = "D1 database name"
  value       = cloudflare_d1_database.task-flow_db.name
}

output "access_application_id" {
  value = cloudflare_zero_trust_access_application.taskflow.id
}

output "access_policy_id" {
  value = cloudflare_zero_trust_access_policy.taskflow_admin.id
}

output "custom_domain" {
  description = "Custom domain for the application"
  value       = "your-custom-domain.com" # IMPORTANT: Replace this with your custom domain.
}