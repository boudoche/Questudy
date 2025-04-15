import os

class Config:
    SECRET_KEY = str(os.getenv('SECRET_KEY', 'default-secret-key'))
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    SESSION_TYPE = 'filesystem'  # Using filesystem for session storage
    SESSION_FILE_DIR = 'cookies'  # Specify the directory for session files
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'session:'
    # Ensure the directory exists or create it
    os.makedirs(SESSION_FILE_DIR, exist_ok=True)
    # Add other configurations as needed
