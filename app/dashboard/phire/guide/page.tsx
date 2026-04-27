'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import '../../dash.css';
import '../phire.css';
import './guide.css';

export default function PhireGuide() {
  const [member, setMember] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    fetch('/api/dashboard/phire/balance').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setMember(d.member);
    });
  }, []);

  const slug = member?.frat_name?.toLowerCase().replace(/\s+/g, '-').replace('big-brother-', '') || '';
  const portrait = `/brothers/${slug}.png`;
  const LEADERS = ['Head Founder', 'Co-Founder', 'Iron Fleet'];
  const isLeader = member && LEADERS.includes(member.role);

  const NAV = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/news', label: 'Wokou News' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/phire', label: 'PHIRE' },
    { href: '/dashboard/gallery', label: 'My Gallery' },
    { href: '/dashboard/edit', label: 'Edit Profile' },
  ];

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'earning', label: 'Earning Points' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'history', label: 'Your History' },
    ...(isLeader ? [
      { id: 'approvals', label: 'Approvals (Leaders)' },
      { id: 'activities', label: 'Managing Activities' },
      { id: 'adjust', label: 'Point Adjustments' },
      { id: 'leaderboard', label: 'Leaderboard' },
    ] : []),
    { id: 'faq', label: 'FAQ' },
  ];

  if (!member) return <div className="dash-loading">LOADING...</div>;

  return (
    <div className="dash-app phire-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <img src="/logo.png" alt="KΘΦ II" />
          <span className="dash-sidebar-logo-text">KΘΦ II</span>
        </div>
        <div className="dash-sidebar-member">
          <div className="dash-sidebar-portrait">
            <img src={portrait} alt="" onError={(e: any) => e.target.src = '/logo.png'} />
          </div>
          <div className="dash-sidebar-name">{member?.frat_name}</div>
          <div className="dash-sidebar-role">{member?.role}</div>
        </div>
        <nav className="dash-nav">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`dash-nav-item ${n.href === '/dashboard/phire' ? 'active' : ''}`}>
              <span>{n.label}</span>
            </a>
          ))}
          <div className="dash-nav-divider" />
          <a href="/" className="dash-nav-item"><span>Back to Site</span></a>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="guide-wrap">

          {/* Header */}
          <div className="guide-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <a href="/dashboard/phire" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.75rem', letterSpacing: '2px' }}>← PHIRE</a>
            </div>
            <div className="guide-title">⚡ PHIRE System Guide</div>
            <div className="guide-subtitle">Everything you need to know about earning points and redeeming rewards</div>
          </div>

          <div className="guide-layout">

            {/* Sticky section nav */}
            <div className="guide-sidenav">
              <div className="guide-sidenav-title">Contents</div>
              {sections.map(s => (
                <button
                  key={s.id}
                  className={`guide-sidenav-item ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="guide-content">

              {/* OVERVIEW */}
              <section id="overview" className="guide-section">
                <div className="guide-section-title">What is PHIRE?</div>
                <p className="guide-text">
                  PHIRE is KΘΦ II's official points and rewards system. Brothers earn points by logging fraternity activities — attending meetings, events, community service, and more. Accumulate enough points to unlock exclusive rewards from leadership.
                </p>
                <div className="guide-callout gold">
                  <div className="guide-callout-icon">⚡</div>
                  <div>
                    <div className="guide-callout-title">How it works in 3 steps</div>
                    <div className="guide-callout-text">
                      1. Log an activity from the approved list → 2. Leadership approves it → 3. Points land in your balance automatically
                    </div>
                  </div>
                </div>
                <div className="guide-cards-row">
                  <div className="guide-info-card">
                    <div className="guide-info-icon">📋</div>
                    <div className="guide-info-label">Submit</div>
                    <div className="guide-info-desc">Pick an activity from the list and submit it for review</div>
                  </div>
                  <div className="guide-info-card">
                    <div className="guide-info-icon">✅</div>
                    <div className="guide-info-label">Approved</div>
                    <div className="guide-info-desc">Iron Fleet or Founders review and approve your submission</div>
                  </div>
                  <div className="guide-info-card">
                    <div className="guide-info-icon">💎</div>
                    <div className="guide-info-label">Earn</div>
                    <div className="guide-info-desc">Points are added to your balance instantly upon approval</div>
                  </div>
                  <div className="guide-info-card">
                    <div className="guide-info-icon">🎁</div>
                    <div className="guide-info-label">Redeem</div>
                    <div className="guide-info-desc">Use your points to claim exclusive rewards from leadership</div>
                  </div>
                </div>
              </section>

              {/* EARNING POINTS */}
              <section id="earning" className="guide-section">
                <div className="guide-section-title">Earning Points</div>
                <p className="guide-text">
                  To earn points, head to <strong>PHIRE → Log Activity</strong>. You'll see all available activities grouped by category. Select the one you completed and hit <em>Submit for Approval</em>.
                </p>

                <div className="guide-step-list">
                  <div className="guide-step">
                    <div className="guide-step-num">1</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Go to Log Activity</div>
                      <div className="guide-step-desc">From the PHIRE home page, click the <strong>⚡ Log Activity</strong> button or navigate to PHIRE → Log Activity in the sidebar.</div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <div className="guide-step-num">2</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Pick your activity</div>
                      <div className="guide-step-desc">Browse activities grouped by category — Attendance, Service, Outreach, Leadership, etc. Each activity shows its point value. Click to select it (it highlights in red).</div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <div className="guide-step-num">3</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Submit for approval</div>
                      <div className="guide-step-desc">Click <strong>Submit for Approval</strong> at the bottom. Leadership gets a bell notification immediately. Your submission appears in your history as <em>Pending</em>.</div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <div className="guide-step-num">4</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Wait for review</div>
                      <div className="guide-step-desc">Iron Fleet or a Founder will approve or deny your submission. You get a bell notification either way. If approved, your points are added instantly.</div>
                    </div>
                  </div>
                </div>

                <div className="guide-callout crimson">
                  <div className="guide-callout-icon">⚠️</div>
                  <div>
                    <div className="guide-callout-title">Rules to know</div>
                    <div className="guide-callout-text">
                      You cannot submit the same activity twice while one is still pending. Wait for approval or denial before resubmitting. Only submit activities you actually completed — false submissions will be denied and noted.
                    </div>
                  </div>
                </div>

                <div className="guide-table-wrap">
                  <div className="guide-table-title">Available Activity Categories</div>
                  <table className="guide-table">
                    <thead>
                      <tr><th>Category</th><th>Examples</th><th>Points Range</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Attendance</td><td>Weekly Meeting, Fraternity Event</td><td>10 – 15 pts</td></tr>
                      <tr><td>Service</td><td>Community Service, Philanthropy</td><td>20 pts</td></tr>
                      <tr><td>Outreach</td><td>Social Media Post, Newsletter</td><td>10 – 15 pts</td></tr>
                      <tr><td>Recruitment</td><td>Successful Recruitment</td><td>50 pts</td></tr>
                      <tr><td>Leadership</td><td>Event Hosting, Mentorship Session</td><td>20 – 25 pts</td></tr>
                      <tr><td>Training</td><td>Training Completion</td><td>15 pts</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* REWARDS */}
              <section id="rewards" className="guide-section">
                <div className="guide-section-title">Reward Tiers</div>
                <p className="guide-text">
                  PHIRE has five reward tiers. Once your balance reaches a tier's threshold you can redeem it. After redemption, each tier has a cooldown period before you can redeem it again.
                </p>

                <div className="guide-tier-list">
                  {[
                    { name: 'Bronze', pts: 300, desc: 'Facebook / Instagram post feature', reset: '7 days', colour: '#cd7f32' },
                    { name: 'Silver', pts: 600, desc: 'Monthly Newsletter feature', reset: '14 days', colour: '#c0c0c0' },
                    { name: 'Gold', pts: 1200, desc: 'Custom KTP Trophy', reset: '30 days', colour: '#c6930a' },
                    { name: 'Platinum', pts: 2400, desc: 'Exclusive Website Interview', reset: '90 days', colour: '#e5e4e2' },
                    { name: 'Diamond', pts: 4800, desc: 'Custom KTP Plaque + Event Recognition', reset: '180 days', colour: '#b9f2ff' },
                  ].map(t => (
                    <div key={t.name} className="guide-tier-row">
                      <div className="guide-tier-badge" style={{ color: t.colour, borderColor: t.colour + '44' }}>{t.name}</div>
                      <div style={{ flex: 1 }}>
                        <div className="guide-tier-desc">{t.desc}</div>
                      </div>
                      <div className="guide-tier-pts" style={{ color: t.colour }}>{t.pts.toLocaleString()} pts</div>
                      <div className="guide-tier-reset">🔄 {t.reset} cooldown</div>
                    </div>
                  ))}
                </div>

                <div className="guide-step-list" style={{ marginTop: '1.5rem' }}>
                  <div className="guide-step">
                    <div className="guide-step-num">1</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Go to Rewards</div>
                      <div className="guide-step-desc">Navigate to <strong>PHIRE → Rewards</strong>. Locked tiers show how many more points you need. Unlocked tiers show a <em>Redeem →</em> button.</div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <div className="guide-step-num">2</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Click Redeem</div>
                      <div className="guide-step-desc">Hit <strong>Redeem →</strong> on any unlocked tier. This sends a redemption request to leadership — they get a bell notification immediately.</div>
                    </div>
                  </div>
                  <div className="guide-step">
                    <div className="guide-step-num">3</div>
                    <div className="guide-step-body">
                      <div className="guide-step-title">Wait for approval</div>
                      <div className="guide-step-desc">Leadership reviews your redemption request. Once approved, your points are deducted and you'll receive a notification. Leadership will then contact you to deliver your reward.</div>
                    </div>
                  </div>
                </div>

                <div className="guide-callout gold">
                  <div className="guide-callout-icon">💡</div>
                  <div>
                    <div className="guide-callout-title">Points are deducted when the reward is approved</div>
                    <div className="guide-callout-text">
                      Your balance stays intact until leadership approves the redemption. You can keep earning points while your redemption request is pending.
                    </div>
                  </div>
                </div>
              </section>

              {/* HISTORY */}
              <section id="history" className="guide-section">
                <div className="guide-section-title">Your History</div>
                <p className="guide-text">
                  Navigate to <strong>PHIRE → My History</strong> to see a full record of everything in your account.
                </p>
                <div className="guide-cards-row">
                  <div className="guide-info-card">
                    <div className="guide-info-icon">📋</div>
                    <div className="guide-info-label">Submissions Tab</div>
                    <div className="guide-info-desc">Every activity you've submitted. Shows status (pending / approved / denied) and who reviewed it. Denied submissions show the reason.</div>
                  </div>
                  <div className="guide-info-card">
                    <div className="guide-info-icon">💳</div>
                    <div className="guide-info-label">Transactions Tab</div>
                    <div className="guide-info-desc">Every point movement — earned from approvals, deducted from redemptions, or manually adjusted by leadership.</div>
                  </div>
                </div>
                <div className="guide-status-legend">
                  <div className="guide-status-title">Submission Status Meanings</div>
                  <div className="guide-status-row"><span className="sub-tag pending">PENDING</span> Submitted, waiting for leadership to review</div>
                  <div className="guide-status-row"><span className="sub-tag approved">APPROVED</span> Approved — points have been added to your balance</div>
                  <div className="guide-status-row"><span className="sub-tag denied">DENIED</span> Denied — check the reason shown and resubmit if appropriate</div>
                </div>
              </section>

              {/* LEADER SECTIONS */}
              {isLeader && (
                <>
                  <section id="approvals" className="guide-section">
                    <div className="guide-section-title">Approval Queue <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">
                      When a brother submits an activity, you receive a bell notification and it appears in the Approval Queue at <strong>PHIRE → Manage → Approval Queue</strong>.
                    </p>
                    <div className="guide-step-list">
                      <div className="guide-step">
                        <div className="guide-step-num">1</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Go to Manage → Approval Queue</div>
                          <div className="guide-step-desc">All pending submissions are listed in order of submission time (oldest first). You can see the brother's name, activity, and point value.</div>
                        </div>
                      </div>
                      <div className="guide-step">
                        <div className="guide-step-num">2</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Approve or Deny</div>
                          <div className="guide-step-desc">Click <strong className="guide-green">✓ Approve</strong> to confirm and add the points, or <strong className="guide-red">✕ Deny</strong> to reject. If denying, you can optionally enter a reason — the brother will see it.</div>
                        </div>
                      </div>
                      <div className="guide-step">
                        <div className="guide-step-num">3</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Brother is notified</div>
                          <div className="guide-step-desc">The brother receives a bell notification immediately after your decision. Points are credited (or not) automatically.</div>
                        </div>
                      </div>
                    </div>
                    <div className="guide-callout gold">
                      <div className="guide-callout-icon">💡</div>
                      <div>
                        <div className="guide-callout-title">Redemption requests are also handled here</div>
                        <div className="guide-callout-text">When a brother redeems a reward, you get a separate notification. Approve or deny it from the same Manage page under the Redemptions section in the sidebar.</div>
                      </div>
                    </div>
                  </section>

                  <section id="activities" className="guide-section">
                    <div className="guide-section-title">Managing Activities <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">
                      The activity list brothers choose from is fully managed by Iron Fleet and Founders. Go to <strong>PHIRE → Manage → Activities</strong>.
                    </p>
                    <div className="guide-cards-row">
                      <div className="guide-info-card">
                        <div className="guide-info-icon">➕</div>
                        <div className="guide-info-label">Create Activity</div>
                        <div className="guide-info-desc">Enter a name, point value, and category. It becomes available for all brothers to log immediately.</div>
                      </div>
                      <div className="guide-info-card">
                        <div className="guide-info-icon">🚫</div>
                        <div className="guide-info-label">Deactivate Activity</div>
                        <div className="guide-info-desc">Click Deactivate to hide an activity from brothers without deleting it. You can reactivate it later.</div>
                      </div>
                    </div>
                    <div className="guide-callout crimson">
                      <div className="guide-callout-icon">⚠️</div>
                      <div>
                        <div className="guide-callout-title">Keep point values consistent</div>
                        <div className="guide-callout-text">
                          Point values are fixed per activity — all brothers get the same amount for the same activity. If you want to award different amounts, use Manual Point Adjustment instead.
                        </div>
                      </div>
                    </div>
                  </section>

                  <section id="adjust" className="guide-section">
                    <div className="guide-section-title">Point Adjustments <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">
                      Manual adjustments let you add or deduct points directly from any brother's balance outside the normal activity system. Go to <strong>PHIRE → Manage → Adjust Points</strong>.
                    </p>
                    <div className="guide-step-list">
                      <div className="guide-step">
                        <div className="guide-step-num">1</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Select the brother</div>
                          <div className="guide-step-desc">The dropdown shows every brother along with their current point balance.</div>
                        </div>
                      </div>
                      <div className="guide-step">
                        <div className="guide-step-num">2</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Enter the amount</div>
                          <div className="guide-step-desc">Use a <strong>positive number</strong> to add points (e.g. 50) or a <strong>negative number</strong> to deduct (e.g. -25).</div>
                        </div>
                      </div>
                      <div className="guide-step">
                        <div className="guide-step-num">3</div>
                        <div className="guide-step-body">
                          <div className="guide-step-title">Enter a reason</div>
                          <div className="guide-step-desc">A reason is required. The brother will see it in their transaction history and receive a bell notification.</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section id="leaderboard" className="guide-section">
                    <div className="guide-section-title">Leaderboard <span className="guide-leader-badge">Leaders Only</span></div>
                    <p className="guide-text">
                      The leaderboard at <strong>PHIRE → Leaderboard</strong> ranks every brother by their <em>lifetime points earned</em> — the total they've ever accumulated, regardless of what they've spent on rewards. This is the metric used for <strong>Big Brother of the Year</strong>.
                    </p>
                    <div className="guide-callout gold">
                      <div className="guide-callout-icon">🏆</div>
                      <div>
                        <div className="guide-callout-title">Lifetime vs Current Balance</div>
                        <div className="guide-callout-text">
                          <em>Current balance</em> is what a brother has to spend right now. <em>Lifetime earned</em> is the total they've ever earned — it never goes down when they redeem rewards. The leaderboard uses lifetime earned so brothers aren't penalised for using the reward system.
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* FAQ */}
              <section id="faq" className="guide-section">
                <div className="guide-section-title">Frequently Asked Questions</div>
                {[
                  { q: 'How long does approval take?', a: "There's no set time — it depends on when leadership is online. You'll get a bell notification the moment your submission is reviewed. Check your notification bell at the bottom of the sidebar." },
                  { q: 'Can I submit the same activity multiple times?', a: 'Yes, but not while one is still pending. Once your submission is approved or denied, you can submit that same activity again.' },
                  { q: 'What happens if my submission is denied?', a: "You'll see the reason (if one was given) in your submission history. You're free to resubmit if you believe it was a mistake, but please check the reason first." },
                  { q: 'Do my points expire?', a: 'No. Your points never expire. They stay in your balance until you redeem a reward.' },
                  { q: 'Will redeeming a reward reset my leaderboard position?', a: 'No. The leaderboard uses lifetime earned points, not your current balance. Redeeming rewards has no effect on your leaderboard standing.' },
                  { q: "I submitted an activity by mistake — can I cancel it?", a: "Contact Iron Fleet or a Founder and ask them to deny the submission. You cannot cancel a pending submission yourself." },
                  { q: "Why is there a cooldown on rewards?", a: "Cooldowns prevent the same reward from being claimed back-to-back. After the cooldown period passes, you can redeem that tier again if you have enough points." },
                  { q: "My points didn't update after approval — what do I do?", a: "Try refreshing the PHIRE page. If your balance still looks wrong, contact a Founder who can check the transaction log and manually correct it." },
                ].map((faq, i) => (
                  <details key={i} className="guide-faq">
                    <summary className="guide-faq-q">{faq.q}</summary>
                    <div className="guide-faq-a">{faq.a}</div>
                  </details>
                ))}
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
