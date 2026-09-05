import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Check, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

export default function RegisterPage({ onNavigateToLogin, onRegisterSuccess }) {
  const { register, authError, setAuthError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [shakingFields, setShakingFields] = useState({});

  const isPasswordLongEnough = password.length >= 6;
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;
  const hasConfirmPasswordMismatch = confirmPassword && password !== confirmPassword;

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

    if (!name.trim()) {
      errors.name = 'Please enter your full name';
      triggerFieldShake('name');
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address';
      triggerFieldShake('email');
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com)';
      triggerFieldShake('email');
    }

    if (!password) {
      errors.password = 'Please enter a password';
      triggerFieldShake('password');
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
      triggerFieldShake('password');
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      triggerFieldShake('confirmPassword');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      triggerFieldShake('confirmPassword');
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
      const createdUser = await register(name.trim(), email.trim(), password);
      onRegisterSuccess(createdUser, email.trim());
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
        <h2 className="auth-heading">Create Account</h2>
        <p className="auth-subtitle">
          Join HabitFlow to begin tracking habits and maintaining consistent daily streaks
        </p>
      </div>

      {/* General API Error Alert */}
      {authError && (
        <div className="auth-error-banner shake-error" role="alert">
          <AlertCircle size={16} className="error-banner-icon" />
          <span>{authError}</span>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Name Input */}
        <div className="form-field-group">
          <label htmlFor="reg-name" className="field-label">Full Name</label>
          <div className={`field-input-wrapper ${shakingFields.name ? 'shake-field' : ''}`}>
            <User size={16} className="field-icon-left" />
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Alex Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              className={`field-input ${fieldErrors.name ? 'input-invalid' : ''}`}
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>
          {fieldErrors.name && (
            <div className="field-error-message" role="alert">
              <AlertCircle size={13} />
              <span>{fieldErrors.name}</span>
            </div>
          )}
        </div>

        {/* Email Input */}
        <div className="form-field-group">
          <label htmlFor="reg-email" className="field-label">Email Address</label>
          <div className={`field-input-wrapper ${shakingFields.email ? 'shake-field' : ''}`}>
            <Mail size={16} className="field-icon-left" />
            <input
              id="reg-email"
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

        {/* Password Input */}
        <div className="form-field-group">
          <div className="field-label-row">
            <label htmlFor="reg-password" className="field-label">Password</label>
            <span className={`field-hint ${isPasswordLongEnough ? 'hint-valid' : ''}`}>
              {password.length > 0 && isPasswordLongEnough ? '✓ 6+ chars' : 'Min. 6 characters'}
            </span>
          </div>
          <div className={`field-input-wrapper ${shakingFields.password ? 'shake-field' : ''}`}>
            <Lock size={16} className="field-icon-left" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              className={`field-input with-action ${fieldErrors.password ? 'input-invalid' : ''}`}
              disabled={isSubmitting}
              autoComplete="new-password"
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

        {/* Confirm Password Input */}
        <div className="form-field-group">
          <div className="field-label-row">
            <label htmlFor="reg-confirm-password" className="field-label">Confirm Password</label>
            {doPasswordsMatch && (
              <span className="field-hint hint-valid">
                <Check size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Passwords match
              </span>
            )}
            {hasConfirmPasswordMismatch && (
              <span className="field-hint hint-invalid">
                Passwords must match
              </span>
            )}
          </div>
          <div className={`field-input-wrapper ${shakingFields.confirmPassword ? 'shake-field' : ''}`}>
            <Lock size={16} className="field-icon-left" />
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              className={`field-input with-action ${hasConfirmPasswordMismatch || fieldErrors.confirmPassword ? 'input-invalid' : ''}`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="field-action-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              tabIndex="-1"
            >
              <span className={`icon-toggle-wrap ${showConfirmPassword ? 'is-visible' : ''}`}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <div className="field-error-message" role="alert">
              <AlertCircle size={13} />
              <span>{fieldErrors.confirmPassword}</span>
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
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="auth-footer-prompt">
        <span>Already have an account?</span>{' '}
        <button 
          type="button"
          onClick={onNavigateToLogin}
          className="auth-link-btn"
        >
          Sign in
        </button>
      </div>

      {/* Trust Footer */}
      <div className="auth-trust-footer">
        <ShieldCheck size={14} className="trust-icon" />
        <span>Your account and habit data are strictly private</span>
      </div>
    </div>
  );
}
