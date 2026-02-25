import { useState } from "react";
import { Send, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function QueryBox({ setAnswer }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const askQuestion = async () => {
    setLoading(true);

    const res = await fetch("http://127.0.0.1:8000/api/query", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization" : `Bearer ${token}`,
       },
       
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-50 rounded-lg">
          <Sparkles className="w-6 h-6 text-cyan-600" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800">Ask Questions</h2>
      </div>

      <div className="space-y-6">
        {/* Query Input */}
        <div className="relative">
          <textarea
            placeholder="Ask something about the document..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none transition-all duration-300"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                askQuestion();
              }
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
            Ctrl + Enter to send
          </div>
        </div>

        {/* Ask Button */}
        <button
          onClick={askQuestion}
          disabled={loading || !query.trim()}
          className="w-full py-4 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              <span>Ask Assistant</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}