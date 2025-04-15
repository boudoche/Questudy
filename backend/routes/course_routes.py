from flask import Blueprint, request, jsonify, session, send_file
from models.course import Course
from flask_cors import cross_origin
from middleware.auth import login_required
from models.user import User
import io

course_bp = Blueprint('course_bp', __name__, url_prefix='/api')

@course_bp.route('/courses', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_courses():
    try:
        user_id = session.get('user_id')
        user_courses = Course.get_user_courses(user_id)
        return jsonify(user_courses)
    except Exception as e:
        print(f"Error fetching courses: {str(e)}")
        return jsonify({'error': 'Failed to fetch courses'}), 500

@course_bp.route('/courses', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def create_course():
    try:
        data = request.get_json()
        code = data.get('code')
        title = data.get('title')
        level = data.get('level')
        creator_id = session.get('user_id')

        if not all([code, title, level]):
            return jsonify({'error': 'Missing required fields'}), 400

        course_id = Course.create_course(code, title, level, creator_id)
        return jsonify({'message': 'Course created successfully', 'course_id': course_id}), 201
    except Exception as e:
        print(f"Error creating course: {str(e)}")
        return jsonify({'error': 'Failed to create course'}), 500

@course_bp.route('/courses/search', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def search_courses():
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify([])
            
        search_results = Course.search_courses(query)
        return jsonify(search_results)
    except Exception as e:
        print(f"Error searching courses: {str(e)}")
        return jsonify({'error': 'Failed to search courses'}), 500

@course_bp.route('/courses/<course_id>/enroll', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def enroll_in_course(course_id):
    try:
        user_id = session.get('user_id')
        if Course.enroll_user(course_id, user_id):
            return jsonify({'message': 'Successfully enrolled in course'})
        return jsonify({'error': 'Failed to enroll in course'}), 400
    except Exception as e:
        print(f"Error enrolling in course: {str(e)}")
        return jsonify({'error': 'Failed to enroll in course'}), 500

@course_bp.route('/courses/<course_id>/unenroll', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def unenroll_from_course(course_id):
    try:
        user_id = session.get('user_id')
        if Course.unenroll_user(course_id, user_id):
            return jsonify({'message': 'Successfully unenrolled from course'})
        return jsonify({'error': 'Failed to unenroll from course'}), 400
    except Exception as e:
        print(f"Error unenrolling from course: {str(e)}")
        return jsonify({'error': 'Failed to unenroll from course'}), 500

@course_bp.route('/courses/<course_id>/creator-status', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def check_creator_status(course_id):
    try:
        user_id = session.get('user_id')
        is_creator = Course.is_course_creator(course_id, user_id)
        return jsonify({'isCreator': is_creator})
    except Exception as e:
        print(f"Error checking creator status: {str(e)}")
        return jsonify({'error': 'Failed to check creator status'}), 500

@course_bp.route('/courses/<course_id>/files', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def upload_file(course_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        file_data = file.read()
        if Course.add_file(course_id, file_data, file.filename, file.content_type):
            return jsonify({'message': 'File uploaded successfully'})
        return jsonify({'error': 'Failed to upload file'}), 500
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return jsonify({'error': 'Failed to upload file'}), 500

@course_bp.route('/courses/<course_id>/files', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_files(course_id):
    try:
        files = Course.get_files(course_id)
        if files:
            return jsonify(files)
        else:
            print(f"No files found for course {course_id}")
            return jsonify([])
    except Exception as e:
        print(f"Error getting files: {str(e)}")
        return jsonify({'error': 'Failed to get files'}), 500

@course_bp.route('/courses/<course_id>/files/<filename>', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def download_file(course_id, filename):
    try:
        file_doc = Course.get_file(course_id, filename)
        if file_doc:
            return send_file(
                io.BytesIO(file_doc['data']),
                mimetype=file_doc['content_type'],
                as_attachment=True,
                download_name=filename
            )
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Failed to download file'}), 500

@course_bp.route('/courses/<course_id>/files/<filename>', methods=['DELETE'])
@cross_origin(supports_credentials=True)
@login_required
def delete_file(course_id, filename):
    try:
        if Course.delete_file(course_id, filename):
            return jsonify({'message': 'File deleted successfully'})
        return jsonify({'error': 'Failed to delete file'}), 500
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return jsonify({'error': 'Failed to delete file'}), 500

@course_bp.route('/courses/<course_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_course(course_id):
    try:
        course = Course.get_course_details(course_id)
        if course:
            return jsonify(course)
        return jsonify({'error': 'Course not found'}), 404
    except Exception as e:
        print(f"Error getting course: {str(e)}")
        return jsonify({'error': 'Failed to get course'}), 500

@course_bp.route('/courses/<course_id>/rankings', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_course_rankings(course_id):
    try:
        rankings = Course.get_rankings(course_id)
        user_id = session.get('user_id')
        
        # Find user's rank
        user_rank = next((index + 1 for (index, r) in enumerate(rankings) 
                         if r["user_id"] == user_id), None)
        
        return jsonify({
            "rankings": rankings,
            "userRank": user_rank
        })
    except Exception as e:
        print(f"Error fetching rankings: {str(e)}")
        return jsonify({'error': 'Failed to fetch rankings'}), 500

@course_bp.route('/set_current_course', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def set_current_course():
    try:
        data = request.get_json()
        course_id = data.get('courseId')
        if not course_id:
            return jsonify({'error': 'Course ID is required'}), 400
            
        # Get user details from the database and store in session
        user = User.get_user_by_id(session.get('user_id'))
        if user:
            session['user_name'] = user.get('name')  # or whatever field contains the username
            session['current_course_id'] = course_id
            print(f"Set current_course_id in session: {course_id}")
            print(f"Set user_name in session: {session['user_name']}")
            return jsonify({'success': True})
        return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        print(f"Error setting current course: {str(e)}")
        return jsonify({'error': 'Failed to set current course'}), 500 