from flask import Flask, session
from flask_cors import CORS
from routes.pdf_routes import pdf_bp
from routes.question_routes import question_bp 
from routes.auth_routes import auth_bp
from routes.course_routes import course_bp
from config import Config
from datetime import timedelta
from flask_session import Session
import debugpy
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# Make the session permanent and set the session lifetime
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # Adjust the session lifetime as needed

# Enable CORS with credentials support
CORS(app, 
     supports_credentials=True,
     resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
     })

# Register blueprints
app.register_blueprint(pdf_bp)
app.register_blueprint(question_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(course_bp)
@app.before_request
def make_session_permanent():
    """Make session permanent and refresh lifetime on each request."""
    session.permanent = True  # Make the session permanent
    session.modified = True   # Refresh session timeout on each request

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

    # debug=True runs the server in development mode with auto-reload
    # quite weirdly, if it is activated it is not possible to attach the vs-code debugger
    # so to debug the server it needs to be disabled
    # app.run(host='0.0.0.0', port=5001, debug=True)

