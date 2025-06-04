variable "identifier" {
  description = "The identifier for the database instance"
  type        = string
}

variable "db_name" {
  description = "The name of the database"
  type        = string
}

variable "db_username" {
  description = "Username for the database"
  type        = string
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_port" {
  description = "Port for the database"
  type        = string
  default     = "5432"
}

variable "engine" {
  description = "The database engine"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "The version of the database engine"
  type        = string
  default     = "15.3"
}

variable "instance_class" {
  description = "The instance class for the database"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "The amount of storage (in GB) to allocate to the database"
  type        = number
  default     = 20
}

variable "vpc_id" {
  description = "The ID of the VPC where the database will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "A list of subnet IDs where the database will be deployed"
  type        = list(string)
}

variable "publicly_accessible" {
  description = "Whether the database should be publicly accessible"
  type        = bool
  default     = false
}

variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, staging, prod)"
  type        = string
}
