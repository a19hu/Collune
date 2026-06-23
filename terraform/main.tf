terraform {

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.2.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

data "google_project" "current" {
  project_id = var.project_id
}

locals {
  cloud_run_service_account_email = var.cloud_run_service_account_email != "" ? var.cloud_run_service_account_email : "${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

# Enable required GCP services
resource "google_project_service" "run_api" {
  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_service" "artifact_registry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "sqladmin" {
  project = var.project_id
  service = "sqladmin.googleapis.com"
}

resource "google_project_service" "storage_api" {
  project = var.project_id
  service = "storage.googleapis.com"
}

resource "google_project_service" "service_networking_api" {
  project = var.project_id
  service = "servicenetworking.googleapis.com"
}


# Artifact Registry repository for container images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "collune"
  description   = "Docker repository for collune backend images"
  format        = "DOCKER"
}




resource "google_cloud_run_service" "default" {
  name     = "collune-backend"
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/collunebackend/collune-backend:${var.image_tag}"

        ports {
          container_port = 8000
        }

        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
      }
      service_account_name  = local.cloud_run_service_account_email
      timeout_seconds       = 300
      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "10"
        "run.googleapis.com/startup-cpu-boost"  = "true"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
      }
      labels = {
        commit-sha = "d6fc5aed5f6dbacf1f6cdbcce1b9131750bc1ebd"
        managed-by = "gcp-cloud-build-deploy-cloud-run"
      }
    }
  }

  traffic {
    latest_revision = true
    percent         = 100
  }
}

# IAM roles for the Cloud Run service account
resource "google_project_iam_member" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${local.cloud_run_service_account_email}"
}

resource "google_project_iam_member" "storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${local.cloud_run_service_account_email}"
}

# Cloud Run Job for Database Migrations
resource "google_cloud_run_v2_job" "migrate" {
  name     = "collune-migrate"
  location = var.region
  project  = var.project_id

  template {
    template {
      service_account = local.cloud_run_service_account_email
      containers {
        image   = "${var.region}-docker.pkg.dev/${var.project_id}/collunebackend/collune-backend:latest"
        command = ["alembic"]
        args    = ["upgrade", "head"]

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgres.connection_name]
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
    ]
  }
}

# Allow unauthenticated access to the Cloud Run service (for Flutter app)
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.default.location
  project  = google_cloud_run_service.default.project
  service  = google_cloud_run_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
