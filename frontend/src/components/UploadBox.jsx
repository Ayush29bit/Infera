import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadBox() {
  const [files, setfiles] = useState([]);
  const [status, setStatus] = useState("");

  const uploadFile = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
     formData.append("files", file);
  });

    setStatus("Uploading...");

    try {
      console.log("Uploading file:", file.name);
      
      const res = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
        
      });

      console.log("Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Upload response:", data);
        setStatus("Document uploaded successfully");
      } else {
        const errorData = await res.text();
        console.error("Upload error:", errorData);
        setStatus("Upload failed: " + errorData);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("Upload failed: " + error.message);
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
        {/* File Input Area */}
        <div className="relative">
          <input
            type="file"
            multiple
             onChange={(e) => setFiles(Array.from(e.target.files))}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt, .jpg, .png, .md"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group"
          >
            <FileText className="w-12 h-12 text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
            <p className="text-slate-600 group-hover:text-slate-700 transition-colors font-medium">
              {file ? file.name : 'Click to select a file'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              PDF, Word, PowerPoint, Images, HTML, Markdown supported
            </p>
          </label>
        </div>

        {/* File Selected Status */}
        {file && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 truncate font-medium">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            status.includes("successfully") 
              ? "bg-green-50 border-green-200" 
              : status.includes("failed")
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            {status.includes("successfully") ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : status.includes("failed") ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            )}
            <p className={`font-medium text-sm ${
              status.includes("successfully") 
                ? "text-green-700" 
                : status.includes("failed")
                ? "text-red-700"
                : "text-blue-700"
            }`}>
              {status}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          disabled={!file || status === "Uploading..."}
          className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {status === "Uploading..." ? (
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
