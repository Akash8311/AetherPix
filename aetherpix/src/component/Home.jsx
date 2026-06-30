import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';

// ─── Theme ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

const THEMES = {
  dark: {
    mode: 'dark',
    pageBg: 'linear-gradient(155deg,#02030a 0%,#050a1f 40%,#070512 70%,#02030a 100%)',
    surface: 'rgba(10,14,38,0.62)',
    surfaceStrong: 'rgba(8,11,30,0.88)',
    border: 'rgba(0,140,255,0.16)',
    borderStrong: 'rgba(0,140,255,0.45)',
    text: '#f2f6ff',
    textDim: 'rgba(190,205,235,0.7)',
    textFaint: 'rgba(140,160,200,0.5)',
    accent: '#1e90ff',
    accent2: '#0b3d91',
    glow: 'rgba(30,144,255,0.28)',
    overlay: 'rgba(2,3,10,0.78)',
    overlayBorder: 'rgba(255,255,255,0.18)',
    scrollTrack: 'rgba(6,8,20,0.6)',
    scrollThumb: 'rgba(150,165,200,0.35)',
  },
  light: {
    mode: 'light',
    pageBg: 'linear-gradient(155deg,#f4f8ff 0%,#e8eefc 40%,#eef1fb 70%,#f6f9ff 100%)',
    surface: 'rgba(255,255,255,0.65)',
    surfaceStrong: 'rgba(255,255,255,0.9)',
    border: 'rgba(10,30,70,0.1)',
    borderStrong: 'rgba(10,40,100,0.28)',
    text: '#040a1a',
    textDim: 'rgba(15,25,55,0.72)',
    textFaint: 'rgba(15,25,55,0.45)',
    accent: '#0b5fd6',
    accent2: '#001a40',
    glow: 'rgba(11,95,214,0.18)',
    overlay: 'rgba(255,255,255,0.85)',
    overlayBorder: 'rgba(10,30,70,0.15)',
    scrollTrack: 'rgba(225,232,250,0.7)',
    scrollThumb: 'rgba(70,90,140,0.32)',
  },
};

// ─── Image search: Google Custom Search JSON API (preferred) ──────────────
async function searchGoogleImages(query, apiKey, cx, count = 12) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&searchType=image&num=${Math.min(count, 10)}&safe=active`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Google search failed (${res.status})`);
  }
  const data = await res.json();
  return (data.items || []).map((r, i) => ({
    id: `g-${i}-${r.link}`,
    url: r.image?.thumbnailLink || r.link,
    fullUrl: r.link,
    title: r.title || query,
    creator: r.displayLink || 'Google',
    source: 'Google',
    license: '',
    link: r.image?.contextLink || r.link,
  }));
}

async function searchOpenverse(query, pageSize = 12) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${pageSize}&mature=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id,
    url: r.thumbnail || r.url,
    fullUrl: r.url,
    title: r.title || query,
    creator: r.creator || 'Unknown',
    source: r.source || r.provider || '',
    license: (r.license || '').toUpperCase(),
    link: r.foreign_landing_url || r.url,
  }));
}

async function searchImages(query, { apiKey, cx, pageSize = 12 } = {}) {
  if (apiKey && cx) {
    try {
      return await searchGoogleImages(query, apiKey, cx, pageSize);
    } catch (e) {
      console.warn('Google Custom Search failed, falling back to Openverse:', e.message);
    }
  }
  return searchOpenverse(query, pageSize);
}

// ─── Download helper ────────────────────────────────────────────────────────
async function downloadImage(img) {
  const src = img.fullUrl || img.url;
  try {
    const res = await fetch(src, { mode: 'cors' });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    a.href = objUrl;
    a.download = `${(img.title || 'aetherpix-image').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch (e) {
    window.open(src, '_blank', 'noopener,noreferrer');
  }
}

// ─── Fully 3D, scroll-animated, letter-by-letter text ──────────────────────
function AnimatedText({ text, style = {}, as: Tag = 'span', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag ref={ref} style={{ display: 'inline-block', perspective: 700, ...style }}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            transformStyle: 'preserve-3d',
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'translateZ(0px) translateY(0px) rotateX(0deg) rotateY(0deg)'
              : 'translateZ(-160px) translateY(28px) rotateX(-95deg) rotateY(35deg)',
            transition: `opacity 0.5s ease ${delay + i * 0.03}s, transform 0.6s cubic-bezier(.2,.7,.3,1.3) ${delay + i * 0.03}s`,
            whiteSpace: char === ' ' ? 'pre' : 'normal',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transition = 'transform 0.25s ease';
            e.currentTarget.style.transform = 'translateZ(14px) rotateX(-12deg) rotateY(10deg) scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transition = 'transform 0.25s ease';
            e.currentTarget.style.transform = 'translateZ(0px) translateY(0px) rotateX(0deg) rotateY(0deg)';
          }}
        >
          {char}
        </span>
      ))}
    </Tag>
  );
}

// ─── Logo that slides in left -> right, then loops a subtle sweep ───────────
function SlidingLogo({ size = 22 }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);
  const theme = useTheme();
  return (
    <span style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
      <span style={{
        display: 'inline-block',
        fontSize: size, fontWeight: 900, letterSpacing: -0.5,
        background: `linear-gradient(90deg,${theme.accent},#7fc2ff,${theme.accent})`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        transform: entered ? 'translateX(0)' : 'translateX(-140%)',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.9s cubic-bezier(.16,.84,.44,1), opacity 0.6s ease',
        animation: entered ? 'logoSweep 5s linear infinite 1s' : 'none',
      }}>AetherPix</span>
      <style>{`
        @keyframes logoSweep {
          0% { background-position: 0% 0; }
          50% { background-position: 100% 0; }
          100% { background-position: 0% 0; }
        }
      `}</style>
    </span>
  );
}

