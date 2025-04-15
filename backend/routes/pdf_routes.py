from flask import Blueprint, request, jsonify, session
from services.chat.chat import Chat
from flask_cors import cross_origin
from services.process_and_chunk_pdf.process_pdf_workflow import divide_dataset_in_sections
from middleware.auth import login_required
from models.course import Course
import io

pdf_bp = Blueprint('pdf_bp', __name__, url_prefix='/api')

@pdf_bp.route('/upload_process_pdf', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def upload_pdf():
    try:
        print("Starting file upload process...")
        
        if 'file' not in request.files:
            print("No file in request")
            return jsonify({'error': 'No file part'}), 400 

        file = request.files['file']
        if file.filename == '':
            print("Empty filename")
            return jsonify({'error': 'No selected file'}), 400

        print(f"Received file: {file.filename}, Content-Type: {file.content_type}")

        # Check if the file is a supported type
        supported_extensions = ['.pdf', '.docx', '.txt', '.pptx', '.ppt', 'md', 'jpg', 'jpeg', 'png']
        if not any(file.filename.lower().endswith(ext) for ext in supported_extensions):
            print(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type'}), 400

        # Get file data and question count
        file_data = file.read()
        question_count = int(request.form.get('questionCount', 3))
        print(f"Question count: {question_count}")
        print(f"File size: {len(file_data)} bytes")

        try:
            # Pass the bytes directly instead of creating a new BytesIO object
            result = divide_dataset_in_sections(file_data, question_count)
            print("File processed successfully")
            
            # Store results in session
            session['chunks'] = result
            session['question_count'] = question_count
            
            print(f"Saving following chunks in session: {result}")
            return jsonify({'message': 'File processed successfully'})
            
        except Exception as process_error:
            print(f"Error processing file content: {str(process_error)}")
            print(f"Error type: {type(process_error)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': 'Failed to process file content'}), 500

    except Exception as e:
        print(f"Unexpected error in upload_pdf: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to process file'}), 500


@pdf_bp.route('/static/test_pdf/<filename>')
def serve_pdf(filename):
    print('getting', filename)
    return send_from_directory('static/test_pdf', filename)



@pdf_bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Test successful'})