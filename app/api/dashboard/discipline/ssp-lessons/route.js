import { NextResponse } from 'next/server';
import { S, h, ch, getMember, canManage } from '../_shared';

const LESSONS = ['lesson_1','lesson_2','lesson_3','lesson_4','lesson_5','lesson_6'];

// PATCH — update lesson attendance, reflections, or clear the brother
export async function PATCH(req) {
  const member = await getMember();
  if (!member || !canManage(member)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { ssp_id, violation_id, member_id, action } = body;

  if (action === 'toggle_lesson') {
    const { lesson, value } = body;
    if (!LESSONS.includes(lesson)) return NextResponse.json({ error: 'Invalid lesson' }, { status: 400 });
    await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ [lesson]: value, updated_at: new Date().toISOString() })
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'toggle_reflections') {
    await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ reflections_done: body.value, updated_at: new Date().toISOString() })
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'clear') {
    // Mark SSP as completed + cleared
    await fetch(`${S}/rest/v1/discipline_ssp?id=eq.${ssp_id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ status: 'completed', cleared: true, cleared_at: new Date().toISOString(), cleared_by_name: member.frat_name, updated_at: new Date().toISOString() })
    });
    // Mark the violation as cleared
    await fetch(`${S}/rest/v1/discipline_violations?id=eq.${violation_id}`, {
      method: 'PATCH', headers: ch(),
      body: JSON.stringify({ cleared: true, cleared_at: new Date().toISOString(), cleared_by_name: member.frat_name })
    });
    // Notify the brother
    await fetch(`${S}/rest/v1/notifications`, {
      method: 'POST', headers: ch(),
      body: JSON.stringify({
        member_id,
        title: 'Cleared — SSP Completed',
        message: `You have successfully completed the Sage Solution Program and all charges have been cleared. Well done, brother.`,
        created_by: member.id
      })
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// GET — total SSP offers for a specific member (lifetime count)
export async function GET(req) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const member_id = searchParams.get('member_id') || member.id;

  // Only managers can look up others
  if (member_id !== member.id && !canManage(member)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ssps = await fetch(`${S}/rest/v1/discipline_ssp?member_id=eq.${member_id}&select=id,status,cleared,offer_number`, { headers: h() }).then(r => r.json());
  const totalOffered = ssps.length;
  const totalCleared = ssps.filter(s => s.cleared).length;

  return NextResponse.json({ total_offered: totalOffered, total_cleared: totalCleared, remaining_offers: Math.max(0, 3 - totalOffered), ssps });
}
