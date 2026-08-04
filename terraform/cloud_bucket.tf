resource "google_storage_bucket" "bucket" {
  name     = var.bucket_name
  location = var.location

  storage_class = var.storage_class

  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  versioning {
    enabled = var.versioning
  }

  lifecycle_rule {
    condition {
      age = var.delete_after_days
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin = concat(
      local.frontend_public_origins,
      [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ]
    )
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Access-Control-Allow-Origin"]
    max_age_seconds = 3600
  }

  labels = var.labels

  force_destroy = var.force_destroy
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