// ─── 3D Rotating Cube Canvas (existing geometric layer) ────────────────────
function ThreeCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    const onMouse = (e) => { mouseRef.current = { x: (e.clientX / W - 0.5) * 2, y: (e.clientY / H - 0.5) * 2 }; };
    window.addEventListener('mousemove', onMouse);

    const project = (x, y, z, fov, cx, cy) => { const scale = fov / (fov + z); return { x: x * scale + cx, y: y * scale + cy, scale }; };
    const makeCube = (cx, cy, cz, size) => {
      const h = size / 2;
      const verts = [[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]].map(([x,y,z]) => [x+cx,y+cy,z+cz]);
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      return { verts, edges, rx:0, ry:0, rz:0, cx, cy, cz, size };
    };
    const rotateX = ([x,y,z],a) => [x, y*Math.cos(a)-z*Math.sin(a), y*Math.sin(a)+z*Math.cos(a)];
    const rotateY = ([x,y,z],a) => [x*Math.cos(a)+z*Math.sin(a), y, -x*Math.sin(a)+z*Math.cos(a)];
    const rotateZ = ([x,y,z],a) => [x*Math.cos(a)-y*Math.sin(a), x*Math.sin(a)+y*Math.cos(a), z];

    const cubes = Array.from({ length: 14 }, () => ({
      ...makeCube((Math.random()-.5)*560, (Math.random()-.5)*280, (Math.random()-.5)*280-100, 30+Math.random()*50),
      rx: Math.random()*Math.PI*2, ry: Math.random()*Math.PI*2, rz: Math.random()*Math.PI*2,
      drx: (Math.random()-.5)*.008, dry: (Math.random()-.5)*.01, drz: (Math.random()-.5)*.005,
      hue: 205, alpha: .12+Math.random()*.2,
    }));
    const particles = Array.from({ length: 90 }, () => ({
      x: (Math.random()-.5)*1400, y: (Math.random()-.5)*900, z: (Math.random()-.5)*600-200,
      r: Math.random()*1.8+.4, vx: (Math.random()-.5)*.2, vy: (Math.random()-.5)*.2, vz: (Math.random()-.5)*.15,
      hue: 205, twinkle: Math.random()*Math.PI*2,
    }));

    const draw = (t) => {
      ctx.clearRect(0,0,W,H);
      const cx=W/2, cy=H/2, FOV=600;
      const mx=mouseRef.current.x, my=mouseRef.current.y;
      const gTX=my*.18, gTY=mx*.22;
      const isLight = theme.mode === 'light';

      cubes.forEach((cube) => {
        cube.rx+=cube.drx+my*.0002; cube.ry+=cube.dry+mx*.0003; cube.rz+=cube.drz;
        const pv = cube.verts.map(([vx,vy,vz]) => {
          let v=[vx-cube.cx,vy-cube.cy,vz-cube.cz];
          v=rotateX(v,cube.rx); v=rotateY(v,cube.ry); v=rotateZ(v,cube.rz);
          v=rotateX(v,gTX); v=rotateY(v,gTY);
          return [v[0]+cube.cx,v[1]+cube.cy,v[2]+cube.cz];
        });
        cube.edges.forEach(([a,b]) => {
          const pa=project(pv[a][0],pv[a][1],pv[a][2],FOV,cx,cy);
          const pb=project(pv[b][0],pv[b][1],pv[b][2],FOV,cx,cy);
          if(pa.scale<0||pb.scale<0) return;
          const avg=(pa.scale+pb.scale)/2;
          ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y);
          ctx.strokeStyle=`hsla(${cube.hue},100%,${isLight?38:70}%,${cube.alpha*avg*(isLight?0.5:0.8)})`; ctx.lineWidth=1.2*avg; ctx.stroke();
        });
      });
      particles.forEach((p) => {
        p.x+=p.vx; p.y+=p.vy; p.z+=p.vz;
        if(Math.abs(p.x)>800) p.vx*=-1;
        if(Math.abs(p.y)>500) p.vy*=-1;
        if(Math.abs(p.z)>400) p.vz*=-1;
        let v=[p.x,p.y,p.z]; v=rotateX(v,gTX); v=rotateY(v,gTY);
        const pp=project(v[0],v[1],v[2],FOV,cx,cy);
        if(pp.scale<=0) return;
        const tw = 0.6 + 0.4*Math.sin(t*0.0015 + p.twinkle);
        ctx.beginPath(); ctx.arc(pp.x,pp.y,p.r*pp.scale,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},100%,${isLight?40:72}%,${(isLight?0.22:0.35)*pp.scale*tw})`; ctx.fill();
      });
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); window.removeEventListener('mousemove',onMouse); };
  }, [theme.mode]);

  return <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none' }} />;
}

// ─── NEW: Aurora / nebula ambient backdrop ──────────────────────────────────
// Soft drifting color-field blobs behind the cube/particle canvas, giving the
// page a living "nebula" depth instead of a flat gradient. Pure CSS, GPU-cheap.
function AuroraField() {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const blobs = isDark
    ? [
        { c: 'rgba(30,144,255,0.30)', w: 620, h: 620, top: '-10%', left: '8%', dur: 26 },
        { c: 'rgba(120,80,255,0.20)', w: 520, h: 520, top: '55%', left: '70%', dur: 32 },
        { c: 'rgba(0,220,255,0.16)', w: 460, h: 460, top: '70%', left: '12%', dur: 22 },
      ]
    : [
        { c: 'rgba(11,95,214,0.16)', w: 620, h: 620, top: '-10%', left: '8%', dur: 26 },
        { c: 'rgba(140,110,255,0.12)', w: 520, h: 520, top: '55%', left: '70%', dur: 32 },
        { c: 'rgba(0,170,210,0.10)', w: 460, h: 460, top: '70%', left: '12%', dur: 22 },
      ];
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position:'absolute', top:b.top, left:b.left,
          width:b.w, height:b.h, borderRadius:'50%',
          background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,
          filter:'blur(10px)',
          animation:`auroraDrift${i} ${b.dur}s ease-in-out infinite`,
          willChange:'transform',
        }} />
      ))}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: isDark
          ? 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)'
          : 'radial-gradient(rgba(10,30,70,0.05) 1px, transparent 1px)',
        backgroundSize:'34px 34px',
        opacity:0.5,
      }} />
      <style>{`
        @keyframes auroraDrift0 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.12); } }
        @keyframes auroraDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-70px,-30px) scale(1.08); } }
        @keyframes auroraDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-50px) scale(1.15); } }
      `}</style>
    </div>
  );
}

// ─── 3D Card ──────────────────────────────────────────────────────────────────
function Card3D({ children, style={}, intensity=15 }) {
  const ref = useRef(null);
  const theme = useTheme();
  const handleMove = (e) => {
    const el=ref.current; if(!el) return;
    const rect=el.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-.5;
    const y=(e.clientY-rect.top)/rect.height-.5;
    el.style.transform=`perspective(800px) rotateY(${x*intensity}deg) rotateX(${-y*intensity}deg) scale(1.03)`;
    el.style.boxShadow=`${x*-12}px ${y*-12}px 50px ${theme.accent}22, 0 0 40px ${theme.accent}18`;
  };
  const handleLeave = () => {
    const el=ref.current; if(!el) return;
    el.style.transform='perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
    el.style.boxShadow='none';
  };
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ transformStyle:'preserve-3d', transition:'transform 0.12s ease, box-shadow 0.12s ease', willChange:'transform', ...style }}>
      {children}
    </div>
  );
}

// ─── Dark/Light toggle button ─────────────────────────────────────────────
function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark or light mode"
      style={{
        width: 56, height: 30, borderRadius: 50, position: 'relative', cursor: 'pointer',
        border: `1px solid ${isDark ? 'rgba(0,140,255,0.4)' : 'rgba(11,95,214,0.35)'}`,
        background: isDark ? 'rgba(8,12,34,0.85)' : 'rgba(255,255,255,0.85)',
        transition: 'background 0.3s, border-color 0.3s',
        padding: 3,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: isDark ? 28 : 2,
        width: 24, height: 24, borderRadius: '50%',
        background: isDark ? 'linear-gradient(135deg,#1e90ff,#0b3d91)' : 'linear-gradient(135deg,#ffd166,#fcb045)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
        boxShadow: isDark ? '0 0 10px rgba(30,144,255,0.6)' : '0 0 10px rgba(252,176,69,0.6)',
      }}>{isDark ? '🌙' : '☀️'}</span>
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    const handler=()=>setScrolled(window.scrollY>40);
    window.addEventListener('scroll',handler);
    return ()=>window.removeEventListener('scroll',handler);
  },[]);
  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      padding:'14px 48px', display:'flex',alignItems:'center',justifyContent:'space-between',
      backdropFilter:scrolled?'blur(24px)':'none',
      background:scrolled?theme.surfaceStrong:'transparent',
      borderBottom:scrolled?`1px solid ${theme.border}`:'1px solid transparent',
      transition:'all 0.4s ease',
    }}>
      <SlidingLogo />
      <div style={{ display:'flex',gap:32,alignItems:'center' }}>
        {['Features','Pricing','Blog'].map((link)=>(
          <a key={link} href={`#${link.toLowerCase()}`}
            style={{ color:theme.textDim,textDecoration:'none',fontSize:14,fontWeight:500,transition:'color 0.2s' }}
            onMouseEnter={e=>(e.target.style.color=theme.accent)}
            onMouseLeave={e=>(e.target.style.color=theme.textDim)}
          >{link}</a>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <ThemeToggle />
        <a href="#pricing" style={{
          padding:'8px 18px',background:'transparent',
          border:`1.5px solid ${theme.borderStrong}`,borderRadius:50,color:theme.accent,fontWeight:700,fontSize:13,
          cursor:'pointer',textDecoration:'none', transition:'background 0.2s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${theme.accent}1a`;}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
        >Pricing</a>
        <button style={{
          padding:'9px 22px',background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,
          border:'none',borderRadius:50,color:'#fff',fontWeight:700,fontSize:14,
          cursor:'pointer',letterSpacing:0.3,boxShadow:`0 0 20px ${theme.glow}`,
          transition:'box-shadow 0.3s, transform 0.2s',
        }}
          onMouseEnter={e=>{e.target.style.boxShadow=`0 0 36px ${theme.glow}`;e.target.style.transform='scale(1.05)';}}
          onMouseLeave={e=>{e.target.style.boxShadow=`0 0 20px ${theme.glow}`;e.target.style.transform='scale(1)';}}
        >Try Free</button>
      </div>
    </nav>
  );
}

