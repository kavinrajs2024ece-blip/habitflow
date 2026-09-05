import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

export default function AuthContainer() {
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // When registration succeeds, navigate to Login with success message & prefilled email
  const handleRegisterSuccess = (createdUser, email) => {
    setPrefilledEmail(email);
    setSuccessMessage(`Account created for ${createdUser.name || email}! Please sign in.`);
    setAuthView('login');
  };

  const handleNavigateToRegister = () => {
    setSuccessMessage('');
    setAuthView('register');
  };

  const handleNavigateToLogin = () => {
    setAuthView('login');
  };

  return (
    <div className="auth-viewport">
      <div className="auth-canvas-overlay" />
      <div className="auth-card-shell">
        {/* Nav Segmented Control */}
        <div className="auth-segmented-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={authView === 'login'}
            className={`auth-segment-tab ${authView === 'login' ? 'segment-active' : ''}`}
            onClick={handleNavigateToLogin}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authView === 'register'}
            className={`auth-segment-tab ${authView === 'register' ? 'segment-active' : ''}`}
            onClick={handleNavigateToRegister}
          >
            Create Account
          </button>
        </div>

        {/* View Switcher with Entrance Animation */}
        <div className="auth-view-content" key={authView}>
          {authView === 'login' ? (
            <LoginPage
              onNavigateToRegister={handleNavigateToRegister}
              prefilledEmail={prefilledEmail}
              successMessage={successMessage}
            />
          ) : (
            <RegisterPage
              onNavigateToLogin={handleNavigateToLogin}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
