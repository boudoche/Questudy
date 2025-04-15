import React from 'react';
import ReactMarkdown from 'react-markdown';

const ModalWindow = ({ text, onClose }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.explanation}>Here is a short explanation:</div>
        <div style={styles.content}>
        <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        <button style={styles.closeButton} onClick={onClose}>Exit</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#2a2a2a',
    padding: '40px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '800px',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
  },
  explanation: {
    color: '#aaaaaa',
    fontSize: '16px',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  content: {
    marginBottom: '40px',
    color: '#ffffff',
    fontSize: '20px',
    lineHeight: '1.6'
  },
  closeButton: {
    padding: '14px 28px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  }
};

export default ModalWindow;
