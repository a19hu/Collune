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

  labels = var.labels

  force_destroy = var.force_destroy
}

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
