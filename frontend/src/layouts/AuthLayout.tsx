import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AuthLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] text-[#fafafa] overflow-hidden font-sans">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px]" />
      
      {/* Tiny subtle grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8 items-center">
        {/* Brand/Hero Section */}
        <div className="lg:col-span-6 text-left hidden lg:block pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            AI-Powered Execution OS
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight leading-none mb-6">
            Execute Your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Learning Goals</span> With AI Precision.
          </h1>
          
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-lg">
            Abhi.Iterates OS converts structured goals into actionable roadmaps, tracks consistency, and builds your technical competence with embedded RAG and intelligence.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
              <div className="text-indigo-400 font-bold text-xl mb-1">Roadmaps</div>
              <div className="text-zinc-500 text-xs">AI-generated task lists, milestones, and revision intervals.</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
              <div className="text-purple-400 font-bold text-xl mb-1">PDF RAG</div>
              <div className="text-zinc-500 text-xs">Vector-powered context queries and flash card creation.</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-2xl backdrop-blur-md">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="text-center lg:hidden mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Abhi.Iterates OS
              </h1>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
