import React from 'react';
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Home, Compass, FolderClosed, LineChart, ShieldAlert } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Roadmaps', path: '/roadmaps', icon: <Compass className="w-5 h-5" /> },
    { name: 'Resources', path: '/resources', icon: <FolderClosed className="w-5 h-5" /> },
    { name: 'Productivity', path: '/productivity', icon: <LineChart className="w-5 h-5" /> },
  ];

  if (user.role === 'ADMIN') {
    menuItems.push({ name: 'Admin Portal', path: '/admin', icon: <ShieldAlert className="w-5 h-5" /> });
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800">
            <Link to="/dashboard" className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Abhi.Iterates OS
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Card / Logout */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm tracking-wide text-white border border-indigo-400/20">
              {getInitials(user.name)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold truncate text-white">{user.name}</div>
              <div className="text-xs text-zinc-500 truncate">{user.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header (Top Bar) */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white md:block hidden">Workspace</h2>
            {/* Mobile Logo */}
            <Link to="/dashboard" className="text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent md:hidden">
              Abhi.Iterates OS
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {user.role}
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white border border-purple-400/20 md:hidden">
              {getInitials(user.name)}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 md:p-8 bg-[#09090b]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
