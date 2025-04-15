import React from 'react';
import { Link } from 'react-router-dom';

function AuthForm({ 
  type, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  name, 
  setName, 
  error, 
  onSubmit 
}) {
  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>{type === 'login' ? 'Login' : 'Create Account'}</h2>
        <form onSubmit={onSubmit} style={styles.form}>
          {type === 'signup' && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>
            {type === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p style={styles.switchText}>
          {type === 'login' ? (
            <>Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" style={styles.link}>Login</Link></>
          )}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    backgroundColor: '#343541',
    borderRadius: '10px',
    color: '#fff',
  },
  formCard: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    borderRadius: '5px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #666',
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  button: {
    padding: '10px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  error: {
    color: '#e74c3c',
    margin: '5px 0',
  },
  switchText: {
    marginTop: '15px',
    textAlign: 'center',
    color: '#3498db',
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
  },
};

export default AuthForm;
