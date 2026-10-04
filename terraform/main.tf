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
  backend_image                   = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/collune-backend:${var.image_tag}"
  frontend_image                  = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/collune-frontend:${var.frontend_image_tag}"
  admin_frontend_image            = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/collune-admin:${var.admin_frontend_image_tag}"
  backend_public_url              = "https://collune-backend-727341248620.asia-south1.run.app"
  frontend_public_origins = [
    "https://collune.com",
    "https://www.collune.com",
    "https://collune.vercel.app",
    "https://collune-frontend-727341248620.asia-south1.run.app",
    "https://collune-admin-727341248620.asia-south1.run.app",
  ]

  react_env = {
    VITE_API_BASE_URL = local.backend_public_url
  }
  django_env = {
    DB_NAME                             = var.database_name
    DB_USER                             = var.db_user
    DB_PASSWORD                         = var.db_password
    DB_INSTANCE_CONNECTION_NAME         = google_sql_database_instance.postgres.connection_name
    DB_PORT                             = "5432"
    GS_BUCKET_NAME                      = var.bucket_name
    GS_PROJECT_ID                       = var.project_id
    EMAIL_BACKEND                       = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST                          = "smtp-relay.brevo.com"
    EMAIL_PORT                          = "587"
    EMAIL_USE_TLS                       = "True"
    EMAIL_HOST_USER                     = var.email_host_user
    EMAIL_HOST_PASSWORD                 = var.email_host_password
    DEFAULT_FROM_EMAIL                  = "noreply@collune.com"
    BREVO_API_KEY                       = var.brevo_api_key
    AISENSY_API_KEY                     = var.aisensy_api_key
    AISENSY_CHAT_REMINDER_CAMPAIGN_NAME = var.aisensy_chat_reminder_campaign_name

    DJANGO_SUPERUSER_USERNAME = var.django_superuser_username
    DJANGO_SUPERUSER_EMAIL    = var.django_superuser_email
    DJANGO_SUPERUSER_PASSWORD = var.django_superuser_password

    META_APP_ID            = var.meta_app_id
    META_APP_SECRET        = var.meta_app_secret
    INSTAGRAM_REDIRECT_URI = "${local.backend_public_url}/api/v1/auth/instagram/callback/"
    FRONTEND_URL           = "https://collune.com"
    CORS_ALLOWED_ORIGINS   = join(",", local.frontend_public_origins)
    CSRF_TRUSTED_ORIGINS   = join(",", local.frontend_public_origins)

    CLOUD_TASKS_ENABLED                 = "True"
    CLOUD_TASKS_PROJECT_ID              = var.project_id
    CLOUD_TASKS_LOCATION                = var.region
    CLOUD_TASKS_CHAT_REMINDER_QUEUE     = google_cloud_tasks_queue.chat_reminders.name
    CLOUD_TASKS_CHAT_REMINDER_URL       = "${local.backend_public_url}/api/v1/tasks/chat/unread-reminder/"
    CLOUD_TASKS_INVOKER_SERVICE_ACCOUNT = google_service_account.chat_reminder_invoker.email
    CLOUD_TASKS_HANDLER_SECRET          = var.cloud_tasks_handler_secret
    CHAT_UNREAD_REMINDER_DELAY_SECONDS  = "1800"

    GOOGLE_CLIENT_SECRET = var.google_client_secret
    YOUTUBE_REDIRECT_URI = "${local.backend_public_url}/api/v1/auth/youtube/callback/"
    GOOGLE_CLIENT_ID     = var.google_client_id
    YOUTUBE_OAUTH_SCOPES = "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly"

    X_CLIENT_ID     = var.x_client_id
    X_CLIENT_SECRET = var.x_client_secret
    X_REDIRECT_URI  = "${local.backend_public_url}/api/v1/auth/x/callback/"
    X_OAUTH_SCOPES  = "tweet.read users.read follows.read offline.access"
    X_BEARER_TOKEN  = var.x_bearer_token

    FACEBOOK_APP_ID       = var.facebook_app_id
    FACEBOOK_APP_SECRET   = var.facebook_app_secret
    FACEBOOK_REDIRECT_URI = "${local.backend_public_url}/api/v1/auth/facebook/callback/"
  }
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

