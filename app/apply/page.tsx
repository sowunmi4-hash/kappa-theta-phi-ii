'use client';
import { useState } from 'react';
import './apply.css';

const STEPS = [
  { label: 'Identity' },
  { label: 'Availability' },
  { label: 'Connection' },
  { label: 'Brotherhood' },
];

const CONTACT_OPTS = ['Facebook','Email','Instagram','Inworld','Discord'];
const COMMS_OPTS   = ['Mic','Text','Both'];
const TIMEZONES    = ['EST','CST','MST','PST','GMT','BST','CET','AEST','Other'];

function Radio({ options, value, onChange }: { options:string[]; value:string; onChange:(v:string)=>void }) {
  return (
    <div className="ap-radio-group">
      {options.map(o => (
        <div key={o} className={`ap-radio-opt${value===o?' sel':''}`} onClick={()=>onChange(o)}>
          <div className="ap-radio-dot"/>
          <span className="ap-radio-label">{o}</span>
        </div>
      ))}
    </div>
  );
}

function Checkboxes({ options, values, onChange }: { options:string[]; values:string[]; onChange:(v:string[])=>void }) {
  const toggle = (o:string) => values.includes(o) ? onChange(values.filter(v=>v!==o)) : onChange([...values,o]);
  return (
    <div className="ap-check-group">
      {options.map(o => (
        <div key={o} className={`ap-check-opt${values.includes(o)?' sel':''}`} onClick={()=>toggle(o)}>
          <div className="ap-check-box">{values.includes(o)&&'✓'}</div>
          <span className="ap-check-label">{o}</span>
        </div>
      ))}
    </div>
  );
}

