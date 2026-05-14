import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const S = process.env.SUPABASE_URL;
const K = process.env.SUPABASE_SECRET_KEY;
const h  = (x={}) => ({ apikey:K, Authorization:`Bearer ${K}`, 'Accept-Profile':'members', ...x });
const ch = () => h({ 'Content-Type':'application/json','Content-Profile':'members',Prefer:'return=representation' });

async function getMember() {
  const token = (await cookies()).get(process.env.SESSION_COOKIE_NAME||'ktf_session')?.value;
  if (!token) return null;
  const s = await fetch(`${S}/rest/v1/website_sessions?session_token=eq.${token}&is_active=eq.true&select=member_id,expires_at`,{headers:h()}).then(r=>r.json());
  if (!s.length||new Date(s[0].expires_at)<new Date()) return null;
  const m = await fetch(`${S}/rest/v1/roster?id=eq.${s[0].member_id}&select=*`,{headers:h()}).then(r=>r.json());
  return m[0]||null;
}

export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({error:'Unauthorized'},{status:401});
  if (member.frat_name !== 'Big Brother Cool Breeze') return NextResponse.json({error:'Forbidden'},{status:403});

  const [debits, income] = await Promise.all([
    fetch(`${S}/rest/v1/bookkeeping_debits?order=created_at.desc`,{headers:h()}).then(r=>r.json()),
    fetch(`${S}/rest/v1/treasury_transactions?order=created_at.desc`,{headers:h()}).then(r=>r.json()),
  ]);

  const debitList  = Array.isArray(debits) ? debits : [];
  const incomeList = Array.isArray(income) ? income : [];

  const totalIncome  = incomeList.reduce((a,t)=>a+t.amount_ls,0);
  const totalDebits  = debitList.reduce((a,t)=>a+t.amount_ls,0);
  const netBalance   = totalIncome - totalDebits;

  const incomeByType = {
    dues:    incomeList.filter(t=>t.type==='dues').reduce((a,t)=>a+t.amount_ls,0),
    gear:    incomeList.filter(t=>t.type==='gear').reduce((a,t)=>a+t.amount_ls,0),
    event:   incomeList.filter(t=>t.type==='event').reduce((a,t)=>a+t.amount_ls,0),
    charity: incomeList.filter(t=>t.type==='charity').reduce((a,t)=>a+t.amount_ls,0),
  };

  return NextResponse.json({ debits:debitList, totalIncome, totalDebits, netBalance, incomeByType });
}

export async function POST(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({error:'Unauthorized'},{status:401});
  if (member.frat_name !== 'Big Brother Cool Breeze') return NextResponse.json({error:'Forbidden'},{status:403});

  const { amount_ls, description, recipient, category } = await req.json();
  if (!amount_ls||!description) return NextResponse.json({error:'Amount and description required'},{status:400});

  const res = await fetch(`${S}/rest/v1/bookkeeping_debits`,{
    method:'POST', headers:ch(),
    body: JSON.stringify({ amount_ls:parseInt(amount_ls), description, recipient:recipient||null, category:category||'General', logged_by_name:member.frat_name })
  }).then(r=>r.json());

  return NextResponse.json({ok:true, id: Array.isArray(res)?res[0]?.id:res?.id});
}

export async function DELETE(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({error:'Unauthorized'},{status:401});
  if (member.frat_name !== 'Big Brother Cool Breeze') return NextResponse.json({error:'Forbidden'},{status:403});

  const { id } = await req.json();
  await fetch(`${S}/rest/v1/bookkeeping_debits?id=eq.${id}`,{ method:'DELETE', headers:h({'Content-Profile':'members'}) });
  return NextResponse.json({ok:true});
}
