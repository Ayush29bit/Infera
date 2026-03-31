import { BookOpen, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

  .ab-wrap {
    animation: ab-in 0.4s ease both;
  }

  @keyframes ab-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ab-card {
    background: #162235;
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 12px;
    overflow: hidden;
  }

  /* Gold top accent line */
  .ab-card::before {
    content: '';
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }

  .ab-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 1.4rem 1.8rem 0;
    margin-bottom: 1rem;
  }

  .ab-header-icon {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 8px;
    background: rgba(201,168,76,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C9A84C;
    flex-shrink: 0;
  }

  .ab-header-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
  }

  .ab-header-sub {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #4A6080;
    margin-top: 1px;
    letter-spacing: 0.06em;
  }

  /* ── Answer body ── */
  .ab-body {
    padding: 0 1.8rem 1.6rem;
  }

  .ab-text {
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: #B8CADC;
    line-height: 1.85;
    white-space: pre-wrap;
  }

  /* Citation badges rendered inline */
  .ab-cite {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: rgba(201,168,76,0.15);
    border: 1px solid rgba(201,168,76,0.35);
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    color: #C9A84C;
    vertical-align: middle;
    margin: 0 1px;
    cursor: default;
  }

  /* ── Sources section ── */
  .ab-sources-section {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 0 1.8rem 1.6rem;
  }

  .ab-sources-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 1rem 0 0;
    background: transparent;
    border: none;
    color: #8A9BB0;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: color 0.2s;
    width: 100%;
    text-align: left;
  }

  .ab-sources-toggle:hover { color: #C9A84C; }

  .ab-sources-count {
    margin-left: auto;
    padding: 2px 8px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 100px;
    font-size: 10px;
    color: #C9A84C;
  }

  .ab-sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
    margin-top: 12px;
    animation: ab-in 0.3s ease;
  }

  .ab-source-card {
    padding: 12px 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .ab-source-card:hover {
    border-color: rgba(201,168,76,0.2);
  }

  /* Rank badge */
  .ab-source-rank {
    position: absolute;
    top: 10px;
    right: 10px;
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: rgba(201,168,76,0.1);
    line-height: 1;
    pointer-events: none;
  }

  .ab-source-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .ab-source-file {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #C9A84C;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .ab-source-dot {
    width: 2px;
    height: 2px;
    background: #4A6080;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .ab-source-chunk {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #4A6080;
  }

  .ab-source-score-bar {
    height: 2px;
    background: rgba(255,255,255,0.05);
    border-radius: 1px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .ab-source-score-fill {
    height: 100%;
    background: linear-gradient(90deg, #C9A84C, #E8C97A);
    border-radius: 1px;
    transition: width 0.6s ease;
  }

  .ab-source-text {
    font-size: 11px;
    color: #4A6080;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Normalise rerank scores to 0–100% for the progress bar
// Cross-encoder scores can be negative, so we need min/max normalisation
function normaliseScores(sources) {
  if (!sources.length) return sources;
  const scores = sources.map(s => s.rerank_score ?? 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  return sources.map(s => ({
    ...s,
    _pct: Math.round(((s.rerank_score ?? 0) - min) / range * 100),
  }));
}

// Render answer text with [1] [2] etc as gold badge spans
function renderWithCitations(text) {
  if (!text) return null;
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    if (/^\[\d+\]$/.test(part)) {
      return <span key={i} className="ab-cite">{part.slice(1, -1)}</span>;
    }
    return part;
  });
}

export default function AnswerBox({ answer, sources = [] }) {
  const [showSources, setShowSources] = useState(false);

  if (!answer) return null;

  const normSources = normaliseScores(sources);

  return (
    <>
      <style>{styles}</style>
      <div className="ab-wrap">
        <div className="ab-card">

          {/* Header */}
          <div className="ab-header">
            <div className="ab-header-icon">
              <BookOpen size={15} />
            </div>
            <div>
              <h3 className="ab-header-title">Infera response</h3>
              <div className="ab-header-sub">
                {sources.length > 0
                  ? `Grounded in ${sources.length} source${sources.length !== 1 ? 's' : ''}`
                  : 'Generated response'}
              </div>
            </div>
          </div>

          {/* Answer text */}
          <div className="ab-body">
            <div className="ab-text">{renderWithCitations(answer)}</div>
          </div>

          {/* Sources section */}
          {sources.length > 0 && (
            <div className="ab-sources-section">
              <button
                className="ab-sources-toggle"
                onClick={() => setShowSources(v => !v)}
              >
                <FileText size={11} />
                Retrieved sources
                <span className="ab-sources-count">{sources.length}</span>
                {showSources
                  ? <ChevronUp size={12} style={{ marginLeft: 'auto', marginRight: 0 }} />
                  : <ChevronDown size={12} style={{ marginLeft: 'auto', marginRight: 0 }} />
                }
              </button>

              {showSources && (
                <div className="ab-sources-grid">
                  {normSources.map((src, i) => (
                    <div key={i} className="ab-source-card">
                      <div className="ab-source-rank">{i + 1}</div>

                      <div className="ab-source-meta">
                        <FileText size={10} color="#C9A84C" />
                        <span className="ab-source-file" title={src.filename}>
                          {src.filename}
                        </span>
                        <span className="ab-source-dot" />
                        <span className="ab-source-chunk">§{src.chunk_index}</span>
                      </div>

                      {/* Relevance bar */}
                      <div className="ab-source-score-bar">
                        <div
                          className="ab-source-score-fill"
                          style={{ width: `${src._pct}%` }}
                        />
                      </div>

                      <div className="ab-source-text">{src.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}