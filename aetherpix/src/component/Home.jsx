import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el); // fire once
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useScrollReveal();

  const transforms = {
    up: 'translateY(48px)',
    down: 'translateY(-48px)',
    left: 'translateX(-48px)',
    right: 'translateX(48px)',
    scale: 'scale(0.85)',
    none: 'none',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [ref, visible] = useScrollReveal();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = num / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start * 10) / 10);
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);

  const raw = parseFloat(target.replace(/[^0-9.]/g, ''));
  const prefix = target.match(/^[^0-9]*/)?.[0] || '';
  const suf = target.match(/[^0-9.]+$/)?.[0] || suffix;

  return (
    <span ref={ref}>
      {visible ? `${prefix}${Number.isInteger(raw) ? Math.floor(count) : count}${suf}` : `${prefix}0${suf}`}
    </span>
  );
}

// ─── Particle canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse);

    const COUNT = 120;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.2,
      hue: Math.random() > 0.5 ? 185 : 270, // cyan or purple
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        // subtle mouse repulsion
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.x += (dx / dist) * 0.6;
          p.y += (dy / dist) * 0.6;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,70%,${p.alpha})`;
        ctx.fill();
      });

      // draw connecting lines
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d / 90) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        background: scrolled ? 'rgba(10,14,39,0.85)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(0,212,255,0.12)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg,#00d4ff,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        AetherPix
      </span>
      <div style={{ display: 'flex', gap: 32 }}>
        {['Features', 'Gallery', 'Pricing', 'API'].map((link) => (
          <a key={link} href="#" style={{ color: 'rgba(200,220,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.target.style.color = '#00d4ff')}
            onMouseLeave={e => (e.target.style.color = 'rgba(200,220,255,0.7)')}
          >{link}</a>
        ))}
      </div>
      <button style={{
        padding: '8px 20px', background: 'linear-gradient(135deg,#00d4ff,#3b82f6)',
        border: 'none', borderRadius: 50, color: '#fff', fontWeight: 600,
        fontSize: 14, cursor: 'pointer', transition: 'box-shadow 0.3s',
      }}>Sign up free</button>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState('');
  const placeholders = ['sunsets over mountains', 'neon city rain', 'abstract geometry', 'deep ocean life'];
  const phIdx = useRef(0);
  const charIdx = useRef(0);
  const forward = useRef(true);

  useEffect(() => {
    const tick = setInterval(() => {
      const ph = placeholders[phIdx.current];
      if (forward.current) {
        charIdx.current++;
        if (charIdx.current >= ph.length) { forward.current = false; setTimeout(() => {}, 800); }
      } else {
        charIdx.current--;
        if (charIdx.current <= 0) {
          forward.current = true;
          phIdx.current = (phIdx.current + 1) % placeholders.length;
        }
      }
      setTyped(ph.slice(0, charIdx.current));
    }, forward.current ? 60 : 40);
    return () => clearInterval(tick);
  }, []);

  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
      {/* Badge */}
      <Reveal delay={0} direction="down">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 50, border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.06)', marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', display: 'inline-block', boxShadow: '0 0 8px #00d4ff' }} />
          <span style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>AI-POWERED IMAGE SEARCH</span>
        </div>
      </Reveal>

      {/* Headline */}
      <Reveal delay={0.1} direction="up">
        <h1 style={{ fontSize: 'clamp(52px,9vw,100px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 20px', letterSpacing: -2 }}>
          <span style={{ background: 'linear-gradient(135deg,#00d4ff 0%,#3b82f6 50%,#a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AetherPix
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(18px,2.5vw,26px)', color: 'rgba(180,210,255,0.85)', maxWidth: 600, margin: '0 auto 12px', fontWeight: 300 }}>
          Search the infinite universe of images
        </p>
        <p style={{ fontSize: 15, color: 'rgba(150,170,200,0.6)', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>
          AI-driven recognition · lightning-fast filters · billions of images indexed
        </p>
      </Reveal>

      {/* Search */}
      <Reveal delay={0.22} direction="up">
        <div style={{ width: '100%', maxWidth: 620, marginBottom: 40, position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(15,23,60,0.7)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(0,212,255,0.25)', borderRadius: 50, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,212,255,0.08)', transition: 'border-color 0.3s, box-shadow 0.3s' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.6)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)')}
          >
            <span style={{ paddingLeft: 24, color: 'rgba(0,212,255,0.5)', fontSize: 18 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={typed + '|'}
              style={{ flex: 1, padding: '18px 16px', background: 'transparent', border: 'none', outline: 'none', color: '#e0f0ff', fontSize: 16 }}
            />
            <button style={{ margin: 6, padding: '12px 28px', background: 'linear-gradient(135deg,#00d4ff,#3b82f6)', border: 'none', borderRadius: 50, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </div>
        </div>
      </Reveal>

      {/* CTA row */}
      <Reveal delay={0.32} direction="up">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={{ padding: '14px 36px', background: 'linear-gradient(135deg,#00d4ff,#3b82f6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 0 30px rgba(0,212,255,0.25)', transition: 'transform 0.2s,box-shadow 0.2s' }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 40px rgba(0,212,255,0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 0 30px rgba(0,212,255,0.25)'; }}
          >Start Exploring</button>
          <button style={{ padding: '14px 36px', background: 'transparent', border: '1.5px solid rgba(0,212,255,0.4)', borderRadius: 10, color: '#00d4ff', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.target.style.background = 'rgba(0,212,255,0.08)')}
            onMouseLeave={e => (e.target.style.background = 'transparent')}
          >Learn More</button>
        </div>
      </Reveal>

      {/* Scroll indicator */}
      <Reveal delay={0.55} direction="none">
        <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.5 }}>
          <span style={{ fontSize: 12, letterSpacing: 2, color: '#00d4ff' }}>SCROLL</span>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom,#00d4ff,transparent)', animation: 'pulse 2s infinite' }} />
        </div>
      </Reveal>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🎨', title: 'AI-Powered Recognition', desc: 'Advanced ML identifies objects, scenes, and styles in milliseconds.' },
  { icon: '⚡', title: 'Lightning Fast', desc: 'Search billions of images with real-time filters and instant results.' },
  { icon: '🎯', title: 'Smart Filters', desc: 'Filter by color, style, resolution, and custom AI-trained categories.' },
  { icon: '🔐', title: 'Privacy First', desc: 'Your searches are encrypted and never stored or sold.' },
  { icon: '🌐', title: 'Global Collection', desc: 'Millions of royalty-free, licensed, and original images worldwide.' },
  { icon: '✨', title: 'Curated Collections', desc: 'Hand-picked galleries from top photographers and designers.' },
];

function Features() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <Reveal direction="up">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>CAPABILITIES</p>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, background: 'linear-gradient(90deg,#00d4ff,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Powerful Features
          </h2>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 1100, width: '100%' }}>
        {FEATURES.map((f, i) => (
          <Reveal key={i} delay={i * 0.08} direction={i % 2 === 0 ? 'left' : 'right'}>
            <div
              style={{
                padding: 32, borderRadius: 20,
                background: 'rgba(15,23,60,0.5)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,212,255,0.15)',
                cursor: 'pointer', transition: 'transform 0.3s,border-color 0.3s,box-shadow 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,212,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ color: '#00d4ff', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'rgba(160,185,220,0.7)', lineHeight: 1.7, fontSize: 14 }}>{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
const EMOJIS = ['🌅', '🌊', '🏔️', '🌲', '🌺', '🦋', '🌙', '✨', '🎆', '🔮', '💫', '🌈'];
const LABELS = ['Sunsets', 'Ocean', 'Mountains', 'Forests', 'Florals', 'Wildlife', 'Night', 'Abstract', 'Cityscapes', 'Mystic', 'Cosmos', 'Color'];

function Gallery() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <Reveal direction="up">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#a855f7', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>EXPLORE</p>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, background: 'linear-gradient(90deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Gallery Preview
          </h2>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, maxWidth: 1100, width: '100%' }}>
        {EMOJIS.map((emoji, i) => (
          <Reveal key={i} delay={i * 0.05} direction="scale">
            <div
              style={{
                aspectRatio: '1', borderRadius: 16,
                background: `linear-gradient(135deg, rgba(${i % 2 ? '168,85,247' : '0,212,255'},0.12), rgba(236,72,153,0.1))`,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168,85,247,0.2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(168,85,247,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: 44, display: 'block', transition: 'transform 0.3s' }}>{emoji}</span>
              <span style={{ color: 'rgba(200,180,255,0.6)', fontSize: 12, fontWeight: 500 }}>{LABELS[i]}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { raw: '10B+', label: 'Images Indexed' },
  { raw: '180+', label: 'Countries' },
  { raw: '<100ms', label: 'Search Speed' },
  { raw: '99.9%', label: 'Uptime' },
];

function Stats() {
  return (
    <section style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <Reveal direction="up">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#00d4ff', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>SCALE</p>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, background: 'linear-gradient(90deg,#00d4ff,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            By The Numbers
          </h2>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24, maxWidth: 900, width: '100%' }}>
        {STATS.map((s, i) => (
          <Reveal key={i} delay={i * 0.1} direction="scale">
            <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 20, background: 'rgba(15,23,60,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,212,255,0.18)' }}>
              <div style={{ fontSize: 'clamp(38px,6vw,56px)', fontWeight: 900, background: 'linear-gradient(135deg,#00d4ff,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
                <Counter target={s.raw} />
              </div>
              <p style={{ color: 'rgba(160,185,220,0.7)', fontSize: 15, fontWeight: 500 }}>{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: 'AetherPix completely changed how I source images for my clients. The AI filters are insanely precise.', name: 'Mia Tanaka', role: 'Creative Director' },
  { text: 'The speed is unreal. I went from spending hours to finding the perfect shot in seconds.', name: 'Arjun Mehta', role: 'Photojournalist' },
  { text: 'Finally a search engine that understands visual context, not just keywords.', name: 'Sofia Reyes', role: 'UX Designer' },
];

function Testimonials() {
  return (
    <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <Reveal direction="up">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#a855f7', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 12 }}>LOVE LETTERS</p>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, background: 'linear-gradient(90deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            What Creators Say
          </h2>
        </div>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 1000, width: '100%' }}>
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={i} delay={i * 0.12} direction={i % 2 === 0 ? 'left' : 'right'}>
            <div style={{ padding: 32, borderRadius: 20, background: 'rgba(15,10,40,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <p style={{ color: 'rgba(200,180,255,0.85)', lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                  {t.name[0]}
                </div>
                <div>
                  <p style={{ color: '#e0d0ff', fontWeight: 700, fontSize: 14, margin: 0 }}>{t.name}</p>
                  <p style={{ color: 'rgba(160,140,200,0.6)', fontSize: 12, margin: '2px 0 0' }}>{t.role}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', textAlign: 'center' }}>
      <Reveal direction="scale">
        <div style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(135deg,#00d4ff,#3b82f6,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ready to Explore?
          </h2>
          <p style={{ color: 'rgba(160,185,220,0.7)', fontSize: 18, lineHeight: 1.7, marginBottom: 48 }}>
            Join millions of creators discovering the perfect image with AetherPix — no credit card, instant access.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ padding: '16px 44px', background: 'linear-gradient(135deg,#00d4ff,#3b82f6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 0 48px rgba(0,212,255,0.35)', transition: 'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 0 64px rgba(0,212,255,0.55)'; }}
              onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 0 48px rgba(0,212,255,0.35)'; }}
            >Get Started Free</button>
            <button style={{ padding: '16px 44px', background: 'transparent', border: '2px solid rgba(0,212,255,0.4)', borderRadius: 12, color: '#00d4ff', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'background 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; }}
            >View Pricing</button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
  { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers'] },
  { title: 'Resources', links: ['Documentation', 'API', 'Community'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Contact'] },
];

function Footer() {
  return (
    <footer style={{ background: 'rgba(6,8,24,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,212,255,0.1)', padding: '60px 40px 32px' }}>
      <Reveal direction="up">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 40, marginBottom: 48 }}>
            {FOOTER_COLS.map((col, i) => (
              <div key={i}>
                <h4 style={{ color: '#00d4ff', fontWeight: 700, marginBottom: 16, fontSize: 14, letterSpacing: 1 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#" style={{ color: 'rgba(140,160,190,0.6)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.target.style.color = '#00d4ff')}
                      onMouseLeave={e => (e.target.style.color = 'rgba(140,160,190,0.6)')}
                    >{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(0,212,255,0.08)', paddingTop: 24, textAlign: 'center', color: 'rgba(100,120,150,0.5)', fontSize: 13 }}>
            © 2024 AetherPix. All rights reserved. | Crafted with ✨
          </div>
        </div>
      </Reveal>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AetherPix() {
  return (
    <div style={{ background: 'linear-gradient(160deg,#040813 0%,#080e2e 40%,#0c0820 70%,#040813 100%)', minHeight: '100vh', color: '#fff', fontFamily: "'Inter','Segoe UI',sans-serif", overflowX: 'hidden' }}>
      {/* Ambient glow blobs */}
      <div style={{ position: 'fixed', top: '10%', left: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <ParticleCanvas />
      <Navbar />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <Hero />
        <Features />
        <Gallery />
        <Stats />
        <Testimonials />
        <CTA />
        <Footer />
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(4,8,20,0.8); }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#00d4ff,#3b82f6); border-radius: 4px; }
        @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}