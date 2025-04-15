import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileDropdown from '../components/ProfileDropdown';

function DashboardPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [isFormVisible, setFormVisible] = useState(false);
    const [newCourse, setNewCourse] = useState({ code: '', title: '', level: '' });
    const [enrollModalVisible, setEnrollModalVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/courses`,
                { withCredentials: true }
            );
            setCourses(response.data.map(course => ({
                ...course,
                isCreator: course.creator_id === sessionStorage.getItem('user_id'),
                isEnrolled: course.enrolled_users.includes(sessionStorage.getItem('user_id'))
            })));
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    const handleAddCourse = async () => {
        if (!newCourse.code || !newCourse.title || !newCourse.level) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/courses`,
                newCourse,
                { withCredentials: true }
            );
            
            if (response.status === 201) {
                setFormVisible(false);
                setNewCourse({ code: '', title: '', level: '' });
                fetchCourses();
            } else {
                throw new Error('Failed to create course');
            }
        } catch (error) {
            console.error('Failed to create course:', error);
            alert(error.response?.data?.error || 'Failed to create course');
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            const id = courseId;
            
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/courses/${id}/enroll`,
                courseId,
                { withCredentials: true }
            );
            setEnrollModalVisible(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchCourses();
        } catch (error) {
            console.error('Failed to enroll in course:', error);
            alert('Failed to enroll in course');
        }
    };

    const handleUnenroll = async (courseId, event) => {
        event.stopPropagation();
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/courses/${courseId}/unenroll`,
                {},
                { withCredentials: true }
            );
            fetchCourses();
        } catch (error) {
            console.error('Failed to unenroll from course:', error);
            alert('Failed to unenroll from course');
        }
    };

    const searchCourses = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/courses/search?q=${searchQuery}`,
                { withCredentials: true }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error('Failed to search courses:', error);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
            <div style={{ 
                position: 'absolute',
                top: '20px',
                right: '20px',
            }}>
                <ProfileDropdown />
            </div>

            <h1 style={{ 
                marginBottom: '30px', 
                position: 'absolute',
                top: '10px',
                left: '20px',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '24px'
            }}>
                My Courses
            </h1>

            <div style={{ 
                display: 'flex', 
                gap: '20px',
                marginBottom: '30px',
                justifyContent: 'center',
                marginTop: '80px'
            }}>
                <button
                    onClick={() => setFormVisible(true)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#1e90ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        minWidth: '150px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Create Course
                </button>
                <button
                    onClick={() => setEnrollModalVisible(true)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#1e90ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        minWidth: '150px',
                        transition: 'background-color 0.2s'
                    }}
                >
                    Enroll
                </button>
            </div>

            <div style={styles.coursesContainer}>
                {courses.map((course) => (
                    <div 
                        key={course._id} 
                        style={styles.courseCard}
                        onClick={() => navigate(`/course/${course._id}`)}
                    >
                        {course.isCreator ? (
                            <div style={styles.creatorBadge}>Creator</div>
                        ) : (
                            <button 
                                style={styles.unenrollButton} 
                                onClick={(e) => handleUnenroll(course._id, e)}
                            >
                                Unenroll
                            </button>
                        )}
                        <h2 style={styles.courseCode}>{course.code}</h2>
                        <p style={styles.courseTitle}>{course.title}</p>
                        <p style={styles.courseLevel}>{course.level}</p>
                        <p style={styles.enrollmentStatus}>
                            {course.isCreator ? 'You created this course' : 'You are enrolled'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Create Course Modal */}
            {isFormVisible && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2>Create New Course</h2>
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Course Code"
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                        />
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Course Title"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        />
                        <select
                            style={styles.input}
                            value={newCourse.level}
                            onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                        >
                            <option value="">Select Level</option>
                            <option value="Bachelor">Bachelor</option>
                            <option value="Master">Master</option>
                        </select>
                        <div style={styles.modalButtons}>
                            <button style={styles.submitButton} onClick={handleAddCourse}>Create</button>
                            <button style={styles.cancelButton} onClick={() => setFormVisible(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enroll Modal */}
            {enrollModalVisible && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>Find and Enroll in Courses</h2>
                            <button 
                                style={styles.closeButton}
                                onClick={() => {
                                    setEnrollModalVisible(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={styles.searchContainer}>
                            <input
                                style={styles.input}
                                type="text"search_results
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button onClick={searchCourses}>Search</button>
                        </div>
                        <div style={styles.searchResults}>
                            {searchResults.map(course => (
                                <div key={course._id} style={styles.searchResult}>
                                    <div>
                                        <h3>{course.code}</h3>
                                        <p>{course.title}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleEnroll(course._id)}
                                        disabled={course.enrolled_users.includes(sessionStorage.getItem('user_id'))}
                                    >
                                        {course.enrolled_users.includes(sessionStorage.getItem('user_id')) 
                                            ? 'Enrolled' 
                                            : 'Enroll'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add these new styles to your existing styles object
const additionalStyles = {
    buttonContainer: {
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
    },
    enrollButton: {
        backgroundColor: '#4CAF50',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '15px 30px',
        fontSize: '1.2em',
        cursor: 'pointer',
        boxShadow: '4px 4px 8px #141414, -4px -4px 8px #3e3e3e',
    },
    creatorBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#1e90ff',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '0.8em',
    },
    unenrollButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#ff5c5c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '0.8em',
    },
    enrollmentStatus: {
        color: '#a9a9a9',
        fontSize: '0.9em',
        marginTop: '10px',
        fontStyle: 'italic'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#e0e0e0',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '5px 10px',
        borderRadius: '4px',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }
    }
};

// Merge the additional styles with your existing styles
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 40px', // Add horizontal padding
        backgroundColor: '#1d1d1d',
        minHeight: '100vh',
        color: '#e0e0e0',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // Change to 100% to respect container padding
        marginBottom: '20px',
        textAlign: 'center',
    },
    title: {
        color: '#1e90ff',
        fontSize: '4em', // Increase the font size to make it bigger
        textAlign: 'center',
    },
    coursesContainer: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: '20px',
        width: '100%', // Change to 100% to respect container padding
    },
    courseCard: {
        backgroundColor: '#2b2b2b',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '8px 8px 16px #141414, -8px -8px 16px #3e3e3e',
        textAlign: 'center',
        width: '250px',
        color: '#ff5c5c',
        position: 'relative',
    },
    courseCode: {
        fontSize: '1.5em',
        color: '#ffffff',
    },
    courseTitle: {
        color: '#ff5c5c',
        fontSize: '1.1em',
    },
    courseLevel: {
        color: '#a9a9a9',
        fontSize: '1em',
    },
    removeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#ff5c5c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        boxShadow: '2px 2px 4px #141414, -2px -2px 4px #3e3e3e',
    },
    addButton: {
        marginTop: '30px',
        backgroundColor: '#1e90ff',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '15px 30px',
        fontSize: '1.2em',
        cursor: 'pointer',
        boxShadow: '4px 4px 8px #141414, -4px -4px 8px #3e3e3e',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#2b2b2b',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '4px 4px 8px #141414, -4px -4px 8px #3e3e3e',
        width: '300px',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        border: 'none',
    },
    modalButtons: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
    },
    submitButton: {
        backgroundColor: '#1e90ff',
        color: '#fff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    cancelButton: {
        backgroundColor: '#ff5c5c',
        color: '#fff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    searchContainer: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    searchResult: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #3e3e3e',
    },
    ...additionalStyles
};

export default DashboardPage;
