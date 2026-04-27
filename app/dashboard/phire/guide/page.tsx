'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';
import './guide.css';

const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet'];

const MEMBER_SECTIONS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'earning',   label: 'Earning Points' },
  { id: 'rewards',   label: 'Rewards' },
  { id: 'history',   label: 'Your History' },
  { id: 'faq',       label: 'FAQ' },
];

const LEADER_SECTIONS = [
  { id: 'approvals',   label: 'Approval Queue' },
  { id: 'activities',  label: 'Managing Activities' },
  { id: 'adjust',      label: 'Point Adjustments' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

export default function PhireGuide() {
  const [member, setMember]         = useState<any>(null);
  const [activeSection, setActive]  = useState('overview');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
    });
  }, []);

  if (!member) return <div className="dash-loading">LOADING...</div>;

  // Only computed after member is confirmed loaded
  const isLeader = LEADERS.includes(member.role);
  const slug     = member.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = `/brothers/${slug}.png`;
  const allSections = isLeader ? [...MEMBER_SECTIONS, ...LEADER_SECTIONS] : MEMBER_SECTIONS;

  const NAV = [
    { href: '/dashboard',         label: 'Home' },
    { href: '/dashboard/news',    label: 'Wokou News' },
    { href: '/dashboard/events',  label: 'Events' },
    { href: '/dashboard/phire',   label: 'PHIRE' },
    { href: '/dashboard/discipline', label: 'Discipline' },
  { href: '/dashboard/gallery', label: 'My Gallery' },
    { href: '/dashboard/edit',    label: 'Edit Profile' },
  ];

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="dash-app phire-root">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={portrait} alt="" onError={(e:any) => e.target.src='/logo.png'} />
          </div>
          <div className="dash-sidebar-name">{member.frat_name}</div>
          <div className="dash-sidebar-role">{member.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`dash-nav-item ${n.href==='/dashboard/phire'?'active':''}`}>
              <span>{n.label}</span>
            </a>
          ))}
          <div className="dash-nav-divider"/>
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="guide-wrap">

          <div className="guide-header">
            <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.5rem'}}>
              <a href="/dashboard/phire" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.75rem',letterSpacing:'2px'}}>← PHIRE</a>
            </div>
            <div className="guide-title">⚡ PHIRE System Guide</div>
            <div className="guide-subtitle">
              {isLeader
                ? `Leadership guide — includes brother sections and Iron Fleet / Founder management tools`
                : `Everything you need to know about earning points and redeeming rewards`}
            </div>
          </div>

          <div className="guide-layout">

            {/* Side nav */}
            <div className="guide-sidenav">
              <div className="guide-sidenav-title">Contents</div>

              <div className="guide-sidenav-group-label">For Brothers</div>
              {MEMBER_SECTIONS.map(s => (
                <button key={s.id} className={`guide-sidenav-item ${activeSection===s.id?'active':''}`} onClick={()=>scrollTo(s.id)}>
                  {s.label}
                </button>
              ))}

              {isLeader && (
                <>
                  <div className="guide-sidenav-divider"/>
                  <div className="guide-sidenav-group-label leader">Leadership</div>
                  {LEADER_SECTIONS.map(s => (
                    <button key={s.id} className={`guide-sidenav-item leader ${activeSection===s.id?'active':''}`} onClick={()=>scrollTo(s.id)}>
                      {s.label}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Content */}
            <div className="guide-content">

              {/* ── OVERVIEW ── */}
              <section id="overview" className="guide-section">
                <div className="guide-section-title">What is PHIRE?</div>
                <p className="guide-text">
                  PHIRE is KΘΦ II's official points and rewards system. Brothers earn points by logging fraternity activities — attending meetings, events, community service, and more. Accumulate enough points to unlock exclusive rewards from leadership.
                </p>
                <div className="guide-callout gold">
                  <div className="guide-callout-icon">⚡</div>
                  <div>
                    <div className="guide-callout-title">How it works in 3 steps</div>
                    <div className="guide-callout-text">Log an activity → Leadership approves it → Points land in your balance automatically</div>
                  </div>
                </div>
                <div className="guide-cards-row">
                  {[
                    { icon:'📋', label:'Submit',   desc:'Pick an activity from the list and submit it for review' },
                    { icon:'✅', label:'Approved', desc:'Iron Fleet or Founders review and approve your submission' },
                    { icon:'💎', label:'Earn',     desc:'Points are added to your balance instantly upon approval' },
                    { icon:'🎁', label:'Redeem',   desc:'Use your points to claim exclusive rewards from leadership' },
                  ].map(c => (
                    <div key={c.label} className="guide-info-card">
                      <div className="guide-info-icon">{c.icon}</div>
                      <div className="guide-info-label">{c.label}</div>
                      <div className="guide-info-desc">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── EARNING POINTS ── */}
              <section id="earning" className="guide-section">
                <div className="guide-section-title">Earning Points</div>
                <p className="guide-text">Head to <strong>PHIRE → Log Activity</strong>. Browse the activity list by category, select what you completed, and submit.</p>
                <div className="guide-step-list">
                  {[
                    { n:'1', title:'Go to Log Activity', desc:'From the PHIRE home page click <strong>⚡ Log Activity</strong>, or use the sidebar.' },
                    { n:'2', title:'Pick your activity',  desc:'Activities are grouped by category. Each shows its point value. Click to select — it highlights in red.' },
                    { n:'3', title:'Submit for approval', desc:'Click <strong>Submit for Approval</strong>. Leadership gets a bell notification immediately. Your submission shows as <em>Pending</em> in history.' },
                    { n:'4', title:'Wait for review',     desc:'Iron Fleet or a Founder will approve or deny. You get a bell notification either way. If approved, points are added instantly.' },
                  ].map(s => (
                    <div key={s.n} className="guide-step">
                      <div className="guide-step-num">{s.n}</div>
                      <div className="guide-step-body">
                        <div className="guide-step-title">{s.title}</div>
                        <div className="guide-step-desc" dangerouslySetInnerHTML={{__html: s.desc}} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="guide-callout crimson">
                  <div className="guide-callout-icon">⚠️</div>
                  <div>
                    <div className="guide-callout-title">Important rules</div>
                    <div className="guide-callout-text">You cannot submit the same activity twice while one is still pending. Only submit activities you actually completed — false submissions will be denied and noted by leadership.</div>
                  </div>
                </div>
                <div className="guide-table-wrap">
                  <div className="guide-table-title">Activity Categories</div>
                  <table className="guide-table">
                    <thead><tr><th>Category</th><th>Examples</th><th>Points</th></tr></thead>
                    <tbody>
                      {[
                        ['Attendance',  'Weekly Meeting, Fraternity Event',  '10 – 15 pts'],
                        ['Service',     'Community Service, Philanthropy',   '20 pts'],
                        ['Outreach',    'Social Media Post, Newsletter',     '10 – 15 pts'],
                        ['Recruitment', 'Successful Recruitment',            '50 pts'],
                        ['Leadership',  'Event Hosting, Mentorship Session', '20 – 25 pts'],
                        ['Training',    'Training Completion',               '15 pts'],
                      ].map(([cat, ex, pts]) => (
                        <tr key={cat}><td>{cat}</td><td>{ex}</td><td>{pts}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── REWARDS ── */}
              <section id="rewards" className="guide-section">
                <div className="guide-section-title">Reward Tiers</div>
                <p className="guide-text">Five reward tiers are available. Once your balance reaches a tier's threshold you can redeem it. After redemption each tier has a cooldown before you can redeem it again.</p>
                <div className="guide-tier-list">
                  {[
                    { name:'Bronze',   pts:300,  desc:'Facebook / Instagram post feature',     reset:'7 days',   colour:'#cd7f32' },
                    { name:'Silver',   pts:600,  desc:'Monthly Newsletter feature',            reset:'14 days',  colour:'#c0c0c0' },
                    { name:'Gold',     pts:1200, desc:'Custom KTP Trophy',                     reset:'30 days',  colour:'#c6930a' },
                    { name:'Platinum', pts:2400, desc:'Exclusive Website Interview',           reset:'90 days',  colour:'#e5e4e2' },
                    { name:'Diamond',  pts:4800, desc:'Custom KTP Plaque + Event Recognition', reset:'180 days', colour:'#b9f2ff' },
                  ].map(t => (
                    <div key={t.name} className="guide-tier-row">
                      <div className="guide-tier-badge" style={{color:t.colour, borderColor:t.colour+'44'}}>{t.name}</div>
                      <div style={{flex:1}}><div className="guide-tier-desc">{t.desc}</div></div>
                      <div className="guide-tier-pts" style={{color:t.colour}}>{t.pts.toLocaleString()} pts</div>
                      <div className="guide-tier-reset">🔄 {t.reset} cooldown</div>
                    </div>
                  ))}
                </div>
                <div className="guide-step-list" style={{marginTop:'1.5rem'}}>
                  {[
                    { n:'1', title:'Go to Rewards', desc:'Navigate to <strong>PHIRE → Rewards</strong>. Locked tiers show how many more points you need. Unlocked tiers show a <em>Redeem →</em> button.' },
                    { n:'2', title:'Click Redeem',  desc:'Hit <strong>Redeem →</strong>. This sends a redemption request to leadership — they get a bell notification immediately.' },
                    { n:'3', title:'Wait for approval', desc:'Leadership reviews your request. Once approved your points are deducted and you get a notification. Leadership will contact you to deliver the reward.' },
                  ].map(s => (
                    <div key={s.n} className="guide-step">
                      <div className="guide-step-num">{s.n}</div>
                      <div className="guide-step-body">
                        <div className="guide-step-title">{s.title}</div>
                        <div className="guide-step-desc" dangerouslySetInnerHTML={{__html: s.desc}} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="guide-callout gold">
                  <div className="guide-callout-icon">💡</div>
                  <div>
                    <div className="guide-callout-title">Points are deducted on approval, not on request</div>
                    <div className="guide-callout-text">Your balance stays intact until leadership approves the redemption. You can keep earning points while your request is pending.</div>
                  </div>
                </div>
              </section>

              {/* ── HISTORY ── */}
              <section id="history" className="guide-section">
                <div className="guide-section-title">Your History</div>
                <p className="guide-text">Navigate to <strong>PHIRE → My History</strong> to see a full record of your activity.</p>
                <div className="guide-cards-row">
                  <div className="guide-info-card">
                    <div className="guide-info-icon">📋</div>
                    <div className="guide-info-label">Submissions</div>
                    <div className="guide-info-desc">Every activity you've submitted with its status and reviewer. Denied submissions show the reason.</div>
                  </div>
                  <div className="guide-info-card">
                    <div className="guide-info-icon">💳</div>
                    <div className="guide-info-label">Transactions</div>
                    <div className="guide-info-desc">Every point movement — earned, deducted from redemptions, or manually adjusted by leadership.</div>
                  </div>
                </div>
                <div className="guide-status-legend">
                  <div className="guide-status-title">Status meanings</div>
                  <div className="guide-status-row"><span className="sub-tag pending">PENDING</span> Submitted, waiting for leadership to review</div>
                  <div className="guide-status-row"><span className="sub-tag approved">APPROVED</span> Approved — points have been added to your balance</div>
                  <div className="guide-status-row"><span className="sub-tag denied">DENIED</span> Denied — check the reason shown and resubmit if appropriate</div>
                </div>
              </section>

              {/* ── FAQ ── */}
              <section id="faq" className="guide-section">
                <div className="guide-section-title">FAQ</div>
                {[
                  { q:'How long does approval take?',              a:"No set time — it depends on when leadership is online. You'll get a bell notification the moment your submission is reviewed." },
                  { q:'Can I submit the same activity twice?',     a:'Yes, but not while one is still pending. Once your submission is approved or denied you can submit that activity again.' },
                  { q:'What happens if my submission is denied?',  a:"You'll see the reason in your history. You're free to resubmit if you believe it was a mistake — check the reason first." },
                  { q:'Do my points expire?',                      a:'No. Your points never expire. They stay in your balance until you redeem a reward.' },
                  { q:'Does redeeming hurt my leaderboard position?', a:'No. The leaderboard uses lifetime earned points, not your current balance. Redeeming has no effect on your standing.' },
                  { q:'I submitted by mistake — can I cancel?',   a:"Contact Iron Fleet or a Founder and ask them to deny the submission. You cannot cancel a pending submission yourself." },
                  { q:'Why is there a cooldown on rewards?',       a:"Cooldowns prevent the same reward from being claimed back-to-back. Once the cooldown passes you can redeem that tier again." },
                  { q:"My points didn't update after approval.",   a:"Try refreshing the PHIRE page. If your balance still looks wrong, contact a Founder who can check the transaction log and correct it." },
                ].map((f, i) => (
                  <details key={i} className="guide-faq">
                    <summary className="guide-faq-q">{f.q}</summary>
                    <div className="guide-faq-a">{f.a}</div>
                  </details>
                ))}
              </section>

              {/* ══ LEADERSHIP SECTIONS — only rendered for leaders ══ */}
              {isLeader && (
                <>
                  <div className="guide-leader-divider">
                    <div className="guide-leader-divider-line"/>
                    <div className="guide-leader-divider-label">👑 Leadership Guide</div>
                    <div className="guide-leader-divider-line"/>
                  </div>
                  <p className="guide-text" style={{marginBottom:'2rem',textAlign:'center',color:'var(--muted)'}}>
                    The sections below are only visible to Iron Fleet and Founders.
                  </p>

                  {/* APPROVAL QUEUE */}
                  <section id="approvals" className="guide-section leader-section">
                    <div className="guide-section-title">Approval Queue <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">When a brother submits an activity, you receive a bell notification and it appears in the queue at <strong>PHIRE → Manage → Approval Queue</strong>.</p>
                    <div className="guide-step-list">
                      {[
                        { n:'1', title:'Open the Approval Queue',  desc:'Go to <strong>PHIRE → Manage</strong>. All pending submissions are listed oldest-first. You can see the brother\'s name, activity, and point value.' },
                        { n:'2', title:'Approve or Deny',          desc:'Click <span class="guide-green"><strong>✓ Approve</strong></span> to confirm and add the points. Click <span class="guide-red"><strong>✕ Deny</strong></span> to reject — you can optionally enter a reason the brother will see.' },
                        { n:'3', title:'Brother is notified',      desc:'The brother receives a bell notification immediately. Points are credited or withheld automatically.' },
                      ].map(s => (
                        <div key={s.n} className="guide-step">
                          <div className="guide-step-num">{s.n}</div>
                          <div className="guide-step-body">
                            <div className="guide-step-title">{s.title}</div>
                            <div className="guide-step-desc" dangerouslySetInnerHTML={{__html: s.desc}} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="guide-callout gold">
                      <div className="guide-callout-icon">💡</div>
                      <div>
                        <div className="guide-callout-title">Reward redemptions work the same way</div>
                        <div className="guide-callout-text">When a brother redeems a reward you get a separate bell notification. Approve or deny it from the Manage page. Approving deducts the points automatically.</div>
                      </div>
                    </div>
                  </section>

                  {/* MANAGING ACTIVITIES */}
                  <section id="activities" className="guide-section leader-section">
                    <div className="guide-section-title">Managing Activities <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">The list brothers choose from is fully managed by Iron Fleet and Founders. Go to <strong>PHIRE → Manage → Activities</strong>.</p>
                    <div className="guide-cards-row">
                      <div className="guide-info-card">
                        <div className="guide-info-icon">➕</div>
                        <div className="guide-info-label">Create Activity</div>
                        <div className="guide-info-desc">Enter a name, point value, and category. It becomes available for all brothers immediately.</div>
                      </div>
                      <div className="guide-info-card">
                        <div className="guide-info-icon">🚫</div>
                        <div className="guide-info-label">Deactivate</div>
                        <div className="guide-info-desc">Hides an activity from brothers without deleting it. Click again to reactivate at any time.</div>
                      </div>
                    </div>
                    <div className="guide-callout crimson">
                      <div className="guide-callout-icon">⚠️</div>
                      <div>
                        <div className="guide-callout-title">Keep point values consistent</div>
                        <div className="guide-callout-text">Point values are fixed per activity — all brothers get the same amount. To award a custom amount use Manual Point Adjustment instead.</div>
                      </div>
                    </div>
                  </section>

                  {/* POINT ADJUSTMENTS */}
                  <section id="adjust" className="guide-section leader-section">
                    <div className="guide-section-title">Point Adjustments <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">Manually add or deduct points from any brother outside the normal activity system. Go to <strong>PHIRE → Manage → Adjust Points</strong>.</p>
                    <div className="guide-step-list">
                      {[
                        { n:'1', title:'Select the brother', desc:'The dropdown shows every brother with their current balance.' },
                        { n:'2', title:'Enter the amount',   desc:'Use a <strong>positive number</strong> to add (e.g. 50) or a <strong>negative number</strong> to deduct (e.g. -25). Balance cannot go below zero.' },
                        { n:'3', title:'Enter a reason',     desc:'A reason is required. The brother sees it in their transaction history and receives a bell notification.' },
                      ].map(s => (
                        <div key={s.n} className="guide-step">
                          <div className="guide-step-num">{s.n}</div>
                          <div className="guide-step-body">
                            <div className="guide-step-title">{s.title}</div>
                            <div className="guide-step-desc" dangerouslySetInnerHTML={{__html: s.desc}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* LEADERBOARD */}
                  <section id="leaderboard" className="guide-section leader-section">
                    <div className="guide-section-title">Leaderboard <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">
                      The leaderboard at <strong>PHIRE → Leaderboard</strong> ranks every brother by their <em>lifetime points earned</em> — the total ever accumulated, regardless of what they've spent on rewards. This is the metric for <strong>Big Brother of the Year</strong>.
                    </p>
                    <div className="guide-callout gold">
                      <div className="guide-callout-icon">🏆</div>
                      <div>
                        <div className="guide-callout-title">Lifetime vs Current Balance</div>
                        <div className="guide-callout-text">
                          <em>Current balance</em> is what a brother has to spend. <em>Lifetime earned</em> never goes down when they redeem — brothers aren't penalised for using the reward system. Always use lifetime earned for BBOTY decisions.
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
