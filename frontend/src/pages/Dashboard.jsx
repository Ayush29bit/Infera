import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, FileText, MessageSquare, Zap, Database } from 'lucide-react';
import UploadBox from '../components/UploadBox';
import QueryBox from '../components/QueryBox';
import AnswerBox from '../components/AnswerBox';

// ── Design tokens matching the landing page ──────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

  .infera-dash * { box-sizing: border-box; }

  .infera-dash {
    min-height: 100vh;
    background: #0D1B2A;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: #F7F3EC;
    position: relative;
    overflow-x: hidden;
  }

  /* Grid texture */
  .infera-dash::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
    background-size: 80px 80px;
    pointer-events: none;
    z-index: 0;
  }

  /* Ambient glow */
  .infera-dash::after {
    content: '';
    position: fixed;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    top: 20%;
    right: -10%;
    pointer-events: none;
    z-index: 0;
  }

  .infera-z { position: relative; z-index: 1; }

  /* ── Header ── */
  .infera-header {
    background: rgba(13,27,42,0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 2.5rem;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .infera-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .infera-logo-mark {
    width: 32px;
    height: 32px;
    background: #C9A84C;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 15px;
    color: #0D1B2A;
    flex-shrink: 0;
  }

  .infera-logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 600;
    color: #FFFFFF;
    letter-spacing: 0.01em;
  }

  .infera-header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .infera-stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 14px;
    border: 1px solid rgba(201,168,76,0.18);
    border-radius: 6px;
    background: rgba(201,168,76,0.05);
  }

  .infera-stat-label {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8A9BB0;
    font-family: 'DM Mono', monospace;
  }

  .infera-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #C9A84C;
    line-height: 1.2;
  }

  .infera-user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    background: rgba(255,255,255,0.03);
  }

  .infera-user-name {
    font-size: 13px;
    font-weight: 500;
    color: #F7F3EC;
  }

  .infera-user-tier {
    font-size: 10px;
    color: #8A9BB0;
    font-family: 'DM Mono', monospace;
  }

  .infera-logout {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 6px;
    background: transparent;
    color: #C9A84C;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }

  .infera-logout:hover {
    background: rgba(201,168,76,0.1);
    border-color: #C9A84C;
    color: #E8C97A;
  }

  /* ── Main layout ── */
  .infera-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2.5rem 2.5rem;
  }

  /* ── Greeting ── */
  .infera-greeting {
    margin-bottom: 2.5rem;
  }

  .infera-greeting-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 0.5rem;
  }

  .infera-greeting h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1.2;
    letter-spacing: -0.01em;
    margin: 0 0 0.4rem;
  }

  .infera-greeting h2 em {
    font-style: italic;
    color: #C9A84C;
  }

  .infera-greeting p {
    font-size: 14px;
    color: #8A9BB0;
    margin: 0;
  }

  /* ── Two-column grid ── */
  .infera-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 860px) {
    .infera-grid { grid-template-columns: 1fr; }
    .infera-header { padding: 0 1.2rem; }
    .infera-main { padding: 1.5rem 1.2rem; }
    .infera-stat-pill { display: none; }
  }

  /* ── Cards (shared base for Upload + Query) ── */
  .infera-card {
    background: #162235;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 2rem;
    transition: border-color 0.2s;
  }

  .infera-card:hover {
    border-color: rgba(201,168,76,0.2);
  }

  .infera-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.5rem;
  }

  .infera-card-icon {
    width: 36px;
    height: 36px;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 8px;
    background: rgba(201,168,76,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C9A84C;
    flex-shrink: 0;
  }

  .infera-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
  }

  /* ── Answer section (full width below grid) ── */
  .infera-answer-section {
    /* rendered by AnswerBox */
  }

  /* ── Pipeline debug badge ── */
  .infera-debug-bar {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 10px 14px;
    background: rgba(201,168,76,0.05);
    border: 1px solid rgba(201,168,76,0.12);
    border-radius: 6px;
    margin-top: 1rem;
  }

  .infera-debug-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #8A9BB0;
  }

  .infera-debug-item span {
    color: #C9A84C;
    font-weight: 500;
  }
`;

export default function Dashboard() {
  // ── LOGIC: DO NOT EDIT ────────────────────────────────────────────────────
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [debug, setDebug] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Lift full response from QueryBox
  const handleAnswer = (data) => {
    setAnswer(data.answer || '');
    setSources(data.sources || []);
    setDebug(data.debug || null);
  };
  // ── END LOGIC ─────────────────────────────────────────────────────────────

  return (
    <>
      <style>{styles}</style>
      <div className="infera-dash">

        {/* ── Header ── */}
        <header className="infera-header infera-z">
          <div className="infera-logo">
            <div className="infera-logo-mark">I</div>
            <span className="infera-logo-text">Infera</span>
          </div>

          <div className="infera-header-right">
            <div className="infera-stat-pill">
              <span className="infera-stat-label">Documents</span>
              <span className="infera-stat-value">{user?.documents_uploaded || 0}</span>
            </div>
            <div className="infera-stat-pill">
              <span className="infera-stat-label">Queries</span>
              <span className="infera-stat-value">{user?.queries_made || 0}</span>
            </div>

            <div className="infera-user-chip">
              <User size={14} color="#8A9BB0" />
              <div>
                <div className="infera-user-name">{user?.username}</div>
                <div className="infera-user-tier">{user?.subscription_tier || 'free'}</div>
              </div>
            </div>

            {/* LOGIC: logout handler stays untouched */}
            <button className="infera-logout" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="infera-main infera-z">

          {/* Greeting */}
          <div className="infera-greeting">
            <div className="infera-greeting-eyebrow">Dashboard</div>
            <h2>
              Welcome back, <em>{user?.full_name || user?.username}</em>
            </h2>
            <p>Upload compliance documents and ask precise questions — powered by hybrid RAG</p>
          </div>

          {/* Two-column: Upload + Query */}
          <div className="infera-grid">
            <UploadBox />
            {/* LOGIC: setAnswer replaced with handleAnswer to capture sources + debug */}
            <QueryBox setAnswer={handleAnswer} />
          </div>

          {/* Answer + sources */}
          <AnswerBox answer={answer} sources={sources} />

          {/* Pipeline debug bar — only shows after a query */}
          {debug && (
            <div className="infera-debug-bar">
              <div className="infera-debug-item">
                <Zap size={11} color="#C9A84C" />
                Dense: <span>{debug.dense_retrieved}</span>
              </div>
              <div className="infera-debug-item">
                <Database size={11} color="#C9A84C" />
                BM25: <span>{debug.bm25_retrieved}</span>
              </div>
              <div className="infera-debug-item">
                Fused: <span>{debug.after_fusion}</span>
              </div>
              <div className="infera-debug-item">
                Reranked → <span>{debug.after_rerank} chunks</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}