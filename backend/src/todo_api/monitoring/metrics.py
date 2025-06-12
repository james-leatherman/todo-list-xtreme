"""
Database metrics module for monitoring connection pool usage.

This module provides comprehensive database monitoring capabilities
for the Todo List Xtreme API using Prometheus metrics.
"""
from prometheus_client import Gauge, Counter, Histogram
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.pool import Pool
import time
import threading

# Database connection metrics
db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

db_connections_total = Gauge(
    'db_connections_total',
    'Total number of database connections in pool'
)

db_connections_idle = Gauge(
    'db_connections_idle', 
    'Number of idle database connections'
)

db_connections_created_total = Counter(
    'db_connections_created_total',
    'Total number of database connections created'
)

db_connections_closed_total = Counter(
    'db_connections_closed_total',
    'Total number of database connections closed'
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Time spent executing database queries',
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

db_query_total = Counter(
    'db_query_total',
    'Total number of database queries executed',
    ['operation']
)

# Thread-local storage for query timing
_local = threading.local()


def setup_database_metrics(engine: Engine):
    """
    Set up database metrics collection for the given SQLAlchemy engine.
    
    Args:
        engine: SQLAlchemy engine instance
    """
    
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_connection, connection_record):
        """Called when a connection is created"""
        db_connections_created_total.inc()
        _update_connection_pool_metrics(engine)
    
    @event.listens_for(engine, "close")
    def receive_close(dbapi_connection, connection_record):
        """Called when a connection is closed"""
        db_connections_closed_total.inc()
        _update_connection_pool_metrics(engine)
    
    @event.listens_for(engine, "checkout")
    def receive_checkout(dbapi_connection, connection_record, connection_proxy):
        """Called when a connection is retrieved from the pool"""
        _update_connection_pool_metrics(engine)
    
    @event.listens_for(engine, "checkin")
    def receive_checkin(dbapi_connection, connection_record):
        """Called when a connection is returned to the pool"""
        _update_connection_pool_metrics(engine)
    
    @event.listens_for(engine, "before_cursor_execute")
    def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Called before SQL execution"""
        _local.query_start_time = time.time()
        
        # Determine operation type
        operation = _get_operation_type(statement)
        context._query_operation = operation
    
    @event.listens_for(engine, "after_cursor_execute")
    def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Called after SQL execution"""
        if hasattr(_local, 'query_start_time'):
            duration = time.time() - _local.query_start_time
            db_query_duration_seconds.observe(duration)
            
            # Count the query by operation type
            operation = getattr(context, '_query_operation', 'unknown')
            db_query_total.labels(operation=operation).inc()


def _update_connection_pool_metrics(engine: Engine):
    """Update connection pool metrics"""
    try:
        pool = engine.pool
        
        # Try to get pool metrics safely using getattr
        try:
            # For QueuePool and similar pools
            size_method = getattr(pool, 'size', None)
            if size_method and callable(size_method):
                size_value = size_method()
                if isinstance(size_value, (int, float)):
                    db_connections_total.set(float(size_value))
                
            checkedout_method = getattr(pool, 'checkedout', None)
            if checkedout_method and callable(checkedout_method):
                checkedout_value = checkedout_method()
                if isinstance(checkedout_value, (int, float)):
                    db_connections_active.set(float(checkedout_value))
                
            checkedin_method = getattr(pool, 'checkedin', None)
            if checkedin_method and callable(checkedin_method):
                checkedin_value = checkedin_method()
                if isinstance(checkedin_value, (int, float)):
                    db_connections_idle.set(float(checkedin_value))
                
        except (AttributeError, TypeError, ValueError):
            # Fall back to basic metrics if specific pool methods aren't available
            pass
            
    except Exception as e:
        # Silently handle any pool introspection issues
        pass


def _get_operation_type(statement: str) -> str:
    """
    Extract the operation type from a SQL statement.
    
    Args:
        statement: SQL statement string
        
    Returns:
        Operation type (select, insert, update, delete, other)
    """
    if not statement:
        return 'unknown'
    
    statement_lower = statement.lower().strip()
    
    if statement_lower.startswith('select'):
        return 'select'
    elif statement_lower.startswith('insert'):
        return 'insert'
    elif statement_lower.startswith('update'):
        return 'update'
    elif statement_lower.startswith('delete'):
        return 'delete'
    elif statement_lower.startswith('create'):
        return 'create'
    elif statement_lower.startswith('drop'):
        return 'drop'
    elif statement_lower.startswith('alter'):
        return 'alter'
    else:
        return 'other'


def get_current_db_metrics() -> dict:
    """
    Get current database metrics values.
    
    Returns:
        Dictionary with current metric values
    """
    try:
        return {
            'active_connections': db_connections_active._value.get() if hasattr(db_connections_active._value, 'get') else 0,
            'total_connections': db_connections_total._value.get() if hasattr(db_connections_total._value, 'get') else 0,
            'idle_connections': db_connections_idle._value.get() if hasattr(db_connections_idle._value, 'get') else 0,
            'connections_created': db_connections_created_total._value.get() if hasattr(db_connections_created_total._value, 'get') else 0,
            'connections_closed': db_connections_closed_total._value.get() if hasattr(db_connections_closed_total._value, 'get') else 0,
            'total_queries': sum(metric._value.get() for metric in db_query_total._metrics.values()) if db_query_total._metrics else 0
        }
    except Exception as e:
        # Return safe defaults if metric access fails
        return {
            'active_connections': 0,
            'total_connections': 0,
            'idle_connections': 0,
            'connections_created': 0,
            'connections_closed': 0,
            'total_queries': 0
        }
