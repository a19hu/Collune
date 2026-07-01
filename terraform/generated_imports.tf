# __generated__ by Terraform
# Please review these resources and move them into your main configuration files.

# __generated__ by Terraform
resource "google_sql_database_instance" "imported_schoolmate" {
  backupdr_backup          = null
  database_version         = "POSTGRES_18"
  deletion_protection      = true
  final_backup_description = null
  instance_type            = "CLOUD_SQL_INSTANCE"
  maintenance_version      = "POSTGRES_18_3.R20260319.04_04"
  name                     = "schoolmate"
  node_count               = 0
  project                  = "schoolmate-498917"
  region                   = "asia-south1"
  replica_names            = []
  root_password            = null # sensitive
  replication_cluster {
    failover_dr_replica_name = null
    psa_write_endpoint       = null
  }
  settings {
    activation_policy            = "NEVER"
    availability_type            = "ZONAL"
    collation                    = null
    connector_enforcement        = "NOT_REQUIRED"
    deletion_protection_enabled  = false
    disk_autoresize              = false
    disk_autoresize_limit        = 0
    disk_size                    = 100
    disk_type                    = "PD_SSD"
    edition                      = "ENTERPRISE_PLUS"
    enable_dataplex_integration  = true
    enable_google_ml_integration = false
    pricing_plan                 = "PER_USE"
    retain_backups_on_delete     = false
    tier                         = "db-perf-optimized-N-8"
    time_zone                    = null
    user_labels                  = {}
    backup_configuration {
      binary_log_enabled             = false
      enabled                        = false
      location                       = null
      point_in_time_recovery_enabled = false
      start_time                     = "23:00"
      transaction_log_retention_days = 14
      backup_retention_settings {
        retained_backups = 15
        retention_unit   = "COUNT"
      }
    }
    data_cache_config {
      data_cache_enabled = true
    }
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
    ip_configuration {
      allocated_ip_range                            = null
      custom_subject_alternative_names              = []
      enable_private_path_for_google_cloud_services = false
      ipv4_enabled                                  = true
      private_network                               = null
      server_ca_mode                                = "GOOGLE_MANAGED_INTERNAL_CA"
      server_ca_pool                                = null
      ssl_mode                                      = "ALLOW_UNENCRYPTED_AND_ENCRYPTED"
      authorized_networks {
        expiration_time = null
        name            = null
        value           = "152.59.142.103/32"
      }
    }
    location_preference {
      follow_gae_application = null
      secondary_zone         = null
      zone                   = "asia-south1-b"
    }
  }

  lifecycle {
    ignore_changes = [
      settings[0].final_backup_config,
    ]
  }
}

# __generated__ by Terraform
resource "google_sql_database_instance" "imported_collune" {
  backupdr_backup          = null
  database_version         = "POSTGRES_18"
  deletion_protection      = true
  final_backup_description = null
  instance_type            = "CLOUD_SQL_INSTANCE"
  maintenance_version      = "POSTGRES_18_4.R20260319.07_04"
  name                     = "collune"
  node_count               = 0
  project                  = "schoolmate-498917"
  region                   = "asia-south1"
  replica_names            = []
  root_password            = null # sensitive
  replication_cluster {
    failover_dr_replica_name = null
    psa_write_endpoint       = null
  }
  settings {
    activation_policy            = "NEVER"
    availability_type            = "ZONAL"
    collation                    = null
    connector_enforcement        = "NOT_REQUIRED"
    deletion_protection_enabled  = true
    disk_autoresize              = true
    disk_autoresize_limit        = 0
    disk_size                    = 250
    disk_type                    = "PD_SSD"
    edition                      = "ENTERPRISE_PLUS"
    enable_dataplex_integration  = true
    enable_google_ml_integration = false
    pricing_plan                 = "PER_USE"
    retain_backups_on_delete     = true
    tier                         = "db-perf-optimized-N-4"
    time_zone                    = null
    user_labels                  = {}
    backup_configuration {
      binary_log_enabled             = false
      enabled                        = true
      location                       = "asia"
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 14
      backup_retention_settings {
        retained_backups = 15
        retention_unit   = "COUNT"
      }
    }
    data_cache_config {
      data_cache_enabled = true
    }
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }
    final_backup_config {
      enabled        = true
      retention_days = 30
    }
    ip_configuration {
      allocated_ip_range                            = null
      custom_subject_alternative_names              = []
      enable_private_path_for_google_cloud_services = false
      ipv4_enabled                                  = true
      private_network                               = null
      server_ca_mode                                = "GOOGLE_MANAGED_INTERNAL_CA"
      server_ca_pool                                = null
      ssl_mode                                      = "ENCRYPTED_ONLY"
    }
    location_preference {
      follow_gae_application = null
      secondary_zone         = null
      zone                   = "asia-south1-c"
    }
    password_validation_policy {
      complexity                  = "COMPLEXITY_DEFAULT"
      disallow_username_substring = true
      enable_password_policy      = true
      min_length                  = 8
      password_change_interval    = null
      reuse_interval              = 0
    }
  }

  lifecycle {
    ignore_changes = [
      settings[0].maintenance_window,
    ]
  }
}

