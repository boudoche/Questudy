from flask import Blueprint, request, jsonify, session
from services.chat.chat import Chat
from flask_cors import cross_origin
from services.chat.rewrite_answers import rewrite_answer, rewrite_hint
from services.process_and_chunk_pdf.process_pdf_workflow import divide_dataset_in_sections
from uuid import uuid4
import os
from middleware.auth import login_required
from models.course import Course

# Blueprint setup
question_bp = Blueprint('question_bp', __name__, url_prefix='/api')

# store chat object as they aren't serializable
session_store = {}



def get_chat_session(session_id):
    """ Helper function to get or initialize a Chat session """
    if session_id not in session_store:
        # Retrieve the file path from the session
        initial_questions = session.get('chunks') 
        print("initial questions ", initial_questions)
        
        if initial_questions:
            chat_session = Chat(initial_questions=initial_questions)
            session_store[session_id] = chat_session
        else:
            # Handle the case where the file path is not set or the file does not exist
            raise FileNotFoundError("chunks not found in session") 
    
    return session_store[session_id]

@question_bp.route('/get_question', methods=['GET'])
@login_required
def get_next_question(): 
    """ Get the next question for the user """
    # Retrieve session ID from cookies or generate a new one
    session_id = session.get('session_id')
    if session_id is None:
        session_id = str(uuid4())
        session['session_id'] = session_id
    
    result = {}
    print("chunks in session ", session.get('chunks'))
    chat_session = get_chat_session(session_id) 

    current_question = chat_session.chat_manager.get_current_question()
    result["current_question_index"] = chat_session.chat_manager.get_current_question_index() 
    result["total_questions"] = chat_session.chat_manager.get_total_questions() 
    result["current_child_index"] = chat_session.chat_manager.get_current_child_index() 
    result["get_current_child_count"] = chat_session.chat_manager.get_current_child_count()

    if current_question:
        result["question"] = current_question.question
        result["ref_text"] = current_question.text
        return jsonify(result), 200
    else:
        # no more questions available
        result["chat_evaluation"] = chat_session.get_chat_evaluation()
        # Remove session data from memory
        if session_id in session_store:
            del session_store[session_id]
        session.pop('session_id', None)
        session.pop('chunks', None)
        return jsonify(result), 200

@question_bp.route('/quit_quiz', methods=['POST'])
def quit_quiz():
    """ Reset only the chat/question state without clearing the entire session """
    session_id = session.get('session_id')
    
    if session_id and session_id in session_store:
        # Only remove the chat session from the session_store
        del session_store[session_id]
        # Remove only quiz-related session data
        session.pop('session_id', None)
        session.pop('chunks', None)

    return jsonify({"message": "Quiz state reset successfully"}), 200

@question_bp.route('/reset_session', methods=['POST'])
def reset_session():
    """ Reset the user's session without removing json_path """
    session_id = session.get('session_id')
    print('resetting session')
    
    if session_id:
        # Remove the chat session from the session_store
        if session_id in session_store:
            del session_store[session_id]  # Clear the stored Chat object
        
        session.clear()  # Clear the entire session

    return jsonify({"message": "Session reset successfully"}), 200


@question_bp.route("/submit_answer", methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def submit_answer():
    """ Submit the answer to the current question """
    answer = request.json.get('answer') 
    question = request.json.get('question')
    session_id = session.get('session_id') 
 
    answer = rewrite_answer(question, answer)

    if not session_id or session_id not in session_store:
        print("session id ", session_id)
        print("session store ", session_store)
        return jsonify({"error": "Session not found"}), 400

    chat_session = get_chat_session(session_id)

    current_question = chat_session.chat_manager.get_current_question()
    if current_question:
        result = chat_session.process_and_evaluate_answer(answer)
        
        # Add points based on feedback
        points_earned = 0
        if result.get('feedback') == "Perfect!":
            points_earned = 10
        elif result.get('feedback') == "Correct":
            points_earned = 5
        elif result.get('subquestion'):
            points_earned = 3
            
        if points_earned > 0:
            Course.update_ranking(
                session.get('current_course_id'),
                session.get('user_id'),
                session.get('user_name'),
                points_earned
            )
            
        return jsonify(result), 200
    else:
        return jsonify({"error": "No current question available"}), 400


@question_bp.route("/rewrite_answer", methods=['POST'])
@cross_origin(supports_credentials=True)
def rewrite_answer_endpoint():
    """ Rewrite the user's answer to the current question """
    answer = request.json.get('answer') 
    question = request.json.get('question')

    if answer:
        improved_answer = rewrite_answer(question, answer)
        return jsonify({"answer": improved_answer}), 200
    else:
        return jsonify({"error": "No current question available"}), 400


@question_bp.route('/upload_process_pdfs', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def upload_process_pdfs():
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files')
    question_count = int(request.form.get('questionCount', 3))
    
    try:
        # Process multiple PDFs and combine their content
        combined_content = []
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({"error": f"Invalid file type for {file.filename}. Only PDFs are supported."}), 400
                
            file_data = file.read()
            # Use the existing divide_dataset_in_sections function
            content = divide_dataset_in_sections(file_data, question_count)
            if content:
                combined_content.extend(content)
            file.seek(0)  # Reset file pointer for next read
        
        if not combined_content:
            return jsonify({"error": "No content could be extracted from the files"}), 400
        
        # Store in session
        session['chunks'] = combined_content
        session['session_id'] = str(uuid4())
        
        return jsonify({"message": "Files processed successfully"}), 200
    except Exception as e:
        print(f"Error processing PDFs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@question_bp.route('/award_quiz_completion', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def award_quiz_completion():
    try:
        data = request.json
        score = data.get('score', 0)
        course_id = session.get('current_course_id')
        user_id = session.get('user_id')
        user_name = session.get('user_name')
        
        # Add debug logging
        print("Debug award_quiz_completion:")
        print(f"Total Questions: {score}")
        print(f"Course ID: {course_id}")
        print(f"User ID: {user_id}")
        print(f"User Name: {user_name}")
        
        if not all([course_id, user_id, user_name]):
            missing = []
            if not course_id: missing.append('course_id')
            if not user_id: missing.append('user_id')
            if not user_name: missing.append('user_name')
            error_msg = f"Missing session data: {', '.join(missing)}"
            print(f"Error: {error_msg}")
            return jsonify({'error': error_msg}), 400
            
        # Award 20 points per question completed
        points_earned = score * 20
        
        success = Course.update_ranking(
            course_id,
            user_id,
            user_name,
            points_earned
        )
        
        if not success:
            return jsonify({'error': 'Failed to update ranking'}), 500
            
        return jsonify({
            'success': True,
            'points_earned': points_earned
        })
    except Exception as e:
        print(f"Error awarding quiz completion points: {str(e)}")
        return jsonify({'error': 'Failed to award points'}), 500