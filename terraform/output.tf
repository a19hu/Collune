# Output the Cloud Run URL
# output "service_url" {
#   value       = google_cloud_run_service.default.status[0].url
#   description = "The URL of the Cloud Run service"
# }
output "frontend_url" {
  value       = google_cloud_run_service.frontend.status[0].url
  description = "Cloud Run URL for the public frontend"
}

output "admin_frontend_url" {
  value       = google_cloud_run_service.admin_frontend.status[0].url
  description = "Cloud Run URL for the admin frontend"
}

output "backend_url" {
  value       = google_cloud_run_service.backend.status[0].url
  description = "Cloud Run URL for the backend"
}
