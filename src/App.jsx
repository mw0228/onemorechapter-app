import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — change PROXY_URL to your deployed server URL
// e.g. "https://onemorechapter-proxy.up.railway.app"
// For local testing use "http://localhost:3001"
// ─────────────────────────────────────────────────────────────────────────────
const PROXY_URL = "onemorechapter-production.up.railway.app";

async function api(path) {
  try {
    const r = await fetch(`${PROXY_URL}${path}`);
    return await r.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Themes ────────────────────────────────────────────────────────────────────
const T = {
  ink: {
    id:"ink", icon:"🖋",
    bg:"#0d0a06", hdr:"rgba(13,10,6,0.97)", card:"rgba(28,20,12,0.9)",
    cardH:"rgba(42,30,16,0.99)", panel:"rgba(22,15,8,0.95)", input:"rgba(8,6,3,0.9)",
    feed:"rgba(22,16,10,0.9)", border:"rgba(201,168,76,0.18)", borderH:"rgba(201,168,76,0.55)",
    acc:"#c9a84c", accDim:"rgba(201,168,76,0.15)", accBorder:"rgba(201,168,76,0.4)",
    p:"#f0e6d0", s:"#9a8a78", m:"#6a5a4a", dim:"#4a3a2a",
    ok:"#7ab87a", ong:"#c9a84c", sh:"rgba(0,0,0,0.5)",
    reader:"#100c06", readerTxt:"#e8dcc8", nav:"rgba(10,7,3,0.98)",
    grad:"radial-gradient(ellipse at 20% 10%,rgba(40,28,12,0.7) 0%,transparent 55%)",
  },
  claude: {
    id:"claude", icon:"🌑",
    bg:"#1e1e1e", hdr:"#262626", card:"#2b2b2b",
    cardH:"#333333", panel:"#242424", input:"#1a1a1a",
    feed:"#2b2b2b", border:"#3a3a3a", borderH:"#686868",
    acc:"#d4a96a", accDim:"rgba(212,169,106,0.13)", accBorder:"#a08060",
    p:"#ececec", s:"#9a9a9a", m:"#787878", dim:"#555",
    ok:"#6ab87a", ong:"#d4a96a", sh:"rgba(0,0,0,0.5)",
    reader:"#1a1a1a", readerTxt:"#e0d8d0", nav:"#222",
    grad:"none",
  },
  light: {
    id:"light", icon:"☀",
    bg:"#f5f0e8", hdr:"rgba(245,240,232,0.97)", card:"#ffffff",
    cardH:"#fffdf8", panel:"#ffffff", input:"#ede8e0",
    feed:"#ffffff", border:"#ddd5c8", borderH:"rgba(180,140,60,0.5)",
    acc:"#8a6020", accDim:"rgba(138,96,32,0.1)", accBorder:"#b48c3c",
    p:"#1a1008", s:"#5a4a3a", m:"#8a7a6a", dim:"#baa89a",
    ok:"#3a8a4a", ong:"#8a6020", sh:"rgba(0,0,0,0.08)",
    reader:"#faf6ef", readerTxt:"#1a1008", nav:"rgba(245,240,232,0.98)",
    grad:"radial-gradient(ellipse at 10% 10%,rgba(255,240,210,0.5) 0%,transparent 50%)",
  },
};

// ── useIsMobile ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : true);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ t }) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:14}}>
    <div style={{
      width:36,height:36,borderRadius:"50%",
      border:`3px solid ${t.border}`,borderTopColor:t.acc,
      animation:"spin 0.8s linear infinite",
    }}/>
    <span style={{color:t.m,fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:2}}>LOADING</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ── Error box ─────────────────────────────────────────────────────────────────
const Err = ({ msg, t, onRetry }) => (
  <div style={{margin:"20px 0",padding:18,background:t.card,border:`1px solid ${t.border}`,borderRadius:8,textAlign:"center"}}>
    <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
    <p style={{color:t.s,fontFamily:"'EB Garamond',serif",fontSize:14,margin:"0 0 12px"}}>{msg || "Failed to load. Check your proxy server is running."}</p>
    {onRetry && <button onClick={onRetry} style={{padding:"7px 20px",background:t.accDim,border:`1px solid ${t.accBorder}`,borderRadius:5,color:t.acc,fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer"}}>Retry</button>}
  </div>
);

// ── Novel Cover Card ──────────────────────────────────────────────────────────
const NCard = ({ novel, t, onClick, rank }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={onClick} style={{cursor:"pointer",position:"relative"}}>
      {rank && (
        <div style={{
          position:"absolute",top:6,left:6,zIndex:2,
          width:22,height:22,borderRadius:"50%",
          background:rank<=3?"#c9a84c":t.card,
          border:`1px solid ${rank<=3?"#c9a84c":t.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,
          color:rank<=3?"#1a1008":t.s,
        }}>{rank}</div>
      )}
      <div style={{
        background:t.card,borderRadius:8,overflow:"hidden",
        border:`1px solid ${t.border}`,
        boxShadow:`0 2px 10px ${t.sh}`,
        transition:"transform 0.18s,box-shadow 0.18s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 8px 20px ${t.sh}`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 2px 10px ${t.sh}`;}}
      >
        <div style={{aspectRatio:"2/3",background:t.dim,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {novel.cover && !imgErr
            ? <img src={novel.cover} alt={novel.title} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:32,opacity:0.3}}>📖</span>
          }
        </div>
        <div style={{padding:"8px 9px"}}>
          <p style={{margin:0,fontSize:12,fontFamily:"'Playfair Display',serif",color:t.p,lineHeight:1.3,fontWeight:700,
            overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
            {novel.title}
          </p>
          {novel.latestChapter && (
            <p style={{margin:"4px 0 0",fontSize:10,color:t.m,fontFamily:"'EB Garamond',serif",
              overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
              {novel.latestChapter}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = ({ label, t }) => (
  <div style={{display:"flex",alignItems:"center",gap:10,margin:"0 0 12px"}}>
    <div style={{height:1,flex:1,background:t.border}}/>
    <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:t.acc,letterSpacing:"3px"}}>{label}</span>
    <div style={{height:1,flex:1,background:t.border}}/>
  </div>
);

// ── SCREEN: Home (Rankings) ───────────────────────────────────────────────────
const HomeScreen = ({ t, m, onNovel }) => {
  const [rankTab, setRankTab] = useState("weekly");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async (type) => {
    setLoading(true); setErr("");
    const res = await api(`/api/rankings/${type}`);
    if (res.ok) setData(d => ({ ...d, [type]: res.novels }));
    else setErr(res.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!data[rankTab]) load(rankTab);
  }, [rankTab, data, load]);

  useEffect(() => {
    api("/api/latest").then(r => { if (r.ok) setLatest(r.novels || []); });
  }, []);

  const RANKS = [
    {id:"daily",   label:"Daily"},
    {id:"weekly",  label:"Weekly"},
    {id:"monthly", label:"Monthly"},
    {id:"popular", label:"All Time"},
  ];

  const current = data[rankTab] || [];

  return (
    <div>
      {/* Latest releases horizontal strip */}
      {latest.length > 0 && (
        <div style={{marginBottom:22}}>
          <SectionHead label="LATEST RELEASES" t={t}/>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch"}}>
            {latest.slice(0,12).map(n=>(
              <div key={n.slug} style={{flexShrink:0,width:m?110:130}} onClick={()=>onNovel(n)}>
                <NCard novel={n} t={t} onClick={()=>onNovel(n)}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings */}
      <SectionHead label="RANKINGS" t={t}/>

      {/* Rank tab pills */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
        {RANKS.map(r=>(
          <button key={r.id} onClick={()=>setRankTab(r.id)} style={{
            padding:"7px 16px",borderRadius:20,border:`1px solid ${rankTab===r.id?t.accBorder:t.border}`,
            background:rankTab===r.id?t.accDim:"transparent",
            color:rankTab===r.id?t.acc:t.s,
            fontFamily:"'Cinzel',serif",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",
            outline:"none",flexShrink:0,letterSpacing:"0.5px",
            transition:"all 0.18s",
          }}>{r.label}</button>
        ))}
      </div>

      {loading && <Spin t={t}/>}
      {!loading && err && <Err msg={err} t={t} onRetry={()=>load(rankTab)}/>}

      {!loading && !err && current.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr 1fr":"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
          {current.map(n=>(
            <NCard key={n.slug} novel={n} t={t} rank={n.rank} onClick={()=>onNovel(n)}/>
          ))}
        </div>
      )}

      {!loading && !err && current.length === 0 && data[rankTab] !== undefined && (
        <Err msg="No novels loaded. Make sure your proxy server is running." t={t} onRetry={()=>{ setData(d=>({...d,[rankTab]:undefined})); load(rankTab); }}/>
      )}
    </div>
  );
};

// ── SCREEN: Search ────────────────────────────────────────────────────────────
const SearchScreen = ({ t, m, onNovel }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef(null);

  const search = useCallback(async (query) => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    const res = await api(`/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) setResults(res.novels || []);
    setLoading(false);
  }, []);

  const onChange = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 600);
  };

  return (
    <div>
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,color:t.m}}>🔍</span>
        <input
          value={q} onChange={e=>onChange(e.target.value)}
          placeholder="Search novels, authors…"
          style={{
            width:"100%",padding:"12px 12px 12px 38px",background:t.input,
            border:`1px solid ${t.border}`,borderRadius:10,
            color:t.p,fontFamily:"'EB Garamond',serif",fontSize:15,outline:"none",
          }}
          autoFocus
        />
        {q && <span onClick={()=>{setQ("");setResults([]);setSearched(false);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",color:t.m,fontSize:18}}>✕</span>}
      </div>

      {loading && <Spin t={t}/>}

      {!loading && searched && results.length === 0 && (
        <div style={{textAlign:"center",padding:40,color:t.m,fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15}}>
          No results for "{q}"
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr 1fr":"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
          {results.map(n=><NCard key={n.slug} novel={n} t={t} onClick={()=>onNovel(n)}/>)}
        </div>
      )}

      {!searched && (
        <div style={{textAlign:"center",paddingTop:60,color:t.dim,fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:16}}>
          Find your next story…
        </div>
      )}
    </div>
  );
};

// ── SCREEN: Novel Detail ──────────────────────────────────────────────────────
const NovelScreen = ({ t, m, slug, onChapter, onBack }) => {
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true); setNovel(null); setChapters([]); setErr("");
    api(`/api/novel/${slug}`).then(res => {
      if (res.ok) { setNovel(res.novel); setChapters(res.novel.chapters || []); }
      else setErr(res.error || "Failed to load novel.");
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <Spin t={t}/>;
  if (err) return <Err msg={err} t={t} onRetry={()=>{setLoading(true);setErr("");api(`/api/novel/${slug}`).then(r=>{if(r.ok){setNovel(r.novel);setChapters(r.novel.chapters||[]);}else setErr(r.error);setLoading(false);})}}/>;
  if (!novel) return null;

  const desc = novel.description || "";
  const shortDesc = desc.length > 250 ? desc.slice(0, 250) + "…" : desc;

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{background:"none",border:"none",color:t.acc,cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:1,padding:"0 0 14px",outline:"none"}}>
        ← BACK
      </button>

      {/* Hero */}
      <div style={{display:"flex",gap:16,marginBottom:20}}>
        <div style={{flexShrink:0,width:m?110:140,borderRadius:8,overflow:"hidden",border:`1px solid ${t.border}`,background:t.dim,aspectRatio:"2/3",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {novel.cover
            ? <img src={novel.cover} alt={novel.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:40,opacity:0.3}}>📖</span>
          }
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h2 style={{margin:"0 0 6px",fontFamily:"'Playfair Display',serif",color:t.p,fontSize:m?16:20,lineHeight:1.3,fontWeight:700}}>
            {novel.title}
          </h2>
          {novel.author && <p style={{margin:"0 0 8px",fontSize:13,color:t.s,fontFamily:"'EB Garamond',serif"}}>by {novel.author}</p>}
          <span style={{
            display:"inline-block",fontSize:10,padding:"3px 9px",borderRadius:10,
            background:novel.status?.toLowerCase().includes("complet")?`${t.ok}22`:`${t.ong}22`,
            border:`1px solid ${novel.status?.toLowerCase().includes("complet")?t.ok:t.ong}`,
            color:novel.status?.toLowerCase().includes("complet")?t.ok:t.ong,
            fontFamily:"'Cinzel',serif",letterSpacing:"0.5px",marginBottom:8,
          }}>{novel.status || "Unknown"}</span>
          {novel.genres?.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {novel.genres.slice(0,5).map(g=>(
                <span key={g} style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:t.accDim,border:`1px solid ${t.accBorder}`,color:t.acc,fontFamily:"'Cinzel',serif"}}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div style={{marginBottom:20,padding:14,background:t.card,border:`1px solid ${t.border}`,borderRadius:8}}>
          <p style={{margin:0,fontFamily:"'EB Garamond',serif",fontSize:14,color:t.s,lineHeight:1.7}}>
            {expanded ? desc : shortDesc}
          </p>
          {desc.length > 250 && (
            <button onClick={()=>setExpanded(!expanded)} style={{background:"none",border:"none",color:t.acc,cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:11,marginTop:6,padding:0,outline:"none"}}>
              {expanded?"Show less ▲":"Read more ▼"}
            </button>
          )}
        </div>
      )}

      {/* Chapter list */}
      <SectionHead label={`CHAPTERS (${chapters.length})`} t={t}/>
      {chapters.length === 0 && (
        <p style={{textAlign:"center",color:t.m,fontFamily:"'EB Garamond',serif",fontStyle:"italic",padding:20}}>No chapters found.</p>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:1,background:t.card,border:`1px solid ${t.border}`,borderRadius:8,overflow:"hidden"}}>
        {chapters.map((ch,i)=>(
          <div key={ch.slug||i} onClick={()=>onChapter(slug,ch.slug,ch.name,chapters,i)}
            style={{
              padding:"11px 14px",cursor:"pointer",
              borderBottom:`1px solid ${t.border}`,
              transition:"background 0.15s",
              display:"flex",alignItems:"center",gap:10,
            }}
            onMouseEnter={e=>e.currentTarget.style.background=t.accDim}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <span style={{fontSize:10,color:t.m,fontFamily:"'Cinzel',serif",minWidth:28}}>{i+1}</span>
            <span style={{flex:1,fontSize:13,color:t.p,fontFamily:"'EB Garamond',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {ch.name}
            </span>
            <span style={{color:t.acc,fontSize:14,flexShrink:0}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── SCREEN: Reader ────────────────────────────────────────────────────────────
const ReaderScreen = ({ t, novelSlug, chapterSlug, chapterName, allChapters, chapterIndex, onBack, onChapter }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [fontSize, setFontSize] = useState(17);
  const [showControls, setShowControls] = useState(true);
  const topRef = useRef(null);

  const loadChapter = useCallback((nSlug, cSlug) => {
    setLoading(true); setData(null); setErr("");
    api(`/api/chapter/${nSlug}/${cSlug}`).then(res => {
      if (res.ok) setData(res);
      else setErr(res.error || "Failed to load chapter.");
      setLoading(false);
      topRef.current?.scrollIntoView({ behavior:"smooth" });
    });
  }, []);

  useEffect(() => { loadChapter(novelSlug, chapterSlug); }, [novelSlug, chapterSlug, loadChapter]);

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < (allChapters?.length || 0) - 1;

  const goAdj = (dir) => {
    const idx = chapterIndex + dir;
    const ch = allChapters?.[idx];
    if (ch) onChapter(novelSlug, ch.slug, ch.name, allChapters, idx);
  };

  const paragraphs = (data?.content || "").split(/\n\n+/).filter(p => p.trim().length > 0);

  return (
    <div style={{background:t.reader,minHeight:"100vh"}}>
      <div ref={topRef}/>

      {/* Top bar */}
      {showControls && (
        <div style={{
          position:"sticky",top:0,zIndex:100,
          background:t.nav,backdropFilter:"blur(12px)",
          borderBottom:`1px solid ${t.border}`,
          padding:"10px 16px",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <button onClick={onBack} style={{background:"none",border:"none",color:t.acc,cursor:"pointer",fontSize:20,padding:0,outline:"none",flexShrink:0}}>←</button>
          <span style={{flex:1,fontSize:12,color:t.s,fontFamily:"'Cinzel',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {data?.title || chapterName || "Loading…"}
          </span>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <button onClick={()=>setFontSize(f=>Math.max(12,f-1))} style={{background:t.accDim,border:`1px solid ${t.accBorder}`,borderRadius:4,color:t.acc,cursor:"pointer",padding:"3px 8px",fontSize:13,outline:"none"}}>A-</button>
            <button onClick={()=>setFontSize(f=>Math.min(26,f+1))} style={{background:t.accDim,border:`1px solid ${t.accBorder}`,borderRadius:4,color:t.acc,cursor:"pointer",padding:"3px 8px",fontSize:13,outline:"none"}}>A+</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div onClick={()=>setShowControls(c=>!c)} style={{padding:"20px 20px 100px",maxWidth:700,margin:"0 auto"}}>
        {loading && <Spin t={t}/>}
        {!loading && err && <Err msg={err} t={t} onRetry={()=>loadChapter(novelSlug,chapterSlug)}/>}
        {!loading && !err && paragraphs.map((p, i) => (
          <p key={i} style={{
            fontFamily:"'EB Garamond',serif", fontSize:fontSize,
            color:t.readerTxt, lineHeight:1.85, margin:"0 0 1.2em",
            textAlign:"justify",
          }}>{p}</p>
        ))}
      </div>

      {/* Bottom nav */}
      {showControls && (
        <div style={{
          position:"fixed",bottom:0,left:0,right:0,zIndex:100,
          background:t.nav,backdropFilter:"blur(12px)",
          borderTop:`1px solid ${t.border}`,
          padding:"10px 16px env(safe-area-inset-bottom)",
          display:"flex",gap:10,
        }}>
          <button
            onClick={()=>goAdj(-1)} disabled={!hasPrev}
            style={{
              flex:1,padding:"10px",borderRadius:8,cursor:hasPrev?"pointer":"not-allowed",
              background:hasPrev?t.accDim:"transparent",
              border:`1px solid ${hasPrev?t.accBorder:t.border}`,
              color:hasPrev?t.acc:t.m,
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1,outline:"none",
              transition:"all 0.15s",
            }}
          >← PREV</button>
          <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
            <span style={{fontSize:11,color:t.m,fontFamily:"'Cinzel',serif"}}>
              {chapterIndex+1}/{allChapters?.length||"?"}
            </span>
          </div>
          <button
            onClick={()=>goAdj(1)} disabled={!hasNext}
            style={{
              flex:1,padding:"10px",borderRadius:8,cursor:hasNext?"pointer":"not-allowed",
              background:hasNext?t.accDim:"transparent",
              border:`1px solid ${hasNext?t.accBorder:t.border}`,
              color:hasNext?t.acc:t.m,
              fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1,outline:"none",
              transition:"all 0.15s",
            }}
          >NEXT →</button>
        </div>
      )}
    </div>
  );
};

// ── SCREEN: Library (bookmarks) ───────────────────────────────────────────────
const LibraryScreen = ({ t, m, onNovel }) => {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("omc_library");
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  if (saved.length === 0) {
    return (
      <div style={{textAlign:"center",paddingTop:60}}>
        <div style={{fontSize:48,marginBottom:16,opacity:0.3}}>📚</div>
        <p style={{color:t.m,fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15}}>Your library is empty.</p>
        <p style={{color:t.dim,fontFamily:"'EB Garamond',serif",fontSize:13}}>Tap the bookmark icon on any novel to save it here.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHead label="MY LIBRARY" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr 1fr":"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
        {saved.map(n=><NCard key={n.slug} novel={n} t={t} onClick={()=>onNovel(n)}/>)}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("omc_theme") || "ink");
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("tabs"); // "tabs" | "novel" | "reader"
  const [novelSlug, setNovelSlug] = useState(null);
  const [reader, setReader] = useState(null); // {novelSlug,chapterSlug,chapterName,allChapters,chapterIndex}
  const m = useIsMobile();
  const t = T[themeId] || T.ink;

  useEffect(() => { localStorage.setItem("omc_theme", themeId); }, [themeId]);

  const openNovel = (novel) => { setNovelSlug(novel.slug); setScreen("novel"); };
  const openChapter = (novelSlug, chapterSlug, chapterName, allChapters, chapterIndex) => {
    setReader({ novelSlug, chapterSlug, chapterName, allChapters, chapterIndex });
    setScreen("reader");
  };
  const goBack = () => {
    if (screen === "reader") { setScreen("novel"); }
    else { setScreen("tabs"); setNovelSlug(null); }
  };

  const TABS = [
    { id:"home",    icon:"🏠", label:"Home" },
    { id:"search",  icon:"🔍", label:"Search" },
    { id:"library", icon:"📚", label:"Library" },
  ];

  // ── Full-screen Reader ──
  if (screen === "reader" && reader) {
    return (
      <div style={{fontFamily:"'EB Garamond',serif",color:t.p}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');*{box-sizing:border-box;}a{color:inherit;}input::placeholder{color:${t.m};opacity:1;}button{-webkit-tap-highlight-color:transparent;}`}</style>
        <ReaderScreen
          t={t}
          novelSlug={reader.novelSlug}
          chapterSlug={reader.chapterSlug}
          chapterName={reader.chapterName}
          allChapters={reader.allChapters}
          chapterIndex={reader.chapterIndex}
          onBack={goBack}
          onChapter={openChapter}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", background:t.bg, backgroundImage:t.grad,
      fontFamily:"'EB Garamond',serif", color:t.p,
      paddingBottom: m ? 68 : 60,
      transition:"background 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        *{box-sizing:border-box;} a{color:inherit;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:${t.bg};}
        ::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px;}
        input::placeholder{color:${t.m};opacity:1;}
        select option{background:${t.panel};color:${t.p};}
        button{-webkit-tap-highlight-color:transparent;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background:t.hdr, backdropFilter:"blur(14px)",
        borderBottom:`1px solid ${t.border}`,
        padding:m?"12px 16px":"12px 20px",
        position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        transition:"background 0.3s",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          {(screen==="novel"||screen==="reader") && (
            <button onClick={goBack} style={{background:"none",border:"none",color:t.acc,cursor:"pointer",fontSize:20,padding:"0 8px 0 0",outline:"none"}}>←</button>
          )}
          <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
            <ellipse cx="19" cy="22" rx="11" ry="13" fill={t.id==="claude"?"#444":"#e8dcc8"}/>
            <path d="M19 4C19 4 14 12 14 18C14 22 16.5 26 19 26C21.5 26 24 22 24 18C24 12 19 4 19 4Z" fill={t.acc}/>
            <circle cx="17" cy="20" r="2" fill={t.bg} opacity="0.5"/>
          </svg>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:m?14:16,color:t.acc,letterSpacing:"3px",fontWeight:700,lineHeight:1}}>OneMoreChapter</div>
            {!m&&<div style={{fontSize:8,color:t.dim,letterSpacing:"2px",fontFamily:"'Cinzel',serif"}}>NOVEL READER</div>}
          </div>
        </div>

        {/* Theme picker */}
        <div style={{display:"flex",gap:2,background:t.card,borderRadius:8,padding:"3px",border:`1px solid ${t.border}`}}>
          {Object.values(T).map(th=>(
            <button key={th.id} onClick={()=>setThemeId(th.id)} style={{
              width:30,height:30,borderRadius:6,border:"none",cursor:"pointer",fontSize:15,
              background:t.id===th.id?t.accDim:"transparent",
              boxShadow:t.id===th.id?`0 0 0 1px ${t.accBorder}`:"none",
              outline:"none",transition:"all 0.18s",
            }}>{th.icon}</button>
          ))}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:900,margin:"0 auto",padding:m?"14px 12px":"18px 20px"}}>
        {screen==="novel" && novelSlug && (
          <NovelScreen t={t} m={m} slug={novelSlug} onChapter={openChapter} onBack={goBack}/>
        )}
        {screen==="tabs" && tab==="home"    && <HomeScreen    t={t} m={m} onNovel={openNovel}/>}
        {screen==="tabs" && tab==="search"  && <SearchScreen  t={t} m={m} onNovel={openNovel}/>}
        {screen==="tabs" && tab==="library" && <LibraryScreen t={t} m={m} onNovel={openNovel}/>}
      </div>

      {/* ── BOTTOM TAB BAR ── */}
      {screen==="tabs" && (
        <nav style={{
          position:"fixed",bottom:0,left:0,right:0,zIndex:200,
          background:t.hdr,backdropFilter:"blur(14px)",
          borderTop:`1px solid ${t.border}`,
          display:"flex",
          paddingBottom:"env(safe-area-inset-bottom)",
        }}>
          {TABS.map(tb=>(
            <button key={tb.id} onClick={()=>setTab(tb.id)} style={{
              flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",
              cursor:"pointer",outline:"none",display:"flex",flexDirection:"column",
              alignItems:"center",gap:3,
              color:tab===tb.id?t.acc:t.m,
              borderTop:tab===tb.id?`2px solid ${t.acc}`:"2px solid transparent",
              transition:"color 0.15s",
            }}>
              <span style={{fontSize:18}}>{tb.icon}</span>
              <span style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:"1px"}}>{tb.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
