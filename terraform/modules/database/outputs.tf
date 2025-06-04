output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.postgres.address
}

output "db_instance_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.postgres.port
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_security_group_id" {
  description = "The security group ID for the database"
  value       = aws_security_group.db_security_group.id
}
