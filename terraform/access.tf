
resource "cloudflare_zero_trust_access_policy" "taskflow_admin" {
  account_id = var.cloudflare_account_id
  name       = "Allow TaskFlow Admin"
  decision   = "allow"

  include = [
    for e in var.access_allowed_emails : {
      email = { email = e }
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "taskflow" {
  account_id = var.cloudflare_account_id

  name                      = "TaskFlow Application"
  domain                    = "your-custom-domain.com" # IMPORTANT: Replace this with your custom domain.
  type                      = "self_hosted"
  session_duration          = "24h"
  auto_redirect_to_identity = true

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.taskflow_admin.id
      precedence = 1
    }
  ]
}