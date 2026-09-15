import React, { useEffect, useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { 
  Settings, Download, FileText, Bug, 
  RefreshCw, Loader2,
  Eye, EyeOff, Copy
} from 'lucide-react';
import { apiService } from '../services/api';

interface TikZRendererProps {
  code?: string;
  hash?: string;
  hideToolbar?: boolean;
  mode?: 'question' | 'solution' | 'all';
}

// NOTE: Change this to your deployed URL if not running locally
const HF_SERVER = 'https://leanhdung1983-tikz-renderer.hf.space/render'; 
const LOCAL_SERVER = 'http://localhost:5000/render';
const KROKI_SERVER = 'https://kroki.io/tikz/svg';
const MAX_RETRIES = 10; 

// Global cache for rendered SVGs to improve performance
const svgCache = new Map<string, string>();

export const clearSvgCache = () => {
  svgCache.clear();
};

const cleanClientSvg = (rawSvg: string | null): string => {
  if (!rawSvg) return '';
  return DOMPurify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style', 'class'],
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

export const TikZRenderer: React.FC<TikZRendererProps> = ({ 
  code, 
  hash,
  hideToolbar = false,
  mode = 'question'
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const originalCode = code || null;
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHtmlError, setIsHtmlError] = useState(false);
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // Responsive width state
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default server selection logic with persistence
  const [serverUrl, setServerUrl] = useState(() => {
    const saved = localStorage.getItem('tikz_server_url');
    return saved || HF_SERVER;
  });
  const [showSettings, setShowSettings] = useState(false);

  // Measure container width for responsive LaTeX wrapping
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const widthPx = entry.contentRect.width;
        if (widthPx > 0) {
          // Convert px to pt (approx 0.75pt per px)
          // Use more of the available width, leaving only a small margin
          const widthPt = Math.floor(widthPx * 0.75) - 10;
          const newWidth = Math.max(300, widthPt);
          
          // Only update if the difference is significant (> 15pt) to prevent infinite loops
          setContainerWidth(prev => {
            if (Math.abs(prev - newWidth) > 15) return newWidth;
            return prev;
          });
        }
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Save server preference
  useEffect(() => {
    localStorage.setItem('tikz_server_url', serverUrl);
  }, [serverUrl]);

  // Track request ID to handle race conditions during retries
  const requestRef = useRef(0);

  const preparePayload = useCallback((rawCode: string, isCustomServer: boolean): string => {
    let payload = rawCode;
    const trimmed = rawCode.trim();
    
    // Auto-wrapping logic
    if (!trimmed.startsWith('\\documentclass')) {
      const isCustom = isCustomServer;
      
      // DETECT MODE: Text/Exercise vs Pure Drawing
      const isTextMode = rawCode.includes('\\begin{ex}') || 
                         rawCode.includes('\\begin{bt}') || 
                         rawCode.includes('\\begin{vd}') ||
                         rawCode.includes('\\loigiai') ||
                         rawCode.includes('\\choice') ||
                         mode === 'solution' ||
                         mode === 'all';

      let preamble = "";
      if (isCustom) {
          preamble = `\\usepackage[utf8]{vietnam}
\\usepackage{amsmath,amssymb,mathrsfs,fancyhdr,enumerate,multirow,makecell,currfile,fontawesome,twemojis}
\\usepackage{tikz,tkz-tab,tkz-euclide,tikz-3dplot}
\\usetikzlibrary{arrows,calc,intersections,angles,snakes,quotes,backgrounds,shapes.geometric,patterns,shadings,positioning}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.9}
\\usepgfplotslibrary{fillbetween}

% Custom commands for VN Math
\\providecommand{\\hoac}[1]{\\left[\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\heva}[1]{\\left\\{\\begin{aligned}#1\\end{aligned}\\right.}
\\providecommand{\\shortans}[1]{\\textbf{Đáp số: }#1}
\\providecommand{\\immini}[3][]{%
  \\noindent\\begin{minipage}[t]{0.65\\linewidth}%
    #2
  \\end{minipage}%
  \\hfill%
  \\begin{minipage}[t]{0.30\\linewidth}%
    \\centering
    #3
  \\end{minipage}%
}
`;
      } else {
          // Kroki fallback - adding tkz-tab just in case, though support is limited
          preamble = `\\usepackage{tikz}
\\usepackage{tkz-tab}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usetikzlibrary{arrows.meta, positioning, calc, shapes, intersections, quotes, backgrounds, fit, petri, mindmap, trees, automata, chains, matrix, scopes, decorations.pathmorphing, decorations.pathreplacing, angles, patterns}`;
      }

      // Using 14pt as per user's recent manual edit
      if (isTextMode) {
          const fullPreamble = `${preamble}
\\newenvironment{ex}[1][]{\\par\\noindent\\textbf{Câu: }}{\\par}
\\newcommand{\\loigiai}[1]{\\par\\noindent\\textbf{Lời giải. }#1}
\\providecommand{\\choice}[4]{}
\\providecommand{\\choiceTF}[4]{}
\\providecommand{\\True}{}
`;
          payload = `\\documentclass[14pt,border=5pt,varwidth=${containerWidth}pt]{standalone}
${fullPreamble}
\\begin{document}
${rawCode}
\\end{document}`;
      } else {
          // Pure drawing mode: simplified preamble, no \Huge, and adjust scale if .8
          const adjustedCode = rawCode.replace(/scale=\.8/g, 'scale=1');
          payload = `\\documentclass[14pt,tikz,border=5pt]{standalone}
${preamble}
\\begin{document}
${adjustedCode}
\\end{document}`;
      }
    }
    return payload;
  }, [mode, containerWidth]);

  const fetchSvg = useCallback(async (requestId: number) => {
    const activeCode = originalCode;
    if (!activeCode && !hash) return;
    
    setIsLoading(true);
    setError(null);
    setSvgContent(null);
    setIsHtmlError(false);

    let globalHashToUse = hash;

    // 1. Check Backend Cache First
    try {
        if (!globalHashToUse && activeCode) {
            const msgUint8 = new TextEncoder().encode(activeCode);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            globalHashToUse = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        if (globalHashToUse) {
            console.log("Fetching for hash:", globalHashToUse);
            const cachedSvg = await apiService.fetchCachedImage(globalHashToUse);
            console.log("fetchCachedImage result length:", cachedSvg ? cachedSvg.length : "null/falsy");
            if (requestId !== requestRef.current) return;
            if (cachedSvg) {
                setSvgContent(cachedSvg);
                setIsLoading(false);
                return;
            }
        }
    } catch (e) {
        console.warn("Backend cache check failed:", e);
    }

    if (requestId !== requestRef.current) return;

    if (!activeCode) {
        setError("Original TikZ code missing and not in cache.");
        setIsLoading(false);
        return;
    }

    const isCustomServer = !serverUrl.includes('kroki.io');
    const payload = preparePayload(activeCode, isCustomServer);
    setLastPayload(payload);

    // 2. Check Local Memory Cache
    const cacheKey = `${serverUrl}:${payload}`;
    if (svgCache.has(cacheKey)) {
        setSvgContent(svgCache.get(cacheKey)!);
        setIsLoading(false);
        return;
    }

    const attemptFetch = async (retriesLeft: number) => {
        if (requestId !== requestRef.current) return;

        try {
            // If it's a Hugging Face space, try to wake it up first if we're on the first few retries
            if (serverUrl.includes('hf.space') && retriesLeft >= MAX_RETRIES - 1) {
                const baseUrl = serverUrl.replace(/\/render\/?$/, '');
                fetch(baseUrl, { mode: 'no-cors' }).catch(() => {});
            }

            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: payload,
            });

            if (!response.ok) {
                const text = await response.text();
                
                // Handling waking up (HF Spaces specific)
                const isWakingUp = response.status === 503 || response.status === 504 || response.status === 404;
                if (isWakingUp && retriesLeft > 0) {
                     const currentAttempt = MAX_RETRIES - retriesLeft + 1;
                     setError(`Server is waking up... Please wait (${currentAttempt}/${MAX_RETRIES})`);
                     // Increase delay for later retries as HF takes time to boot
                     const delay = currentAttempt > 3 ? 8000 : 5000;
                     setTimeout(() => attemptFetch(retriesLeft - 1), delay);
                     return;
                }

                // Detect Hugging Face specific error page
                if (text.includes("Your space is in error") || text.includes("Space is in error")) {
                    throw new Error("HUGGINGFACE_SPACE_ERROR");
                }

                // Check for JSON error details
                try {
                    const jsonErr = JSON.parse(text);
                    if (jsonErr.details) {
                        throw new Error(jsonErr.details);
                    }
                    throw new Error(jsonErr.error || 'Server Error');
                } catch (e: unknown) {
                    const err = e as Error;
                    if (err.message && err.message !== 'Unexpected token' && !err.message.includes('JSON')) {
                        throw err;
                    }
                    setIsHtmlError(true);
                    throw new Error(text || `HTTP Error ${response.status}`);
                }
            }

            let svg = await response.text();
            
            // Optimization: Remove fixed width/height from SVG to allow responsive scaling
            svg = svg.replace(/width="[\d\.]+(pt|px|cm|in)"/i, 'width="100%"');
            svg = svg.replace(/height="[\d\.]+(pt|px|cm|in)"/i, 'height="auto"');

            if (requestId === requestRef.current) {
                // Store in cache
                svgCache.set(cacheKey, svg);
                
                // ALSO SAVE TO DB CACHE SO IT IS GLOBAL!
                if (globalHashToUse) {
                    apiService.saveCachedImage(globalHashToUse, svg).catch(e => console.warn("Failed to globally cache SVG:", e));
                }
                
                setSvgContent(svg);
                setError(null);
                setIsLoading(false);
            }

        } catch (err: unknown) {
             const e = err as Error;
             if (requestId === requestRef.current) {
                 if (retriesLeft > 0 && (e.message === 'Failed to fetch' || e.message.includes('NetworkError'))) {
                      setError(`Connecting... (${MAX_RETRIES - retriesLeft + 1}/${MAX_RETRIES})`);
                      setTimeout(() => attemptFetch(retriesLeft - 1), 3000);
                      return;
                 }
                 console.error(e);
                 
                 let msg = e.message || "Failed to render.";
                 
                 if (msg.includes("! Undefined control sequence")) {
                     msg = `LaTeX Error: Undefined command.\n(Possibly missing: \\usepackage{tkz-tab}, \\immini, or \\shortans)\n\n${msg}`;
                 }
                 if (msg.includes("! LaTeX Error: File")) {
                     msg = `LaTeX Error: Missing package or file.\n\n${msg}`;
                 }
                 if (msg.includes("unavailable in encoding T1")) {
                     msg = `LaTeX Error: Unicode characters (ư, ơ) failing. T5 encoding not active.\n\n${msg}`;
                 }

                 setError(msg);
                 setSvgContent(null);
                 setIsLoading(false);
             }
        }
    };

    attemptFetch(MAX_RETRIES);
  }, [code, serverUrl, preparePayload]);

  // Debounce render
  useEffect(() => {
    const currentId = ++requestRef.current;
    
    // If we only have a hash, no need to debounce, fetch immediately
    if (hash && !code) {
      fetchSvg(currentId);
      return;
    }

    const timer = setTimeout(() => {
      if (currentId === requestRef.current) {
        fetchSvg(currentId);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [code, hash, serverUrl, containerWidth, fetchSvg, originalCode]); // Re-render if width changes significantly

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tikz-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    if (!code) return;
    if (serverUrl.includes('kroki.io')) {
        alert("PDF download is not supported on Kroki server.");
        return;
    }

    setIsPdfLoading(true);
    try {
        // Construct PDF endpoint. 
        const pdfUrl = serverUrl.replace(/\/render\/?$/, '/pdf');
        const payload = preparePayload(code, true);

        const response = await fetch(pdfUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: payload,
        });

        if (!response.ok) {
            const text = await response.text();
            let errorMessage = "Failed to generate PDF";
            try {
                const jsonErr = JSON.parse(text);
                errorMessage = jsonErr.details || jsonErr.error || errorMessage;
            } catch {}
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tikz-diagram-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err: unknown) {
        const e = err as Error;
        alert(`PDF Generation Error:\n${e.message}`);
    } finally {
        setIsPdfLoading(false);
    }
  };

  const testConnection = async () => {
      setIsLoading(true);
      try {
          const res = await fetch(serverUrl, { method: 'GET' });
          if (res.ok) {
              const data = await res.json().catch(() => ({}));
              alert(`Connection Successful!\nStatus: ${res.status}\nMessage: ${data.message || 'Server OK'}`);
          } else {
              alert(`Connection Failed!\nStatus: ${res.status}\nCheck if Space is PUBLIC.`);
          }
      } catch (e: unknown) {
          const err = e as Error;
          alert(`Connection Error: ${err.message}\nMake sure your server is running and accessible.`);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg overflow-hidden ${hideToolbar ? '' : 'shadow-xl'} relative`}>
      {!hideToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</span>
              {error && <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded animate-pulse">{isLoading ? 'Connecting...' : 'Error'}</span>}
              <div className="flex items-center gap-1 ml-2">
                  <span className={`w-2 h-2 rounded-full ${serverUrl.includes('hf.space') ? 'bg-green-500' : serverUrl.includes('localhost') ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-[10px] text-gray-500">{serverUrl.includes('hf.space') ? 'HF Cloud' : serverUrl.includes('localhost') ? 'Local' : 'Kroki'}</span>
              </div>
          </div>
          <div className="flex gap-2 items-center">
              <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${showSettings ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  title="Configure Renderer Server"
              >
                  <Settings size={14} /> Settings
              </button>

             {isLoading && <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1"><Loader2 size={14} className="animate-spin" /></span>}
             
             {!isLoading && !error && (
               <>
                  {/* SVG Download */}
                  <button 
                    onClick={handleDownloadSvg}
                    disabled={!svgContent}
                    className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${!svgContent ? 'text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    title="Download SVG"
                  >
                    <Download size={14} /> SVG
                  </button>

                  {/* PDF Download */}
                  {!serverUrl.includes('kroki.io') && (
                      <button 
                        onClick={handleDownloadPdf}
                        disabled={isPdfLoading}
                        className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${isPdfLoading ? 'bg-indigo-100 text-indigo-400 cursor-wait' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                        title="Download PDF"
                      >
                        {isPdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
                      </button>
                  )}
               </>
             )}
          </div>
        </div>
      )}

      {!hideToolbar && showSettings && (
          <div className="bg-gray-50 border-b border-gray-200 p-3 text-sm animate-fade-in z-20 absolute w-full shadow-lg">
              <label className="block text-gray-700 font-medium mb-1 text-xs">Renderer Server URL:</label>
              <div className="flex gap-2 mb-2">
                  <input 
                      type="text" 
                      value={serverUrl} 
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="https://your-space.hf.space/render"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs font-mono text-gray-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <button onClick={testConnection} className="bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700 text-xs whitespace-nowrap">
                      Test Connection
                  </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setServerUrl(HF_SERVER)} className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-gray-50">Reset to Default HF</button>
                  <button onClick={() => setServerUrl(LOCAL_SERVER)} className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-gray-50">Localhost</button>
                  <button onClick={() => setServerUrl(KROKI_SERVER)} className="text-[10px] px-2 py-1 bg-white border rounded hover:bg-gray-50">Kroki (No custom pkgs)</button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic">
                  Note: If using Localhost, ensure <code>server.py</code> is running. If using HF, ensure the Space is Public.
              </p>
          </div>
      )}
      
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto p-1 flex flex-col items-stretch bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
      >
        
        {isLoading && !svgContent && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                {/* Spinner is in header, this is just a dimmer */}
            </div>
        )}

        {error ? (
          <div className="max-w-2xl mx-auto w-full bg-red-50 border border-red-200 rounded p-4 text-red-900 text-sm font-mono overflow-auto max-h-96 shadow-lg z-10">
            <div className="flex items-center justify-between mb-2 font-bold border-b border-red-200 pb-2">
                <div className="flex items-center gap-2">
                    <Bug size={16} /> 
                    {error === "HUGGINGFACE_SPACE_ERROR" ? "Server Offline" : "Compilation / Server Error"}
                </div>
                <div className="flex gap-2">
                    {serverUrl.includes('hf.space') && (
                        <button 
                            onClick={() => window.open(serverUrl.replace(/\/render\/?$/, ''), '_blank')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-[10px] hover:bg-green-700 transition-colors flex items-center gap-1"
                            title="Open server in new tab to wake it up"
                        >
                            <RefreshCw size={12} /> Wake up Server
                        </button>
                    )}
                    {(error === "HUGGINGFACE_SPACE_ERROR" || error.includes("Failed to fetch")) && (
                        <button 
                            onClick={() => setServerUrl(KROKI_SERVER)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-[10px] hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                            <RefreshCw size={12} /> Switch to Kroki
                        </button>
                    )}
                </div>
            </div>
            
            <div className="bg-white border border-red-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono text-red-700">
                {error === "HUGGINGFACE_SPACE_ERROR" ? (
                    <div className="space-y-2">
                        <p className="font-bold text-red-800">The Hugging Face Space is currently in an error state or sleeping.</p>
                        <p>This is an external service issue (hf.co). You have three options:</p>
                        <ul className="list-disc ml-5 space-y-1">
                            <li><strong>Wake up Server:</strong> Click the green button above to open the server page in a new tab. This usually forces it to start.</li>
                            <li><strong>Switch to Kroki:</strong> Click the red button above. Note: Kroki doesn&apos;t support custom Vietnamese packages like <code>ex_test</code>, <code>tkz-tab</code>, or <code>tkz-euclide</code>.</li>
                            <li><strong>Run Locally:</strong> If you have LaTeX installed, you can run <code>python server.py</code> and set the URL to <code>http://localhost:5000/render</code> in Settings.</li>
                        </ul>
                    </div>
                ) : error.includes("Failed to fetch") ? (
                    <div className="space-y-2">
                        <p className="font-bold text-red-800">Failed to connect to the rendering server.</p>
                        <p>Possible reasons:</p>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>The server is sleeping (common for Hugging Face). Click <strong>Wake up Server</strong> above.</li>
                            <li>Your internet connection is unstable.</li>
                            <li>The Server URL in Settings is incorrect.</li>
                        </ul>
                    </div>
                ) : error.includes("Undefined control sequence") && serverUrl.includes("kroki.io") && (code.includes("tkz-tab") || code.includes("tkz-euclide") || code.includes("\\tkzTab") || code.includes("\\tkzEuclide")) ? (
                    <div className="space-y-2">
                        <p className="font-bold text-red-800">Kroki Server Error: Package not supported.</p>
                        <p>You are using <code>tkz-tab</code> or <code>tkz-euclide</code>, which are not supported by the Kroki renderer.</p>
                        <p><strong>Solution:</strong> Switch back to the <strong>HF Cloud</strong> server in Settings and ensure it is &quot;Awake&quot;.</p>
                    </div>
                ) : isHtmlError ? (
                    <div>{error}</div>
                ) : (
                    error
                )}
            </div>
            
            <div className="mt-3 text-[10px] text-gray-500 flex justify-between items-center">
               <span>
                 {error === "HUGGINGFACE_SPACE_ERROR" 
                   ? "You can check the status at: https://huggingface.co/spaces/leanhdung1983/tikz-renderer"
                   : "If this is a &apos;LaTeX Error&apos;, check the syntax in the editor code. If &apos;Failed to fetch&apos;, check your Server URL in settings."}
               </span>
               {lastPayload && (
                 <button 
                   onClick={() => setShowDebug(!showDebug)}
                   className="text-blue-600 hover:underline flex items-center gap-1"
                 >
                   {showDebug ? <><EyeOff size={12}/> Hide Source</> : <><Eye size={12}/> Show Source</>}
                 </button>
               )}
            </div>

            {showDebug && lastPayload && (
              <div className="mt-4 p-3 bg-slate-900 text-slate-300 rounded text-[10px] overflow-auto max-h-60 font-mono">
                <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-1">
                  <span className="text-slate-500 uppercase tracking-wider">Generated LaTeX Source</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(lastPayload);
                      alert("Copied to clipboard!");
                    }}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <pre className="whitespace-pre">{lastPayload}</pre>
              </div>
            )}
          </div>
        ) : svgContent ? (
          <div 
            dangerouslySetInnerHTML={{ __html: cleanClientSvg(svgContent) }} 
            className="w-full transition-all duration-500"
          />
        ) : (
           !isLoading && <div className="text-gray-400 text-sm">Waiting for code...</div>
        )}
      </div>
    </div>
  );
};