// ─── Marquee of other AI image search engines ─────────────────────────────
const OTHER_ENGINES = [
  'PixelMind AI', 'VisionScope', 'NeuralLens', 'DeepFrame Search',
  'Lookora AI', 'ImageForge', 'PicSensei', 'ScanVerse',
  'ClarityNet', 'Glimpse AI', 'FrameQuery', 'OptiVision',
];

function EngineMarquee() {
  const theme = useTheme();
  const loopItems = [...OTHER_ENGINES, ...OTHER_ENGINES];
  const edgeColor = theme.mode === 'dark' ? '#050a1f' : '#eef1fb';
  return (
    <div style={{ width:'100%', overflow:'hidden', padding:'18px 0', position:'relative' }}>
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        background:`linear-gradient(90deg, ${edgeColor} 0%, transparent 8%, transparent 92%, ${edgeColor} 100%)`,
      }} />
      <div style={{
        display:'flex', gap:40, width:'max-content',
        animation:'marqueeScroll 26s linear infinite',
      }}>
        {loopItems.map((name, i) => (
          <span key={i} style={{
            display:'inline-flex', alignItems:'center', gap:8,
            fontSize:14, fontWeight:600, color:theme.textFaint,
            whiteSpace:'nowrap', letterSpacing:0.3,
          }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:theme.accent,opacity:0.6 }} />
            {name}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}

// ─── API settings panel (Google Custom Search key + cx) ────────────────────
function ApiSettings({ apiKey, cx, setApiKey, setCx, usingGoogle, onSave }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localCx, setLocalCx] = useState(cx);

  return (
    <div style={{ width:'100%', maxWidth:640, marginBottom:18 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background:'transparent', border:'none', cursor:'pointer',
          color: usingGoogle ? theme.accent : theme.textFaint, fontSize:12, fontWeight:600,
          display:'flex', alignItems:'center', gap:6, margin:'0 auto',
        }}
      >
        <span style={{ width:6,height:6,borderRadius:'50%', background: usingGoogle ? theme.accent : theme.textFaint, boxShadow: usingGoogle ? `0 0 8px ${theme.accent}`:'none' }} />
        {usingGoogle ? 'Using Google Custom Search API' : 'Using free Openverse fallback'} · {open ? 'hide' : 'configure Google API'}
      </button>
      {open && (
        <div style={{
          marginTop:12, padding:18, borderRadius:14, background:theme.surface, backdropFilter:'blur(16px)',
          border:`1px solid ${theme.border}`, display:'flex', flexDirection:'column', gap:10, textAlign:'left',
        }}>
          <p style={{ fontSize:12, color:theme.textFaint, lineHeight:1.6 }}>
            Plug in a Google Custom Search JSON API key + Search Engine ID (with Image Search enabled) for real Google image results. Get them from the Google Cloud Console and Programmable Search Engine. Without these, AetherPix automatically uses the free Openverse open-image index.
          </p>
          <input
            type="text" placeholder="Google API key"
            value={localKey} onChange={e=>setLocalKey(e.target.value)}
            style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${theme.border}`, background:'transparent', color:theme.text, fontSize:13, outline:'none' }}
          />
          <input
            type="text" placeholder="Search Engine ID (cx)"
            value={localCx} onChange={e=>setLocalCx(e.target.value)}
            style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${theme.border}`, background:'transparent', color:theme.text, fontSize:13, outline:'none' }}
          />
          <button
            onClick={() => { setApiKey(localKey); setCx(localCx); onSave(); setOpen(false); }}
            style={{
              padding:'10px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
              background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#fff',
            }}
          >Save & search with Google</button>
        </div>
      )}
    </div>
  );
}

