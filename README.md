# Todo List Xtreme

A full-stack to-do list application with photo upload capabilities, responsive design, and OAuth authentication.

## Features

- Create, read, update, and delete tasks
- Add photos to tasks for visual tracking
- Google OAuth authentication
- Responsive design (works on mobile devices)
- AWS infrastructure managed with Terraform
- PostgreSQL database for data persistence

## Tech Stack

### Backend
- Python with FastAPI
- PostgreSQL database
- JWT authentication
- AWS S3 integration for photo storage
- Docker containerization

### Frontend
- React
- Material-UI components
- Responsive design
- JWT token authentication
- Photo upload capability

### Infrastructure
- AWS (Amazon Web Services)
- Terraform for Infrastructure as Code
- RDS PostgreSQL
- S3 buckets
- Elastic Beanstalk for deployment
- CloudFront CDN for frontend

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js and npm
- Python 3.11+
- AWS CLI (for deployment)
- Terraform (for infrastructure provisioning)

### Local Development

#### Backend
```bash
cd backend
# Create a .env file with necessary environment variables
docker-compose up -d
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables

#### Backend (.env)
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=todolist
DATABASE_URL=postgresql://postgres:postgres@db:5432/todolist
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
```

#### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000
```

## Deployment with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -out=tfplan

# Apply the configuration
terraform apply tfplan
```

## Project Structure

```
todo-list-xtreme/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── todos.py
│   ├── tests/
│   ├── alembic/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── README.md
└── terraform/
    ├── modules/
    │   └── database/
    │       ├── main.tf
    │       ├── variables.tf
    │       └── outputs.tf
    ├── environments/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
```

## License

MIT License

## Acknowledgments

- FastAPI for the amazing Python web framework
- React and Material-UI for the frontend components
- AWS and Terraform for the infrastructure
