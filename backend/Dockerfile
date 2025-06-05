FROM python:3.11-slim

WORKDIR /app

# Copy requirements first to leverage Docker caching
COPY updated_requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r updated_requirements.txt

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
