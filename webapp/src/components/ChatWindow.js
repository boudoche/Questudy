import React, { useState, useEffect, useRef } from 'react';

function ChatWindow({
  currentQuestion,
  onSubmitAnswer,
  feedback,
  onReAddCurrentQuestion,
  onNewMessage,
  movingToNextQuestion,
  disableInput,
  onReAddFeedback,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showHintButton, setShowHintButton] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const reAddCurrentQuestion = () => {
    if (currentQuestion) {
      setMessages((prevMessages) => {
        return [...prevMessages, { text: currentQuestion, sender: 'bot' }];
      });
    }
    setShowHintButton(true);
  };

  const reAddFeedback = () => {
    if (feedback) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: feedback, sender: 'bot' },
      ]);
    }
  };

  useEffect(() => {
    if (onReAddCurrentQuestion) {
      onReAddCurrentQuestion(reAddCurrentQuestion);
    }
  }, [onReAddCurrentQuestion]);

  useEffect(() => {
    if (onReAddFeedback) {
      onReAddFeedback(reAddFeedback);
    }
  }, [onReAddFeedback]);

  useEffect(() => {
    if (feedback) {
      setMessages((prevMessages) => {
        return [...prevMessages, { text: feedback, sender: 'bot' }];
      });
      setShowHintButton(false);
    }
  }, [feedback]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.length === 0) {
      setMessages([{ text: currentQuestion, sender: 'bot' }]);
    } else if (
      currentQuestion &&
      currentQuestion.length > 0 &&
      currentQuestion[currentQuestion.length - 1].text !== currentQuestion
    ) {
      setMessages((prevMessages) => {
        return [...prevMessages, { text: currentQuestion, sender: 'bot' }];
      });
    }
    setShowHintButton(false);
  }, [currentQuestion]);

  useEffect(() => {
    if (movingToNextQuestion) {
      setMessages((prevMessages) => {
        return [
          ...prevMessages,
          { text: 'Moving on to the next question.', sender: 'bot' },
        ];
      });
    }
  }, [movingToNextQuestion]);

  const handleSend = () => {
    if (input.trim() === '') return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: input, sender: 'me' },
    ]);
    onSubmitAnswer(input);
    setInput('');
    setShowHintButton(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    resizeInput();
  };

  const resizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    resizeInput();
  }, [input]);

  const handleGetHint = () => {
    onNewMessage();
    setShowHintButton(false);
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(message.sender === 'me'
                ? styles.userMessage
                : styles.botMessage),
            }}
          >
            {message.sender === 'bot' ? (
              <div dangerouslySetInnerHTML={{ __html: message.text }} />
            ) : (
              message.text
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {showHintButton && (
        <div style={styles.hintButtonContainer}>
          <button onClick={handleGetHint} style={styles.hintButton}>
            Get a Hint
          </button>
        </div>
      )}
      {!disableInput && (
        <div style={styles.inputContainer}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={styles.textarea}
            placeholder="Type your answer here"
            rows={1}
            disabled={disableInput}
          />
          <button
            onClick={handleSend}
            style={styles.sendButton}
            disabled={disableInput}
          >
            ➤
          </button>   
        </div>
      )}
      {/* {!disableInput && (
        <div style={styles.rewriteButtonContainer}>
          <button
            onClick={handleRewrite}
            disabled={disableInput || !input.trim()} // Disable button if input is empty
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...styles.rewriteButton,
              backgroundColor: isHovered ? styles.rewriteButtonHover.backgroundColor : styles.rewriteButton.backgroundColor,
            }}
          >
            Rewrite <br /> Answer
          </button>
          <div style={{ color: '#dcdcdc', fontSize: '12px', textAlign: 'center', marginTop: '5px'}}>
            [ <kbd>Ctrl</kbd> + <kbd>return</kbd> ]
          </div>
        </div>
      )} */}
    </div>
  );
}
const styles = {
  chatContainer: {
    backgroundColor: '#343541',
    color: '#dcdcdc',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '700px',
    height: '80vh',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    position: 'relative', // Add this line to position the rewrite button absolutely
  },
  messagesContainer: {
    overflowY: 'auto',
    flex: 1,
    marginBottom: '10px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  message: {
    padding: '12px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2980b9', // Darker blue
    color: '#fff',
  },
  
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#434654',
    color: '#e0e0e0',
  },
  hintButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  hintButton: {
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#e74c3c',
    color: '#fff',
    cursor: 'pointer',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#202123',
    borderRadius: '10px',
    border: '1px solid #444',
  },
  textarea: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    outline: 'none',
    backgroundColor: '#1e1e1e',
    color: '#dcdcdc',
    resize: 'none',
    overflow: 'hidden',
    minHeight: '40px',
    maxHeight: '150px',
  },
  sendButton: {
    width: '40px', // Square shape
    height: '40px',
    marginLeft: '10px',
    borderRadius: '8px', // Slightly rounded corners for a square look
    border: 'none',
    backgroundColor: '#3498db',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease',
  },
  sendButtonHover: {
    backgroundColor: '#0056b3',
  },
  rewriteButtonContainer: {
    position: 'absolute',
    bottom: '30px', // Adjust as needed
    right: '10px', // Position on the right
  },
  rewriteButton: {
    display: 'inline-block',       // Ensure the button aligns properly within containers
    padding: '8px 15px',          // Increase padding for a bigger button
    backgroundColor: '#3498db',
    color: '#fff',
    marginLeft: '10px',            // Add some space between the buttons
    border: 'none',
    borderRadius: '12px',          // Slightly increase the border-radius for smoother corners
    cursor: 'pointer',
    fontSize: '14px',              // Increase font size for better readability
    fontWeight: 'bold',            // Make the text bolder
    textAlign: 'center',           // Center the text
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add a subtle shadow for a modern touch
    transition: 'background-color 0.3s ease', // Add a smooth hover transition
  },
  rewriteButtonHover: {
    backgroundColor: '#0056b3', // Darker shade on hover
  },
};

export default ChatWindow;