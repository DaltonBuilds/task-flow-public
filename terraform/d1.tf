resource "cloudflare_d1_database" "task-flow_db" {
  account_id = var.cloudflare_account_id
  name       = var.database_name

  read_replication = {
    mode = "disabled"
  }
}