export default function ApplyPage() {
  const [step, setStep]       = useState(0);
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const [form, setForm] = useState({
    email: '', sl_name: '', sl_birth_month: '', sl_birth_day: '', sl_birth_year: '',
    rl_sl_age: '', timezone: '', schedule_limitations: '',
    can_pledge: '', financially_prepared: '', contact_method: [] as string[],
    communication_mode: '', referred_by: '',
    reasons_to_join: '', what_you_gain: '', sl_activities: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  function validate(): string {
    if (step === 0) {
      if (!form.email.trim()) return 'Email is required.';
      if (!form.email.includes('@')) return 'Enter a valid email address.';
      if (!form.sl_name.trim()) return 'SL Legacy Name is required.';
      if (!form.rl_sl_age.trim()) return 'Age is required.';
    }
    if (step === 1) {
      if (!form.timezone) return 'Please select your timezone.';
      if (!form.schedule_limitations) return 'Please answer the schedule question.';
      if (!form.can_pledge) return 'Please confirm your pledging availability.';
      if (!form.financially_prepared) return 'Please confirm your financial readiness.';
    }
    if (step === 2) {
      if (!form.contact_method.length) return 'Select at least one contact method.';
      if (!form.communication_mode) return 'Select your communication mode.';
      if (!form.referred_by.trim()) return 'Please name the brother who referred you.';
    }
    if (step === 3) {
      if (!form.reasons_to_join.trim()) return 'Please share your reasons for joining.';
      if (!form.what_you_gain.trim()) return 'Please share what you hope to gain.';
      if (!form.sl_activities.trim()) return 'Please share your SL activities.';
    }
    return '';
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    if (step < 3) { setStep(s => s + 1); }
    else { submit(); }
  }

  async function submit() {
    setSubmitting(true); setError('');
    const sl_birth_date = form.sl_birth_month && form.sl_birth_day && form.sl_birth_year
      ? `${form.sl_birth_year}-${form.sl_birth_month.padStart(2,'0')}-${form.sl_birth_day.padStart(2,'0')}`
      : null;
    const res = await fetch('/api/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email, sl_name: form.sl_name, sl_birth_date, rl_sl_age: form.rl_sl_age,
        timezone: form.timezone,
        schedule_limitations: form.schedule_limitations === 'Yes',
        can_pledge: form.can_pledge === 'Yes',
        financially_prepared: form.financially_prepared === 'Yes',
        contact_method: form.contact_method.join(', '),
        communication_mode: form.communication_mode,
        referred_by: form.referred_by,
        reasons_to_join: form.reasons_to_join,
        what_you_gain: form.what_you_gain,
        sl_activities: form.sl_activities,
      })
    }).then(r => r.json());
    if (res.error) { setError(res.error); setSubmitting(false); return; }
    setDone(true);
  }

  if (done) return (
    <div className="ap-wrap">
      <div className="ap-kanji"><span className="k1">誓</span><span className="k2">海</span></div>
      <div className="ap-card" style={{maxWidth:540}}>
        <div className="ap-success">
          <div className="ap-success-seal"><img src="/logo.png" alt="KΘΦ II"/></div>
          <div className="ap-success-title">Application Received</div>
          <div className="ap-success-sub">Kappa Theta Phi II · Wokou-Corsairs</div>
          <p className="ap-success-desc">Your application has been submitted to the founding brothers. You will be contacted through your preferred method. Death Before Dishonor.</p>
          <a href="/" className="ap-back-home">Return to Home →</a>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="ap-kanji"><span className="k1">武</span><span className="k2">義</span></div>
      <div className="ap-wrap">
        {/* Header */}
        <div className="ap-header">
          <img src="/logo.png" alt="KΘΦ II" className="ap-logo"/>
          <div className="ap-header-sub">Kappa Theta Phi II · Pledging Application</div>
          <h1 className="ap-header-title">Join the Brotherhood</h1>
          <p className="ap-header-desc">
            KΘΦ II is a voluntary, non-profit fraternal organization within Second Life — formed for brotherhood, leadership, friendship, and service.
          </p>
        </div>

        {/* Progress */}
        <div className="ap-progress">
          {STEPS.map((s, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',flex:i<STEPS.length-1?1:'initial'}}>
              <div className="ap-step-node">
                <div className={`ap-step-circle${i<step?' done':i===step?' active':' pending'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`ap-step-label${i===step?' active':''}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`ap-progress-line${i<step?' done':''}`}/>}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="ap-card">
          <div className="ap-card-hdr">
            <div className="ap-card-step">Step {step+1} of {STEPS.length}</div>
            <div className="ap-card-title">
              {step===0 && 'About You'}
              {step===1 && 'Your Availability'}
              {step===2 && 'How to Reach You'}
              {step===3 && 'Why the Brotherhood'}
            </div>
          </div>

          <div className="ap-fields">
            {error && <div className="ap-error">{error}</div>}

            {/* STEP 1 */}
            {step === 0 && <>
              <div>
                <label className="ap-field-lbl">Email Address <span>*</span></label>
                <input className="ap-input" type="email" placeholder="your@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div>
                <label className="ap-field-lbl">SL Legacy Name <span>*</span></label>
                <input className="ap-input" placeholder="e.g. JohnDoe Resident" value={form.sl_name} onChange={e=>set('sl_name',e.target.value)}/>
              </div>
              <div>
                <label className="ap-field-lbl">SL Birth Date</label>
                <div className="ap-date-row">
                  <input className="ap-input" placeholder="MM" maxLength={2} value={form.sl_birth_month} onChange={e=>set('sl_birth_month',e.target.value)}/>
                  <input className="ap-input" placeholder="DD" maxLength={2} value={form.sl_birth_day} onChange={e=>set('sl_birth_day',e.target.value)}/>
                </div>
                <input className="ap-input" placeholder="YYYY" maxLength={4} value={form.sl_birth_year} onChange={e=>set('sl_birth_year',e.target.value)} style={{marginTop:'.4rem'}}/>
              </div>
              <div>
                <label className="ap-field-lbl">RL & SL Age <span>*</span></label>
                <input className="ap-input" placeholder="e.g. RL: 25 / SL: 3 years" value={form.rl_sl_age} onChange={e=>set('rl_sl_age',e.target.value)}/>
              </div>
            </>}

            {/* STEP 2 */}
            {step === 1 && <>
              <div>
                <label className="ap-field-lbl">Timezone <span>*</span></label>
                <select className="ap-select" value={form.timezone} onChange={e=>set('timezone',e.target.value)}>
                  <option value="">Select your timezone...</option>
                  {TIMEZONES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="ap-field-lbl">Do you have schedule limitations? <span>*</span></label>
                <div style={{fontFamily:'var(--cinzel,Cinzel)',fontSize:'.5rem',letterSpacing:'2px',color:'rgba(245,240,232,.3)',marginBottom:'.4rem'}}>e.g. work, school, other commitments</div>
                <Radio options={['Yes','No']} value={form.schedule_limitations} onChange={v=>set('schedule_limitations',v)}/>
              </div>
              <div>
                <label className="ap-field-lbl">Can you dedicate 4 weeks for pledging? <span>*</span></label>
                <Radio options={['Yes','No']} value={form.can_pledge} onChange={v=>set('can_pledge',v)}/>
              </div>
              <div>
                <label className="ap-field-lbl">Are you financially prepared for monthly dues? <span>*</span></label>
                <Radio options={['Yes','No']} value={form.financially_prepared} onChange={v=>set('financially_prepared',v)}/>
              </div>
            </>}

            {/* STEP 3 */}
            {step === 2 && <>
              <div>
                <label className="ap-field-lbl">Preferred contact method <span>*</span></label>
                <Checkboxes options={CONTACT_OPTS} values={form.contact_method} onChange={v=>set('contact_method',v)}/>
              </div>
              <div>
                <label className="ap-field-lbl">Mode of communication <span>*</span></label>
                <Radio options={COMMS_OPTS} value={form.communication_mode} onChange={v=>set('communication_mode',v)}/>
              </div>
              <div>
                <label className="ap-field-lbl">Brother who gave you this application <span>*</span></label>
                <input className="ap-input" placeholder="Brother's name..." value={form.referred_by} onChange={e=>set('referred_by',e.target.value)}/>
              </div>
            </>}

            {/* STEP 4 */}
            {step === 3 && <>
              <div>
                <label className="ap-field-lbl">Why do you want to join KΘΦ II? <span>*</span></label>
                <textarea className="ap-textarea" placeholder="Share your reasons..." value={form.reasons_to_join} onChange={e=>set('reasons_to_join',e.target.value)} rows={4}/>
              </div>
              <div>
                <label className="ap-field-lbl">What would you gain from this fraternity? <span>*</span></label>
                <textarea className="ap-textarea" placeholder="What are you looking to gain..." value={form.what_you_gain} onChange={e=>set('what_you_gain',e.target.value)} rows={4}/>
              </div>
              <div>
                <label className="ap-field-lbl">What activities are you involved in on SL? <span>*</span></label>
                <div style={{fontFamily:'var(--cinzel,Cinzel)',fontSize:'.5rem',letterSpacing:'2px',color:'rgba(245,240,232,.3)',marginBottom:'.4rem'}}>e.g. DJ, Photographer, Landscaper, Scripter, Model, etc.</div>
                <textarea className="ap-textarea" placeholder="Your SL activities..." value={form.sl_activities} onChange={e=>set('sl_activities',e.target.value)} rows={3}/>
              </div>
            </>}
          </div>

          <div className="ap-actions">
            {step > 0 && <button className="ap-btn-back" onClick={()=>{setError('');setStep(s=>s-1);}}>← Back</button>}
            <button className="ap-btn-next" onClick={next} disabled={submitting}>
              {step < 3 ? 'Continue →' : submitting ? 'Submitting...' : 'Submit Application ⚓'}
            </button>
          </div>
        </div>

        <div style={{marginTop:'1.5rem',fontFamily:'Cinzel,serif',fontSize:'.46rem',letterSpacing:'2px',color:'rgba(245,240,232,.2)',textAlign:'center'}}>
          KΘΦ II · Death Before Dishonor · Est. 3·14·21
        </div>
      </div>
    </div>
  );
}
