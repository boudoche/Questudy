from datetime import datetime
from pymongo import MongoClient
from bson.binary import Binary
import os
from dotenv import load_dotenv
import uuid
import re

load_dotenv()

mongodb_uri = os.getenv('MONGODB_URI')
client = MongoClient(mongodb_uri)
db = client.studymate
courses = db.courses

class Course:
    def __init__(self, code, title, level, creator_id):
        self.code = code
        self.title = title
        self.level = level
        self.creator_id = creator_id
        self.enrolled_users = [creator_id]  # Creator is automatically enrolled
        self.files = []
        self.created_at = datetime.utcnow()
        self.rankings = []  # Add rankings field

    @staticmethod
    def create_course(code, title, level, creator_id):
        course = {
            "_id": str(uuid.uuid4()),
            "code": code,
            "title": title,
            "level": level,
            "creator_id": creator_id,
            "enrolled_users": [creator_id],
            "files": [],
            "created_at": datetime.utcnow(),
            "rankings": []  # Initialize rankings
        }
        result = courses.insert_one(course)
        return course["_id"]

    @staticmethod
    def get_user_courses(user_id):
        """Get basic course info for dashboard"""
        try:
            cursor = courses.find(
                {
                    "$or": [
                        {"enrolled_users": user_id},
                        {"creator_id": user_id}
                    ]
                },
                {
                    "_id": 1,
                    "code": 1,
                    "title": 1,
                    "level": 1,
                    "creator_id": 1,
                    "enrolled_users": 1,
                    "created_at": 1
                }
            )
            
            course_list = []
            for course in cursor:
                course_dict = {
                    "_id": course["_id"],
                    "code": course["code"],
                    "title": course["title"],
                    "level": course["level"],
                    "creator_id": course["creator_id"],
                    "enrolled_users": course.get("enrolled_users", []),
                    "created_at": course["created_at"].isoformat()
                }
                course_list.append(course_dict)
            
            return course_list
        except Exception as e:
            print(f"Error getting user courses: {str(e)}")
            return []

    @staticmethod
    def get_course_details(course_id):
        """Get full course details including enrolled users"""
        try:
            course = courses.find_one(
                {"_id": course_id},
                {
                    "files": 0  # Exclude files for better performance
                }
            )
            if course:
                course['_id'] = str(course['_id'])
                course['created_at'] = course['created_at'].isoformat()
                return course
            return None
        except Exception as e:
            print(f"Error getting course details: {str(e)}")
            return None

    @staticmethod
    def search_courses(query):
        try:
            # Create a case-insensitive regex pattern
            pattern = re.compile(query, re.IGNORECASE)
            
            # Search in both code and title fields
            cursor = courses.find({
                "$or": [
                    {"code": {"$regex": pattern}},
                    {"title": {"$regex": pattern}}
                ]
            }, {
                "_id": 1,
                "code": 1,
                "title": 1,
                "level": 1,
                "creator_id": 1,
                "enrolled_users": 1
            })
            
            # Ensure enrolled_users exists in each result
            results = list(cursor)
            for result in results:
                if 'enrolled_users' not in result:
                    result['enrolled_users'] = []
                
            return results
        except Exception as e:
            print(f"Error searching courses: {str(e)}")
            return []

    @staticmethod
    def enroll_user(course_id, user_id):
        try:
            result = courses.update_one(
                {"_id": course_id},
                {"$addToSet": {"enrolled_users": user_id}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error enrolling user: {str(e)}")
            return False

    @staticmethod
    def unenroll_user(course_id, user_id):
        try:
            course = courses.find_one({"_id": course_id})
            if course and course['creator_id'] != user_id:
                result = courses.update_one(
                    {"_id": float(course_id)},
                    {"$pull": {"enrolled_users": user_id}}
                )
                return result.modified_count > 0
            return False
        except Exception as e:
            print(f"Error unenrolling user: {str(e)}")
            return False

    @staticmethod
    def is_course_creator(course_id, user_id):
        try:
            course = courses.find_one({"_id": course_id})
            return course and course['creator_id'] == user_id
        except Exception as e:
            print(f"Error checking creator status: {str(e)}")
            return False

    @staticmethod
    def add_file(course_id, file_data, filename, content_type):
        try:
            file_doc = {
                "id": str(uuid.uuid4()),
                "filename": filename,
                "data": Binary(file_data),
                "content_type": content_type,
                "uploaded_at": datetime.utcnow()
            }
            
            result = courses.update_one(
                {"_id": course_id},
                {"$push": {"files": file_doc}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error adding file: {str(e)}")
            return False

    @staticmethod
    def get_files(course_id):
        try:
            course = courses.find_one({"_id": course_id})
            return [{
                    "id": f["id"],  
                    "filename": f["filename"],
                    "content_type": f["content_type"],
                    "uploaded_at": f["uploaded_at"]
                } for f in course["files"]]
            
        except Exception as e:
            print(f"Error getting files: {str(e)}")
            return []

    @staticmethod
    def get_file(course_id, filename):
        try:
            course = courses.find_one({
                "_id": course_id,
                "files.filename": filename
            }, {"files.$": 1})
            
            if course and course.get('files'):
                return course['files'][0]
            return None
        except Exception as e:
            print(f"Error getting file: {str(e)}")
            return None

    @staticmethod
    def delete_file(course_id, filename):
        try:
            result = courses.update_one(
                {"_id": course_id},
                {"$pull": {"files": {"filename": filename}}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False 

    @staticmethod
    def update_ranking(course_id, user_id, user_name, points_earned):
        try:
            # Try to update existing ranking
            result = courses.update_one(
                {
                    "_id": course_id,
                    "rankings.user_id": user_id
                },
                {
                    "$inc": {"rankings.$.points": points_earned}
                }
            )
            
            # If user not found in rankings, add them
            if result.modified_count == 0:
                courses.update_one(
                    {"_id": course_id},
                    {
                        "$push": {
                            "rankings": {
                                "user_id": user_id,
                                "user_name": user_name,
                                "points": points_earned
                            }
                        }
                    }
                )
            return True
        except Exception as e:
            print(f"Error updating ranking: {str(e)}")
            return False

    @staticmethod
    def get_rankings(course_id):
        try:
            course = courses.find_one({"_id": course_id})
            if course and "rankings" in course:
                rankings = sorted(course["rankings"], 
                                key=lambda x: x["points"], 
                                reverse=True)
                return rankings
            return []
        except Exception as e:
            print(f"Error getting rankings: {str(e)}")
            return [] 