import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProfileDropdown() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    
    const userInitial = sessionStorage.getItem('user_name')?.charAt(0).toUpperCase() || '?';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(process.env.REACT_APP_API_URL + '/api/auth/logout', {}, { withCredentials: true });
            sessionStorage.removeItem('user_id');
            sessionStorage.removeItem('user_name');  // Clear the name too
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    return (
        <div style={styles.profileContainer} ref={dropdownRef}>
            <div 
                style={styles.profileIcon} 
                onClick={() => setDropdownOpen(!dropdownOpen)}
            >
                {userInitial}
            </div>
            {dropdownOpen && (
                <div style={styles.dropdown}>
                    <div 
                        style={styles.dropdownItem} 
                        onClick={() => {
                            navigate('/dashboard');
                            setDropdownOpen(false);
                        }}
                    >
                        Dashboard
                    </div>
                    <div 
                        style={styles.dropdownItem} 
                        onClick={() => window.open("https://people.epfl.ch/stefano.viel/?lang=en", "_blank")}
                    >
                        Contact Support
                    </div>
                    <div 
                        style={styles.dropdownItem} 
                        onClick={handleLogout}
                    >
                        Log Out
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    profileContainer: {
        position: 'relative',
    },
    profileIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#1e90ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        fontSize: '1.2em',
        fontWeight: 'bold',
    },
    dropdown: {
        position: 'absolute',
        top: '50px',
        right: '0',
        backgroundColor: '#2b2b2b',
        borderRadius: '8px',
        padding: '8px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        minWidth: '150px',
        zIndex: 1000,
    },
    dropdownItem: {
        padding: '10px 20px',
        cursor: 'pointer',
        color: '#e0e0e0',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#3b3b3b',
        },
    },
};

export default ProfileDropdown; 