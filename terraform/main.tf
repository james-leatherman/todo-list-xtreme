# Main Terraform configuration

provider "aws" {
  region = var.aws_region
}

# Random string for unique naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Use the database module
module "database" {
  source = "./modules/database"

  identifier           = "${var.project_name}-${random_string.suffix.result}"
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  db_port              = var.db_port
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  vpc_id               = var.vpc_id
  subnet_ids           = var.subnet_ids
  publicly_accessible  = var.db_publicly_accessible
  project_name         = var.project_name
  environment          = var.environment
}

# S3 bucket for photo storage
resource "aws_s3_bucket" "photos_bucket" {
  bucket = "${var.project_name}-photos-${random_string.suffix.result}"

  tags = {
    Name        = "${var.project_name}-photos"
    Environment = var.environment
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "photos_bucket_public_access" {
  bucket = aws_s3_bucket.photos_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket CORS configuration for frontend uploads
resource "aws_s3_bucket_cors_configuration" "photos_bucket_cors" {
  bucket = aws_s3_bucket.photos_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"] # You might want to restrict this in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ECR repository for backend
resource "aws_ecr_repository" "backend_repo" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-backend"
    Environment = var.environment
  }
}

# Elastic Beanstalk application
resource "aws_elastic_beanstalk_application" "eb_app" {
  name        = var.project_name
  description = "Todo List Xtreme Application"
}

# Elastic Beanstalk environment for backend
resource "aws_elastic_beanstalk_environment" "backend_env" {
  name                = "${var.project_name}-backend-${var.environment}"
  application         = aws_elastic_beanstalk_application.eb_app.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.0.1 running Docker"

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb_instance_profile.name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "POSTGRES_USER"
    value     = var.db_username
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "POSTGRES_PASSWORD"
    value     = var.db_password
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "POSTGRES_DB"
    value     = var.db_name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "POSTGRES_SERVER"
    value     = module.database.db_instance_address
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "POSTGRES_PORT"
    value     = var.db_port
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_S3_BUCKET"
    value     = aws_s3_bucket.photos_bucket.bucket
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.aws_region
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CORS_ORIGINS"
    value     = "https://${aws_s3_bucket.frontend_bucket.website_endpoint},${var.additional_cors_origins}"
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = var.vpc_id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", var.subnet_ids)
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = "1"
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = "3"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "LoadBalanced"
  }

  tags = {
    Name        = "${var.project_name}-backend"
    Environment = var.environment
  }
}

# IAM role for Elastic Beanstalk
resource "aws_iam_role" "eb_service_role" {
  name = "${var.project_name}-eb-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticbeanstalk.amazonaws.com"
        }
      }
    ]
  })
}

# Attach policies to the EB service role
resource "aws_iam_role_policy_attachment" "eb_service_role_policy" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "eb_service_role_policy2" {
  role       = aws_iam_role.eb_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
}

# IAM role for EC2 instances
resource "aws_iam_role" "eb_ec2_role" {
  name = "${var.project_name}-eb-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach policies to the EC2 role
resource "aws_iam_role_policy_attachment" "eb_ec2_role_policy1" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_role_policy2" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_role_policy3" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECR-FullAccess"
}

resource "aws_iam_role_policy_attachment" "eb_ec2_role_policy4" {
  role       = aws_iam_role.eb_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

# Create instance profile for EC2 instances
resource "aws_iam_instance_profile" "eb_instance_profile" {
  name = "${var.project_name}-eb-instance-profile"
  role = aws_iam_role.eb_ec2_role.name
}

# S3 bucket for frontend hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "${var.project_name}-frontend-${random_string.suffix.result}"

  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

# Configure S3 bucket for website hosting
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# S3 bucket policy to allow public read access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = ["s3:GetObject"]
        Effect    = "Allow"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Principal = "*"
      },
    ]
  })
}

# CloudFront distribution for frontend (optional but recommended)
resource "aws_cloudfront_distribution" "frontend_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend_bucket.id}"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Handle SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name        = "${var.project_name}-frontend-cdn"
    Environment = var.environment
  }
}
