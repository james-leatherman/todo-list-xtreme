from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator

# OpenTelemetry imports
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry import trace

from app.config import settings
from app.database import get_db, engine
from app.auth import router as auth_router
from app.todos import router as todos_router
from app.column_settings import router as column_settings_router
from app import models
from app.metrics import setup_database_metrics

app = FastAPI(
    title="Todo List Xtreme API",
    description="A to-do list API with photo upload support",
    version="0.1.0",
)

# OpenTelemetry setup
resource = Resource.create({"service.name": "todo-list-xtreme-api"})
provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317", insecure=True)
span_processor = BatchSpanProcessor(otlp_exporter)
provider.add_span_processor(span_processor)
trace.set_tracer_provider(provider)

FastAPIInstrumentor.instrument_app(app)
RequestsInstrumentor().instrument()

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

# Database metrics setup
setup_database_metrics(engine)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(todos_router, prefix="/todos", tags=["todos"])
app.include_router(column_settings_router, prefix="/column-settings", tags=["column-settings"])

# Mount static files directory for serving uploaded photos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Welcome to Todo List Xtreme API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    # Try to query something simple to test database connection
    try:
        # Just count users
        user_count = db.query(models.User).count()
        return {"status": "connected", "user_count": user_count}
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
