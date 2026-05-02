import { useState } from "react";
import { Send, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

  /* ── QueryBox card ── */
  .iq-card {
    background: #162235;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 2rem;
    transition: border-color 0.2s;
    height: 100%;
  }

  .iq-card:focus-within {
    border-color: rgba(201,168,76,0.3);
  }

  .iq-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.4rem;
  }

  .iq-icon {
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

  .iq-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
  }

  /* ── Textarea ── */
  .iq-textarea-wrap {
    position: relative;
    margin-bottom: 1rem;
  }

  .iq-textarea {
    width: 100%;
    height: 176px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #F7F3EC;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 300;
    line-height: 1.7;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
  }

  .iq-textarea::placeholder {
    color: #4A6080;
  }

  .iq-textarea:focus {
    border-color: rgba(201,168,76,0.4);
    background: rgba(201,168,76,0.02);
  }

  .iq-hint {
    position: absolute;
    bottom: 10px;
    right: 12px;
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    color: #4A6080;
    pointer-events: none;
  }

  /* ── Send button ── */
  .iq-btn {
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
  }

  .iq-btn:hover:not(:disabled) {
    background: #E8C97A;
    transform: translateY(-1px);
  }

  .iq-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Spinner ── */
  .iq-spin {
    animation: iq-rotate 0.8s linear infinite;
  }

  @keyframes iq-rotate {
    to { transform: rotate(360deg); }
  }

  /* ── Answer block (inside QueryBox for inline display) ── */
  .iq-answer-wrap {
    margin-top: 1.4rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-top: 1.4rem;
    animation: iq-fade 0.4s ease;
  }

  @keyframes iq-fade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .iq-answer-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 0.6rem;
  }

  .iq-answer-text {
    font-size: 13px;
    color: #B8CADC;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  /* Citation markers inline */
  .iq-answer-text .cite {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: rgba(201,168,76,0.15);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: #C9A84C;
    vertical-align: middle;
    margin: 0 1px;
  }

  /* ── Sources accordion ── */
  .iq-sources-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 1rem;
    padding: 6px 0;
    background: transparent;
    border: none;
    border-top: 1px solid rgba(255,255,255,0.05);
    color: #8A9BB0;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: color 0.2s;
    padding-top: 10px;
  }

  .iq-sources-toggle:hover { color: #C9A84C; }

  .iq-sources-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    animation: iq-fade 0.3s ease;
  }

  .iq-source-card {
    padding: 10px 12px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 2px solid rgba(201,168,76,0.4);
    border-radius: 0 6px 6px 0;
  }

  .iq-source-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .iq-source-file {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #C9A84C;
    letter-spacing: 0.04em;
  }

  .iq-source-chunk {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #4A6080;
  }

  .iq-source-score {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #4A6080;
  }

  .iq-source-text {
    font-size: 11px;
    color: #6A7F94;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export default function QueryBox({ setAnswer }) {
  // ── LOGIC: DO NOT EDIT ──────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  // ── END LOGIC ────────────────────────────────────────────────────────────

  // Local state for inline display
  const [localAnswer, setLocalAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);

  // ── LOGIC: fetch — URL, headers, body untouched ─────────────────────────
  const askQuestion = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setLocalAnswer('');
    setSources([]);
    setShowSources(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      // Update local display
      setLocalAnswer(data.answer || '');
      setSources(data.sources || []);

      // Lift full response to Dashboard (sources + debug included)
      setAnswer(data);
    } catch (err) {
      setLocalAnswer('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ── END LOGIC ────────────────────────────────────────────────────────────

  // Render citations as styled badges
  const renderAnswer = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      if (/^\[\d+\]$/.test(part)) {
        return <span key={i} className="cite">{part.slice(1,-1)}</span>;
      }
      return part;
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="iq-card">

        <div className="iq-header">
          <div className="iq-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="iq-title">Ask the assistant</h2>
        </div>

        {/* Textarea */}
        <div className="iq-textarea-wrap">
          <textarea
            className="iq-textarea"
            placeholder="Ask something about your compliance documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) askQuestion();
            }}
          />
          <span className="iq-hint">Ctrl + Enter to send</span>
        </div>

        {/* Button */}
        <button
          className="iq-btn"
          onClick={askQuestion}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="iq-spin" />
              Analyzing documents...
            </>
          ) : (
            <>
              <Send size={15} />
              Ask Infera
            </>
          )}
        </button>

        {/* Inline answer */}
        {localAnswer && (
          <div className="iq-answer-wrap">
            <div className="iq-answer-label">Answer</div>
            <div className="iq-answer-text">{renderAnswer(localAnswer)}</div>

            {/* Sources accordion */}
            {sources.length > 0 && (
              <>
                <button
                  className="iq-sources-toggle"
                  onClick={() => setShowSources(v => !v)}
                >
                  {showSources ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                  {sources.length} source{sources.length !== 1 ? 's' : ''} retrieved
                </button>

                {showSources && (
                  <div className="iq-sources-list">
                    {sources.map((src, i) => (
                      <div key={i} className="iq-source-card">
                        <div className="iq-source-meta">
                          <FileText size={10} color="#C9A84C" />
                          <span className="iq-source-file">{src.filename}</span>
                          <span className="iq-source-chunk">chunk {src.chunk_index}</span>
                          <span className="iq-source-score">score {src.rerank_score?.toFixed(2)}</span>
                        </div>
                        <div className="iq-source-text">{src.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}