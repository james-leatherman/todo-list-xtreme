# Variables for Todo List Xtreme infrastructure

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "todo-list-xtreme"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "ID of the VPC to deploy resources"
  type        = string
  default     = "" # You'll need to provide this when running Terraform
}

variable "subnet_ids" {
  description = "List of subnet IDs for the resources"
  type        = list(string)
  default     = [] # You'll need to provide this when running Terraform
}

# Database variables
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "todolist"
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  type        = string
  default     = "todolist" # Consider using secrets management for production
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  default     = "" # Should be provided securely, not hardcoded
  sensitive   = true
}

variable "db_port" {
  description = "Port for the PostgreSQL database"
  type        = string
  default     = "5432"
}

variable "db_instance_class" {
  description = "Instance class for the PostgreSQL database"
  type        = string
  default     = "db.t3.micro" # Consider larger instances for production
}

variable "db_allocated_storage" {
  description = "Allocated storage for the PostgreSQL database (in GB)"
  type        = number
  default     = 20
}

variable "db_publicly_accessible" {
  description = "Whether the PostgreSQL database should be publicly accessible"
  type        = bool
  default     = false
}

# CORS variables
variable "additional_cors_origins" {
  description = "Additional allowed CORS origins"
  type        = string
  default     = ""
}
