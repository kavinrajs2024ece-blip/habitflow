import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function AuthPage() {
  const { login, register, authError, setAuthError } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch tab
  const handleTabChange = (registerTab) => {
    setIsRegistering(registerTab);
    setAuthError(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegistering && !name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // One-Click Demo Login
  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await login('demo@habitflow.com', 'password123');
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-section">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon">🌊</span>
          </div>
          <h1 className="auth-title">HabitFlow</h1>
          <p className="auth-subtitle">
            {isRegistering 
              ? "Start building your daily momentum today" 
              : "Sign in to access your personal habits and streaks"}
          </p>
        </div>

        {/* Quick Demo Login Banner */}
        <div className="auth-demo-banner">
          <div className="demo-banner-content">
            <div className="demo-badge">
              <Sparkles size={14} /> Demo Account
            </div>
            <p className="demo-text">
              Test existing habits (<strong>Diet</strong>, <strong>Workout</strong>, <strong>DSA</strong>) instantly:
            </p>
          </div>
          <button 
            type="button" 
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="btn btn-demo-quick"
          >
            {isSubmitting ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <>
                <span>1-Click Demo Login</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        <div className="auth-divider-row">
          <span className="divider-line" />
          <span className="divider-text">OR CONTINUE WITH EMAIL</span>
          <span className="divider-line" />
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegistering ? 'auth-tab-active' : ''}`}
            onClick={() => handleTabChange(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegistering ? 'auth-tab-active' : ''}`}
            onClick={() => handleTabChange(true)}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={16} className="error-alert-icon" />
            <span>{authError}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field (Sign Up only) */}
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="auth-name" className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="field-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Alex Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input with-icon"
                  required={isRegistering}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="field-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input with-icon"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="label-with-hint">
              <label htmlFor="auth-password" className="form-label">Password</label>
              {isRegistering && <span className="label-hint">Min. 6 characters</span>}
            </div>
            <div className="input-icon-wrap">
              <Lock size={16} className="field-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isRegistering ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input with-icon with-eye"
                required
                minLength={isRegistering ? 6 : undefined}
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-auth-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>{isRegistering ? "Creating account..." : "Signing in..."}</span>
              </>
            ) : (
              <>
                <span>{isRegistering ? "Create Account" : "Sign In to HabitFlow"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security / Privacy Footer */}
        <div className="auth-footer-security">
          <ShieldCheck size={14} className="security-icon" />
          <span>Secured with Bcrypt password encryption and JWT session tokens.</span>
        </div>
      </div>
    </div>
  );
}
