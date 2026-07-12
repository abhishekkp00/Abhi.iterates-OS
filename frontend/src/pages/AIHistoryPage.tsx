import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';


interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function AIHistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // We will query the endpoint GET /api/v1/ai/history
    axios.get('/api/v1/ai/history')
      .then(res => {
        if (res.data?.success) {
          setConversations(res.data.data);
        }
      })
      .catch(() => {
        // Fallback placeholder empty list
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/20 text-slate-100">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="h-8 w-8 text-blue-500" />
          AI Conversation History
        </h1>
        <p className="text-slate-400">
          Review, search, and resume all past assistant chat logs.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search past conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-900/40 rounded-lg animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900/40 border-slate-800 py-12 text-center">
          <CardContent className="space-y-3">
            <MessageSquare className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-lg font-medium text-slate-300">No Conversations Found</h3>
            <p className="text-sm text-slate-500">
              {search ? 'Try adjusting your search filters.' : 'Start a new conversation in the assistant tab.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(conv => (
            <Link
              key={conv.id}
              to={`/ai/chat/${conv.id}`}
              className="group block p-4 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 rounded-xl transition-all shadow-md hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    {conv.title || 'Untitled Session'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Last active: {new Date(conv.updatedAt).toLocaleDateString()} at {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
