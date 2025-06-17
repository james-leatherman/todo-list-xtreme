FROM python:3.11-slim

WORKDIR /app

# Copy requirements first to leverage Docker caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Add src to Python path
ENV PYTHONPATH="${PYTHONPATH}:/app/src"

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.todo_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
