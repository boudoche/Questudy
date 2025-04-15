from flask import Blueprint, request, jsonify, session
from models.user import User
from flask_cors import cross_origin
from werkzeug.security import check_password_hash

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def signup():
    if request.method == 'OPTIONS':
        return '', 204
        
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user_id = User.create_user(email, password, name)
    if not user_id:
        return jsonify({"error": "Email already exists"}), 400

    session['user_id'] = user_id
    return jsonify({"message": "User created successfully", "user_id": user_id}), 201

@auth_bp.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.get_user_by_email(email)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session['user_id'] = user['_id']
    return jsonify({"message": "Login successful", "user_id": str(user['_id'])}), 200

@auth_bp.route('/logout', methods=['POST'])
@cross_origin(supports_credentials=True)
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/check-auth', methods=['GET'])
@cross_origin(supports_credentials=True)
def check_auth():
    user_id = session.get('user_id')
    if user_id:
        return jsonify({"authenticated": True, "user_id": user_id}), 200
    return jsonify({"authenticated": False}), 401
