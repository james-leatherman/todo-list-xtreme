"""
Logging configuration for Todo List Xtreme API

This module provides centralized logging configuration for the entire application,
including structured logging, request/response logging, and integration with
observability tools.
"""

import logging
import logging.config
import json
import time
from typing import Any, Dict, Optional
from pathlib import Path

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add extra fields if present
        if hasattr(record, "request_id"):
            log_entry["request_id"] = getattr(record, "request_id")
        if hasattr(record, "user_id"):
            log_entry["user_id"] = getattr(record, "user_id")
        if hasattr(record, "endpoint"):
            log_entry["endpoint"] = getattr(record, "endpoint")
        if hasattr(record, "method"):
            log_entry["method"] = getattr(record, "method")
        if hasattr(record, "status_code"):
            log_entry["status_code"] = getattr(record, "status_code")
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = getattr(record, "duration_ms")
        if hasattr(record, "error_type"):
            log_entry["error_type"] = getattr(record, "error_type")
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)


class RequestResponseLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""
    
    def __init__(self, app, logger_name: str = "todo_api.requests"):
        super().__init__(app)
        self.logger = logging.getLogger(logger_name)
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response details."""
        # Generate request ID
        request_id = f"{int(time.time() * 1000)}-{id(request)}"
        
        # Extract request details
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log request
        start_time = time.time()
        self.logger.info(
            f"Request started: {method} {url}",
            extra={
                "request_id": request_id,
                "method": method,
                "endpoint": url,
                "client_ip": client_ip,
                "user_agent": user_agent,
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful response
            self.logger.info(
                f"Request completed: {method} {url} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "endpoint": url,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                }
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            # Log error response
            self.logger.error(
                f"Request failed: {method} {url} - {str(e)}",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "endpoint": url,
                    "duration_ms": round(duration_ms, 2),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            raise


def setup_logging(
    log_level: str = "INFO",
    log_format: str = "json",
    log_file: Optional[str] = None
) -> None:
    """
    Configure application logging.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Log format ("json" or "standard")
        log_file: Path to log file (optional)
    """
    
    # Define formatters
    formatters = {
        "json": {
            "()": JSONFormatter,
        },
        "standard": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    }
    
    # Define handlers
    handlers = {
        "console": {
            "class": "logging.StreamHandler",
            "level": log_level,
            "formatter": log_format,
            "stream": "ext://sys.stdout",
        }
    }
    
    # Add file handler if log_file is specified
    if log_file:
        handlers["file"] = {
            "class": "logging.FileHandler",
            "level": log_level,
            "formatter": log_format,
            "filename": log_file,
            "mode": "a",
        }
    
    # Define loggers
    loggers = {
        "todo_api": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "todo_api.requests": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "todo_api.auth": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "todo_api.todos": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "todo_api.column_settings": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "todo_api.database": {
            "level": log_level,
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "uvicorn": {
            "level": "INFO",
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": list(handlers.keys()),
            "propagate": False,
        },
    }
    
    # Configure logging
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": formatters,
        "handlers": handlers,
        "loggers": loggers,
        "root": {
            "level": log_level,
            "handlers": list(handlers.keys()),
        }
    }
    
    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(f"todo_api.{name}")


# Convenience functions for common logging patterns
def log_api_call(logger: logging.Logger, endpoint: str, method: str, **kwargs):
    """Log an API call with standardized format."""
    logger.info(
        f"API call: {method} {endpoint}",
        extra={
            "endpoint": endpoint,
            "method": method,
            **kwargs
        }
    )


def log_database_operation(logger: logging.Logger, operation: str, table: str, **kwargs):
    """Log a database operation with standardized format."""
    logger.info(
        f"Database operation: {operation} on {table}",
        extra={
            "operation": operation,
            "table": table,
            **kwargs
        }
    )


def log_authentication_event(logger: logging.Logger, event: str, user_id: Optional[str] = None, **kwargs):
    """Log an authentication event with standardized format."""
    logger.info(
        f"Authentication event: {event}",
        extra={
            "event": event,
            "user_id": user_id,
            **kwargs
        }
    )


def log_error(logger: logging.Logger, error: Exception, context: Optional[str] = None, **kwargs):
    """Log an error with standardized format."""
    logger.error(
        f"Error occurred: {str(error)}" + (f" in {context}" if context else ""),
        extra={
            "error_type": type(error).__name__,
            "context": context,
            **kwargs
        },
        exc_info=True
    )
