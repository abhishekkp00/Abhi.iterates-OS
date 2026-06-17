import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getResourceFileBlob } from '../services/resourceService';
import { X, ShieldAlert, Lock, AlertCircle, RefreshCw } from 'lucide-react';

interface SecureViewerProps {
  resourceId: number;
  resourceTitle: string;
  resourceType: string;
  onClose: () => void;
}

export const SecureViewer: React.FC<SecureViewerProps> = ({
  resourceId,
  resourceTitle,
  resourceType,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isObscured, setIsObscured] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Load Secure Document Stream
  useEffect(() => {
    let url: string | null = null;
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const blob = await getResourceFileBlob(resourceId);
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Access Denied: Could not retrieve document payload.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [resourceId]);

  // Anti-Screen Recording & Anti-Screenshot Logic
  useEffect(() => {
    // 1. Obscure when window loses focus (Snipping tool / Screen recorders trigger this)
    const handleBlur = () => {
      setIsObscured(true);
    };

    const handleFocus = () => {
      // Small timeout to let screen-cap overlay close
      setTimeout(() => {
        setIsObscured(false);
      }, 300);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsObscured(true);
      } else {
        setIsObscured(false);
      }
    };

    // 2. Intercept print / save / devtools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Print Screen
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard
        triggerWarning('Screenshot keys blocked to secure author material.');
        e.preventDefault();
      }

      // Block Ctrl + P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        triggerWarning('Printing is disabled for this material.');
        e.preventDefault();
      }

      // Block Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        triggerWarning('Saving is disabled for this material.');
        e.preventDefault();
      }

      // Block Ctrl + Shift + I or F12 (Inspect Element)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
        triggerWarning('Developer inspection panel blocked.');
        e.preventDefault();
      }
    };

    const triggerWarning = (msg: string) => {
      setWarningMessage(msg);
      setTimeout(() => setWarningMessage(null), 3000);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">Securing session and streaming material...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
          <Lock className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-200">Access Denied</h3>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()} // Block right click
    >
      {/* Print-only CSS to completely black out printer previews */}
      <style>{`
        @media print {
          body { display: none !important; }
          .secure-viewer-root { display: none !important; }
        }
      `}</style>

      {/* Top security bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
            Secured Viewer Mode
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs text-zinc-400 truncate max-w-xs md:max-w-md">
            {resourceTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-semibold">
            {user?.email}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main viewer viewport */}
      <div className="flex-1 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
        
        {/* Anti-Screen Recording black overlay */}
        {isObscured ? (
          <div className="absolute inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <Lock className="w-12 h-12 text-indigo-400 animate-pulse" />
            <h4 className="text-lg font-bold text-zinc-200">Content Temporarily Obscured</h4>
            <p className="text-xs text-zinc-500 max-w-sm">
              Screenshot, print capture, or active screen sharing was detected. Return focus to the window to resume viewing.
            </p>
          </div>
        ) : (
          <>
            {/* Dynamic Watermark grid overlay to prevent camera shots */}
            <div className="absolute inset-0 z-40 pointer-events-none opacity-[0.04] select-none grid grid-cols-2 md:grid-cols-4 gap-12 p-8 overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="text-xs font-bold text-zinc-200 rotate-[-30deg] whitespace-nowrap"
                >
                  {user?.email}
                  <br />
                  CONFIDENTIAL • DRM ACTIVE
                </div>
              ))}
            </div>

            {/* Document display */}
            <div className="w-full h-full p-4 flex items-center justify-center">
              {resourceType === 'PDF' && blobUrl ? (
                <object
                  data={`${blobUrl}#toolbar=0&navpanes=0`}
                  type="application/pdf"
                  className="w-full max-w-4xl h-full border border-zinc-800 rounded-lg shadow-2xl"
                >
                  {/* Fallback frame */}
                  <iframe
                    src={`${blobUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full rounded-lg"
                    title="Secured Document View"
                  />
                </object>
              ) : blobUrl ? (
                <img
                  src={blobUrl}
                  alt={resourceTitle}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="text-zinc-500 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-zinc-500" />
                  <span>Document container empty.</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Dynamic warning banner */}
        {warningMessage && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs font-semibold text-zinc-200 flex items-center gap-2 shadow-2xl animate-bounce z-50">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
