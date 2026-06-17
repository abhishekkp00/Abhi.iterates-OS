import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] p-4 text-center font-sans">
      <div className="relative p-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 max-w-md w-full shadow-2xl backdrop-blur-md space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Access Denied</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            You do not have the required permissions to view this resource. Contact your administrator if you believe this is an error.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white font-semibold text-sm transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
};
