import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Flame, BookOpen, Clock, Calendar, CheckSquare } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const mockStats = [
    { name: 'Active Streaks', value: '5 Days', icon: <Flame className="text-orange-500 w-6 h-6" />, desc: 'Keep the momentum going!' },
    { name: 'Hours Studied', value: '18.5 hrs', icon: <Clock className="text-indigo-400 w-6 h-6" />, desc: 'This week' },
    { name: 'Active Goals', value: '2 Goals', icon: <BookOpen className="text-purple-400 w-6 h-6" />, desc: 'System Design, Spring Boot' },
    { name: 'Tasks Completed', value: '14 / 20', icon: <CheckSquare className="text-emerald-400 w-6 h-6" />, desc: '70% execution rate' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name}</span>.
          </h1>
          <p className="text-zinc-400 text-sm">
            Here is an overview of your learning execution progress.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300">
          <Calendar className="w-4 h-4 text-indigo-400" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockStats.map((stat) => (
          <div
            key={stat.name}
            className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900/20 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">{stat.name}</span>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">{stat.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <p className="text-xs text-zinc-400">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-8 p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Today's Tasks</h3>
            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              View All Tasks
            </button>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Read Spring Security architecture and filters', category: 'Spring Boot OS', status: 'completed' },
              { title: 'Implement JWT Refresh Token flow on backend', category: 'Spring Boot OS', status: 'completed' },
              { title: 'Design client-side glassmorphic login screen', category: 'React Front', status: 'in_progress' },
              { title: 'Integrate Google Identity Services on frontend', category: 'React Front', status: 'pending' },
            ].map((task, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-850 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      task.status === 'completed'
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {task.status === 'completed' && <span className="text-[10px]">✓</span>}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-300'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {task.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Roadmap Focus */}
        <div className="lg:col-span-4 p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Current Roadmap</h3>
            <div className="p-4 rounded-lg bg-indigo-600/10 border border-indigo-500/20 space-y-4">
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  Active Goal
                </div>
                <h4 className="text-base font-bold text-white">Full Stack SaaS Developer</h4>
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-2">Overall Goal Progress: 18%</div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white font-semibold text-sm transition-all duration-200 mt-6 cursor-pointer">
            Resume Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};
