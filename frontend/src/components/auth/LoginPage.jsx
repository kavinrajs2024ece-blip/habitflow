import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export default function LoginPage({ 
  onNavigateToRegister, 
  prefilledEmail = '', 
  successMessage = '' 
}) {
  const { login, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [shakingFields, setShakingFields] = useState({});

  // Trigger shake animation on a specific input field
  const triggerFieldShake = (field) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setShakingFields((prev) => ({ ...prev, [field]: false }));
    }, 450);
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Please enter your email address';
      triggerFieldShake('email');
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com)';
      triggerFieldShake('email');
    }

    if (!password) {
      errors.password = 'Please enter your password';
      triggerFieldShake('password');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setFieldErrors({});
    setAuthError(null);
    try {
      await login('demo@habitflow.com', 'password123');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card-inner">
      {/* Brand & Heading Section */}
      <div className="auth-brand-section">
        <div className="auth-brand-badge">
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div className="auth-brand-header-text">
          <span className="auth-app-name">Habit<span className="accent-text">Flow</span></span>
          <span className="auth-app-tag">Productivity Dashboard</span>
        </div>
        <h2 className="auth-heading">Welcome Back</h2>
        <p className="auth-subtitle">
          Sign in to access your daily habits, streaks, and momentum records
        </p>
      </div>

      {/* Success Notification Banner (After Registration) */}
      {successMessage && (
        <div className="auth-success-banner" role="status">
          <CheckCircle2 size={16} className="success-banner-icon" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Quick Demo Access Card */}
      <div className="auth-demo-card">
        <div className="demo-card-left">
          <div className="demo-tag">
            <Sparkles size={12} />
            <span>Instant Preview</span>
          </div>
          <p className="demo-desc">
            Test pre-loaded habits (<strong>Diet</strong>, <strong>Workout</strong>, <strong>DSA</strong>):
          </p>
        </div>
        <button 
          type="button" 
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          className="btn-demo-action"
          title="Sign in immediately with demo account"
        >
          {isSubmitting ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <>
              <span>1-Click Demo</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>

      <div className="auth-divider">
        <span className="divider-line" />
        <span className="divider-text">OR CONTINUE WITH EMAIL</span>
        <span className="divider-line" />
      </div>

      {/* General API Error Banner */}
      {authError && (
        <div className="auth-error-banner shake-error" role="alert">
          <AlertCircle size={16} className="error-banner-icon" />
          <span>{authError}</span>
        </div>
      )}

      {/* Form with Custom Validation */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email Field */}
        <div className="form-field-group">
          <label htmlFor="login-email" className="field-label">
            Email Address
          </label>
          <div className={`field-input-wrapper ${shakingFields.email ? 'shake-field' : ''}`}>
            <Mail size={16} className="field-icon-left" />
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              className={`field-input ${fieldErrors.email ? 'input-invalid' : ''}`}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <div className="field-error-message" role="alert">
              <AlertCircle size={13} />
              <span>{fieldErrors.email}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="form-field-group">
          <div className="field-label-row">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
          </div>
          <div className={`field-input-wrapper ${shakingFields.password ? 'shake-field' : ''}`}>
            <Lock size={16} className="field-icon-left" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              className={`field-input with-action ${fieldErrors.password ? 'input-invalid' : ''}`}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="field-action-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex="-1"
            >
              <span className={`icon-toggle-wrap ${showPassword ? 'is-visible' : ''}`}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </button>
          </div>
          {fieldErrors.password && (
            <div className="field-error-message" role="alert">
              <AlertCircle size={13} />
              <span>{fieldErrors.password}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-auth-primary"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="auth-footer-prompt">
        <span>Don't have an account yet?</span>{' '}
        <button 
          type="button"
          onClick={onNavigateToRegister}
          className="auth-link-btn"
        >
          Create an account
        </button>
      </div>

      {/* Security Credential Footer */}
      <div className="auth-trust-footer">
        <ShieldCheck size={14} className="trust-icon" />
        <span>Multi-tenant isolation &amp; 256-bit encrypted sessions</span>
      </div>
    </div>
  );
}
