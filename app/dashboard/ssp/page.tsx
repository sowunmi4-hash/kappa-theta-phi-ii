'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../dash.css';
import './ssp.css';



const LESSONS = [
  {
    key: 'lesson_1',
    num: 1,
    title: 'What Brotherhood Really Means',
    points: [
      'Brotherhood is responsibility, not just friendship.',
      'Wearing letters means representing something bigger than yourself.',
      'Trust: how one person\'s actions affect the entire group unit.',
    ],
  },
  {
    key: 'lesson_2',
    num: 2,
    title: 'Respect: The Foundation of Character',
    points: [
      'Respect for your brothers.',
      'Respect for women.',
      'Respect for property and shared spaces.',
      'Respect in disagreement.',
    ],
  },
  {
    key: 'lesson_3',
    num: 3,
    title: 'Accountability: Owning Your Actions',
    points: [
      'The difference between an explanation and an excuse.',
      'Apology vs. actual change.',
      'Consequences are part of growth.',
      'Trust is rebuilt through consistent actions, not words.',
    ],
  },
  {
    key: 'lesson_4',
    num: 4,
    title: 'Public Behavior = Public Representation',
    points: [
      'You are never "just yourself" in public when you wear the letters.',
      'Social media, parties, and campus events all reflect on the chapter.',
      'One moment can define an entire chapter\'s reputation.',
      'Pride vs. embarrassment — the choice is always yours.',
    ],
  },
  {
    key: 'lesson_5',
    num: 5,
    title: 'Emotional Control & Decision Making',
    points: [
      'Anger, ego, and peer pressure are not excuses.',
      'Think past the moment — consider what comes after.',
      'Strength is self-control, not reaction.',
      'Pause. Think. Choose.',
    ],
  },
  {
    key: 'lesson_6',
    num: 6,
    title: 'Rebuilding Trust',
    points: [
      'Trust is earned back slowly — there are no shortcuts.',
      'Actions speak louder than apologies.',
      'Being an example going forward is the only true measure of change.',
    ],
  },
];

const COLORS: Record<string,string> = {
  grey: '#a0a0b4',
  navy_blue: '#3c64c8',
  gold: '#c6930a',
  crimson_red: '#e05070',
};

const COLOR_LABELS: Record<string,string> = {
  grey: 'Grey',
  navy_blue: 'Navy Blue',
  gold: 'Gold',
  crimson_red: 'Crimson Red',
};

