'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import '../dash.css';
import './ssp.css';

// ─── LESSON BANK (facilitator-only) ───────────────────────────────────────────
const LESSONS = [
  {
    key: 'lesson_1', num: 1,
    title: 'What Brotherhood Really Means',
    questions: [
      'In your own words, what does brotherhood mean to you — not the textbook definition, what does it actually mean?',
      'Can you give me an example of a time you felt you truly represented your brothers well?',
      'What does it mean to you personally that your actions affect every member of this chapter?',
    ],
    points: [
      'Brotherhood is responsibility, not just friendship.',
      'Wearing letters means representing something bigger than yourself.',
      'Trust: how one person\'s actions affect the entire group unit.',
    ],
  },
  {
    key: 'lesson_2', num: 2,
    title: 'Respect: The Foundation of Character',
    questions: [
      'What does respect actually look like in practice — give me a specific example.',
      'Was the incident that led to your violation a moment of disrespect? To whom?',
      'What would you do differently if that situation happened again tomorrow?',
    ],
    points: [
      'Respect for your brothers.',
      'Respect for women.',
      'Respect for property and shared spaces.',
      'Respect in disagreement.',
    ],
  },
  {
    key: 'lesson_3', num: 3,
    title: 'Accountability: Owning Your Actions',
    questions: [
      'What is the difference between an explanation and an excuse? Which did you give when this happened?',
      'Have you actually apologised to anyone affected — and if so, what did you say?',
      'What specific action — not a promise, an action — have you taken since the violation?',
    ],
    points: [
      'The difference between an explanation and an excuse.',
      'Apology vs. actual change.',
      'Consequences are part of growth.',
      'Trust is rebuilt through consistent actions, not words.',
    ],
  },
  {
    key: 'lesson_4', num: 4,
    title: 'Public Behavior = Public Representation',
    questions: [
      'When you were involved in this incident, were you representing the fraternity whether you intended to or not?',
      'If someone outside the chapter saw what happened, what would they think of KΘΦ II?',
      'How do you think your brothers felt when they found out?',
    ],
    points: [
      'You are never "just yourself" in public when you wear the letters.',
      'Social media, parties, and campus events all reflect on the chapter.',
      'One moment can define an entire chapter\'s reputation.',
      'Pride vs. embarrassment — the choice is always yours.',
    ],
  },
  {
    key: 'lesson_5', num: 5,
    title: 'Emotional Control & Decision Making',
    questions: [
      'Walk me through the moment you made the decision that led to this. What were you thinking?',
      'Was there a point where you could have stopped? What would have had to happen for you to stop?',
      'What does self-control look like for you personally going forward?',
    ],
    points: [
      'Anger, ego, and peer pressure are not excuses.',
      'Think past the moment — consider what comes after.',
      'Strength is self-control, not reaction.',
      'Pause. Think. Choose.',
    ],
  },
  {
    key: 'lesson_6', num: 6,
    title: 'Rebuilding Trust',
    questions: [
      'Do you feel like your brothers trust you the same way they did before this? Why or why not?',
      'What does rebuilding that trust look like — specifically, what are you going to do?',
      'If a newer member came to you with a similar situation, what would you tell them?',
    ],
    points: [
      'Trust is earned back slowly — there are no shortcuts.',
      'Actions speak louder than apologies.',
      'Being an example going forward is the only true measure of change.',
    ],
  },
];

const REFLECTIONS = {
  key: 'reflections_done',
  title: 'Final Reflection',
  questions: [
    'Looking back at all six sessions — what was the hardest thing to sit with?',
    'What has genuinely changed in how you think about your role in this chapter?',
    'What would you say to yourself right before the incident happened, if you could go back?',
  ],
};

const COLORS: Record<string, string> = {
  grey: '#a0a0b4', navy_blue: '#3c64c8', gold: '#c6930a', crimson_red: '#e05070',
};

