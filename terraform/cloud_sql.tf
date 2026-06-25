resource "google_sql_database_instance" "postgres" {
  name             = var.instance_name
  database_version = "POSTGRES_18"
  region           = var.region

  depends_on = [
    google_project_service.sqladmin,
  ]

  settings {
    tier    = var.machine_type
    edition = "ENTERPRISE"

    availability_type = "REGIONAL"

    disk_type       = "PD_SSD"
    disk_size       = 10
    disk_autoresize = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled = true
    }

    database_flags {
      name  = "max_connections"
      value = "500"
    }

    insights_config {
      query_insights_enabled  = true
      record_application_tags = true
      record_client_address   = true
    }
  }

}

resource "google_sql_database" "app_db" {
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app_user" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
