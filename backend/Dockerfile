FROM python:3.12-slim

WORKDIR /app

# Install system dependencies including Stockfish
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    stockfish \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.3

# Copy Poetry files
COPY pyproject.toml poetry.lock* ./

# Configure Poetry: Don't create virtual env, install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy application code
COPY . .

# Set PYTHONPATH so imports work correctly
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
# Initialize db module (db/__init__.py) and start API
CMD ["poetry", "run", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

