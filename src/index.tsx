import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import './index.css';

function normalizeLookupKey(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-').trim();
}

function LoginApp() {
  const [lastName, setLastName] = useState('');
  const [projectKeyword, setProjectKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note: No need to clear sessionStorage - we don't use it for job data
  // We always fetch fresh JSON from URL path in App.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!lastName || !projectKeyword) throw new Error('Please fill in all fields.');

      // 1. Fetch Manifest
      const manifestRes = await fetch('/assets/js/manifest.json');
      if (!manifestRes.ok) throw new Error('Manifest not found (System Error).');
      
      const manifest = await manifestRes.json();
      if (!manifest.jobs) throw new Error('No jobs found in system.');

      // 2. Normalize and Match
      const normLast = normalizeLookupKey(lastName);
      const normKey = normalizeLookupKey(projectKeyword);

      let jobEntry: any = null;
      // manifest.jobs is object keyed by UID or string
      for (const entry of Object.values(manifest.jobs) as any[]) {
        if (normalizeLookupKey(entry.login_name || '') === normLast &&
            normalizeLookupKey(entry.login_keyword || '') === normKey) {
          jobEntry = entry;
          break;
        }
      }

      if (!jobEntry) throw new Error('Job not found. Check credentials.');

      // 3. Extract job_id and redirect (don't fetch or store job data)
      // App.tsx will fetch fresh JSON from URL path
      const jobId = jobEntry.job_id;
      if (!jobId) throw new Error('Invalid job entry in manifest.');
      
      // 4. Redirect to job URL (404.html will route to App.tsx)
      window.location.href = `/${jobId}`;

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow Effect Mockup */}
        <div className="fixed pointer-events-none inset-0 flex items-center justify-center opacity-30">
            <div className="w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10 flex flex-col items-center">
            <div className="w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Horvath Payments</h1>
                    <p className="text-slate-400 text-sm">Login to access your contract and invoices.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 transition-all"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 transition-all"
                            placeholder="Project Keyword"
                            value={projectKeyword}
                            onChange={e => setProjectKeyword(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500 mt-2 text-center">Use the keyword from your notification email.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Lookup Payments'}
                    </button>
                </form>
            </div>
            
            <p className="text-center text-sm text-slate-600 mt-8">
                Need help? Contact <a href="mailto:sean@august.style" className="text-emerald-500 hover:underline">sean@august.style</a>
            </p>
        </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<LoginApp />);
}
