import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

  .auth-page {
    min-height: 100vh;
    background: #0D1B2A;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    position: relative;
    overflow: hidden;
  }

  .auth-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 80px 80px;
    pointer-events: none;
  }

  .auth-page::after {
    content: '';
    position: fixed;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .auth-z { position: relative; z-index: 1; }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: #162235;
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 16px;
    overflow: hidden;
    animation: auth-in 0.5s ease both;
  }

  @keyframes auth-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .auth-card::before {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }

  .auth-card-inner { padding: 2.2rem 2.2rem 2rem; }

  .auth-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.8rem;
  }

  .auth-logo-mark {
    width: 44px;
    height: 44px;
    background: #C9A84C;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 20px;
    color: #0D1B2A;
    margin-bottom: 0.9rem;
  }

  .auth-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.01em;
    margin: 0 0 0.2rem;
  }

  .auth-brand-sub {
    font-size: 13px;
    color: #8A9BB0;
    margin: 0;
  }

  /* Alert banners */
  .auth-alert {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 1.2rem;
    font-size: 13px;
    animation: auth-in 0.3s ease;
  }

  .auth-alert.error {
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.2);
    color: #F09595;
  }

  .auth-alert.success {
    background: rgba(40,200,64,0.08);
    border: 1px solid rgba(40,200,64,0.2);
    color: #5FD97A;
  }

  /* Two-column grid for username + full name */
  .auth-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 480px) {
    .auth-row { grid-template-columns: 1fr; }
  }

  .auth-field { margin-bottom: 1rem; }

  .auth-label {
    display: block;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8A9BB0;
    margin-bottom: 6px;
  }

  .auth-label-hint {
    color: #4A6080;
    font-size: 10px;
    margin-left: 4px;
    text-transform: none;
    letter-spacing: 0;
  }

  .auth-input-wrap { position: relative; }

  .auth-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #4A6080;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .auth-input {
    width: 100%;
    padding: 11px 14px 11px 38px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: #F7F3EC;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 300;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }

  .auth-input::placeholder { color: #3A5070; }

  .auth-input:focus {
    border-color: rgba(201,168,76,0.4);
    background: rgba(201,168,76,0.02);
  }

  .auth-input-hint {
    font-size: 10px;
    color: #4A6080;
    font-family: 'DM Mono', monospace;
    margin-top: 4px;
    padding-left: 2px;
  }

  /* Password match indicator */
  .auth-pw-match {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    margin-top: 5px;
    padding-left: 2px;
  }

  .auth-pw-match.ok    { color: #5FD97A; }
  .auth-pw-match.no    { color: #F09595; }

  .auth-btn {
    width: 100%;
    padding: 13px;
    background: #C9A84C;
    border: none;
    border-radius: 8px;
    color: #0D1B2A;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.02em;
    transition: all 0.2s;
    margin-top: 1.4rem;
  }

  .auth-btn:hover:not(:disabled) {
    background: #E8C97A;
    transform: translateY(-1px);
  }

  .auth-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .auth-spin { animation: auth-rotate 0.8s linear infinite; }
  @keyframes auth-rotate { to { transform: rotate(360deg); } }

  .auth-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 1.4rem 0 1.2rem;
  }

  .auth-footer {
    text-align: center;
    font-size: 13px;
    color: #4A6080;
  }

  .auth-footer a {
    color: #C9A84C;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .auth-footer a:hover { color: #E8C97A; }
`;

export default function Register() {
  // ── LOGIC: DO NOT EDIT ──────────────────────────────────────────────────
  const [email, setEmail]                   = useState('');
  const [username, setUsername]             = useState('');
  const [fullName, setFullName]             = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, username, password, fullName);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  // ── END LOGIC ────────────────────────────────────────────────────────────

  // Live password match feedback
  const pwTyped = confirmPassword.length > 0;
  const pwMatch = password === confirmPassword;

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="auth-z" style={{ width: '100%', maxWidth: 440 }}>
          <div className="auth-card">
            <div className="auth-card-inner">

              {/* Brand */}
              <div className="auth-brand">
                <div className="auth-logo-mark">I</div>
                <h1 className="auth-brand-name">Infera</h1>
                <p className="auth-brand-sub">Create your free account</p>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-alert error">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="auth-alert success">
                  <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  Account created! Redirecting to login...
                </div>
              )}

              {/* Form — onSubmit preserved exactly */}
              <form onSubmit={handleSubmit}>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label">Email address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Mail size={14} /></span>
                    <input
                      className="auth-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Username + Full Name in a row */}
                <div className="auth-row">
                  <div className="auth-field">
                    <label className="auth-label">Username</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon"><User size={14} /></span>
                      <input
                        className="auth-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe"
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">
                      Full name
                      <span className="auth-label-hint">(optional)</span>
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon"><User size={14} /></span>
                      <input
                        className="auth-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={14} /></span>
                    <input
                      className="auth-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="auth-input-hint">At least 8 characters</div>
                </div>

                {/* Confirm password */}
                <div className="auth-field">
                  <label className="auth-label">Confirm password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={14} /></span>
                    <input
                      className="auth-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {/* Live match feedback */}
                  {pwTyped && (
                    <div className={`auth-pw-match ${pwMatch ? 'ok' : 'no'}`}>
                      {pwMatch
                        ? <><CheckCircle size={11} /> Passwords match</>
                        : <><AlertCircle size={11} /> Passwords don't match</>
                      }
                    </div>
                  )}
                </div>

                <button
                  className="auth-btn"
                  type="submit"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <><Loader2 size={15} className="auth-spin" /> Creating account...</>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="auth-divider" />

              <div className="auth-footer">
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}