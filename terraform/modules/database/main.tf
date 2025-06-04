resource "aws_db_subnet_group" "default" {
  name       = var.identifier
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "db_security_group" {
  name        = "${var.identifier}-sg"
  description = "Security group for PostgreSQL database"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL traffic from within VPC
  ingress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # In production, restrict this to your application's security group
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-db-sg"
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = var.identifier
  allocated_storage      = var.allocated_storage
  engine                 = var.engine
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  port                   = var.db_port
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_security_group.id]
  publicly_accessible    = var.publicly_accessible
  skip_final_snapshot    = true

  tags = {
    Name        = "${var.project_name}-db"
    Environment = var.environment
  }
}