export default function SSPPage() {
  const [member, setMember]   = useState<any>(null);
  const [ssps, setSsps]       = useState<any[]>([]);
  const [active, setActive]   = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  const NAV = [
    { href: '/dashboard',            label: 'Home' },
    { href: '/dashboard/news',       label: 'Wokou News' },
    { href: '/dashboard/events',     label: 'Events' },
    { href: '/dashboard/phire',      label: 'PHIRE' },
    { href: '/dashboard/discipline', label: 'Discipline' },
    { href: '/dashboard/gallery',    label: 'My Gallery' },
    { href: '/dashboard/edit',       label: 'Edit Profile' },
  ];

  useEffect(() => {
    fetch('/api/dashboard/ssp').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
      setSsps(d.ssps || []);
      // Auto-select the first active (enrolled) SSP
      const enrolled = d.ssps?.find((s:any) => s.status === 'enrolled');
      if (enrolled) setActive(enrolled.id);
      else if (d.ssps?.length > 0) setActive(d.ssps[0].id);
      setLoading(false);
    });
  }, []);

  const slug    = member?.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = `/brothers/${slug}.png`;

  const currentSsp = ssps.find(s => s.id === active);

  function completedCount(ssp: any) {
    return LESSONS.filter(l => ssp[l.key]).length;
  }

  function progressPct(ssp: any) {
    const lessons = completedCount(ssp);
    const reflections = ssp.reflections_done ? 1 : 0;
    return Math.round(((lessons + reflections) / 7) * 100);
  }

  if (loading) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={portrait} alt="" onError={(e:any) => e.target.src = '/logo.png'} />
          </div>
          <div className="dash-sidebar-name">{member?.frat_name}</div>
          <div className="dash-sidebar-role">{member?.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href}
          {(member?.fraction === 'Ishi No Fraction' || member?.frat_name === 'Big Brother Substance') && <a href="/dashboard/dues-report" className="dash-nav-item"><span>Dues Report</span></a>} href={n.href} className="dash-nav-item">
              <span>{n.label}</span>
            </a>
          ))}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
            <button onClick={async()=>{await fetch('/api/logout',{method:'POST'});window.location.href='/login';}} className="dash-nav-item" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'#e05070',fontFamily:'inherit'}}><span>Sign Out</span></button>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="ssp-wrap">

          {/* Header */}
          <div className="ssp-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <a href="/dashboard/discipline" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.75rem', letterSpacing: '2px' }}>← Discipline</a>
            </div>
            <div className="ssp-page-title">Sage Solution Program</div>
            <div className="ssp-page-sub">
              A six-lesson program in brotherhood, character, accountability, and growth.
            </div>
          </div>

          {ssps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              You have not been enrolled in the Sage Solution Program.
            </div>
          ) : (
            <div className="ssp-layout">

              {/* Left: SSP session list */}
              <div className="ssp-sessions">
                <div className="ssp-sessions-label">Your Sessions</div>
                {ssps.map(ssp => (
                  <div
                    key={ssp.id}
                    className={`ssp-session-item ${active === ssp.id ? 'active' : ''} ${ssp.cleared ? 'cleared' : ''}`}
                    onClick={() => setActive(ssp.id)}
                  >
                    <div className="ssp-session-offense" style={{ color: COLORS[ssp.violation?.offense_color] || 'var(--muted)' }}>
                      {COLOR_LABELS[ssp.violation?.offense_color] || 'Unknown'} Offense
                    </div>
                    <div className="ssp-session-status">
                      {ssp.cleared ? 'Cleared' : ssp.status.replace('_', ' ')}
                    </div>
                    <div className="ssp-session-offer">Offer {ssp.offer_number} of 3</div>
                    {/* Mini progress bar */}
                    <div className="ssp-session-bar">
                      <div className="ssp-session-bar-fill" style={{ width: `${progressPct(ssp)}%`, background: ssp.cleared ? '#4ade80' : 'var(--gold)' }} />
                    </div>
                    <div className="ssp-session-pct">{progressPct(ssp)}% complete</div>
                  </div>
                ))}
              </div>

              {/* Right: Active SSP detail */}
              {currentSsp && (
                <div className="ssp-detail">

                  {/* Status banner */}
                  {currentSsp.cleared ? (
                    <div className="ssp-banner cleared">
                      <div className="ssp-banner-title">Program Completed</div>
                      <div className="ssp-banner-sub">
                        All charges for this violation have been cleared.
                        {currentSsp.cleared_at && ` Cleared on ${new Date(currentSsp.cleared_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                      </div>
                    </div>
                  ) : currentSsp.status === 'opted_out' ? (
                    <div className="ssp-banner opted-out">
                      <div className="ssp-banner-title">Opted Out</div>
                      <div className="ssp-banner-sub">You opted out of this SSP session. Disciplinary action is at the discretion of the Sgt. at Arms.</div>
                    </div>
                  ) : currentSsp.status === 'offered' ? (
                    <div className="ssp-banner offered">
                      <div className="ssp-banner-title">SSP Offered — Awaiting Your Response</div>
                      <div className="ssp-banner-sub">
                        Go to your <a href="/dashboard/discipline" style={{ color: 'var(--gold)' }}>Discipline record</a> to accept or opt out.
                      </div>
                    </div>
                  ) : (
                    <div className="ssp-banner enrolled">
                      <div className="ssp-banner-title">Enrolled — Session In Progress</div>
                      <div className="ssp-banner-sub">
                        {completedCount(currentSsp)} of 6 lessons complete.
                        {currentSsp.reflections_done ? ' Reflections done.' : ' Reflections pending.'}
                        {completedCount(currentSsp) === 6 && currentSsp.reflections_done
                          ? ' All requirements met — awaiting leadership clearance.'
                          : ' Attend all sessions with leadership to complete the program.'}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="ssp-progress-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--muted)', textTransform: 'uppercase' }}>Progress</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700 }}>{progressPct(currentSsp)}%</span>
                    </div>
                    <div className="ssp-progress-bar">
                      <div className="ssp-progress-fill" style={{ width: `${progressPct(currentSsp)}%`, background: currentSsp.cleared ? '#4ade80' : 'var(--gold)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.65rem', color: 'rgba(240,232,208,0.3)' }}>
                      <span>{completedCount(currentSsp)}/6 lessons</span>
                      <span>{currentSsp.reflections_done ? 'Reflections done' : 'Reflections pending'}</span>
                    </div>
                  </div>

                  {/* Violation info */}
                  {currentSsp.violation && (
                    <div className="ssp-violation-ref">
                      <div className="ssp-violation-ref-label">Related Violation</div>
                      <div className="ssp-violation-ref-color" style={{ color: COLORS[currentSsp.violation.offense_color] }}>
                        {COLOR_LABELS[currentSsp.violation.offense_color]} Offense
                      </div>
                      <div className="ssp-violation-ref-items">
                        {currentSsp.violation.violations?.map((v: string, i: number) => (
                          <div key={i} className="ssp-violation-ref-item">{v}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completion standard */}
                  <div className="ssp-standard">
                    <div className="ssp-standard-title">Completion Standard</div>
                    <div className="ssp-standard-items">
                      <div className={`ssp-standard-item ${completedCount(currentSsp) === 6 ? 'done' : ''}`}>
                        <div className="ssp-check">{completedCount(currentSsp) === 6 ? 'x' : `${completedCount(currentSsp)}/6`}</div>
                        Attend all 6 sessions
                      </div>
                      <div className={`ssp-standard-item ${currentSsp.reflections_done ? 'done' : ''}`}>
                        <div className="ssp-check">{currentSsp.reflections_done ? 'x' : 'R'}</div>
                        Complete reflection exercises
                      </div>
                      <div className="ssp-standard-item" style={{ color: 'rgba(240,232,208,0.4)', fontSize: '0.75rem' }}>
                        <div className="ssp-check" style={{ opacity: 0.3 }}>+</div>
                        Participate honestly and show improved behavior over time
                      </div>
                    </div>
                    <div className="ssp-standard-note">
                      Completing this program clears all charges for the related violation. The SSP can only be offered 3 times total.
                    </div>
                  </div>

                  {/* The 6 Lessons */}
                  <div className="ssp-lessons-title">The Six Lessons</div>
                  <div className="ssp-lessons">
                    {LESSONS.map(lesson => {
                      const done = !!currentSsp[lesson.key];
                      return (
                        <div key={lesson.key} className={`ssp-lesson-card ${done ? 'done' : ''}`}>
                          <div className="ssp-lesson-header">
                            <div className="ssp-lesson-num">{done ? 'x' : lesson.num}</div>
                            <div className="ssp-lesson-title-text">Lesson {lesson.num} — {lesson.title}</div>
                            {done && <div className="ssp-lesson-tag">Complete</div>}
                          </div>
                          <ul className="ssp-lesson-points">
                            {lesson.points.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}

                    {/* Reflections card */}
                    <div className={`ssp-lesson-card ${currentSsp.reflections_done ? 'done' : ''}`}>
                      <div className="ssp-lesson-header">
                        <div className="ssp-lesson-num">{currentSsp.reflections_done ? 'x' : 'R'}</div>
                        <div className="ssp-lesson-title-text">Reflection Exercises</div>
                        {currentSsp.reflections_done && <div className="ssp-lesson-tag">Complete</div>}
                      </div>
                      <ul className="ssp-lesson-points">
                        <li>Attend all sessions with full participation.</li>
                        <li>Complete all assigned reflection exercises honestly.</li>
                        <li>Demonstrate improved behavior over time.</li>
                        <li>Show that what was learned has been applied.</li>
                      </ul>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
