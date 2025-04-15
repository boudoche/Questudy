# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Update the package list and install pandoc
RUN apt-get update && apt-get install -y \
    pandoc \
    gcc \
    python3-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install NLTK
RUN pip install nltk

RUN python -c "import nltk; nltk.download('punkt')"

# Copy only the requirements.txt file to leverage Docker cache
ADD requirements.txt ./requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Add the current directory contents into the container at /app/backend
ADD . ./backend

# Set the working directory to /backend
WORKDIR /backend

CMD ["python", "app.py"]