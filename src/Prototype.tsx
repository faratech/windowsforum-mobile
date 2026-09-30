import { useEffect, useRef, useState, type FormEvent, type UIEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Add24Regular, Alert24Regular, Apps24Regular, ArrowLeft24Regular,
  ArrowUp24Regular, Bookmark24Filled, Bookmark24Regular, Chat24Regular,
  ChatMultiple24Regular, Checkmark24Regular, ChevronRight24Regular,
  Dismiss24Regular, Home24Filled, Home24Regular, Laptop24Regular,
  Lightbulb24Regular, MoreHorizontal24Regular, Search24Regular,
  Sparkle24Regular, WeatherMoon24Regular, WeatherSunny24Regular,
  Desktop24Regular, ArrowDown24Regular, ThumbLike24Regular, Attach24Regular,
} from '@fluentui/react-icons';
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard, useKeyboardInsets } from './mobile';
import { forums, initialTopics, sampleAlerts, type Topic } from './content';
import './prototype.css';

type Tab = 'Feed' | 'Forums' | 'Ask AI' | 'Inbox';
type Filter = 'Latest' | 'Following' | 'Saved';
type Theme = 'light' | 'dark' | 'system';
type Sheet = 'account' | 'search' | 'actions' | 'jump' | null;
type Reply = { id: number; body: string };
const themeKey = 'wf-mobile-preview:theme';
const draftKey = 'wf-mobile-preview:drafts';
function readPreference(): Theme {
  const query = new URLSearchParams(location.search).get('theme');
  if (query === 'light' || query === 'dark') return query;
  try { const saved = localStorage.getItem(themeKey); if (saved === 'light' || saved === 'dark' || saved === 'system') return saved; } catch { /* optional preference */ }
  return 'dark';
}
function readDrafts(): Record<string, string> {
  try { const value: unknown = JSON.parse(sessionStorage.getItem(draftKey) || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === 'string'));
  } catch { /* optional preview draft */ }
  return {};
}
function Avatar({ initials, color = 'blue' }: { initials: string; color?: string }) {
  return <span className={`avatar avatar-${color}`} aria-hidden="true">{initials}</span>;
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const { bottomInset } = useKeyboardInsets();
  const [theme, setTheme] = useState<Theme>(readPreference);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const [tab, setTab] = useState<Tab>('Feed');
  const [filter, setFilter] = useState<Filter>('Latest');
  const [topics, setTopics] = useState(initialTopics);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [saved, setSaved] = useState<number[]>([3]);
  const [read, setRead] = useState<number[]>([]);
  const [alertsRead, setAlertsRead] = useState<number[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [query, setQuery] = useState('');
  const [composer, setComposer] = useState<'new' | 'reply' | null>(null);
  const [drafts, setDrafts] = useState(readDrafts);
  const draftTitle = drafts['new:title'] ?? '';
  const draftCategory = forums.some(f => f.name === drafts['new:category']) ? drafts['new:category'] : forums[0].name;
  const [replies, setReplies] = useState<Record<number, Reply[]>>({});
  const [liked, setLiked] = useState<string[]>([]);
  const [currentPost, setCurrentPost] = useState(1);
  const [toast, setToast] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const jumpTarget = useRef<number | null>(null);
  const thread = topics.find(t => t.id === selectedId);
  const threadReplies = replies[selectedId ?? 0] ?? [];
  const basePostCount = thread?.response ? 2 : 1;
  const postCount = thread ? basePostCount + threadReplies.length : 0;
  const activeDraftKey = composer === 'new' ? 'new' : `reply:${selectedId}`;
  const draft = drafts[activeDraftKey] ?? '';

  useEffect(() => {
    document.documentElement.dataset.wfTheme = resolvedTheme;
    try { localStorage.setItem(themeKey, theme); } catch { /* optional preference */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#141b23' : '#ffffff');
  }, [theme, resolvedTheme]);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(mq.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  useEffect(() => { try { sessionStorage.setItem(draftKey, JSON.stringify(drafts)); } catch { /* optional preview draft */ } }, [drafts]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => () => clearTimeout(aiTimer.current), []);

  function switchTab(next: Tab) { keyboard.hide(); setTab(next); setSelectedId(null); setSheet(null); }
  function showSheet(next: Sheet) { keyboard.hide(); setSheet(next); }
  function openThread(topic: Topic) {
    keyboard.hide(); setSheet(null); setSelectedId(topic.id); setRead(prev => [...new Set([...prev, topic.id])]); setCurrentPost(1); jumpTarget.current = null;
  }
  function setDraftTitle(value: string) { setDrafts(prev => ({ ...prev, 'new:title': value })); }
  function setDraftCategory(value: string) { setDrafts(prev => ({ ...prev, 'new:category': value })); }
  function closeThread() { keyboard.hide(); setSelectedId(null); }
  function edit(kind: 'new' | 'reply') { keyboard.hide(); setComposer(kind); setSheet(null); }
  function closeComposer() { keyboard.hide(); setComposer(null); if (draft.trim() || composer === 'new' && draftTitle.trim()) setToast('Draft kept for you'); }
  function toggleSaved() {
    if (!thread) return;
    setSaved(prev => prev.includes(thread.id) ? prev.filter(id => id !== thread.id) : [...prev, thread.id]);
    setToast(saved.includes(thread.id) ? 'Removed from Saved' : 'Discussion saved');
  }
  function jumpTo(post: number) {
    keyboard.hide(); setSheet(null); setCurrentPost(post); jumpTarget.current = post;
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${post}`);
      const scroller = el?.closest('.mobile-scroll');
      if (el && scroller) scroller.scrollTo({ top: el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12, behavior: 'smooth' });
    });
  }
  function trackReading(event: UIEvent<HTMLElement>) {
    if (jumpTarget.current !== null) return;
    const scroller = event.target;
    if (!(scroller instanceof HTMLElement) || !scroller.matches('.mobile-scroll')) return;
    const top = scroller.getBoundingClientRect().top;
    const visible = [...scroller.querySelectorAll<HTMLElement>('[data-post]')].find(post => post.getBoundingClientRect().bottom > top + 60);
    if (visible) setCurrentPost(Number(visible.dataset.post));
  }
  function submitDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || (composer === 'new' && !draftTitle.trim())) return;
    keyboard.hide();
    if (composer === 'new') {
      const topic: Topic = { id: Date.now(), title: draftTitle.trim(), category: draftCategory, initials: 'A', author: 'Alex (you)', color: 'blue', time: 'Now', replies: 0, body: draft.trim(), following: true };
      setTopics(prev => [topic, ...prev]); setSelectedId(topic.id); setTab('Feed'); setFilter('Latest'); setDraftTitle(''); setCurrentPost(1); jumpTarget.current = null; setToast('Discussion added to this preview');
    } else if (thread) {
      setReplies(prev => ({ ...prev, [thread.id]: [...(prev[thread.id] ?? []), { id: Date.now(), body: draft.trim() }] }));
      setTopics(prev => prev.map(t => t.id === thread.id ? { ...t, replies: t.replies + 1 } : t));
      setToast('Reply added to this preview'); setTimeout(() => jumpTo(postCount + 1), 80);
    }
    setDrafts(prev => ({ ...prev, [activeDraftKey]: '' })); setComposer(null);
  }
  function askAI(question = aiText) {
    if (!question.trim()) return;
    keyboard.hide(); setAiQuestion(question.trim()); setAiText(''); setAiLoading(true);
    clearTimeout(aiTimer.current); aiTimer.current = setTimeout(() => setAiLoading(false), 650);
  }
  function TopicRow({ topic, highlighted = false }: { topic: Topic; highlighted?: boolean }) {
    const unread = topic.unread && !read.includes(topic.id);
    return <button type="button" className={`topic-row ${highlighted && unread ? 'highlighted' : ''}`} onClick={() => openThread(topic)} aria-label={`Open discussion: ${topic.title}`}>
      <Avatar initials={topic.initials} color={topic.color} />
      <span className="topic-copy"><strong>{topic.title}</strong><span className="topic-category"><Chat24Regular />{topic.category}</span></span>
      <span className="topic-meta"><span className="meta-count-line">{topic.attachment && <Attach24Regular aria-label="Has attachment" />}<span className={`count ${unread ? 'count-new' : ''} ${topic.solved ? 'count-solved' : ''}`}>
        {topic.solved ? <><Checkmark24Regular /><span>Solved</span></> : unread ? `${topic.unread} new` : topic.replies}
      </span></span><time>{topic.time}</time></span>
    </button>;
  }
  const filtered = topics.filter(t => filter === 'Saved' ? saved.includes(t.id) : filter === 'Following' ? t.following : true);
  // Keep row positions stable while the reader opens; read badges update in place.
  const newReplies = filtered.filter(t => t.unread);
  const recentTopics = filtered.filter(t => !newReplies.includes(t));
  const resultTopics = topics.filter(t => `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  const isDetail = Boolean(thread || category && tab === 'Forums');
  const navItems = [
    { label: 'Feed' as Tab, Icon: tab === 'Feed' ? Home24Filled : Home24Regular },
    { label: 'Forums' as Tab, Icon: ChatMultiple24Regular },
    { label: 'Ask AI' as Tab, Icon: Sparkle24Regular },
    { label: 'Inbox' as Tab, Icon: Alert24Regular },
  ];
  return <>
    {createPortal(<aside className="preview-tools" aria-label="Prototype controls">
      <div className="preview-heading"><span className="preview-brand">WindowsForum</span><span className="preview-tag">Option 3</span></div>
      <p className="preview-description">A familiar community.<br />A more natural mobile experience.</p>
      <div className="preview-themes" aria-label="Preview appearance">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><WeatherSunny24Regular />Light</button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><WeatherMoon24Regular />Dark</button>
      </div>
      <span className="preview-note">Interactive concept · Sample content</span>
      <a className="concept-link" href="/mobile/concepts.html">View original concepts<ChevronRight24Regular /></a>
    </aside>, document.body)}
    <div className="wf-app" data-theme={resolvedTheme}>
      <header className="app-header">
        {isDetail ? <><button type="button" className="icon-button" aria-label={thread ? 'Back to discussions' : 'Back to forums'} onClick={thread ? closeThread : () => setCategory(null)}><ArrowLeft24Regular /></button><span className="header-title">{thread ? 'Discussion' : 'Forums'}</span>
          {thread && <div className="header-actions"><button type="button" className="icon-button" onClick={toggleSaved} aria-label={saved.includes(thread.id) ? 'Unsave discussion' : 'Save discussion'} aria-pressed={saved.includes(thread.id)}>{saved.includes(thread.id) ? <Bookmark24Filled /> : <Bookmark24Regular />}</button><button type="button" className="icon-button" aria-label="Discussion options" onClick={() => showSheet('actions')}><MoreHorizontal24Regular /></button></div>}
        </> : <><div className="brand"><img src={`${import.meta.env.BASE_URL}assets/brand/windowsforum.png`} alt="" /><span><b>WINDOWS</b><span>FORUM</span></span></div><div className="header-actions"><button type="button" className="icon-button" aria-label="Search discussions" onClick={() => showSheet('search')}><Search24Regular /></button><button type="button" className="profile-button" aria-label="Account and appearance" onClick={() => showSheet('account')}>A</button></div></>}
      </header>
      <section className={`tab-screen feed-screen ${tab !== 'Feed' || thread ? 'inactive-screen' : ''}`} aria-label="Community feed">
        <div className="feed-top"><div className="title-row"><h1>Your community</h1><button type="button" className="primary-button new-discussion" onClick={() => edit('new')}><Add24Regular />New discussion</button></div><div className="segments" role="group" aria-label="Feed filter">{(['Latest', 'Following', 'Saved'] as const).map(item => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="feed-scroll-wrap"><MobileScroll className="feed-scroll"><main className="feed-content">
          {newReplies.length > 0 && <section aria-label="New replies"><h2 className="section-heading">{newReplies.some(t => !read.includes(t.id)) ? 'New replies' : 'Recent replies'}</h2>{newReplies.map((topic, i) => <TopicRow key={topic.id} topic={topic} highlighted={i === 0} />)}</section>}
          {recentTopics.length > 0 && <section aria-label="Recent discussions"><h2 className="section-heading">{filter === 'Saved' ? 'Your saved discussions' : filter === 'Following' ? 'From people and forums you follow' : 'Recent discussions'}</h2>{recentTopics.map((topic, i) => <div key={topic.id}><TopicRow topic={topic} />{filter === 'Latest' && i === 1 && <div className="ad-space" aria-label="Advertisement placeholder">Advertisement</div>}</div>)}</section>}
          {filtered.length === 0 && <div className="empty-state">{filter === 'Following' ? <Alert24Regular /> : <Bookmark24Regular />}<h2>{filter === 'Following' ? 'Your conversations, together.' : 'A good discussion is worth keeping.'}</h2><p>{filter === 'Following' ? 'Follow a discussion from its options menu to see it here.' : 'Save a discussion to find it here later.'}</p><button className="text-button" onClick={() => setFilter('Latest')}>Explore the latest</button></div>}
          <p className="feed-end">You’re all caught up with this preview.</p>
        </main></MobileScroll></div>
      </section>
      <section className={`tab-screen ${tab !== 'Forums' || thread ? 'inactive-screen' : ''}`} aria-label="Forums">
        <MobileScroll><main className="standard-content"><div className="page-intro"><span className="eyebrow">FIND YOUR PEOPLE</span><h1>{category || 'A place for every question.'}</h1><p>{category ? forums.find(f => f.name === category)?.description : 'Explore the WindowsForum community.'}</p></div>
          {category ? <><button className="primary-button category-compose" onClick={() => { setDraftCategory(category); edit('new'); }}><Add24Regular />Start a discussion</button>{topics.filter(t => t.category === category).map(topic => <TopicRow key={topic.id} topic={topic} />)}</> : forums.map(forum => {
            const Icon = forum.icon === 'help' ? ChatMultiple24Regular : forum.icon === 'apps' ? Apps24Regular : forum.icon === 'desktop' ? Desktop24Regular : forum.icon === 'light' ? Lightbulb24Regular : Laptop24Regular;
            return <button className="forum-row" key={forum.name} onClick={() => setCategory(forum.name)}><span className={`forum-icon avatar-${forum.color}`}><Icon /></span><span><strong>{forum.name}</strong><span>{forum.description}</span></span><ChevronRight24Regular /></button>;
          })}
          {!category && <div className="community-note"><Chat24Regular /><p>Real questions. Shared experience.<br />A community built around helping.</p></div>}
        </main></MobileScroll>
      </section>
      <section className={`tab-screen ai-screen ${tab !== 'Ask AI' || thread ? 'inactive-screen' : ''}`} aria-label="Ask AI">
        <MobileScroll><main className="ai-content"><div className="ai-intro"><span className="ai-mark"><Sparkle24Regular /></span><span className="eyebrow">WINDOWSFORUM AI</span><h1>Let’s figure it out.</h1><p>A starting point for your Windows questions,<br />with the community close by.</p></div>
          {!aiQuestion ? <div className="suggestions">{['Help me troubleshoot Wi-Fi', 'Find a discussion about backups', 'What can I do with PowerToys?'].map(prompt => <button key={prompt} onClick={() => askAI(prompt)}>{prompt}<ChevronRight24Regular /></button>)}</div> : <div className="ai-conversation"><div className="question-bubble">{aiQuestion}</div><div className="ai-answer"><span className="answer-label"><Sparkle24Regular />{aiLoading ? 'Thinking…' : 'Sample answer'}</span>{aiLoading ? <p role="status">Putting together a starting point…</p> : <><p>Start with a few details: your Windows version, your device model, and what changed before the issue appeared.</p><p>The community can help narrow it down. Here’s a sample discussion to explore:</p><button className="related-topic" onClick={() => openThread(topics[0])}><Chat24Regular /><span>{topics[0].title}</span><ChevronRight24Regular /></button></>}</div></div>}
          <p className="ai-disclosure">Preview conversation · Sample responses</p>
        </main></MobileScroll>
        <form className="ai-composer" style={{ bottom: bottomInset + 70 }} onSubmit={event => { event.preventDefault(); askAI(); }}><KeyboardInput aria-label="Ask a Windows question" placeholder="Ask a Windows question…" value={aiText} onChange={event => setAiText(event.target.value)} /><button type="submit" className="send-button" aria-label="Send question" disabled={!aiText.trim()}><ArrowUp24Regular /></button></form>
      </section>
      <section className={`tab-screen ${tab !== 'Inbox' || thread ? 'inactive-screen' : ''}`} aria-label="Inbox">
        <MobileScroll><main className="standard-content"><div className="page-intro inbox-intro"><div><h1>Your inbox</h1><p>Keep the conversation going.</p></div><button type="button" className="text-button" disabled={alertsRead.length === sampleAlerts.length} onClick={() => { setAlertsRead(sampleAlerts.map(a => a.id)); setToast('All notifications marked read'); }}>Mark all read</button></div><h2 className="section-heading">Today</h2>
          {sampleAlerts.map(alert => <button key={alert.id} className={`alert-row ${alertsRead.includes(alert.id) ? '' : 'unread-alert'}`} onClick={() => { setAlertsRead(prev => [...new Set([...prev, alert.id])]); const topic = topics.find(t => t.id === alert.topic); if (topic) openThread(topic); }}><Avatar initials={alert.initials} color={alert.color} /><span><strong>{alert.author}</strong><span className="alert-action">{alert.action}</span><span className="alert-title">{alert.title}</span><time>{alert.time}</time></span>{!alertsRead.includes(alert.id) && <span className="unread-dot" aria-label="Unread" />}</button>)}
          <p className="feed-end">That’s everything for now.</p>
        </main></MobileScroll>
      </section>
      {thread && <section className="tab-screen thread-screen" aria-label="Discussion reader" onScrollCapture={trackReading} onPointerDownCapture={() => { jumpTarget.current = null; }} onWheelCapture={() => { jumpTarget.current = null; }}>
        <MobileScroll key={thread.id}><main className="thread-content"><div className="thread-intro"><span className="eyebrow">{thread.category}</span><h1>{thread.title}</h1><p>{thread.author} <span aria-hidden="true">·</span> {thread.time} <span aria-hidden="true">·</span> {thread.replies} replies</p>{thread.solved && <span className="solved-label"><Checkmark24Regular />Solved discussion</span>}</div>
          <article id="post-1" data-post="1" className="post"><div className="post-author"><Avatar initials={thread.initials} color={thread.color} /><span><strong>{thread.author}</strong><span>Community member</span></span><span className="post-number">#1</span></div><p>{thread.body}</p><div className="post-actions"><button aria-pressed={liked.includes(`${thread.id}:1`)} onClick={() => setLiked(prev => prev.includes(`${thread.id}:1`) ? prev.filter(x => x !== `${thread.id}:1`) : [...prev, `${thread.id}:1`])}><ThumbLike24Regular />{liked.includes(`${thread.id}:1`) ? 'Liked' : 'Like'}</button><button onClick={() => { setDrafts(prev => ({ ...prev, [`reply:${thread.id}`]: [prev[`reply:${thread.id}`]?.trim(), `“${thread.body}”`].filter(Boolean).join('\n\n') + '\n\n' })); edit('reply'); }}><Chat24Regular />Quote</button></div></article>
          {thread.response && <><div className="new-reply-marker">Latest reply</div><article id="post-2" data-post="2" className="post"><div className="post-author"><Avatar initials="MK" color="purple" /><span><strong>Morgan K.</strong><span>Community member</span></span><span className="post-number">#2</span></div><p>{thread.response}</p><div className="post-actions"><button aria-pressed={liked.includes(`${thread.id}:2`)} onClick={() => setLiked(prev => prev.includes(`${thread.id}:2`) ? prev.filter(x => x !== `${thread.id}:2`) : [...prev, `${thread.id}:2`])}><ThumbLike24Regular />{liked.includes(`${thread.id}:2`) ? 'Liked' : 'Like'}</button><button onClick={() => edit('reply')}><Chat24Regular />Reply</button></div></article></>}
          {threadReplies.map((reply, i) => <article key={reply.id} id={`post-${i + basePostCount + 1}`} data-post={i + basePostCount + 1} className="post own-post"><div className="post-author"><Avatar initials="A" /><span><strong>Alex <span className="you-label">You</span></strong><span>Just now · Preview reply</span></span><span className="post-number">#{i + basePostCount + 1}</span></div><p>{reply.body}</p></article>)}
          <p className="thread-sample-note">Sample discussion · {postCount} preview posts</p>
        </main></MobileScroll>
        <div className="reading-dock" style={{ paddingBottom: bottomInset }}><button className="icon-button" aria-label="Jump to first post" onClick={() => jumpTo(1)}><ArrowUp24Regular /></button><button className="post-counter" aria-label="Jump to a post" onClick={() => showSheet('jump')}>{currentPost}<span> / {postCount}</span></button><button className="icon-button" aria-label="Jump to latest reply" onClick={() => jumpTo(postCount)}><ArrowDown24Regular /></button><button className="primary-button reply-button" onClick={() => edit('reply')}><Chat24Regular />Reply</button></div>
      </section>}
      {!thread && <nav className="bottom-nav" aria-label="Main navigation" style={{ paddingBottom: bottomInset }}>{navItems.map(({ label, Icon }) => <button key={label} type="button" aria-current={tab === label ? 'page' : undefined} onClick={() => switchTab(label)}><span className="nav-icon"><Icon />{label === 'Inbox' && sampleAlerts.length > alertsRead.length && <span className="notification-badge">{sampleAlerts.length - alertsRead.length}</span>}</span><span>{label}</span></button>)}</nav>}
      {toast && <div className="toast" role="status" style={{ bottom: bottomInset + 84 }}><Checkmark24Regular />{toast}</div>}
      {composer && <section className="compose-screen" aria-label={composer === 'new' ? 'New discussion composer' : 'Reply composer'}><form onSubmit={submitDraft}><div className="compose-header"><button type="button" className="icon-button" aria-label="Close composer and keep draft" onClick={closeComposer}><Dismiss24Regular /></button><h2>{composer === 'new' ? 'New discussion' : 'Your reply'}</h2><button type="submit" className="primary-button" disabled={!draft.trim() || composer === 'new' && !draftTitle.trim()}>Post</button></div>
        <div className="compose-scroll-wrap"><MobileScroll><div className="compose-fields">{composer === 'new' ? <><label className="field-label">Post in<select value={draftCategory} onChange={event => setDraftCategory(event.target.value)}>{forums.map(f => <option key={f.name}>{f.name}</option>)}</select></label><label className="field-label">Discussion title<KeyboardInput placeholder="What would you like to discuss?" value={draftTitle} onChange={event => setDraftTitle(event.target.value)} maxLength={150} /></label></> : <div className="reply-context"><span>Replying to</span><strong>{thread?.title}</strong></div>}<label className="field-label">{composer === 'new' ? 'Your message' : 'Your reply'}<KeyboardTextarea placeholder="Share the details. The community is here to help." value={draft} onChange={event => setDrafts(prev => ({ ...prev, [activeDraftKey]: event.target.value }))} rows={8} maxLength={10000} /></label></div></MobileScroll></div><div className="compose-footer" style={{ bottom: bottomInset }}><span>{draft.length.toLocaleString()} / 10,000</span><p>Preview only. Nothing is sent to the forum.</p></div></form></section>}
      <BottomSheet open={sheet !== null} onOpenChange={open => { if (!open) { keyboard.hide(); setSheet(null); } }} title={sheet === 'account' ? 'Make yourself at home' : sheet === 'search' ? 'Search the community' : sheet === 'jump' ? 'Jump to a post' : 'Discussion options'} description={sheet === 'account' ? 'Your account and appearance preferences.' : sheet === 'search' ? 'Find a discussion in this preview.' : sheet === 'jump' ? 'Pick up the conversation where you want.' : 'Keep this discussion close.'} snap={sheet === 'search' ? 0.85 : 0.62}>
        <button className="sheet-close icon-button" type="button" aria-label="Close panel" onClick={() => { keyboard.hide(); setSheet(null); }}><Dismiss24Regular /></button>
        {sheet === 'account' && <div className="account-sheet"><div className="account-card"><Avatar initials="A" /><span><strong>Alex</strong><span>Preview account</span></span></div><h3>Appearance</h3><div className="theme-options">{([{ value: 'light', label: 'Light', Icon: WeatherSunny24Regular }, { value: 'dark', label: 'Dark', Icon: WeatherMoon24Regular }, { value: 'system', label: 'System', Icon: Desktop24Regular }] as const).map(({ value, label, Icon }) => <button key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}><Icon />{label}{theme === value && <Checkmark24Regular />}</button>)}</div><p className="sheet-help">Your appearance preference stays with this browser.</p><div className="account-link"><Bookmark24Regular /><button onClick={() => { switchTab('Feed'); setFilter('Saved'); }}>Saved discussions</button><ChevronRight24Regular /></div></div>}
        {sheet === 'search' && <div className="search-sheet"><div className="search-field"><Search24Regular /><KeyboardInput aria-label="Search preview discussions" placeholder="Search discussions…" value={query} onChange={event => setQuery(event.target.value)} /></div><span className="search-count">{query ? `${resultTopics.length} results` : 'Recent discussions'}</span><div className="search-results">{resultTopics.map(topic => <button key={topic.id} onClick={() => openThread(topic)}><Chat24Regular /><span><strong>{topic.title}</strong><small>{topic.category}</small></span><ChevronRight24Regular /></button>)}{!resultTopics.length && <div className="empty-state"><Search24Regular /><h2>No discussions found</h2><p>Try “Wi-Fi”, “backup”, or “desktop”.</p></div>}</div></div>}
        {sheet === 'actions' && thread && <div className="action-list"><button onClick={() => { toggleSaved(); setSheet(null); }}><Bookmark24Regular />{saved.includes(thread.id) ? 'Remove from Saved' : 'Save discussion'}</button><button onClick={() => { setTopics(prev => prev.map(t => t.id === thread.id ? { ...t, following: !t.following } : t)); setSheet(null); setToast(thread.following ? 'No longer following' : 'Following this discussion'); }}><Alert24Regular />{thread.following ? 'Unfollow discussion' : 'Follow discussion'}</button><button onClick={() => jumpTo(postCount)}><ArrowDown24Regular />Go to latest reply</button></div>}
        {sheet === 'jump' && <div className="action-list">{Array.from({ length: postCount }, (_, i) => <button key={i} aria-current={currentPost === i + 1 ? 'true' : undefined} onClick={() => jumpTo(i + 1)}><span className="jump-number">{i + 1}</span><span>{i === 0 ? 'Opening post' : i < basePostCount ? 'Latest community reply' : 'Your preview reply'}</span>{currentPost === i + 1 && <Checkmark24Regular />}</button>)}</div>}
      </BottomSheet>
    </div>
  </>;
}
