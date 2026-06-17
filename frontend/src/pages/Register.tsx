import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';
import { User, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.register({ name, email, password });
      setAuth(response);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        (err.response?.data?.validationErrors && Object.values(err.response.data.validationErrors).join(', ')) ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential returned from Google');
      }
      const response = await authService.googleLogin(credentialResponse.credential);
      setAuth(response);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Google login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white tracking-tight">Create an account</h2>
        <p className="text-zinc-400 text-sm">Join the platform to begin executing your goals</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-medium animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Abhishek Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50 transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign Up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-x-0 h-px bg-zinc-850" />
        <span className="relative px-3 bg-zinc-950 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          Or register with
        </span>
      </div>

      {/* Google Login Container */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-xs flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            width="280px"
          />

        </div>
      </div>

      {/* Redirect Link */}
      <div className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
};
