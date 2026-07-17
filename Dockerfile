# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with UID 1000 (Hugging Face Spaces requirement)
RUN useradd -m -u 1000 user
WORKDIR /code

# Copy requirements and install dependencies
COPY requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the application files into /code
COPY --chown=user:user . /code

# Make the directory writable by all for HuggingFace runtime file writes
RUN chmod -R 777 /code
USER user

# Expose port 7860 for HuggingFace Spaces
EXPOSE 8000

# Start the FastAPI server using uvicorn
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000"]
