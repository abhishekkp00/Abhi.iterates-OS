import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Terminal, CheckCircle2 } from 'lucide-react';
import axios from 'axios';


interface ToolMetadata {
  name: string;
  description: string;
  parameters: string; // JSON schema or description string
  authorizedRoles: string[];
}

export default function AIToolsPage() {
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We will query the endpoint GET /api/v1/ai/tools
    axios.get('/api/v1/ai/tools')
      .then(res => {
        if (res.data?.success) {
          setTools(res.data.data);
        } else {
          // Fallback static tools list if endpoint is empty
          setTools(getFallbackTools());
        }
      })
      .catch(() => {
        setTools(getFallbackTools());
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getFallbackTools = (): ToolMetadata[] => [
    {
      name: 'searchResources',
      description: 'Search personal study resources like uploaded notes, flashcards, or syllabus documents.',
      parameters: '{"query": "string"}',
      authorizedRoles: ['ROLE_USER']
    },
    {
      name: 'searchMarketplace',
      description: 'Find textbook listings, school equipment, or study devices for sale on campus.',
      parameters: '{"query": "string", "minPrice": "number", "maxPrice": "number"}',
      authorizedRoles: ['ROLE_USER']
    },
    {
      name: 'searchKnowledgeBase',
      description: 'Semantic vector search through course textbooks and lecture PDFs.',
      parameters: '{"query": "string", "documentId": "string"}',
      authorizedRoles: ['ROLE_USER']
    },
    {
      name: 'getCurrentProfile',
      description: 'Retrieve logged-in student user details (username, email, year level).',
      parameters: '{}',
      authorizedRoles: ['ROLE_USER']
    },
    {
      name: 'getDashboardSummary',
      description: 'Get an overview of active tasks, resources count, and recent marketplace alerts.',
      parameters: '{}',
      authorizedRoles: ['ROLE_USER']
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/20 text-slate-100">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="h-8 w-8 text-blue-500" />
          Agent Tool Registry
        </h1>
        <p className="text-slate-400">
          Registered capabilities available to the LLM agent during conversations.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-900/40 rounded-xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map(tool => (
            <Card key={tool.name} className="bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80 transition-all shadow-lg backdrop-blur-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    {tool.name}
                    <Badge variant="outline" className="text-xs border-green-500/30 bg-green-500/10 text-green-400 gap-1 font-sans">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1 font-mono">
                    Parameters: {tool.parameters}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {tool.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-blue-400" />
                    Security Roles:
                  </span>
                  <div className="flex gap-1.5">
                    {tool.authorizedRoles.map(role => (
                      <Badge key={role} className="bg-slate-800 text-slate-300 text-[10px] hover:bg-slate-800">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
