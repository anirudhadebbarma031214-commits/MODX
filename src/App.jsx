import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { Search, Compass, Flame, Heart, MessageCircle, Download, Star, Upload, LogOut, Plus, X, CloudUpload, ShieldCheck, Trash2, Send, Menu, Sparkles } from 'lucide-react';

const GAMES = ['All games', 'Minecraft', 'GTA V', 'Roblox', 'Cyberpunk 2077', 'Skyrim'];
const CATEGORIES = ['Graphics', 'Gameplay', 'Vehicles', 'World', 'Effects', 'Maps', 'Tools', 'Other'];

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } });
        if (error) throw error;
        setMessage(data.session ? 'Account created. Welcome to MODX!' : 'Account created! Check your email to confirm your address, then sign in.');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><div className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark">M<span>X</span></div><div className="brand-name">MOD<span>X</span><small>MOD COMMUNITY</small></div></div>
    <div className="eyebrow">YOUR MODDING UNIVERSE</div>
    <h1>{mode === 'signin' ? 'Welcome back.' : 'Join the community.'}</h1>
    <p className="auth-sub">{mode === 'signin' ? 'Sign in to discover, download and share mods.' : 'Create your free account and publish your first mod.'}</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'signup' && <label>DISPLAY NAME<input required minLength="2" maxLength="32" value={name} onChange={e=>setName(e.target.value)} placeholder="Your creator name"/></label>}
      <label>EMAIL ADDRESS<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>PASSWORD<input required type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      {error && <p className="auth-error">{error}</p>}{message && <p className="auth-message">{message}</p>}
      <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="auth-switch">{mode === 'signin' ? "New to MODX?" : 'Already have an account?'} <button onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('');setMessage('')}}>{mode === 'signin' ? 'Create account' : 'Sign in'}</button></p>
    <small className="auth-foot"><ShieldCheck size={13}/> Sign-in is required to access the MODX community.</small>
    <div className="auth-credit">A GAME? NO. A MODDING COMMUNITY. <b>BY ANI STUDIO</b></div>
  </div></main>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mods, setMods] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState('Discover');
  const [game, setGame] = useState('All games');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Newest');
  const [selected, setSelected] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);

  const user = session?.user;
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Creator';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthReady(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadCommunity() {
    if (!user) return;
    const [m, l, c] = await Promise.all([
      supabase.from('modx_mods').select('*').order('created_at', { ascending: false }),
      supabase.from('modx_likes').select('mod_id,user_id'),
      supabase.from('modx_comments').select('id,mod_id,user_id,body,created_at')
    ]);
    const failure = m.error || l.error || c.error;
    if (failure) { notify(failure.message); return; }
    setMods(m.data || []); setLikes(l.data || []); setComments(c.data || []);
  }
  useEffect(() => { if (user) loadCommunity(); else { setMods([]); setLikes([]); setComments([]); } }, [user?.id]);

  function notify(msg) { setToast(msg); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(''), 3200); }

  const filtered = useMemo(() => mods.filter(m =>
    (game === 'All games' || m.game === game) &&
    (page !== 'Favorites' || likes.some(l => l.mod_id === m.id && l.user_id === user?.id)) &&
    (page !== 'My uploads' || m.user_id === user?.id) &&
    (page !== 'Trending' || likes.some(l => l.mod_id === m.id)) &&
    (m.title + ' ' + m.game + ' ' + m.category + ' ' + (m.author_name || '')).toLowerCase().includes(query.toLowerCase())
  ).sort((a,b) => sort === 'Most liked' ? likes.filter(l=>l.mod_id===b.id).length-likes.filter(l=>l.mod_id===a.id).length : sort === 'Oldest' ? new Date(a.created_at)-new Date(b.created_at) : new Date(b.created_at)-new Date(a.created_at)), [mods,likes,game,page,query,sort,user?.id]);

  async function toggleLike(mod) {
    const existing = likes.find(l => l.mod_id === mod.id && l.user_id === user.id);
    const result = existing
      ? await supabase.from('modx_likes').delete().eq('mod_id',mod.id).eq('user_id',user.id)
      : await supabase.from('modx_likes').insert({mod_id:mod.id,user_id:user.id});
    if (result.error) return notify(result.error.message);
    setLikes(old => existing ? old.filter(l=>!(l.mod_id===mod.id&&l.user_id===user.id)) : [...old,{mod_id:mod.id,user_id:user.id}]);
  }

  async function publishMod(e) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || !file.size) return notify('Choose a mod file first.');
    if (file.size > 50 * 1024 * 1024) return notify('Maximum file size is 50 MB.');
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      const path = user.id + '/' + crypto.randomUUID() + '-' + safeName;
      const uploaded = await supabase.storage.from('modx-files').upload(path,file,{ upsert:false });
      if (uploaded.error) throw uploaded.error;
      const inserted = await supabase.from('modx_mods').insert({
        user_id:user.id, title:String(data.get('title')).trim(), game:data.get('game'),
        category:data.get('category'), description:String(data.get('description')).trim(),
        file_path:path, file_name:file.name, author_name:displayName
      }).select().single();
      if (inserted.error) {
        await supabase.storage.from('modx-files').remove([path]);
        throw inserted.error;
      }
      setMods(old=>[inserted.data,...old]); setUploadOpen(false); form.reset(); notify('Your mod is now published!');
    } catch (e) { notify(e.message || 'Upload failed.'); }
    finally { setBusy(false); }
  }

  async function downloadMod(mod) {
    const { data, error } = await supabase.storage.from('modx-files').createSignedUrl(mod.file_path,60);
    if (error) return notify(error.message);
    const link = document.createElement('a'); link.href = data.signedUrl; link.download = mod.file_name; link.target = '_blank'; link.rel='noreferrer'; link.click();
  }

  async function postComment(e) {
    e.preventDefault(); if (!selected || !commentText.trim()) return;
    const { data, error } = await supabase.from('modx_comments').insert({mod_id:selected.id,user_id:user.id,body:commentText.trim()}).select().single();
    if (error) return notify(error.message);
    setComments(old=>[...old,data]); setCommentText('');
  }

  async function deleteMod(mod) {
    if (!window.confirm('Delete this mod and its uploaded file?')) return;
    const [removed] = await Promise.all([
      supabase.from('modx_mods').delete().eq('id',mod.id).eq('user_id',user.id),
      supabase.storage.from('modx-files').remove([mod.file_path])
    ]);
    if (removed.error) return notify(removed.error.message);
    setMods(old=>old.filter(m=>m.id!==mod.id)); setSelected(null); notify('Mod deleted.');
  }

  if (!authReady) return <div className="loading-screen">Loading MODX…</div>;
  if (!session) return <AuthScreen/>;

  return <div className="app">
    <aside className={mobile?'sidebar open':'sidebar'}>
      <div className="brand"><div className="brand-mark">M<span>X</span></div><div className="brand-name">MOD<span>X</span><small>MOD COMMUNITY</small></div><button className="mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{[[Compass,'Discover'],[Flame,'Trending'],[Heart,'Favorites'],[MessageCircle,'Community'],[Upload,'My uploads']].map(([I,n])=><button key={n} className={'nav-item '+(page===n?'active':'')} onClick={()=>{setPage(n);setMobile(false)}}><I size={18}/>{n}</button>)}</nav>
      <div className="side-label games-label">BROWSE GAMES</div>
      <nav>{GAMES.slice(1).map((g,i)=><button key={g} className={'nav-item game-nav '+(game===g?'active':'')} onClick={()=>{setGame(game===g?'All games':g);setPage('Discover')}}><span className={'game-icon g'+i}>{g[0]}</span>{g}</button>)}</nav>
      <div className="sidebar-bottom"><div className="creator-card"><Sparkles size={18}/><b>Creator studio</b><p>Publish your next community favourite.</p><button onClick={()=>setUploadOpen(true)}>Upload a mod <Plus size={14}/></button></div>
      <div className="user-mini"><div className="avatar">{displayName[0]?.toUpperCase()}</div><div><b>{displayName}</b><small>{user.email}</small></div><button className="logout-icon" title="Sign out" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/></button></div></div>
    </aside>
    <main className="main"><header className="topbar"><button className="hamburger" onClick={()=>setMobile(true)}><Menu/></button><div className="breadcrumb">MODX <span>/</span> <b>{page}</b></div><div className="top-actions"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search mods and creators..."/></div><button className="upload-top" onClick={()=>setUploadOpen(true)}><Plus size={17}/> Upload mod</button><div className="top-avatar">{displayName[0]?.toUpperCase()}</div></div></header>
      <div className="content">
        <section className="hero"><div className="hero-copy"><div className="eyebrow">THE MODDING UNIVERSE</div><h1>Level up your<br/>game<span className="gradient-text">.</span></h1><p>Discover community mods. Share your creations.<br/>Make every game your own.</p><div className="hero-buttons"><button className="primary-btn" onClick={()=>document.getElementById('mod-library')?.scrollIntoView({behavior:'smooth'})}>Explore mods</button><button className="secondary-btn" onClick={()=>setUploadOpen(true)}><Upload size={16}/> Become a creator</button></div><div className="hero-stats"><div><b>{mods.length}</b><small>PUBLISHED MODS</small></div><i/><div><b>{new Set(mods.map(m=>m.user_id)).size}</b><small>CREATORS</small></div><i/><div><b>{likes.length}</b><small>COMMUNITY LIKES</small></div></div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-x">X</div><div className="float-card card-a"><Sparkles size={15}/><span>CREATOR POWER</span><b>Unleash it.</b></div><div className="float-card card-b"><span className="pulse"/> <span>COMMUNITY LIVE</span><b>{mods.length} published mods</b></div><div className="hero-caption">YOUR NEXT<br/><b>FAVOURITE MOD</b></div></div></section>
        <div className="section-heading" id="mod-library"><div><div className="eyebrow">COMMUNITY LIBRARY</div><h2>{page==='Favorites'?'Your saved mods':page==='Trending'?'Trending right now':page==='My uploads'?'Your uploads':page==='Community'?'Community mods':'Explore mods'} <span className="heading-count">{filtered.length}</span></h2><p>Real uploads from signed-in MODX creators.</p></div><button className="view-all" onClick={()=>{setPage('Discover');setGame('All games')}}>View all →</button></div>
        <div className="filters"><div className="game-pills">{GAMES.map(g=><button key={g} className={game===g?'selected':''} onClick={()=>setGame(g)}>{g}</button>)}</div><label className="sort-select">Sort <select value={sort} onChange={e=>setSort(e.target.value)}><option>Newest</option><option>Oldest</option><option>Most liked</option></select></label></div>
        <div className="mod-grid">{filtered.map(m=>{const count=likes.filter(l=>l.mod_id===m.id).length;const mine=likes.some(l=>l.mod_id===m.id&&l.user_id===user.id);return <article className="mod-card" key={m.id}><div className="mod-image"><div className="mod-placeholder"><span>{m.game}</span></div><span className="mod-tag">{m.category}</span></div><div className="mod-info"><div className="mod-meta">{m.game} · {new Date(m.created_at).toLocaleDateString()}</div><button className="mod-title" onClick={()=>setSelected(m)}>{m.title}</button><div className="creator-line"><div className="creator-avatar">{(m.author_name||'C')[0].toUpperCase()}</div><span>by <b>{m.author_name||'Creator'}</b></span><button className={'like-btn '+(mine?'liked':'')} onClick={()=>toggleLike(m)}><Heart size={16} fill={mine?'currentColor':'none'}/></button></div><div className="mod-footer"><span><Heart size={14}/>{count}</span><span><MessageCircle size={14}/>{comments.filter(c=>c.mod_id===m.id).length}</span><button onClick={()=>setSelected(m)}>Details ↗</button></div></div></article>})}</div>
        {!filtered.length&&<div className="empty"><Search/><h3>No mods here yet</h3><p>Try another filter or publish the first one.</p><button onClick={()=>{setQuery('');setGame('All games');setPage('Discover')}}>Clear filters</button></div>}
        <section className="creator-banner"><div className="banner-icon"><CloudUpload size={25}/></div><div><div className="eyebrow">GOT SOMETHING AWESOME?</div><h2>Your creation deserves<br/>to be <span className="gradient-text">discovered.</span></h2><p>Upload your mod and share it with the community.</p></div><button className="primary-btn" onClick={()=>setUploadOpen(true)}>Start uploading <Upload size={16}/></button><div className="banner-watermark">M</div></section>
        <footer><div className="footer-brand">MOD<span>X</span></div><span>Built by <b>ANI STUDIO</b> · Your Mods. Your Community.</span><span>© 2026 MODX</span></footer>
      </div>
    </main>
    {selected&&<div className="overlay" onClick={()=>setSelected(null)}><div className="detail-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X/></button><div className="detail-art"><span>{selected.game}</span></div><div className="detail-body"><div className="mod-meta">{selected.game} · {selected.category}</div><h2>{selected.title}</h2><p>{selected.description}</p><div className="detail-stats"><span><Heart size={15}/>{likes.filter(l=>l.mod_id===selected.id).length} likes</span><span><MessageCircle size={15}/>{comments.filter(c=>c.mod_id===selected.id).length} comments</span><span><ShieldCheck size={15}/>{selected.author_name||'Creator'}</span></div><button className="primary-btn full" onClick={()=>downloadMod(selected)}><Download size={16}/> Download mod</button>{selected.user_id===user.id&&<button className="danger-btn full" onClick={()=>deleteMod(selected)}><Trash2 size={15}/> Delete my mod</button>}<div className="comment-area"><h3>Community discussion</h3>{comments.filter(c=>c.mod_id===selected.id).map(c=><div className="comment" key={c.id}><b>{c.user_id===user.id?'You':'Community member'}</b><p>{c.body}</p></div>)}<form onSubmit={postComment} className="comment-form"><input value={commentText} onChange={e=>setCommentText(e.target.value)} maxLength={1000} placeholder="Write a comment…" required/><button className="primary-btn"><Send size={14}/></button></form></div><small className="modal-note"><ShieldCheck/> Download only files you trust and scan them before installing.</small></div></div></div>}
    {uploadOpen&&<div className="overlay" onClick={()=>!busy&&setUploadOpen(false)}><div className="upload-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setUploadOpen(false)}><X/></button><div className="eyebrow">CREATOR STUDIO</div><h2>Publish a <span className="gradient-text">mod.</span></h2><p className="upload-intro">Your upload will be available to signed-in MODX members.</p><form onSubmit={publishMod}><label>MOD NAME<input name="title" required minLength="3" maxLength="90" placeholder="e.g. Ultra Realistic Graphics"/></label><div className="form-row"><label>GAME<select name="game" required defaultValue=""><option value="" disabled>Select game</option>{GAMES.slice(1).map(g=><option key={g}>{g}</option>)}</select></label><label>CATEGORY<select name="category">{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label></div><label>DESCRIPTION<textarea name="description" required minLength="10" maxLength="2000" placeholder="Describe your mod…"/></label><label className="file-drop"><CloudUpload/><b>Choose mod file</b><span>ZIP, JAR, 7Z · Maximum 50 MB</span><input name="file" type="file" required accept=".zip,.jar,.7z,.mcpack,.mcaddon,.pak"/></label><button className="primary-btn full" disabled={busy}><Upload size={16}/>{busy?'Publishing…':'Publish to MODX'}</button><small className="modal-note"><ShieldCheck/> Upload only files you own or have permission to share.</small></form></div></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
