# Test pydantic-settings import
try:
    from pydantic_settings import BaseSettings
    print("Successfully imported pydantic_settings.BaseSettings")
except ImportError as e:
    print(f"Import error: {e}")
    
    # Try to import pydantic instead
    try:
        from pydantic import BaseSettings
        print("Successfully imported pydantic.BaseSettings")
    except ImportError as e2:
        print(f"Pydantic import error: {e2}")
