import sys
print(sys.path)
import pydantic
print("pydantic version:", pydantic.__version__)
try:
    from pydantic_settings import BaseSettings
    print("pydantic_settings imported successfully")
except ImportError as e:
    print("Error importing pydantic_settings:", e)
