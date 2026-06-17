import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Flame,
  BookOpen,
  Clock,
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Activity,
  PlusCircle,
  TrendingUp,
  Bookmark,
  Check
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  completed: boolean;
}

interface StudyLog {
  id: string;
  timestamp: string;
  duration: number; // in minutes
  topic: string;
  notes: string;
}

// Web Audio API synthesizer for the Pomodoro timer complete signal
const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a dual-tone warm chord
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.4); // C5
    playNote(659.25, now + 0.1, 0.4); // E5
    playNote(783.99, now + 0.2, 0.5); // G5
  } catch (e) {
    console.warn('Web Audio Context is not supported or was blocked:', e);
  }
};

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // --- Dynamic State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('abhi_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Review Spring Boot Security Filter chain mappings', category: 'Backend', completed: true },
      { id: '2', title: 'Implement JWT Refresh Token rotation', category: 'Security', completed: true },
      { id: '3', title: 'Design client-side glassmorphic login screen', category: 'Frontend', completed: false },
      { id: '4', title: 'Setup Google OAuth 2.0 Web Client Credentials', category: 'DevOps', completed: false },
    ];
  });

  const [logs, setLogs] = useState<StudyLog[]>(() => {
    const saved = localStorage.getItem('abhi_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), duration: 45, topic: 'Spring Boot REST APIs', notes: 'Configured global filters and status mapping controllers' },
      { id: '2', timestamp: new Date(Date.now() - 172800000).toISOString(), duration: 90, topic: 'Database Migration', notes: 'Setup PostgreSQL schemas and ran Liquibase updates' },
    ];
  });

  const [status, setStatus] = useState<'focused' | 'reading' | 'resting'>('focused');
  
  // Task Input States
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');

  // Study Log Input States
  const [logTopic, setLogTopic] = useState('');
  const [logDuration, setLogDuration] = useState('30');
  const [logNotes, setLogNotes] = useState('');

  // Pomodoro States
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  
  const timerRef = useRef<any>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('abhi_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('abhi_logs', JSON.stringify(logs));
  }, [logs]);

  // Pomodoro interval loop
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playChime();
            setTimerRunning(false);
            if (timerMode === 'work') {
              // Log the session automatically
              const autoLog: StudyLog = {
                id: Math.random().toString(),
                timestamp: new Date().toISOString(),
                duration: 25,
                topic: 'Pomodoro Focus Session',
                notes: 'Completed a 25-minute uninterrupted work block.'
              };
              setLogs(prevLogs => [autoLog, ...prevLogs]);
              setTimerMode('break');
              return 5 * 60; // 5 min break
            } else {
              setTimerMode('work');
              return 25 * 60; // 25 min work
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerMode]);

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Math.random().toString(),
      title: newTaskTitle,
      category: newTaskCategory,
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTaskTitle('');
  };

  // Toggle Task Completion
  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Log Study Session Manually
  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTopic.trim() || !logDuration) return;
    const newLog: StudyLog = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      duration: parseInt(logDuration),
      topic: logTopic,
      notes: logNotes
    };
    setLogs([newLog, ...logs]);
    setLogTopic('');
    setLogNotes('');
  };

  // Timer Controls
  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60);
  };

  // Format Time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Calculations ---
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalMinutesStudied = logs.reduce((sum, item) => sum + item.duration, 0);
  const totalHoursStudied = (totalMinutesStudied / 60).toFixed(1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner (Clean, Minimalist Layout) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Welcome back, {user?.name || 'Developer'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sync Ready
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Platform Status: Active • Database Connected • 0 Security Warnings
          </p>
        </div>

        {/* Status Mode Selectors */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <button
            onClick={() => setStatus('focused')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              status === 'focused'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎯 Focus Mode
          </button>
          <button
            onClick={() => setStatus('reading')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              status === 'reading'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📚 Deep Study
          </button>
          <button
            onClick={() => setStatus('resting')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              status === 'resting'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ☕ Rest Slot
          </button>
        </div>
      </div>

      {/* Metrics Row (Sleek, High contrast, No neon-glows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">5 Days</div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Streak target: 14 Days</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hours Logged</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">{totalHoursStudied} hrs</div>
            <div className="text-xs text-zinc-400">
              Aggregated study block records
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Roadmap Status</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">2 Roadmaps</div>
            <div className="text-xs text-zinc-400">
              SaaS Foundation, Spring Boot Integration
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Task Completion</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">{completionPercentage}%</div>
            <div className="text-xs text-zinc-400">
              {completedTasks} of {totalTasks} items completed
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column (Checklist & Timeline Log) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Daily Interactive Task checklist */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">Task Execution List</h3>
              <span className="text-xs text-zinc-400">{completedTasks} completed today</span>
            </div>

            {/* Tasks list */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-sm">No tasks remaining. Add one below.</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800/80 hover:bg-zinc-900/20 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          task.completed
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-700 hover:border-zinc-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-sm font-medium ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {task.category}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Next learning target..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Security">Security</option>
                <option value="DevOps">DevOps</option>
                <option value="General">General</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          {/* Session Logger & Logs Timeline */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-6">
            <div className="pb-2 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">Study Log & Timeline</h3>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Form (Left side) */}
              <form onSubmit={handleLogSession} className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={logTopic}
                    onChange={(e) => setLogTopic(e.target.value)}
                    placeholder="e.g. JWT Refresh Flow"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Duration (Min)</label>
                  <select
                    value={logDuration}
                    onChange={(e) => setLogDuration(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                    <option value="90">90 Minutes</option>
                    <option value="120">120 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Key concepts covered..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-100 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Log Study Session
                </button>
              </form>

              {/* Logs List (Right side) */}
              <div className="md:col-span-3 space-y-3 max-h-[280px] overflow-y-auto pr-1">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Recent Sessions</label>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs">No logged sessions. Submit a work block to begin your timeline.</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-zinc-900 bg-zinc-900/5 hover:bg-zinc-900/10 space-y-1.5 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold text-zinc-200">{log.topic}</h4>
                        <span className="text-[10px] font-medium text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                          {log.duration} Mins
                        </span>
                      </div>
                      {log.notes && <p className="text-xs text-zinc-400 leading-relaxed">{log.notes}</p>}
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Pomodoro Timer & Progress) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Functional Pomodoro Timer widget */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-6 flex flex-col items-center justify-between text-center">
            <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100">Deep Focus Timer</h3>
              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                timerMode === 'work'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {timerMode === 'work' ? 'Work Interval' : 'Rest Break'}
              </span>
            </div>

            {/* Circular Progress Design */}
            <div className="relative w-40 h-40 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke="#18181b"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  stroke={timerMode === 'work' ? '#818cf8' : '#34d399'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 72}
                  strokeDashoffset={
                    2 * Math.PI * 72 * (1 - timeLeft / (timerMode === 'work' ? 25 * 60 : 5 * 60))
                  }
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              {/* Text overlay */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold tracking-tighter text-zinc-100">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                  {timerRunning ? 'Timer Active' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 w-full">
              <button
                onClick={toggleTimer}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  timerRunning
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Start
                  </>
                )}
              </button>
              
              <button
                onClick={resetTimer}
                className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Milestone / Roadmap Widget */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 border-b border-zinc-800 pb-3">Active Roadmap Target</h3>
            
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-zinc-900/30 border border-zinc-850 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">Milestone Goal</span>
                  <h4 className="text-sm font-bold text-zinc-200">Abhi.Iterates OS Foundation</h4>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                    <span>Task Progress</span>
                    <span>{completionPercentage}% completed</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Milestone Steps */}
              <div className="space-y-2.5 pl-1.5">
                {[
                  { title: 'Core JWT Authentication layer', status: 'done' },
                  { title: 'CORS Configuration & Local Dev integration', status: 'done' },
                  { title: 'Google Identity Client Provider setup', status: 'done' },
                  { title: 'Refined UI Dashboard & Focus widgets', status: 'done' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-[9px]">
                      ✓
                    </div>
                    <span className="text-zinc-300 font-medium">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
