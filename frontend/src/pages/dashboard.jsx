import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, FileText, MessageSquare } from 'lucide-react';
import UploadBox from '../components/UploadBox';
import QueryBox from '../components/QueryBox';
import AnswerBox from '../components/AnswerBox';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Smart Compliance Assistant</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl">
              <User className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.subscription_tier}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="px-3 py-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-slate-600">Documents</p>
                <p className="text-lg font-bold text-blue-600">{user?.documents_uploaded || 0}</p>
              </div>
              <div className="px-3 py-2 bg-cyan-50 rounded-lg">
                <p className="text-xs text-slate-600">Queries</p>
                <p className="text-lg font-bold text-cyan-600">{user?.queries_made || 0}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.full_name || user?.username}! 👋
          </h2>
          <p className="text-slate-600 mt-2">
            Upload documents and ask questions to get instant insights
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadBox />
          <QueryBox setAnswer={setAnswer} />
        </div>

        {/* Answer Section */}
        <div className="mt-6">
          <AnswerBox answer={answer} />
        </div>
      </div>
    </div>
  );
}