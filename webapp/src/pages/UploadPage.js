import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import ProfileDropdown from '../components/ProfileDropdown';

function UploadPage() {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [questionCount, setQuestionCount] = useState(2);
    const navigate = useNavigate();

    const onDrop = (acceptedFiles) => {
        setFile(acceptedFiles[0]);
        console.log("File selected:", acceptedFiles[0].name);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'application/pdf' });

    const handleFileUpload = async () => {
        if (!file) {
            alert('Please select a file first!');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('questionCount', questionCount);

        console.log('post at ', process.env.REACT_APP_API_URL + '/api/upload_process_pdf');

        try {
            const response = await axios.post(process.env.REACT_APP_API_URL + '/api/upload_process_pdf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            });

            if (response.data.error) {
                alert(response.data.error);
            } else {
                navigate('/questions', { 
                    replace: false, 
                    state: { previousPage: window.location.pathname }
                  });
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('Failed to upload file');
        } finally {
            setIsLoading(false);
        }
    };

    const questionOptions = [
        { count: 2, time: '2-5 minutes' },
        { count: 3, time: '3-8 minutes' },
        { count: 5, time: '5-20 minutes' },
        { count: 10, time: '10-40 minutes' },
    ];

    const samplePdfs = [
        { title: "How to drink water", filename: "drink_water.pdf" },
        { title: "How to make a sandwich", filename: "sandwich.pdf" },
        { title: "How to open a door", filename: "door.pdf" }
    ];

    return (
        <div className="landing-page">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Questudying</h1>
                    <p>Your personal learning assistant</p>
                </div>
                <ProfileDropdown />
            </header>
            <main>
                <section className="explanation-section">
                <h2>How It Works</h2>
                <p>
                    - Upload a document, and the app will ask you questions about it.<br />
                    - It's normal to make mistakes and to say <b>"I don't know"</b> — that's when the <b>learning</b> happens.<br />
                    - <b>Repeat</b> with the same document to improve understanding and retention.<br />
                    - Stick with it, and you'll see <b>progress</b>. Good luck!
                </p>
                </section>
                <section className="upload-section">
                    <div {...getRootProps()} className="dropzone">
                        <input {...getInputProps()} />
                        {
                            isDragActive ?
                            <p>Drop the document here ...</p> :
                            <p>Drag and drop your document here, or click to browse</p>
                        }
                    </div>
                    {file && (
                        <p className="file-name">Selected File: <strong>{file.name}</strong></p>
                    )}
                    <div className="question-count">
                        <label htmlFor="questionCount">Choose number of questions:</label>
                        <select
                            id="questionCount"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                        >
                            {questionOptions.map(option => (
                                <option key={option.count} value={option.count}>
                                    {option.count} ({option.time})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleFileUpload} className="upload-button">
                        {isLoading ? 'Generating questions...' : 'Generate Questions'}
                    </button>
                </section>
                {/* <section className="sample-pdfs">
                    <h3>Try it with some simple PDFs:</h3>
                    <div className="pdf-list">
                        {samplePdfs.map((pdf, index) => (
                            <div key={index} className="pdf-item">
                                <span>{pdf.title}</span>
                                <a href={process.env.REACT_APP_API_URL + `/static/test_pdf/${pdf.filename}`} download className="download-link">Download</a>
                            </div>
                        ))}
                    </div>
                </section> */}
            </main>
            <footer>
                <p>&copy; 2024 LearningMate. All rights reserved.</p>
            </footer>
            <style jsx>{`
    body, html {
        margin: 0;
        padding: 0;
        min-height: 100%;
        height: 100%;
        overflow-y: auto;
        background-color: #1a1a1a;
        color: #ffffff;
        font-family: 'Arial', sans-serif;
    }

    .landing-page {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        text-align: center;
        padding: 2rem;
        background-color: #2a2a2a;
        flex-shrink: 0;
    }

    h1 {
        font-size: 4.5rem;
        margin-bottom: 0.5rem;
        color: #4576f5;
        font-family: 'Poppins', sans-serif; /* Custom font for a modern look */
        background: linear-gradient(90deg, #4576f5, #34a3ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
        letter-spacing: 2px; /* Adds spacing between letters */
        animation: pulse 2s infinite; /* Adds a subtle animation */
    }

    main {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 2rem;
        overflow-y: auto;
    }

    .upload-section, .sample-pdfs {
        background: #2a2a2a;
        border-radius: 10px;
        padding: 2rem;
        width: 100%;
        max-width: 800px; /* Increase the width for the PDFs section */
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
    }

    .dropzone {
        border: 2px dashed white;
        border-radius: 10px;
        padding: 4rem; /* Increase height of the drop zone */
        text-align: center;
        cursor: pointer;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .explanation-section, .upload-section {
        background: #2a2a2a;
        border-radius: 10px;
        padding: 2rem;
        width: 100%;
        max-width: 800px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
    }

    .explanation-section h2 {
        color: #4576f5;
        margin-bottom: 1rem;
    }

    .explanation-section p {
        line-height: 1.6;
    }

    .dropzone:hover {
        background-color: #3a3a3a;
    }

    .file-name {
        margin-bottom: 1rem;
        color: #3498db;
        font-size: 1.1rem;
    }

    .question-count {
        margin-bottom: 1rem;
        font-size: 1.1rem;
        text-align: center; /* Center align the text */
    }

    .question-count label {
        display: block; /* Ensure label takes up full width */
        margin-bottom: 0.5rem; /* Space between label and select */
        color: #ffffff; /* Set color for the label */
    }

    .question-count select {
        display: block; /* Ensure select takes up full width */
        margin: 0 auto; /* Center the dropdown */
        padding: 0.5rem;
        border-radius: 5px;
        background-color: #3a3a3a;
        color: #ffffff;
        border: 1px solid white;
        width: 80%; /* Make dropdown responsive */
        max-width: 300px; /* Set a max-width for the dropdown */
    }

    .upload-button {
        background-color: #3498db;
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 10px;
        font-size: 1.2rem;
        cursor: pointer;
        transition: background-color 0.3s;
        width: 80%;
        max-width: 300px; /* Set a max-width for the button */
        display: block; /* Ensure block-level display for margin auto */
        margin: 0 auto; /* Center the button horizontally */
    }

    .upload-button:hover {
        background-color: #2980b9;
    }

    .sample-pdfs h3 {
        color: white;
        margin-bottom: 1.5rem;
        font-size: 1.8rem;
        text-align: center;
    }

    .pdf-list {
        display: flex;
        flex-direction: row;
        gap: 1rem; /* Adjust gap if needed */
        justify-content: center;
        flex-wrap: wrap;
    }

    .pdf-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #2e2e2e;
        padding: 1.5rem;
        border-radius: 10px;
        transition: transform 0.3s, box-shadow 0.3s;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        width: 200px;
        text-align: center;
    }

    .pdf-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }

    .pdf-item span {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        color: #ffffff;
    }

    .download-link {
        background-color: #3498db;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 5px;
        text-decoration: none;
        transition: background-color 0.3s, transform 0.3s;
        font-size: 1rem;
    }

    .download-link:hover {
        background-color: #2980b9;
        transform: scale(1.05);
    }

    footer {
        text-align: center;
        padding: 1.5rem;
        background-color: #2a2a2a;
        font-size: 0.9rem;
        color: #ffffff;
        flex-shrink: 0;
    }
`}</style>

        </div>
    );
}

export default UploadPage;