// ─── NEW: Recent search history chips ───────────────────────────────────────
function HistoryChips({ history, onPick }) {
  const theme = useTheme();
  if (!history || history.length === 0) return null;
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:18, maxWidth:640 }}>
      <span style={{ fontSize:11, color:theme.textFaint, alignSelf:'center', marginRight:2 }}>Recent:</span>
      {history.map((term, i) => (
        <button
          key={`${term}-${i}`}
          onClick={() => onPick(term)}
          style={{
            padding:'5px 14px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
            background: theme.surface, border:`1px solid ${theme.border}`, color: theme.textDim,
            transition:'all 0.2s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.borderStrong; e.currentTarget.style.color=theme.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.color=theme.textDim;}}
        >{term}</button>
      ))}
    </div>
  );
}

// ─── Live Image Search Result Grid (with download) ─────────────────────────
function ImageGrid({ images, loading, error }) {
  const [hovered, setHovered] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const theme = useTheme();

  if (error) {
    return (
      <p style={{ color: theme.textFaint, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
        Couldn't load images: {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:640, margin:'0 auto',
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            aspectRatio:'4/3', borderRadius:12,
            background: theme.surface, border:`1.5px solid ${theme.border}`,
            animation: 'pulseLoad 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
        <style>{`@keyframes pulseLoad { 0%,100% { opacity:0.4; } 50% { opacity:0.9; } }`}</style>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <p style={{ color: theme.textFaint, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
        No images found. Try a different search.
      </p>
    );
  }

  const handleDownload = async (e, img) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(img.id);
    await downloadImage(img);
    setDownloading(null);
  };

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(3,1fr)',
      gap:12, maxWidth:640, margin:'0 auto',
    }}>
      {images.map((img, i) => (
        <a
          key={img.id}
          href={img.link}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={()=>setHovered(img.id)}
          onMouseLeave={()=>setHovered(null)}
          style={{
            position:'relative', borderRadius:12, overflow:'hidden',
            aspectRatio:'4/3', cursor:'pointer', display:'block',
            background: theme.surface,
            border: hovered===img.id ? `1.5px solid ${theme.borderStrong}` : `1.5px solid ${theme.border}`,
            transform: hovered===img.id ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
            boxShadow: hovered===img.id ? `0 8px 32px ${theme.glow}` : 'none',
            transition:'all 0.25s ease',
            opacity: 0,
            animation: `fadeSlideIn 0.5s ease ${0.05 + i * 0.05}s forwards`,
            textDecoration: 'none',
          }}
        >
          <img
            src={img.url}
            alt={img.title}
            loading="lazy"
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          />

          <button
            onClick={(e) => handleDownload(e, img)}
            title="Download image"
            style={{
              position:'absolute', top:8, left:8,
              width:26, height:26, borderRadius:'50%',
              background: theme.overlay, backdropFilter:'blur(8px)',
              border:`1px solid ${theme.overlayBorder}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color: theme.mode === 'dark' ? '#fff' : '#0a1430', fontSize:12,
              opacity: hovered===img.id ? 1 : 0,
              transform: hovered===img.id ? 'scale(1)' : 'scale(0.7)',
              transition:'all 0.2s ease',
            }}
          >
            {downloading===img.id ? '…' : '⬇'}
          </button>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            padding:'24px 10px 8px',
            background: theme.mode === 'dark'
              ? 'linear-gradient(to top,rgba(2,3,10,0.85),transparent)'
              : 'linear-gradient(to top,rgba(255,255,255,0.92),transparent)',
            opacity: hovered===img.id ? 1 : 0,
            transform: hovered===img.id ? 'translateY(0)' : 'translateY(6px)',
            transition:'all 0.25s ease',
          }}>
            <p style={{ color: theme.mode === 'dark' ? '#fff' : '#0a1430', fontSize:11,fontWeight:700,marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{img.title}</p>
            <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
              <span style={{
                fontSize:9,padding:'2px 6px',borderRadius:50,
                background:`${theme.accent}33`,color:theme.accent,fontWeight:600,letterSpacing:0.5,
              }}>{img.creator}</span>
              {img.license && (
                <span style={{
                  fontSize:9,padding:'2px 6px',borderRadius:50,
                  background:`${theme.accent}33`,color:theme.accent,fontWeight:600,letterSpacing:0.5,
                }}>{img.license}</span>
              )}
            </div>
          </div>
          <div style={{
            position:'absolute',top:8,right:8,
            background:`${theme.accent}2e`,backdropFilter:'blur(8px)',
            border:`1px solid ${theme.accent}59`,
            borderRadius:50,padding:'2px 8px',
            fontSize:9,color:theme.accent,fontWeight:700,letterSpacing:0.5,
          }}>AI</div>
        </a>
      ))}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
const SURPRISE_TERMS = [
  'bioluminescent forest', 'tokyo rain at night', 'desert dunes at dawn',
  'glacier ice cave', 'vintage motorcycle', 'macro dewdrop', 'aurora borealis',
  'brutalist architecture', 'underwater coral reef', 'milky way over mountains',
];

function Hero() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultLabel, setResultLabel] = useState('TRENDING SEARCHES');
  const [elapsed, setElapsed] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [cx, setCx] = useState('');
  const [history, setHistory] = useState([]);
  const debounceRef = useRef(null);

  const placeholders=['sunsets over mountains','neon city rain','abstract geometry','deep ocean life'];
  const phIdx=useRef(0), charIdx=useRef(0), forward=useRef(true);

  useEffect(() => {
    const tick=setInterval(() => {
      const ph=placeholders[phIdx.current];
      if(forward.current){ charIdx.current++; if(charIdx.current>=ph.length) forward.current=false; }
      else { charIdx.current--; if(charIdx.current<=0){ forward.current=true; phIdx.current=(phIdx.current+1)%placeholders.length; } }
      setTyped(ph.slice(0,charIdx.current));
    }, forward.current?65:42);
    return ()=>clearInterval(tick);
  },[]);

  const pushHistory = (term) => {
    if (!term) return;
    setHistory(h => [term, ...h.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 5));
  };

  const runSearch = useCallback(async (q, keyOverride, cxOverride) => {
    const term = q.trim() || 'sunsets over mountains';
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const results = await searchImages(term, {
        apiKey: keyOverride !== undefined ? keyOverride : apiKey,
        cx: cxOverride !== undefined ? cxOverride : cx,
        pageSize: 12,
      });
      setImages(results);
      setResultLabel(q.trim() ? `RESULTS FOR "${q.trim().toUpperCase()}"` : 'TRENDING SEARCHES');
      setElapsed(((performance.now() - start) / 1000).toFixed(2));
      if (q.trim()) pushHistory(q.trim());
    } catch (e) {
      setError(e.message || 'unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiKey, cx]);

  // initial load
  useEffect(() => { runSearch(''); /* eslint-disable-next-line */ }, []);

  // debounced live search as user types
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
  };

  const handleSurprise = () => {
    const term = SURPRISE_TERMS[Math.floor(Math.random() * SURPRISE_TERMS.length)];
    setQuery(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(term);
  };

  const handleHistoryPick = (term) => {
    setQuery(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(term);
  };

  return (
    <section style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'140px 24px 40px' }}>

      <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'6px 18px',borderRadius:50,border:`1px solid ${theme.borderStrong}`,background:`${theme.accent}11`,marginBottom:32 }}>
        <span style={{ width:7,height:7,borderRadius:'50%',background:theme.accent,display:'inline-block',boxShadow:`0 0 10px ${theme.accent}` }}/>
        <span style={{ color:theme.accent,fontSize:12,fontWeight:700,letterSpacing:1.5 }}>AI-POWERED IMAGE SEARCH</span>
      </div>

      <h1 style={{ fontSize:'clamp(54px,9.5vw,108px)',fontWeight:900,lineHeight:1.0,letterSpacing:-3,margin:'0 0 22px' }}>
        AetherPix
      </h1>

      <p style={{ fontSize:'clamp(17px,2.4vw,24px)',color:theme.textDim,maxWidth:560,margin:'0 auto 10px',fontWeight:300,lineHeight:1.4 }}>
        <AnimatedText text="Search the infinite universe of images" delay={0.3} />
      </p>
      <p style={{ fontSize:14,color:theme.textFaint,maxWidth:520,margin:'0 auto 28px',lineHeight:1.8 }}>
        <AnimatedText text="Real images · live search · download anything you find" delay={0.6} />
      </p>

      <form onSubmit={handleSubmit} style={{ width:'100%',maxWidth:640,marginBottom:14 }}>
        <Card3D intensity={6} style={{ borderRadius:50 }}>
          <div style={{
            display:'flex',alignItems:'center',
            background:theme.surface,backdropFilter:'blur(20px)',
            border:`1.5px solid ${isFocused?theme.borderStrong:theme.border}`,
            borderRadius:50,overflow:'hidden',
            boxShadow:isFocused?`0 0 48px ${theme.glow}`:`0 8px 40px ${theme.glow}`,
            transition:'border-color 0.3s, box-shadow 0.3s',
          }}>
            <span style={{ paddingLeft:26,color:theme.textFaint,fontSize:18 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={()=>setIsFocused(true)}
              onBlur={()=>setIsFocused(false)}
              placeholder={typed+'|'}
              style={{ flex:1,padding:'19px 16px',background:'transparent',border:'none',outline:'none',color:theme.text,fontSize:16 }}
            />
            <button type="button" onClick={handleSurprise} title="Surprise me"
              style={{
                marginRight:6, padding:'9px 14px',borderRadius:50,fontSize:16,cursor:'pointer',
                background:'transparent', border:`1px solid ${theme.border}`, color:theme.accent,
                transition:'background 0.2s, transform 0.2s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${theme.accent}1a`; e.currentTarget.style.transform='rotate(18deg)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='rotate(0deg)';}}
            >🎲</button>
            <button type="submit" style={{
              marginRight:14, padding:'9px 20px',borderRadius:50,fontSize:13,fontWeight:700,cursor:'pointer',
              background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:'none',color:'#fff',
              boxShadow:`0 0 16px ${theme.glow}`,
            }}>Search</button>
          </div>
        </Card3D>
      </form>

      <HistoryChips history={history} onPick={handleHistoryPick} />

      <ApiSettings
        apiKey={apiKey} cx={cx} setApiKey={setApiKey} setCx={setCx}
        usingGoogle={Boolean(apiKey && cx)}
        onSave={() => runSearch(query)}
      />

      <EngineMarquee />

      <div style={{ width:'100%',maxWidth:640,marginBottom:44, marginTop:20 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,padding:'0 4px' }}>
          <span style={{ color:theme.accent,fontSize:12,fontWeight:600,letterSpacing:1 }}>{resultLabel}</span>
          <span style={{ color:theme.textFaint,fontSize:11 }}>
            {loading ? 'searching…' : `${images.length} results${elapsed ? ` · ${elapsed}s` : ''}`}
          </span>
        </div>
        <ImageGrid images={images} loading={loading} error={error} />
        <p style={{ color:theme.textFaint, fontSize:11, marginTop:14 }}>Hover an image and tap ⬇ to download it · tap 🎲 to surprise yourself.</p>
      </div>

      <div style={{ display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center' }}>
        <button style={{
          padding:'15px 40px',background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:'none',borderRadius:12,
          color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',boxShadow:`0 0 32px ${theme.glow}`,
          transition:'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e=>{e.target.style.transform='scale(1.06) translateY(-2px)';e.target.style.boxShadow=`0 0 50px ${theme.glow}`;}}
          onMouseLeave={e=>{e.target.style.transform='scale(1) translateY(0)';e.target.style.boxShadow=`0 0 32px ${theme.glow}`;}}
        >Try Free</button>
        <a href="#pricing" style={{
          padding:'15px 40px',background:'transparent',border:`1.5px solid ${theme.borderStrong}`,borderRadius:12,
          color:theme.accent,fontWeight:600,fontSize:15,cursor:'pointer',textDecoration:'none',
          transition:'background 0.2s, border-color 0.2s, transform 0.2s', display:'inline-block',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${theme.accent}19`;e.currentTarget.style.transform='scale(1.04)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform='scale(1)';}}
        >View Pricing</a>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:'🎨', title:'AI Recognition', desc:'Advanced ML identifies objects, scenes, and styles in milliseconds.' },
  { icon:'⚡', title:'Lightning Fast', desc:'Search billions of images with real-time filters and instant results.' },
  { icon:'🎯', title:'Smart Filters', desc:'Filter by color, style, resolution, and custom AI-trained categories.' },
  { icon:'⬇', title:'One-Tap Download', desc:'Save any image straight to your device in its original quality.' },
  { icon:'🌐', title:'Google-Powered Search', desc:'Plug in your own Google Custom Search API key for true Google image results.' },
  { icon:'✨', title:'Curated Picks', desc:'Hand-picked galleries from top photographers and designers globally.' },
];

function Features() {
  const theme = useTheme();
  return (
    <section id="features" style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'100px 24px' }}>
      <div style={{ textAlign:'center',marginBottom:64 }}>
        <p style={{ color:theme.accent,fontSize:12,fontWeight:700,letterSpacing:3,marginBottom:12 }}>CAPABILITIES</p>
        <h2 style={{ fontSize:'clamp(32px,5vw,52px)',fontWeight:800,margin:0 }}>
          <AnimatedText text="Powerful Features" style={{ background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }} />
        </h2>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:24,maxWidth:1100,width:'100%' }}>
        {FEATURES.map((f,i)=>(
          <Card3D key={i} intensity={12} style={{ borderRadius:20 }}>
            <div style={{ padding:34,borderRadius:20,background:theme.surface,backdropFilter:'blur(16px)',border:`1px solid ${theme.border}`,height:'100%' }}>
              <div style={{ fontSize:44,marginBottom:18,display:'inline-block',filter:`drop-shadow(0 4px 12px ${theme.glow})` }}>{f.icon}</div>
              <h3 style={{ color:theme.accent,fontWeight:700,fontSize:18,marginBottom:10 }}>{f.title}</h3>
              <p style={{ color:theme.textDim,lineHeight:1.75,fontSize:14 }}>{f.desc}</p>
            </div>
          </Card3D>
        ))}
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value:'10B+', label:'Images Indexed' },
  { value:'180+', label:'Countries' },
  { value:'<100ms', label:'Search Speed' },
  { value:'99.9%', label:'Uptime' },
];

function Stats() {
  const theme = useTheme();
  return (
    <section style={{ minHeight:'55vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'90px 24px' }}>
      <div style={{ textAlign:'center',marginBottom:60 }}>
        <p style={{ color:theme.accent,fontSize:12,fontWeight:700,letterSpacing:3,marginBottom:12 }}>SCALE</p>
        <h2 style={{ fontSize:'clamp(32px,5vw,52px)',fontWeight:800,margin:0 }}>
          <AnimatedText text="By The Numbers" style={{ background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }} />
        </h2>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:24,maxWidth:900,width:'100%' }}>
        {STATS.map((s,i)=>(
          <Card3D key={i} intensity={14} style={{ borderRadius:20 }}>
            <div style={{ textAlign:'center',padding:'44px 24px',borderRadius:20,background:theme.surface,backdropFilter:'blur(14px)',border:`1px solid ${theme.border}` }}>
              <div style={{ fontSize:'clamp(38px,6vw,56px)',fontWeight:900,background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:10,letterSpacing:-1 }}>{s.value}</div>
              <p style={{ color:theme.textDim,fontSize:15,fontWeight:500 }}>{s.label}</p>
            </div>
          </Card3D>
        ))}
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name:'Free', price:'$0', period:'forever',
    desc:'Perfect for casual explorers and hobbyists.',
    badge:null,
    features:['100 searches / month','Standard resolution downloads','Basic AI filters','Community support','5 saved collections'],
    cta:'Try Free', popular:false,
  },
  {
    name:'Pro', price:'$12', period:'per month',
    desc:'For creators who need speed and depth every day.',
    badge:'Most Popular',
    features:['Unlimited searches','4K resolution downloads','Advanced AI recognition','Priority support','Unlimited collections','API access (1k calls/mo)','No watermarks'],
    cta:'Start Free Trial', popular:true,
  },
  {
    name:'Enterprise', price:'$49', period:'per month',
    desc:'Scale with your team — custom quotas and SLA.',
    badge:null,
    features:['Everything in Pro','Unlimited API access','Custom AI model training','Dedicated account manager','SSO & team management','SLA 99.99% uptime','White-label options'],
    cta:'Contact Sales', popular:false,
  },
];

function Pricing() {
  const theme = useTheme();
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'100px 24px' }}>
      <div style={{ textAlign:'center',marginBottom:20 }}>
        <p style={{ color:theme.accent,fontSize:12,fontWeight:700,letterSpacing:3,marginBottom:12 }}>PRICING</p>
        <h2 style={{ fontSize:'clamp(32px,5vw,52px)',fontWeight:800,margin:'0 0 16px' }}>
          <AnimatedText text="Simple, Transparent Pricing" style={{ background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }} />
        </h2>
        <p style={{ color:theme.textDim,fontSize:15,maxWidth:460,margin:'0 auto 32px',lineHeight:1.7 }}>
          No hidden fees. Cancel anytime. Start free and scale when you're ready.
        </p>

        <div style={{ display:'inline-flex',alignItems:'center',gap:12,padding:'6px 8px',borderRadius:50,background:theme.surface,border:`1px solid ${theme.border}` }}>
          <span style={{ fontSize:13,color: !annual?theme.accent:theme.textFaint,fontWeight:600,cursor:'pointer',padding:'4px 14px',borderRadius:50,background:!annual?`${theme.accent}1f`:'transparent',transition:'all 0.25s' }}
            onClick={()=>setAnnual(false)}>Monthly</span>
          <span style={{ fontSize:13,color:annual?theme.accent:theme.textFaint,fontWeight:600,cursor:'pointer',padding:'4px 14px',borderRadius:50,background:annual?`${theme.accent}1f`:'transparent',transition:'all 0.25s' }}
            onClick={()=>setAnnual(true)}>
            Annual
            <span style={{ marginLeft:6,fontSize:10,background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontWeight:800 }}>SAVE 25%</span>
          </span>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:24,maxWidth:1050,width:'100%',marginTop:48,alignItems:'stretch' }}>
        {PLANS.map((plan,i)=>{
          const price = annual && plan.price!=='$0'
            ? `$${Math.round(parseInt(plan.price.replace('$',''))*0.75)}`
            : plan.price;
          return (
            <Card3D key={i} intensity={11} style={{ borderRadius:24 }}>
              <div style={{
                position:'relative', padding:'36px 32px', borderRadius:24,
                background: plan.popular ? theme.surfaceStrong : theme.surface,
                backdropFilter:'blur(18px)',
                border: plan.popular ? `1.5px solid ${theme.accent}88` : `1px solid ${theme.border}`,
                boxShadow: plan.popular ? `0 0 60px ${theme.glow}` : 'none',
                height:'100%',display:'flex',flexDirection:'column',
              }}>
                {plan.badge && (
                  <div style={{
                    position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',
                    padding:'5px 20px',borderRadius:50,
                    background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,
                    color:'#fff',fontSize:11,fontWeight:800,letterSpacing:1,whiteSpace:'nowrap',
                    boxShadow:`0 0 24px ${theme.glow}`,
                  }}>{plan.badge}</div>
                )}

                <div style={{ marginBottom:8 }}>
                  <span style={{ fontSize:13,fontWeight:700,letterSpacing:2,color:theme.accent }}>{plan.name.toUpperCase()}</span>
                </div>

                <div style={{ display:'flex',alignItems:'baseline',gap:4,marginBottom:6 }}>
                  <span style={{ fontSize:'clamp(42px,7vw,58px)',fontWeight:900,background:`linear-gradient(135deg,${theme.accent},${theme.text})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:-2 }}>{price}</span>
                  <span style={{ color:theme.textFaint,fontSize:14 }}>/{plan.period}</span>
                </div>

                <p style={{ color:theme.textDim,fontSize:13,lineHeight:1.6,marginBottom:28 }}>{plan.desc}</p>

                <div style={{ height:1,background:`linear-gradient(90deg,transparent,${theme.accent}33,transparent)`,marginBottom:24 }}/>

                <ul style={{ listStyle:'none',padding:0,margin:'0 0 32px',display:'flex',flexDirection:'column',gap:12,flex:1 }}>
                  {plan.features.map((feat,j)=>(
                    <li key={j} style={{ display:'flex',alignItems:'center',gap:10,fontSize:13,color:theme.textDim }}>
                      <span style={{ width:18,height:18,borderRadius:'50%',background:`${theme.accent}22`,border:`1px solid ${theme.accent}55`,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <span style={{ color:theme.accent,fontSize:10,fontWeight:900 }}>✓</span>
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button style={{
                  width:'100%',padding:'14px 0',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',
                  background: plan.popular ? `linear-gradient(135deg,${theme.accent},${theme.accent2})` : 'transparent',
                  border: plan.popular ? 'none' : `1.5px solid ${theme.accent}55`,
                  color: plan.popular ? '#fff' : theme.accent,
                  boxShadow: plan.popular ? `0 0 36px ${theme.glow}` : 'none',
                  transition:'all 0.22s ease',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow=`0 0 52px ${theme.glow}`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow=plan.popular?`0 0 36px ${theme.glow}`:'none';}}
                >{plan.cta}</button>
              </div>
            </Card3D>
          );
        })}
      </div>

      <p style={{ color:theme.textFaint,fontSize:12,marginTop:36,textAlign:'center' }}>
        All plans include 14-day free trial · No credit card required · Cancel anytime
      </p>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { text:'AetherPix completely changed how I source images for my clients. The AI filters are insanely precise.', name:'Mia Tanaka', role:'Creative Director' },
  { text:'The speed is unreal. I went from spending hours to finding the perfect shot in seconds.', name:'Arjun Mehta', role:'Photojournalist' },
  { text:'Finally a search engine that understands visual context, not just keywords.', name:'Sofia Reyes', role:'UX Designer' },
];

function Testimonials() {
  const theme = useTheme();
  return (
    <section style={{ minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'90px 24px' }}>
      <div style={{ textAlign:'center',marginBottom:60 }}>
        <p style={{ color:theme.accent,fontSize:12,fontWeight:700,letterSpacing:3,marginBottom:12 }}>LOVE LETTERS</p>
        <h2 style={{ fontSize:'clamp(32px,5vw,52px)',fontWeight:800,margin:0 }}>
          <AnimatedText text="What Creators Say" style={{ background:`linear-gradient(90deg,${theme.accent},${theme.text})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }} />
        </h2>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:24,maxWidth:1000,width:'100%' }}>
        {TESTIMONIALS.map((t,i)=>(
          <Card3D key={i} intensity={11} style={{ borderRadius:20 }}>
            <div style={{ padding:34,borderRadius:20,background:theme.surface,backdropFilter:'blur(16px)',border:`1px solid ${theme.border}`,height:'100%' }}>
              <div style={{ fontSize:48,color:`${theme.accent}33`,lineHeight:0.8,marginBottom:14,fontFamily:'Georgia,serif' }}>"</div>
              <p style={{ color:theme.textDim,lineHeight:1.8,fontSize:15,marginBottom:24 }}>{t.text}</p>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17,boxShadow:`0 0 18px ${theme.glow}` }}>{t.name[0]}</div>
                <div>
                  <p style={{ color:theme.text,fontWeight:700,fontSize:14,margin:0 }}>{t.name}</p>
                  <p style={{ color:theme.textFaint,fontSize:12,margin:'3px 0 0' }}>{t.role}</p>
                </div>
              </div>
            </div>
          </Card3D>
        ))}
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  const theme = useTheme();
  return (
    <section style={{ minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'100px 24px',textAlign:'center' }}>
      <Card3D intensity={7} style={{ borderRadius:28,maxWidth:720,width:'100%',margin:'0 auto' }}>
        <div style={{ padding:'72px 56px',borderRadius:28,background:theme.surfaceStrong,backdropFilter:'blur(24px)',border:`1px solid ${theme.border}`,boxShadow:`0 0 80px ${theme.glow}` }}>
          <h2 style={{ fontSize:'clamp(36px,6vw,68px)',fontWeight:900,lineHeight:1.08,marginBottom:20 }}>
            <AnimatedText text="Ready to Explore?" style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }} />
          </h2>
          <p style={{ color:theme.textDim,fontSize:17,lineHeight:1.75,marginBottom:48,maxWidth:480,margin:'0 auto 48px' }}>
            Join millions of creators discovering the perfect image — no credit card, instant access.
          </p>
          <div style={{ display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap' }}>
            <button style={{
              padding:'16px 46px',background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:'none',borderRadius:12,
              color:'#fff',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:`0 0 48px ${theme.glow}`,transition:'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e=>{e.target.style.transform='scale(1.06) translateY(-2px)';e.target.style.boxShadow=`0 0 70px ${theme.glow}`;}}
              onMouseLeave={e=>{e.target.style.transform='scale(1)';e.target.style.boxShadow=`0 0 48px ${theme.glow}`;}}
            >Try Free</button>
            <a href="#pricing" style={{
              padding:'16px 46px',background:'transparent',border:`2px solid ${theme.borderStrong}`,borderRadius:12,
              color:theme.accent,fontWeight:700,fontSize:16,cursor:'pointer',transition:'background 0.2s, border-color 0.2s, transform 0.2s',textDecoration:'none',display:'inline-block',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${theme.accent}19`;e.currentTarget.style.transform='scale(1.04)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform='scale(1)';}}
            >View Pricing</a>
          </div>
        </div>
      </Card3D>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const theme = useTheme();
  return (
    <footer style={{ background:theme.surfaceStrong,backdropFilter:'blur(24px)',borderTop:`1px solid ${theme.border}`,padding:'64px 48px 32px' }}>
      <div style={{ maxWidth:1100,margin:'0 auto' }}>
        <div style={{ marginBottom:60, textAlign:'center', color:theme.textFaint }}>
          <span style={{ fontSize:'clamp(40px,8vw,90px)', fontWeight:900, letterSpacing:-2,
            background:`linear-gradient(135deg,${theme.accent},${theme.text})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', opacity:0.85 }}>
            Aether<span style={{ opacity:0.6 }}>Pix</span>
          </span>
        </div>

        <div style={{ borderTop:`1px solid ${theme.border}`,paddingTop:24,textAlign:'center',color:theme.textFaint,fontSize:12 }}>
          © 2025 AetherPix. All rights reserved. · Crafted with ✨ · Google Custom Search API (optional) or Openverse (CC-licensed open images)
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AetherPix() {
  const [mode, setMode] = useState('dark');
  const theme = { ...THEMES[mode], toggle: () => setMode(m => m === 'dark' ? 'light' : 'dark') };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{
        background: theme.pageBg,
        minHeight:'100vh', color: theme.text,
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
        overflowX:'hidden',
        transition:'background 0.5s ease, color 0.5s ease',
      }}>
        <div style={{ position:'fixed',top:'8%',left:'12%',width:700,height:700,borderRadius:'50%',background:`radial-gradient(circle,${theme.glow} 0%,transparent 70%)`,opacity:0.5,pointerEvents:'none',zIndex:0 }}/>
        <div style={{ position:'fixed',bottom:'18%',right:'8%',width:550,height:550,borderRadius:'50%',background:`radial-gradient(circle,${theme.glow} 0%,transparent 70%)`,opacity:0.4,pointerEvents:'none',zIndex:0 }}/>
        <div style={{ position:'fixed',top:'55%',left:'50%',width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle,${theme.glow} 0%,transparent 70%)`,opacity:0.3,transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:0 }}/>

        <AuroraField />
        <ThreeCanvas />
        <Navbar />

        <div style={{ position:'relative',zIndex:10 }}>
          <Hero />
          <Features />
          <Stats />
          <Pricing />
          <Testimonials />
          <CTA />
          <Footer />
        </div>

        <style>{`
          * { box-sizing:border-box; margin:0; padding:0; }
          html { scroll-behavior:smooth; }
          ::-webkit-scrollbar { width:7px; }
          ::-webkit-scrollbar-track { background:${theme.scrollTrack}; }
          ::-webkit-scrollbar-thumb { background:${theme.scrollThumb}; border-radius:4px; }
          ::-webkit-scrollbar-thumb:hover { background:${theme.mode==='dark'?'rgba(170,185,215,0.5)':'rgba(60,80,130,0.5)'}; }
          @media (prefers-reduced-motion:reduce) { * { transition:none !important; animation:none !important; } }
        `}</style>
      </div>
    </ThemeContext.Provider>
  );
}