# __generated__ by Terraform from "projects/schoolmate-498917/locations/asia-south1/jobs/create-superuser"
resource "google_cloud_run_v2_job" "imported_create_superuser" {
  annotations         = {}
  client              = "gcloud"
  client_version      = "553.0.0"
  deletion_protection = true
  labels              = {}
  launch_stage        = "GA"
  location            = "asia-south1"
  name                = "create-superuser"
  project             = "schoolmate-498917"
  template {
    annotations = {}
    labels      = {}
    parallelism = 0
    task_count  = 1
    template {
      encryption_key                = null
      execution_environment         = "EXECUTION_ENVIRONMENT_GEN2"
      gpu_zonal_redundancy_disabled = false
      max_retries                   = 3
      service_account               = "350157158342-compute@developer.gserviceaccount.com"
      timeout                       = "600s"
      containers {
        args        = []
        command     = []
        depends_on  = []
        image       = "asia-south1-docker.pkg.dev/schoolmate-498917/reposchoolmate/sm:v1"
        name        = null
        working_dir = null
        env {
          name  = "DB_INSTANCE_CONNECTION_NAME"
          value = "schoolmate-498917:asia-"
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        volume_mounts {
          mount_path = "/cloudsql"
          name       = "cloudsql"
        }
      }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = ["schoolmate-498917:asia-south1:schoolmate"]
        }
      }
    }
  }
}

# __generated__ by Terraform from "locations/asia-south1/namespaces/schoolmate-498917/services/cl"
resource "google_cloud_run_service" "imported_cl" {
  autogenerate_revision_name = false
  location                   = "asia-south1"
  name                       = "cl"
  project                    = "schoolmate-498917"
  metadata {
    annotations = {}
    labels      = {}
    namespace   = "schoolmate-498917"
  }
  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "3"
        "run.googleapis.com/client-name"        = "gcloud"
        "run.googleapis.com/client-version"     = "553.0.0"
        "run.googleapis.com/cloudsql-instances" = "schoolmate-498917:asia-south1:schoolmate"
        "run.googleapis.com/startup-cpu-boost"  = "true"
      }
      labels = {
        "client.knative.dev/nonce"            = "ruqnmxxugh"
        "run.googleapis.com/startupProbeType" = "Default"
      }
    }
    spec {
      container_concurrency = 80
      node_selector         = {}
      service_account_name  = "350157158342-compute@developer.gserviceaccount.com"
      timeout_seconds       = 300
      containers {
        args    = ["-c", "python manage.py migrate --noinput && gunicorn server.wsgi:application --bind 0.0.0.0:$PORT"]
        command = ["/bin/sh"]
        image   = "asia-south1-docker.pkg.dev/schoolmate-498917/colune/cl:v7"
        name    = "cl-1"
        ports {
          container_port = 8080
          name           = "http1"
          protocol       = null
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
          requests = {}
        }
        startup_probe {
          failure_threshold     = 1
          initial_delay_seconds = 0
          period_seconds        = 240
          timeout_seconds       = 240
          tcp_socket {
            port = 8080
          }
        }
      }
    }
  }
  traffic {
    latest_revision = true
    percent         = 100
    revision_name   = null
    tag             = null
  }
}

# __generated__ by Terraform from "locations/asia-south1/namespaces/schoolmate-498917/services/sm"
resource "google_cloud_run_service" "imported_sm" {
  autogenerate_revision_name = false
  location                   = "asia-south1"
  name                       = "sm"
  project                    = "schoolmate-498917"
  metadata {
    annotations = {}
    labels      = {}
    namespace   = "schoolmate-498917"
  }
  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"     = "3"
        "run.googleapis.com/client-name"       = "cloud-console"
        "run.googleapis.com/startup-cpu-boost" = "true"
      }
      labels = {
        "client.knative.dev/nonce"            = "d6deb27a-2bfa-4bb3-a4fa-b6254ff5aa6f"
        "run.googleapis.com/startupProbeType" = "Default"
      }
    }
    spec {
      container_concurrency = 80
      node_selector         = {}
      service_account_name  = "350157158342-compute@developer.gserviceaccount.com"
      timeout_seconds       = 300
      containers {
        args    = []
        command = []
        image   = "asia-south1-docker.pkg.dev/schoolmate-498917/reposchoolmate/sm@sha256:406e011e976193eb872a47f0fa1420e32299b4e20b8c15a10aa1415bec2ef6e3"
        name    = "sm-1"
        ports {
          container_port = 8080
          name           = "http1"
          protocol       = null
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
          requests = {}
        }
        startup_probe {
          failure_threshold     = 1
          initial_delay_seconds = 0
          period_seconds        = 240
          timeout_seconds       = 240
          tcp_socket {
            port = 8080
          }
        }
      }
    }
  }
  traffic {
    latest_revision = true
    percent         = 100
    revision_name   = null
    tag             = null
  }
}

# __generated__ by Terraform from "projects/schoolmate-498917/locations/asia-south1/repositories/reposchoolmate"
resource "google_artifact_registry_repository" "imported_reposchoolmate" {
  cleanup_policy_dry_run = true
  description            = null
  format                 = "DOCKER"
  kms_key_name           = null
  labels                 = {}
  location               = "asia-south1"
  mode                   = "STANDARD_REPOSITORY"
  project                = "schoolmate-498917"
  repository_id          = "reposchoolmate"
  docker_config {
    immutable_tags = false
  }
  vulnerability_scanning_config {
    enablement_config = "INHERITED"
  }
}

# __generated__ by Terraform from "django_dev_bucket_schoolmate"
resource "google_storage_bucket" "imported_django_dev_schoolmate" {
  default_event_based_hold    = false
  enable_object_retention     = false
  force_destroy               = false
  labels                      = {}
  location                    = "ASIA-SOUTH1"
  name                        = "django_dev_bucket_schoolmate"
  project                     = "schoolmate-498917"
  public_access_prevention    = "enforced"
  requester_pays              = false
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  encryption {
    default_kms_key_name = ""
  }
  hierarchical_namespace {
    enabled = false
  }
  soft_delete_policy {
    retention_duration_seconds = 604800
  }
}
