"""
Database metrics module for monitoring connection pool usage.

This module provides comprehensive database monitoring capabilities
for the Todo List Xtreme API using Prometheus metrics.
"""
from prometheus_client import Gauge, Counter, Histogram, REGISTRY, CollectorRegistry
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.pool import Pool
import time
import threading
from typing import Union, Optional, List, Tuple

# Global references to metrics - properly typed
db_connections_active: Optional[Gauge] = None
db_connections_total: Optional[Gauge] = None
db_connections_idle: Optional[Gauge] = None
db_connections_created_total: Optional[Counter] = None
db_connections_closed_total: Optional[Counter] = None
db_query_duration_seconds: Optional[Histogram] = None
db_query_total: Optional[Counter] = None

def _get_or_create_gauge(name: str, description: str) -> Gauge:
    """Get existing gauge or create new one."""
    try:
        return Gauge(name, description)
    except ValueError:
        # Metric already exists, use a simple fallback
        # Create with a prefix to avoid conflicts
        return Gauge(f"{name}_fallback", description)

def _get_or_create_counter(name: str, description: str, labelnames: Optional[List[str]] = None) -> Counter:
    """Get existing counter or create new one."""
    try:
        if labelnames:
            return Counter(name, description, labelnames)
        else:
            return Counter(name, description)
    except ValueError:
        # Metric already exists, use a simple fallback
        if labelnames:
            return Counter(f"{name}_fallback", description, labelnames)
        else:
            return Counter(f"{name}_fallback", description)

def _get_or_create_histogram(name: str, description: str, buckets: Optional[Tuple[float, ...]] = None) -> Histogram:
    """Get existing histogram or create new one."""
    try:
        if buckets:
            return Histogram(name, description, buckets=buckets)
        else:
            return Histogram(name, description)
    except ValueError:
        # Metric already exists, use a simple fallback
        if buckets:
            return Histogram(f"{name}_fallback", description, buckets=buckets)
        else:
            return Histogram(f"{name}_fallback", description)

def _initialize_metrics():
    """Initialize all metrics safely."""
    global db_connections_active, db_connections_total, db_connections_idle
    global db_connections_created_total, db_connections_closed_total
    global db_query_duration_seconds, db_query_total
    
    if db_connections_active is None:
        db_connections_active = _get_or_create_gauge(
            'db_connections_active', 
            'Number of active database connections'
        )

    if db_connections_total is None:
        db_connections_total = _get_or_create_gauge(
            'db_connections_total',
            'Total number of database connections in pool'  
        )

    if db_connections_idle is None:
        db_connections_idle = _get_or_create_gauge(
            'db_connections_idle',
            'Number of idle database connections'
        )

    if db_connections_created_total is None:
        db_connections_created_total = _get_or_create_counter(
            'db_connections_created_total',
            'Total number of database connections created'
        )

    if db_connections_closed_total is None:
        db_connections_closed_total = _get_or_create_counter(
            'db_connections_closed_total',
            'Total number of database connections closed'
        )

    if db_query_duration_seconds is None:
        db_query_duration_seconds = _get_or_create_histogram(
            'db_query_duration_seconds',
            'Time spent executing database queries',
            buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
        )

    if db_query_total is None:
        db_query_total = _get_or_create_counter(
            'db_query_total',
            'Total number of database queries executed',
            ['operation']
        )

# Initialize metrics on module load
_initialize_metrics()

# Thread-local storage for query timing
_local = threading.local()


def setup_database_metrics(engine: Engine):
    """
    Set up database metrics collection for the given SQLAlchemy engine.
    
    Args:
        engine: SQLAlchemy engine instance
    """
    # Ensure metrics are initialized
    _initialize_metrics()
    
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_connection, connection_record):
        """Called when a connection is created"""
        if db_connections_created_total:
            db_connections_created_total.inc()
        _update_connection_pool_metrics(engine)
    
    @event.listens_for(engine, "close")
    def receive_close(dbapi_connection, connection_record):
        """Called when a connection is closed"""
        if db_connections_closed_total:
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
            if db_query_duration_seconds:
                db_query_duration_seconds.observe(duration)
            
            # Count the query by operation type
            operation = getattr(context, '_query_operation', 'unknown')
            if db_query_total:
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
                if isinstance(size_value, (int, float)) and db_connections_total:
                    db_connections_total.set(float(size_value))
                
            checkedout_method = getattr(pool, 'checkedout', None)
            if checkedout_method and callable(checkedout_method):
                checkedout_value = checkedout_method()
                if isinstance(checkedout_value, (int, float)) and db_connections_active:
                    db_connections_active.set(float(checkedout_value))
                
            checkedin_method = getattr(pool, 'checkedin', None)
            if checkedin_method and callable(checkedin_method):
                checkedin_value = checkedin_method()
                if isinstance(checkedin_value, (int, float)) and db_connections_idle:
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
        # Use safe metric access - these methods should work without accessing private attributes
        result = {
            'active_connections': 0,
            'total_connections': 0, 
            'idle_connections': 0,
            'connections_created': 0,
            'connections_closed': 0,
            'total_queries': 0
        }
        
        # Try to get values through collect() method which is the proper way
        if db_connections_active:
            try:
                for sample in db_connections_active.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_connections_active':
                            result['active_connections'] = int(metric.value)
                            break
            except Exception:
                pass
                
        if db_connections_total:
            try:
                for sample in db_connections_total.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_connections_total':
                            result['total_connections'] = int(metric.value)
                            break
            except Exception:
                pass
                
        if db_connections_idle:
            try:
                for sample in db_connections_idle.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_connections_idle':
                            result['idle_connections'] = int(metric.value)
                            break
            except Exception:
                pass
                
        if db_connections_created_total:
            try:
                for sample in db_connections_created_total.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_connections_created_total':
                            result['connections_created'] = int(metric.value)
                            break
            except Exception:
                pass
                
        if db_connections_closed_total:
            try:
                for sample in db_connections_closed_total.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_connections_closed_total':
                            result['connections_closed'] = int(metric.value)
                            break
            except Exception:
                pass
                
        if db_query_total:
            try:
                total_queries = 0
                for sample in db_query_total.collect():
                    for metric in sample.samples:
                        if metric.name == 'db_query_total':
                            total_queries += metric.value
                result['total_queries'] = int(total_queries)
            except Exception:
                pass
                
        return result
        
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
