import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

  .ub-card {
    background: #162235;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 2rem;
    transition: border-color 0.2s;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ub-card:hover {
    border-color: rgba(201,168,76,0.2);
  }

  .ub-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.4rem;
  }

  .ub-icon {
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

  .ub-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0;
  }

  /* ── Drop zone ── */
  .ub-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 176px;
    border: 1px dashed rgba(201,168,76,0.25);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255,255,255,0.02);
    margin-bottom: 1rem;
    text-align: center;
    padding: 1rem;
  }

  .ub-dropzone:hover {
    border-color: rgba(201,168,76,0.5);
    background: rgba(201,168,76,0.04);
  }

  .ub-dropzone.has-file {
    border-color: rgba(201,168,76,0.4);
    background: rgba(201,168,76,0.04);
  }

  .ub-dropzone-icon {
    color: rgba(201,168,76,0.4);
    margin-bottom: 10px;
    transition: color 0.2s;
  }

  .ub-dropzone:hover .ub-dropzone-icon {
    color: #C9A84C;
  }

  .ub-dropzone-label {
    font-size: 13px;
    font-weight: 500;
    color: #B8CADC;
    margin-bottom: 4px;
    font-family: 'DM Sans', sans-serif;
  }

  .ub-dropzone-sub {
    font-size: 11px;
    color: #4A6080;
    font-family: 'DM Mono', monospace;
    line-height: 1.6;
  }

  /* ── Selected file chip ── */
  .ub-file-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(201,168,76,0.06);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 6px;
    margin-bottom: 1rem;
    animation: ub-fade 0.3s ease;
  }

  @keyframes ub-fade {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ub-file-name {
    font-size: 12px;
    font-weight: 500;
    color: #E8C97A;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .ub-file-size {
    font-size: 11px;
    color: #4A6080;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Status message ── */
  .ub-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    animation: ub-fade 0.3s ease;
  }

  .ub-status.success {
    background: rgba(40,200,64,0.08);
    border: 1px solid rgba(40,200,64,0.2);
    color: #5FD97A;
  }

  .ub-status.error {
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.2);
    color: #F09595;
  }

  .ub-status.loading {
    background: rgba(201,168,76,0.06);
    border: 1px solid rgba(201,168,76,0.15);
    color: #C9A84C;
  }

  /* ── Upload button ── */
  .ub-btn {
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
    margin-top: auto;
  }

  .ub-btn:hover:not(:disabled) {
    background: #E8C97A;
    transform: translateY(-1px);
  }

  .ub-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }

  .ub-spin {
    animation: ub-rotate 0.8s linear infinite;
  }

  @keyframes ub-rotate {
    to { transform: rotate(360deg); }
  }
`;

export default function UploadBox() {
  // ── LOGIC: DO NOT EDIT ──────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("Please select a file first");
      return;
    }
    if (!token) {
      setStatus("You must be logged in to upload files");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.message || "Document uploaded successfully!");
        setSelectedFile(null);
        document.getElementById('file-upload').value = '';
      } else {
        const errorData = await response.json();
        setStatus(`Upload failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  // ── END LOGIC ────────────────────────────────────────────────────────────

  const statusType = status.includes("success")
    ? "success"
    : status.includes("failed") || status.includes("error")
    ? "error"
    : status
    ? "loading"
    : null;

  return (
    <>
      <style>{styles}</style>
      <div className="ub-card">

        <div className="ub-header">
          <div className="ub-icon">
            <Upload size={16} />
          </div>
          <h2 className="ub-title">Upload document</h2>
        </div>

        {/* Hidden file input — id preserved exactly */}
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.html,.md"
        />

        {/* Drop zone */}
        <label
          htmlFor="file-upload"
          className={`ub-dropzone${selectedFile ? ' has-file' : ''}`}
        >
          <FileText size={36} className="ub-dropzone-icon" />
          <p className="ub-dropzone-label">
            {selectedFile ? selectedFile.name : 'Click to select a file'}
          </p>
          <p className="ub-dropzone-sub">
            PDF · Word · PowerPoint · Images · HTML · Markdown
          </p>
        </label>

        {/* Selected file chip */}
        {selectedFile && (
          <div className="ub-file-chip">
            <CheckCircle size={13} color="#C9A84C" />
            <span className="ub-file-name">{selectedFile.name}</span>
            <span className="ub-file-size">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className={`ub-status ${statusType}`}>
            {statusType === 'success' && <CheckCircle size={13} />}
            {statusType === 'error'   && <AlertCircle size={13} />}
            {statusType === 'loading' && <Loader2 size={13} className="ub-spin" />}
            {status}
          </div>
        )}

        {/* Upload button */}
        <button
          className="ub-btn"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={15} className="ub-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={15} />
              Upload document
            </>
          )}
        </button>
      </div>
    </>
  );
}