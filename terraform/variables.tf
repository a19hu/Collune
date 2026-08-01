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
  default = "db-custom-2-3840"
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
