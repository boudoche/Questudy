import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ChatWindow from '../components/ChatWindow';
import { MessageCircle } from 'lucide-react';
import ReferenceTextWindow from '../components/ReferenceTextWindow';
import ProgressBar from '../components/ProgressBar'; // Import the ProgressBar component
import { useNavigate, useLocation } from 'react-router-dom';

function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showRefText, setShowRefText] = useState(false);
  const [refText, setRefText] = useState('');
  const reAddCurrentQuestionRef = useRef(null);
  const reAddCurrentFeedbackRef = useRef(null);
  const [movingToNextQuestion, setMovingToNextQuestion] = useState(false);
  const [disableInput, setDisableInput] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [getCurrentChildCount, setGetCurrentChildCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const scoreRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Add console logs to track state changes
  useEffect(() => {
    console.log('Quiz completed:', quizCompleted);
    console.log('Completion data:', completionData);
  }, [quizCompleted, completionData]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + '/api/get_question', { withCredentials: true });
      console.log('API Response:', response.data);

      if (!response.data.question) {
        console.log('Setting quiz completed');
        setQuizCompleted(true);
        setFeedback(response.data.chat_evaluation);

        console.log('score', scoreRef.current);
        
        // Award completion points
        const completionResponse = await axios.post(
          process.env.REACT_APP_API_URL + '/api/award_quiz_completion', 
          { score: scoreRef.current }, 
          { withCredentials: true }
        );
        
        setCompletionData({
          chat_evaluation: response.data.chat_evaluation || 'Quiz completed!',
          points_earned: completionResponse.data.points_earned
        });
      } else {
        // Update other state for ongoing quiz
        setCurrentQuestion(response.data.question);
      }
      setCurrentQuestionIndex(response.data.current_question_index);
      setTotalQuestions(response.data.total_questions);
      setCurrentChildIndex(response.data.current_child_index);
      setGetCurrentChildCount(response.data.get_current_child_count);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleAnswerSubmit = async (answer) => {
    if (!currentQuestion) return;

    try { 
      console.log('submitting answer', answer);
      const response = await axios.post(process.env.REACT_APP_API_URL + '/api/submit_answer', {
        answer: answer
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('submitted_answer')

      console.log(response.data)

      
      if (response.data.feedback === feedback && reAddCurrentFeedbackRef.current) {
        // If feedback is the same (e.g two correct), add it again
        reAddCurrentFeedbackRef.current()
      }else{
        // add feedback, doesn't work if it's the same
        setFeedback(response.data.feedback);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
      

      if (response.data.improperly_answered) {
        setMovingToNextQuestion(true);
      } 

      if (response.data.text) {
        setRefText(response.data.text);
        // asking same question again, it needs to be added manually
        if (reAddCurrentQuestionRef.current) {
          reAddCurrentQuestionRef.current();
        }
      } else {
        fetchQuestion(); 
      }

      if(response.data.score === 'correct'){
        setScore(prevScore => {
          const newScore = prevScore + 1;
          scoreRef.current = newScore; // Update ref
          return newScore;
        });
      } else if(response.data.score === 'perfect'){
        setScore(prevScore => {
          const newScore = prevScore + 2;
          scoreRef.current = newScore; // Update ref
          return newScore;
        });
      }
      
    } catch (error) {
      console.error('Failed to submit answer', error);
      setFeedback('Error submitting answer.');
    }
  };

  const handleShowHint = () => {
    setShowRefText(true);
  };

  const handleQuit = async () => {
    try {
      // Call the new quit_quiz endpoint instead of reset_session
      await axios.post(process.env.REACT_APP_API_URL + '/api/quit_quiz', {}, { withCredentials: true });
      // Reset local state
      setCurrentQuestion(null);
      setCurrentChildIndex(0);
      setGetCurrentChildCount(0);
      setCurrentQuestionIndex(0);
      setFeedback('');
      // Navigate back to the previous page or dashboard if no previous page
      const previousPage = location.state?.previousPage || '/dashboard';
      navigate(previousPage);
    } catch (error) {
      console.error('Failed to quit:', error);
    }
  };

  const handleRetry = () => {
    setQuizCompleted(false);
    setCompletionData(null);
    // Logic to start a new quiz session
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      

      {/* Simplified modal */}
      {quizCompleted && completionData && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            className="completion-modal"
            style={{
              backgroundColor: '#2b2b2b',
              padding: '30px',
              borderRadius: '10px',
              color: 'white',
              zIndex: 1000000,
              width: '90%',
              maxWidth: '500px',
              textAlign: 'center'
            }}
          >
            <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Quiz Completed!</h2>
            <div 
              style={{ color: '#e0e0e0', lineHeight: '1.6', marginBottom: '25px', textAlign: 'left' }}
              dangerouslySetInnerHTML={{ __html: completionData.chat_evaluation }}
            />
            <div style={{ fontSize: '24px', color: '#4CAF50', fontWeight: 'bold', margin: '25px 0' }}>
              You earned {completionData.points_earned} points!
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              <button 
                onClick={() => navigate('/dashboard')}
                style={{
                  backgroundColor: '#1e90ff',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Dashboard
              </button>
              <button 
                onClick={handleQuit}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '10px',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Discord feedback icon */}
        <a
          href="https://discord.gg/tJjV9QSf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#7289DA',
            color: 'white',
            borderRadius: '5px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            textDecoration: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          <MessageCircle size={24} />
          <span style={{ marginLeft: '5px', fontSize: '14px' }}>Feedback?</span>
        </a>

        {/* Quit button */}
        <button
          onClick={handleQuit}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            backgroundColor: '#ff5c5c',
            color: 'white',
            borderRadius: '5px',
            padding: '10px 20px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Quit
        </button>

        <ProgressBar 
          current={currentQuestionIndex}
          max={totalQuestions} 
          label="Questions"
        />

        {getCurrentChildCount > 0 &&  getCurrentChildCount !== currentChildIndex && (
          <ProgressBar 
            current={currentChildIndex} 
            max={getCurrentChildCount} 
            label="Side quest questions"
          />
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', 
          height: '100%',
          width: '100%',
        }}>
          <ChatWindow 
            currentQuestion={currentQuestion} 
            onSubmitAnswer={handleAnswerSubmit} 
            feedback={feedback} 
            onReAddCurrentQuestion={(func) => { reAddCurrentQuestionRef.current = func; }}
            onNewMessage={handleShowHint}
            movingToNextQuestion={movingToNextQuestion}
            disableInput={disableInput}
            onReAddFeedback={(func) => { reAddCurrentFeedbackRef.current = func; }}
          />
        </div>

        {showRefText && (
          <ReferenceTextWindow
            text={refText}
            onClose={() => setShowRefText(false)}
          />
        )}
      </div>
    </div>
  );
}

export default QuizPage;