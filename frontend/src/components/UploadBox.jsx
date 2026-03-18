import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UploadBox() {
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Upload className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">Upload Document</h2>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.html,.md"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group"
          >
            <FileText className="w-12 h-12 text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
            <p className="text-slate-600 group-hover:text-slate-700 transition-colors font-medium">
              {selectedFile ? selectedFile.name : 'Click to select a file'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              PDF, Word, PowerPoint, Images, HTML, Markdown supported
            </p>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 truncate font-medium">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}

        {status && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            status.includes("success") 
              ? "bg-green-50 border-green-200" 
              : status.includes("failed") || status.includes("error")
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            {status.includes("success") ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : status.includes("failed") || status.includes("error") ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            )}
            <p className={`font-medium text-sm ${
              status.includes("success") 
                ? "text-green-700" 
                : status.includes("failed") || status.includes("error")
                ? "text-red-700"
                : "text-blue-700"
            }`}>
              {status}
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              <span>Upload Document</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}