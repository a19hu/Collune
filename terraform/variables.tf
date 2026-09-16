variable "project_id" {
  type    = string
  default = "gen-lang-client-0347493408"
}

variable "region" {
  type    = string
  default = "asia-south1"
}
variable "zone" {
  type    = string
  default = "asia-south1-a"
}

variable "instance_name" {
  type    = string
  default = "postgresql-18"
}

variable "machine_type" {
  type    = string
  default = "db-g1-small"
}


variable "private_service_access_prefix_length" {
  type        = number
  description = "Prefix length for the internal IP range reserved for Private Service Access."
  default     = 16
}

variable "database_name" {
  type    = string
  default = "app"
}

variable "db_user" {
  type    = string
  default = "appuser"
}

variable "db_password" {
  description = "Password for the Cloud SQL default user"
  type        = string
  sensitive   = true
}

variable "bucket_name" {
  type        = string
  description = "Globally unique bucket name"
}

variable "location" {
  type    = string
  default = "asia-south1"
}

variable "storage_class" {
  type    = string
  default = "STANDARD"
}

variable "versioning" {
  type    = bool
  default = true
}

variable "delete_after_days" {
  type    = number
  default = 36500
}

variable "force_destroy" {
  type    = bool
  default = false
}

variable "labels" {
  type = map(string)
  default = {
    env = "dev"
  }
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "admin_frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "redis_url" {
  description = "Redis connection URL used by Django Channels and Celery, for example rediss://:password@host:port/0?ssl_cert_reqs=CERT_REQUIRED."
  type        = string
  sensitive   = true
  default     = ""
}

variable "celery_worker_min_instances" {
  description = "Number of Celery worker instances kept warm. A value of 1 is required for continuous task consumption."
  type        = number
  default     = 1

  validation {
    condition     = var.celery_worker_min_instances >= 1
    error_message = "celery_worker_min_instances must be at least 1."
  }
}

variable "celery_worker_max_instances" {
  description = "Maximum Celery worker instances. Keep this at 1 unless tasks are explicitly safe to consume concurrently."
  type        = number
  default     = 1

  validation {
    condition     = var.celery_worker_max_instances >= var.celery_worker_min_instances
    error_message = "celery_worker_max_instances must be greater than or equal to celery_worker_min_instances."
  }
}

variable "cloud_run_service_account_email" {
  description = "Service account email used by Cloud Run service/job. Empty value means use Compute Engine default service account for the selected project."
  type        = string
  default     = ""
}

variable "email_host_user" {
  type    = string
  default = ""
}

variable "email_host_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "brevo_api_key" {
  type      = string
  default   = ""
  sensitive = true

}

variable "aisensy_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "django_superuser_username" {
  type    = string
  default = ""
}

variable "django_superuser_email" {
  type    = string
  default = ""
}

variable "django_superuser_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "meta_app_id" {
  type    = string
  default = ""
}

variable "meta_app_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "google_client_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "x_client_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "x_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "x_bearer_token" {
  type      = string
  default   = ""
  sensitive = true
}
variable "facebook_app_id" {
  type      = string
  default   = ""
  sensitive = true
}
variable "facebook_app_secret" {
  type      = string
  default   = ""
  sensitive = true
}
