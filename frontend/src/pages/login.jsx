import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

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

  /* Grid texture */
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

  /* Ambient glow */
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

  /* ── Card ── */
  .auth-card {
    width: 100%;
    max-width: 420px;
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

  /* Gold top line */
  .auth-card::before {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }

  .auth-card-inner { padding: 2.4rem 2.2rem 2.2rem; }

  /* ── Logo / brand ── */
  .auth-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .auth-logo-mark {
    width: 48px;
    height: 48px;
    background: #C9A84C;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 22px;
    color: #0D1B2A;
    margin-bottom: 1rem;
  }

  .auth-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
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

  /* ── Error banner ── */
  .auth-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.2);
    border-radius: 8px;
    margin-bottom: 1.4rem;
    font-size: 13px;
    color: #F09595;
    animation: auth-in 0.3s ease;
  }

  /* ── Form ── */
  .auth-field { margin-bottom: 1.1rem; }

  .auth-label {
    display: block;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8A9BB0;
    margin-bottom: 6px;
  }

  .auth-input-wrap {
    position: relative;
  }

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

  /* ── Submit button ── */
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
    margin-top: 1.6rem;
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

  .auth-spin {
    animation: auth-rotate 0.8s linear infinite;
  }

  @keyframes auth-rotate { to { transform: rotate(360deg); } }

  /* ── Footer link ── */
  .auth-footer {
    margin-top: 1.4rem;
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

  /* ── Divider ── */
  .auth-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 1.6rem 0 1.4rem;
  }
`;

export default function Login() {
  // ── LOGIC: DO NOT EDIT ──────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  // ── END LOGIC ────────────────────────────────────────────────────────────

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="auth-z" style={{ width: '100%', maxWidth: 420 }}>
          <div className="auth-card">
            <div className="auth-card-inner">

              {/* Brand */}
              <div className="auth-brand">
                <div className="auth-logo-mark">I</div>
                <h1 className="auth-brand-name">Infera</h1>
                <p className="auth-brand-sub">Sign in to your account</p>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-error">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              {/* Form — onSubmit preserved exactly */}
              <form onSubmit={handleSubmit}>
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
                    />
                  </div>
                </div>

                <button className="auth-btn" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 size={15} className="auth-spin" /> Signing in...</>
                  ) : (
                    'Sign in to Infera'
                  )}
                </button>
              </form>

              <div className="auth-divider" />

              <div className="auth-footer">
                Don't have an account?{' '}
                <Link to="/register">Create one free</Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}