function completedCount(ssp: any) {
  return LESSONS.filter(l => ssp[l.key]).length;
}
function progressPct(ssp: any) {
  return Math.round(((completedCount(ssp) + (ssp.reflections_done ? 1 : 0)) / 7) * 100);
}
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function SSPPage() {
  const [member, setMember]       = useState<any>(null);
  const [canManage, setCanManage] = useState(false);
  const [ssps, setSsps]           = useState<any[]>([]);
  const [active, setActive]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  // Facilitator session state
  const [sessionLesson, setSessionLesson] = useState<string | null>(null);
  const [sessionNote, setSessionNote]     = useState('');
  const [sessionPassed, setSessionPassed] = useState(true);
  const [saving, setSaving]               = useState('');
  const [sessionLogs, setSessionLogs]     = useState<any[]>([]);

  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
    { href: '/dashboard/edit', label: 'Edit Profile' },
  ];

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
    });
  }, []);

  useEffect(() => {
    if (!member) return;
    const manage = member.fraction === 'Ishi No Fraction' || member.role === 'Head Founder' || member.role === 'Co-Founder';
    setCanManage(manage);
    loadSSPs(manage);
  }, [member]);

  async function loadSSPs(manage: boolean) {
    const url = manage ? '/api/dashboard/ssp?view=all' : '/api/dashboard/ssp';
    const d = await fetch(url).then(r => r.json());
    setSsps(d.ssps || []);
    if (d.ssps?.length && !active) setActive(d.ssps[0].id);
    setLoading(false);
  }

  async function loadSessionLogs(sspId: string) {
    const d = await fetch(`/api/dashboard/ssp/sessions?ssp_id=${sspId}`).then(r => r.json());
    setSessionLogs(d.logs || []);
  }

  useEffect(() => {
    if (active && canManage) loadSessionLogs(active);
  }, [active, canManage]);

  async function conductSession(sspId: string, lessonKey: string, passed: boolean, note: string) {
    setSaving(lessonKey);
    await fetch('/api/dashboard/ssp/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: sspId, lesson_key: lessonKey, passed, private_notes: note })
    });
    // Mark lesson as done on the record
    await fetch('/api/dashboard/ssp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: sspId, [lessonKey]: true, [`${lessonKey}_notes`]: note })
    });
    setSessionLesson(null);
    setSessionNote('');
    setSessionPassed(true);
    setSaving('');
    await loadSSPs(true);
    await loadSessionLogs(sspId);
  }

  async function clearBrother(sspId: string) {
    if (!confirm('Mark this Sage Solution as fully completed and dismiss all charges?')) return;
    setSaving('clear');
    await fetch('/api/dashboard/ssp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssp_id: sspId, cleared: true })
    });
    setSaving('');
    await loadSSPs(true);
  }

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const currentSsp = ssps.find(s => s.id === active);
  const allDone = currentSsp && completedCount(currentSsp) === 6 && currentSsp.reflections_done;

  if (!member || loading) return <div className="dash-loading">LOADING...</div>;

  // ─── BROTHER VIEW (not facilitator) ────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="dash-app">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
          <div className="dash-sidebar-member">
            <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e: any) => e.target.src = '/logo.png'} /></div>
            <div className="dash-sidebar-name">{member.frat_name}</div>
            <div className="dash-sidebar-role">{member.role}</div>
          </div>
          <nav className="dash-nav">
            {NAV.map(n => <a key={n.href} href={n.href} className="dash-nav-item"><span>{n.label}</span></a>)}
            <div className="dash-nav-divider" />
            <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
            <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }} className="dash-nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#e05070', fontFamily: 'inherit' }}><span>Sign Out</span></button>
          </nav>
        </aside>
        <main className="dash-main">
          <div className="ssp-hero">
            <div className="ssp-hero-title">Sage Solution Program</div>
            <div className="ssp-hero-sub">Your participation is tracked by Ishi No Faction leadership</div>
          </div>
          {ssps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              You have no active Sage sessions.
            </div>
          ) : (
            <div style={{ maxWidth: '560px', margin: '2rem auto', padding: '0 1.5rem' }}>
              {ssps.map(ssp => (
                <div key={ssp.id} className="ssp-brother-card">
                  <div className="ssp-brother-header">
                    <div>
                      <div className="ssp-brother-title">Sage Solution — Offer {ssp.offer_number} of 3</div>
                      <div className="ssp-brother-offense" style={{ color: COLORS[ssp.violation?.offense_color] || 'var(--muted)' }}>
                        {ssp.violation?.offense_color?.replace('_', ' ').toUpperCase()} CARD
                      </div>
                    </div>
                    <span className={`ssp-status-badge ${ssp.cleared ? 'cleared' : ssp.status}`}>
                      {ssp.cleared ? 'Completed' : ssp.status === 'opted_out' ? 'Opted Out' : ssp.status === 'enrolled' ? 'Enrolled' : 'In Progress'}
                    </span>
                  </div>

                  <div className="ssp-brother-progress">
                    <div className="ssp-brother-bar">
                      <div className="ssp-brother-bar-fill" style={{ width: `${progressPct(ssp)}%`, background: ssp.cleared ? '#4ade80' : 'var(--gold)' }} />
                    </div>
                    <div className="ssp-brother-pct">{progressPct(ssp)}%</div>
                  </div>

                  <div className="ssp-brother-steps">
                    {LESSONS.map(l => (
                      <div key={l.key} className={`ssp-brother-step ${ssp[l.key] ? 'done' : ''}`}>
                        <span className="ssp-brother-step-dot">{ssp[l.key] ? '✓' : '○'}</span>
                        <span>Session {l.num}: {l.title}</span>
                      </div>
                    ))}
                    <div className={`ssp-brother-step ${ssp.reflections_done ? 'done' : ''}`}>
                      <span className="ssp-brother-step-dot">{ssp.reflections_done ? '✓' : '○'}</span>
                      <span>Final Reflection</span>
                    </div>
                  </div>

                  <div className="ssp-brother-notice">
                    <span>⚓</span>
                    <span>Each session is conducted in-person with an Ishi No Faction member. Attend when called and engage honestly.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── FACILITATOR VIEW (Ishi No Faction) ─────────────────────────────────────
  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo"><img src="/logo.png" alt="KΘΦ II" /><span className="dash-sidebar-logo-text">KΘΦ II</span></div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait"><img src={`/brothers/${slug}.png`} alt="" onError={(e: any) => e.target.src = '/logo.png'} /></div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => <a key={n.href} href={n.href} className="dash-nav-item"><span>{n.label}</span></a>)}
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && (
            <a href="/dashboard/dues-report" className="dash-nav-item"><span>Dues Report</span></a>
          )}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login'; }} className="dash-nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#e05070', fontFamily: 'inherit' }}><span>Sign Out</span></button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="ssp-hero">
          <div className="ssp-hero-title">Sage Solution Program</div>
          <div className="ssp-hero-sub">Facilitator View — Conduct sessions in-person, questions are confidential</div>
        </div>

        {ssps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>No active Sage Solution records.</div>
        ) : (
          <div className="ssp-layout">
            {/* LEFT: roster */}
            <div className="ssp-roster">
              <div className="ssp-roster-label">Active Programs</div>
              {ssps.map(ssp => (
                <div key={ssp.id}
                  className={`ssp-roster-item ${active === ssp.id ? 'active' : ''} ${ssp.cleared ? 'cleared' : ''}`}
                  onClick={() => setActive(ssp.id)}>
                  <div className="ssp-roster-name">{ssp.member_name}</div>
                  <div className="ssp-roster-meta">
                    <span style={{ color: COLORS[ssp.violation?.offense_color] || 'var(--muted)' }}>
                      {ssp.violation?.offense_color?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span>{progressPct(ssp)}%</span>
                  </div>
                  <div className="ssp-roster-bar">
                    <div className="ssp-roster-bar-fill" style={{ width: `${progressPct(ssp)}%`, background: ssp.cleared ? '#4ade80' : 'var(--gold)' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT: session panel */}
            {currentSsp && (
              <div className="ssp-panel">
                <div className="ssp-panel-header">
                  <div>
                    <div className="ssp-panel-name">{currentSsp.member_name}</div>
                    <div className="ssp-panel-sub">
                      Offer {currentSsp.offer_number} of 3 · {progressPct(currentSsp)}% complete
                      {currentSsp.cleared && <span style={{ color: '#4ade80', marginLeft: '8px' }}>✓ Cleared</span>}
                    </div>
                  </div>
                  {allDone && !currentSsp.cleared && (
                    <button className="ssp-clear-btn" onClick={() => clearBrother(currentSsp.id)} disabled={saving === 'clear'}>
                      {saving === 'clear' ? 'Clearing...' : '✓ Clear & Dismiss Charges'}
                    </button>
                  )}
                </div>

                {/* Lesson cards */}
                <div className="ssp-lessons">
                  {[...LESSONS, { ...REFLECTIONS, num: 7, points: [] }].map((lesson: any) => {
                    const isDone = currentSsp[lesson.key];
                    const isOpen = sessionLesson === lesson.key;
                    const log = sessionLogs.find(l => l.lesson_key === lesson.key);

                    return (
                      <div key={lesson.key} className={`ssp-lesson-card ${isDone ? 'done' : ''} ${isOpen ? 'open' : ''}`}>
                        <div className="ssp-lesson-header" onClick={() => !isDone && setSessionLesson(isOpen ? null : lesson.key)}>
                          <div className="ssp-lesson-num">{isDone ? '✓' : lesson.num}</div>
                          <div className="ssp-lesson-info">
                            <div className="ssp-lesson-title">{lesson.title}</div>
                            {isDone && log && (
                              <div className="ssp-lesson-log">
                                Conducted by {log.facilitator_name} · {timeAgo(log.session_at)}
                                {log.passed === false && <span style={{ color: '#e05070', marginLeft: '6px' }}>· Did not pass</span>}
                              </div>
                            )}
                            {isDone && log?.private_notes && (
                              <div className="ssp-lesson-note">📝 {log.private_notes}</div>
                            )}
                          </div>
                          {!isDone && (
                            <button className="ssp-lesson-conduct-btn" onClick={(e) => { e.stopPropagation(); setSessionLesson(isOpen ? null : lesson.key); setSessionNote(''); setSessionPassed(true); }}>
                              {isOpen ? 'Cancel' : 'Conduct Session'}
                            </button>
                          )}
                        </div>

                        {/* Expanded: questions + conduct form */}
                        {isOpen && (
                          <div className="ssp-lesson-body">
                            {lesson.points?.length > 0 && (
                              <div className="ssp-lesson-topics">
                                <div className="ssp-lesson-topics-label">Topics to cover</div>
                                {lesson.points.map((p: string, i: number) => (
                                  <div key={i} className="ssp-lesson-topic-item">· {p}</div>
                                ))}
                              </div>
                            )}

                            <div className="ssp-lesson-questions">
                              <div className="ssp-lesson-questions-label">⚠ Ask these questions verbally — do not share with the brother</div>
                              {lesson.questions.map((q: string, i: number) => (
                                <div key={i} className="ssp-lesson-q">
                                  <span className="ssp-lesson-q-num">{i + 1}</span>
                                  <span>{q}</span>
                                </div>
                              ))}
                            </div>

                            <div className="ssp-conduct-form">
                              <div className="ssp-conduct-label">Session outcome</div>
                              <div className="ssp-conduct-pass-row">
                                <button className={`ssp-conduct-pass ${sessionPassed ? 'active' : ''}`} onClick={() => setSessionPassed(true)}>✓ Passed</button>
                                <button className={`ssp-conduct-fail ${!sessionPassed ? 'active' : ''}`} onClick={() => setSessionPassed(false)}>✗ Did not pass</button>
                              </div>
                              <textarea
                                className="ssp-conduct-notes"
                                placeholder="Private notes (not visible to the brother)..."
                                value={sessionNote}
                                onChange={e => setSessionNote(e.target.value)}
                                rows={3}
                              />
                              <button
                                className="ssp-conduct-submit"
                                disabled={!!saving}
                                onClick={() => conductSession(currentSsp.id, lesson.key, sessionPassed, sessionNote)}>
                                {saving === lesson.key ? 'Saving...' : 'Mark Session Complete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Session history */}
                {sessionLogs.length > 0 && (
                  <div className="ssp-history">
                    <div className="ssp-history-label">Session History</div>
                    {sessionLogs.map(log => (
                      <div key={log.id} className="ssp-history-item">
                        <div className="ssp-history-lesson">{LESSONS.find(l => l.key === log.lesson_key)?.title || 'Final Reflection'}</div>
                        <div className="ssp-history-meta">
                          {log.facilitator_name} · {timeAgo(log.session_at)}
                          {log.passed === false && <span style={{ color: '#e05070' }}> · Did not pass</span>}
                        </div>
                        {log.private_notes && <div className="ssp-history-note">📝 {log.private_notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
