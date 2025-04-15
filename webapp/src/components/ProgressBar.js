import React from 'react';

const ProgressBar = ({ current, max, label }) => {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#343541',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#dcdcdc',
        }}>{label}</span>
        <span style={{
          fontSize: '14px',
          color: '#dcdcdc',
        }}>{`${current}/${max}`}</span>
      </div>
      <div style={{
        width: '100%',
        backgroundColor: '#202123',
        borderRadius: '5px',
        height: '10px',
        overflow: 'hidden',
      }}>
        <div 
          style={{
            width: `${percentage}%`,
            backgroundColor: '#3498db',  // Bluish color
            height: '100%',
            borderRadius: '5px',
            transition: 'width 0.3s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