resource "google_project_service" "cloud_tasks_api" {
  project = var.project_id
  service = "cloudtasks.googleapis.com"
}


# Artifact Registry repository for container images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "collune"
  description   = "Docker repository for collune backend images"
  format        = "DOCKER"
}


resource "google_cloud_run_service" "backend" {
  name     = "collune-backend"
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image   = local.backend_image
        command = ["/bin/sh"]
        args    = ["-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py ensure_superuser && uvicorn server.asgi:application --host 0.0.0.0 --port 8080"]

        ports {
          container_port = 8080
        }

        dynamic "env" {
          for_each = local.django_env
          content {
            name  = env.key
            value = env.value
          }
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

  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
      template[0].metadata[0].labels["client.knative.dev/nonce"],
    ]
  }
}

resource "google_cloud_run_service" "frontend" {
  name     = "collune-frontend"
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = local.frontend_image

        ports {
          container_port = 8080
        }

        dynamic "env" {
          for_each = local.react_env
          content {
            name  = env.key
            value = env.value
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
      service_account_name  = local.cloud_run_service_account_email
      timeout_seconds       = 60
      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"     = "10"
        "run.googleapis.com/startup-cpu-boost" = "true"
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

  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
      template[0].metadata[0].labels["client.knative.dev/nonce"],
    ]
  }
}

resource "google_cloud_run_service" "admin_frontend" {
  name     = "collune-admin"
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = local.admin_frontend_image

        ports {
          container_port = 8080
        }

        dynamic "env" {
          for_each = local.react_env
          content {
            name  = env.key
            value = env.value
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
      service_account_name  = local.cloud_run_service_account_email
      timeout_seconds       = 60
      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"     = "10"
        "run.googleapis.com/startup-cpu-boost" = "true"
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

  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
      template[0].metadata[0].labels["client.knative.dev/nonce"],
    ]
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

# Cloud Tasks invokes a private endpoint on the backend after the delay.
resource "google_service_account" "chat_reminder_invoker" {
  project      = var.project_id
  account_id   = "chat-reminder-tasks"
  display_name = "Collune chat reminder Cloud Tasks invoker"
}

resource "google_cloud_tasks_queue" "chat_reminders" {
  project  = var.project_id
  location = var.region
  name     = "chat-reminders"

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 20
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "1800s"
  }

  depends_on = [google_project_service.cloud_tasks_api]
}

resource "google_project_iam_member" "chat_reminder_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${local.cloud_run_service_account_email}"
}

resource "google_service_account_iam_member" "chat_reminder_enqueuer_can_act_as_invoker" {
  service_account_id = google_service_account.chat_reminder_invoker.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cloud_run_service_account_email}"
}

# Cloud Tasks needs this permission to mint the OIDC token attached to tasks.
resource "google_service_account_iam_member" "cloud_tasks_can_mint_invoker_token" {
  service_account_id = google_service_account.chat_reminder_invoker.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-cloudtasks.iam.gserviceaccount.com"

  depends_on = [google_project_service.cloud_tasks_api]
}

resource "google_cloud_run_service_iam_member" "chat_reminder_can_invoke_backend" {
  location = google_cloud_run_service.backend.location
  project  = google_cloud_run_service.backend.project
  service  = google_cloud_run_service.backend.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.chat_reminder_invoker.email}"
}

# Cloud Run Job for Database Migrations
resource "google_cloud_run_v2_job" "migrate" {
  name                = "collune-migrate"
  location            = var.region
  project             = var.project_id
  deletion_protection = false

  template {
    template {
      service_account = local.cloud_run_service_account_email
      containers {
        image   = local.backend_image
        command = ["/bin/sh", "-c"]
        args    = ["python manage.py migrate --noinput && python manage.py ensure_superuser"]

        dynamic "env" {
          for_each = local.django_env
          content {
            name  = env.key
            value = env.value
          }
        }

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

}

# Allow unauthenticated access to the public web frontends
resource "google_cloud_run_service_iam_member" "frontend_public_access" {
  location = google_cloud_run_service.frontend.location
  project  = google_cloud_run_service.frontend.project
  service  = google_cloud_run_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "admin_frontend_public_access" {
  location = google_cloud_run_service.admin_frontend.location
  project  = google_cloud_run_service.admin_frontend.project
  service  = google_cloud_run_service.admin_frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
