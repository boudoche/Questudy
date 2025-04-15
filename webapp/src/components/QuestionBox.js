import React, { useState, useEffect } from 'react';

function QuestionBox({ question, onSubmit, clearAnswer }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const receivedFeedback = await onSubmit(answer);
    setFeedback(receivedFeedback);
    // Optionally clear the answer here if needed right after submission.
  };

  // Clear the answer when instructed by the parent component
  useEffect(() => {
    if (clearAnswer) {
      setAnswer('');
    }
  }, [clearAnswer]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px',  textAlign: 'center' }}>
      <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>{question}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            fontSize: '16px',
            padding: '10px',
            marginBottom: '10px', // Ensure space between the textarea and the button
            border: '2px solid #ccc',
            borderRadius: '5px',
            resize: 'vertical'
          }}
        />
        <button type="submit" style={{
          padding: '10px 20px',
          fontSize: '18px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#4CAF50',
          color: 'white',
          cursor: 'pointer',
          marginBottom: '10px' // Reduces space before feedback
        }}>
          Send
        </button>
        {feedback && <p style={{ color: 'red', margin: '5px 0', fontSize: '16px' }}>{feedback}</p>} 
      </form>
    </div>
  );
}

export default QuestionBox;
