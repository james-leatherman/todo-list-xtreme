# Outputs for Todo List Xtreme infrastructure

output "db_instance_endpoint" {
  description = "The endpoint of the PostgreSQL database"
  value       = module.database.db_instance_address
}

output "db_instance_port" {
  description = "The port of the PostgreSQL database"
  value       = module.database.db_instance_port
}

output "backend_url" {
  description = "URL of the backend API"
  value       = aws_elastic_beanstalk_environment.backend_env.endpoint_url
}

output "frontend_url" {
  description = "URL of the frontend website (S3)"
  value       = "http://${aws_s3_bucket.frontend_bucket.website_endpoint}"
}

output "frontend_cloudfront_url" {
  description = "CloudFront URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "photos_bucket_name" {
  description = "Name of the S3 bucket for photos"
  value       = aws_s3_bucket.photos_bucket.bucket
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for the backend"
  value       = aws_ecr_repository.backend_repo.repository_url
}
