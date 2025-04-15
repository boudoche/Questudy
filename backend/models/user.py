from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

# Use MongoDB Atlas connection string
mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://omar:3xSOmCtFKGobG3ht@cluster0.5mikz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
client = MongoClient(mongodb_uri)
db = client.studymate
users = db.users

# Create index for email uniqueness
try:
    users.create_index("email", unique=True)
except Exception as e:
    print(f"Error creating index: {str(e)}")

class User:
    def __init__(self, email, password, name=None):
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.name = name
        self.created_at = datetime.utcnow()

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def create_user(email, password, name=None):
        if users.find_one({"email": email}):
            return None
        user = User(email, password, name)
        user_data = {
            "_id": str(uuid.uuid4()),
            "email": user.email,
            "password_hash": user.password_hash,
            "name": user.name,
            "created_at": user.created_at
        }
        result = users.insert_one(user_data)
        return str(result.inserted_id)

    @staticmethod
    def get_user_by_email(email):
        return users.find_one({"email": email})

    @staticmethod
    def get_user_by_id(user_id):
        try:
            return users.find_one({"_id": user_id})
        except Exception as e:
            print(f"Error getting user by ID: {str(e)}")
            return None
