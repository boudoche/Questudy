import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Crown } from 'lucide-react';
import axios from 'axios';
import ProfileDropdown from '../components/ProfileDropdown';
import RankingModal from '../components/RankingModal';

function CoursePage() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [questionCount, setQuestionCount] = useState(1);
    const [isCreator, setIsCreator] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [processingQuestions, setProcessingQuestions] = useState(false);
    const initialLoadDone = useRef(false);
    const [showRankings, setShowRankings] = useState(false);
    const [rankings, setRankings] = useState({ rankings: [], userRank: null });

    useEffect(() => {
        loadCourseData();
    }, []);

    const loadCourseData = useCallback(async () => {
        if (initialLoadDone.current) return;
        
        try {
            setIsLoading(true);
            
            // Load everything in parallel
            const [courseResponse, filesResponse, creatorResponse] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_API_URL}/api/courses/${courseId}`,
                    { withCredentials: true }
                ),
                axios.get(
                    `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/files`,
                    { withCredentials: true }
                ),
                axios.get(
                    `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/creator-status`,
                    { withCredentials: true }
                )
            ]);

            setCourse(courseResponse.data);
            
            if (Array.isArray(filesResponse.data)) {
                setFiles(filesResponse.data);
            } else {
                console.error('Files response is not an array:', filesResponse.data);
                setFiles([]);
            }
            
            setIsCreator(creatorResponse.data.isCreator);
            initialLoadDone.current = true;
            
        } catch (error) {
            console.error('Failed to load course data:', error);
            alert('Failed to load course data');
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    

    const refreshFiles = async () => {
        try {
            const filesResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/files`,
                { withCredentials: true }
            );
            if (Array.isArray(filesResponse.data)) {
                setFiles(filesResponse.data);
            } else {
                console.error('Files response is not an array:', filesResponse.data);
                setFiles([]);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/files`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true
                }
            );
            
            await refreshFiles();
            
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to save file');
        } finally {
            setUploadProgress(0);
            setSelectedFile(null);
        }
    };

    const handleDelete = async (fileId, filename, e) => {
        if (e) {
            e.stopPropagation(); // Prevent file selection when clicking delete
        }
        
        if (!filename) {
            console.error('No filename provided for deletion');
            return;
        }

        try {
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/files/${filename}`,
                { withCredentials: true }
            );
            
            if (response.status === 200) {
                // Remove from selected files if it was selected
                if (selectedFiles.has(fileId)) {
                    const newSelectedFiles = new Set(selectedFiles);
                    newSelectedFiles.delete(fileId);
                    setSelectedFiles(newSelectedFiles);
                }
                // Refresh the files list
                await refreshFiles();
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file');
        }
    };

    const handleFileClick = async (fileId) => {
        const newSelectedFiles = new Set(selectedFiles);
        if (newSelectedFiles.has(fileId)) {
            newSelectedFiles.delete(fileId);
        } else {
            newSelectedFiles.add(fileId);
        }
        setSelectedFiles(newSelectedFiles);
    };

    const handleStartQuiz = async () => {
        if (selectedFiles.size === 0) {
            alert('Please select at least one PDF');
            return;
        }

        setProcessingQuestions(true);
        setIsLoading(true);
        const selectedFileIds = Array.from(selectedFiles);

        try {
            // Set current course ID in session
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/set_current_course`,
                { courseId },
                { withCredentials: true }
            );
            
            // Download and process all selected files
            const processedFiles = await Promise.all(
                selectedFileIds.map(async (fileId) => {
                    const selectedFile = files.find(file => file.id === fileId);
                    const fileResponse = await axios.get(
                        `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/files/${selectedFile.filename}`,
                        { responseType: 'blob', withCredentials: true }
                    );
                    return new File([fileResponse.data], selectedFile.filename, { type: 'application/pdf' });
                })
            );

            // Create FormData with all files
            const formData = new FormData();
            processedFiles.forEach((file, index) => {
                formData.append('files', file);
            });
            formData.append('questionCount', questionCount || 3);

            const apiResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/upload_process_pdfs`,
                formData,   
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            );

            if (apiResponse.data.error) {
                console.error('API Error:', apiResponse.data.error);
                alert(apiResponse.data.error);
            } else {
                navigate('/questions', { 
                    replace: false, 
                    state: { previousPage: window.location.pathname }
                });
            }
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Failed to process files. Please try again.');
        } finally {
            setProcessingQuestions(false);
            setIsLoading(false);
            setSelectedFiles(new Set());
        }
    };

    const fetchRankings = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/rankings`,
                { withCredentials: true }
            );
            setRankings(response.data);
            setShowRankings(true);
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button 
                    onClick={() => navigate('/dashboard')}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} />
                    Back to Dashboard
                </button>
                <h1 style={styles.title}>Course Materials</h1>
                <div style={{ 
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={fetchRankings}
                        style={{
                            backgroundColor: '#1e90ff',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '14px'
                        }}
                    >
                        <Crown size={18} />
                        Rankings
                    </button>
                    <ProfileDropdown />
                </div>
            </div>

            {isCreator && (
                <div style={styles.uploadSection}>
                    <label style={styles.uploadButton}>
                        <Upload size={24} />
                        Upload PDF
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {selectedFile && (
                        <div style={styles.progressContainer}>
                            <div style={styles.progressLabel}>
                                Uploading: {selectedFile.name}
                            </div>
                            <div style={styles.progressBar}>
                                <div 
                                    style={{
                                        ...styles.progressFill,
                                        width: `${uploadProgress}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={styles.filesGrid}>
                {Array.isArray(files) && files.length > 0 ? (
                    <>
                        {files.map(file => (
                            <div 
                                key={file.id} 
                                style={{
                                    ...styles.fileCard,
                                    border: selectedFiles.has(file.id) ? '2px solid #1e90ff' : 'none'
                                }}
                                onClick={() => handleFileClick(file.id)}
                            >
                                <div style={styles.previewContainer}>
                                    <div style={styles.pdfPreview}>PDF</div>
                                </div>
                                <div style={styles.fileName}>{file.filename}</div>
                                {isCreator && (
                                    <button
                                        onClick={(e) => handleDelete(file.id, file.filename, e)}
                                        style={styles.deleteButton}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {selectedFiles.size > 0 && (
                            <button
                                onClick={handleStartQuiz}
                                style={{
                                    ...styles.startQuizButton,
                                    position: 'fixed',
                                    bottom: '20px',
                                    right: '20px',
                                }}
                            >
                                Start Quiz ({selectedFiles.size} selected)
                            </button>
                        )}
                    </>
                ) : (
                    <div>No files available</div>
                )}
            </div>

            {processingQuestions && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner}></div>
                        <p>We're generating your questions, it can take a few seconds...</p>
                    </div>
                </div>
            )}

            {showRankings && (
                <RankingModal 
                    rankings={rankings.rankings}
                    userRank={rankings.userRank}
                    onClose={() => setShowRankings(false)}
                />
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#1d1d1d',
        minHeight: '100vh',
        color: '#e0e0e0',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px',
        gap: '20px',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        backgroundColor: '#2b2b2b',
        border: 'none',
        borderRadius: '8px',
        color: '#e0e0e0',
        cursor: 'pointer',
    },
    title: {
        margin: '0 auto',
        color: '#1e90ff',
        fontSize: '2.5em',
    },
    uploadSection: {
        marginBottom: '30px',
    },
    uploadButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '15px 30px',
        backgroundColor: '#1e90ff',
        color: '#fff',
        borderRadius: '10px',
        cursor: 'pointer',
        width: 'fit-content',
    },
    progressContainer: {
        marginTop: '20px',
    },
    progressLabel: {
        marginBottom: '10px',
    },
    progressBar: {
        width: '100%',
        height: '10px',
        backgroundColor: '#2b2b2b',
        borderRadius: '5px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1e90ff',
        transition: 'width 0.3s ease',
    },
    filesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
    },
    fileCard: {
        backgroundColor: '#2b2b2b',
        borderRadius: '10px',
        padding: '15px',
        position: 'relative',
    },
    previewContainer: {
        aspectRatio: '1',
        backgroundColor: '#1d1d1d',
        borderRadius: '8px',
        marginBottom: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfPreview: {
        color: '#1e90ff',
        fontSize: '24px',
    },
    fileName: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    deleteButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#ff5c5c',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingBox: {
        backgroundColor: '#2b2b2b',
        padding: '30px',
        borderRadius: '10px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: '#fff',
        maxWidth: '300px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        margin: '0 auto 20px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1e90ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
        }
    },
    rankingButton: {
        backgroundColor: '#1e90ff',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'translateY(-2px)'
        }
    }
};

const additionalStyles = {
    startQuizButton: {
        backgroundColor: '#1e90ff',
        color: 'white',
        padding: '15px 30px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'translateY(-2px)'
        }
    }
};

Object.assign(styles, additionalStyles);

const spinKeyframes = document.createElement('style');
spinKeyframes.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(spinKeyframes);

export default CoursePage; 