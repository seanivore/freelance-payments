import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Mouse glow effect state
  const containerRef = useRef<HTMLDivElement>(null);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });
  const [glowIntensity, setGlowIntensity] = useState(0.35);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Handle mouse movement for glow effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Check if near the card (within 100px)
    const nearCard = 
      e.clientX >= rect.left - 100 &&
      e.clientX <= rect.right + 100 &&
      e.clientY >= rect.top - 100 &&
      e.clientY <= rect.bottom + 100;
    
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    setGlowPosition({ x: e.clientX, y: e.clientY });
    
    if (isInside) {
      // Inside the card - brightest
      setGlowIntensity(0.55);
    } else if (nearCard) {
      // Near the card - calculate gradual intensity based on distance
      const distanceToCard = Math.min(
        Math.abs(e.clientX - rect.left),
        Math.abs(e.clientX - rect.right),
        Math.abs(e.clientY - rect.top),
        Math.abs(e.clientY - rect.bottom)
      );
      // Gradual transition from 0.55 (at edge) to 0.35 (at 100px away)
      const proximityIntensity = 0.55 - (distanceToCard / 100) * 0.2;
      setGlowIntensity(Math.max(0.35, proximityIntensity));
    } else {
      // Far from card - base intensity (still visible)
      setGlowIntensity(0.35);
    }
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove, isTouchDevice]);

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
      for (const entry of Object.values(manifest.jobs) as any[]) {
        if (normalizeLookupKey(entry.login_name || '') === normLast &&
            normalizeLookupKey(entry.login_keyword || '') === normKey) {
          jobEntry = entry;
          break;
        }
      }

      if (!jobEntry) throw new Error('Job not found. Check credentials.');

      // 3. Extract job_id and redirect
      const jobId = jobEntry.job_id;
      if (!jobId) throw new Error('Invalid job entry in manifest.');
      
      // 4. Redirect to job URL
      window.location.href = `/${jobId}`;

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Art */}
      <div className="fixed inset-0 -z-20">
        <img
          src="/assets/media/pdf-viewer-bg-art-1.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.7) 0%, rgba(15, 15, 15, 0.5) 50%, rgba(15, 15, 15, 0.7) 100%)',
          }}
        />
      </div>

      {/* Mouse-following glow effect */}
      {!isTouchDevice && (
        <div
          className="fixed pointer-events-none -z-10"
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201, 156, 173, 0.6) 0%, rgba(201, 156, 173, 0.2) 40%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            left: glowPosition.x,
            top: glowPosition.y,
            opacity: glowIntensity,
            filter: 'blur(60px)',
            transition: 'opacity 100ms ease-out',
          }}
        />
      )}

      {/* Login Card */}
      <div 
        ref={containerRef}
        className="w-full max-w-md relative z-10 flex flex-col items-center animate-fade-in-up"
      >
        <div 
          className="w-full p-8 rounded-2xl border border-portfolio-border bg-portfolio-bg-dark/80 backdrop-blur-xl shadow-2xl transition-shadow duration-100 ease-out"
          style={{
            boxShadow: `0 0 ${40 + glowIntensity * 40}px rgba(201, 156, 173, ${glowIntensity * 0.4})`,
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-agency text-4xl font-bold text-portfolio-text-primary mb-2 tracking-wider">
              Horvath Payments
            </h1>
            <p className="text-portfolio-text-secondary text-sm">
              Sign contract, make payments, and download documents.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                className="w-full bg-portfolio-bg-primary border border-portfolio-border rounded-lg px-4 py-3 text-portfolio-text-primary placeholder-portfolio-text-secondary/50 transition-all duration-300 focus:outline-none focus:border-portfolio-accent-mauve focus:shadow-glow"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div>
              <input 
                type="text" 
                className="w-full bg-portfolio-bg-primary border border-portfolio-border rounded-lg px-4 py-3 text-portfolio-text-primary placeholder-portfolio-text-secondary/50 transition-all duration-300 focus:outline-none focus:border-portfolio-accent-mauve focus:shadow-glow"
                placeholder="Project Keyword"
                value={projectKeyword}
                onChange={e => setProjectKeyword(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-portfolio-text-secondary/70 mt-2 text-center">
                Use the keyword from your notification email.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-portfolio-accent-mauve hover:bg-portfolio-accent-mauve/80 text-portfolio-bg-dark font-semibold py-3 rounded-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg hover:shadow-glow"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Access Portal'}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-portfolio-text-secondary/60 mt-8">
          Need help? Contact{' '}
          <a 
            href="mailto:sean@august.style" 
            className="text-portfolio-accent-mauve hover:text-portfolio-accent-mauve/80 transition-colors"
          >
            sean@august.style
          </a>
        </p>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<LoginApp />);
}
