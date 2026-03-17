#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const API_BASE = 'https://api.instantly.ai/api/v2';
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const DO_RAMP = args.has('--ramp');

const apiKey = process.env.INSTANTLY_API_KEY || process.env.INSTANTLY_API_TOKEN || '';
if (!apiKey) {
  console.error('Missing INSTANTLY_API_KEY env var.');
  if (APPLY || DO_RAMP) process.exit(1);
}

const CSV_PATH = process.env.PROSPECT_CSV_PATH || '/root/PastaOS/CMO_Gary/pinger/prospect-list-v3.csv';

const weekdaysET = {
  name: 'Mon-Fri 8am-5pm ET',
  timing: { from: '08:00', to: '17:00' },
  days: { '1': true, '2': true, '3': true, '4': true, '5': true },
  timezone: 'America/Detroit'
};

function campaign1() {
  return {
    name: 'Pinger_Wave1_Webflow_Mar21',
    campaign_schedule: { schedules: [weekdaysET] },
    sequences: [{
      steps: [
        {
          type: 'email',
          delay: 4,
          delay_unit: 'days',
          variants: [
            { subject: 'Free Pinger Studio — want in?', body: `Hey {{firstName}},\n\nFound {{company}} on {{source}} — your work on {{specificProject}} is exactly what I had in mind when building this.\n\nI'm Mario, founder of Pinger. Quick version: it's uptime monitoring built specifically for web agencies. The difference from UptimeRobot or Better Stack — your clients get a branded status page. Their logo, their colors, your domain. They check it instead of calling you at midnight.\n\nLooking for 20 agencies to be design partners before we officially launch. The deal:\n\nYou get: Free Studio access (normally $79/mo) for 6 months, locked in permanently.\nI get: Honest feedback from someone who actually runs an agency.\n\nNo sales calls. No obligation. You try it on a real client site, tell me what's broken, and we're square.\n\nInterested?\n\n— Mario\nFounder, Pinger 🏓\nhttps://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1` },
            { subject: "Quick question about {{company}}'s clients", body: `Hey {{firstName}},\n\nFound {{company}} on {{source}} — your work on {{specificProject}} is exactly what I had in mind when building this.\n\nI'm Mario, founder of Pinger. Quick version: it's uptime monitoring built specifically for web agencies. The difference from UptimeRobot or Better Stack — your clients get a branded status page. Their logo, their colors, your domain. They check it instead of calling you at midnight.\n\nLooking for 20 agencies to be design partners before we officially launch. The deal:\n\nYou get: Free Studio access (normally $79/mo) for 6 months, locked in permanently.\nI get: Honest feedback from someone who actually runs an agency.\n\nNo sales calls. No obligation. You try it on a real client site, tell me what's broken, and we're square.\n\nInterested?\n\n— Mario\nFounder, Pinger 🏓\nhttps://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1` }
          ]
        },
        { type: 'email', delay: 5, delay_unit: 'days', variants: [{ subject: 'Re: Free Pinger Studio — want in?', body: `Hey {{firstName}},\n\nJust bumping this in case it got buried.\n\nOne thing I didn't mention — the status page your client sees is public. No login, no app download. You send them a URL once, they bookmark it. That's it.\n\nA few agencies in beta told me the first time their client said \"I just checked your status page\" instead of calling — that was the moment it clicked.\n\nStill happy to set you up if you want to take it for a spin.\n\n— Mario\nPinger 🏓` }] },
        { type: 'email', delay: 7, delay_unit: 'days', variants: [{ subject: 'Re: Free Pinger Studio — want in?', body: `Hey {{firstName}},\n\nQuick one — closing the design partner program this week, we've got the feedback we need from the first cohort.\n\nIf you've been curious but not ready to commit: free tier is live at https://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1. One status page, five monitors, no credit card. Takes about five minutes, you'll know quickly if it fits.\n\nEither way — good luck with {{company}}.\n\n— Mario\nPinger 🏓` }] }
      ]
    }],
    email_list: ['mario@trypinger.com'],
    daily_limit: 20,
    email_gap: 3,
    random_wait_max: 7,
    stop_on_reply: true,
    stop_on_auto_reply: true,
    open_tracking: true,
    link_tracking: true,
    insert_unsubscribe_header: true,
    auto_variant_select: { trigger: 'open_rate' }
  };
}

function campaign2() {
  return {
    name: 'Pinger_Wave1_WP_Mar21',
    campaign_schedule: { schedules: [weekdaysET] },
    sequences: [{
      steps: [
        {
          type: 'email',
          delay: 5,
          delay_unit: 'days',
          variants: [
            { subject: 'Your WordPress maintenance clients — quick question', body: `Hey {{firstName}},\n\nCame across {{company}} — looks like you're running ongoing WordPress maintenance for a solid client base.\n\nI'm building Pinger — uptime monitoring where every client gets a branded status page. They see what's up, what's down, what you're doing about it. The \"my site's been down, why didn't you tell me?\" conversation stops happening.\n\n20 design partner spots — free Studio access for 6 months in exchange for real feedback.\n\nInterested?\n\n— Mario\nFounder, Pinger 🏓\nhttps://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=wp-wave1` },
            { subject: 'Free Pinger Studio for WordPress agencies — want in?', body: `Hey {{firstName}},\n\nCame across {{company}} — looks like you're running ongoing WordPress maintenance for a solid client base.\n\nI'm building Pinger — uptime monitoring where every client gets a branded status page. They see what's up, what's down, what you're doing about it. The \"my site's been down, why didn't you tell me?\" conversation stops happening.\n\n20 design partner spots — free Studio access for 6 months in exchange for real feedback.\n\nInterested?\n\n— Mario\nFounder, Pinger 🏓\nhttps://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=wp-wave1` }
          ]
        },
        { type: 'email', delay: 7, delay_unit: 'days', variants: [{ subject: 'Re: Your WordPress maintenance clients — quick question', body: `Hey {{firstName}},\n\nBumping this — one thing worth adding.\n\nFor WordPress maintenance shops, the status page is especially useful because you're often managing 20–50 client sites simultaneously. When something goes wrong at 11pm, the client usually finds out before you do — and the call starts badly.\n\nWith Pinger, they have a page to check instead. You get the alert first, you're already on it when they look. The 11pm panic call becomes a check-in.\n\nFree tier at https://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=wp-wave1 if you want to see it in action — one status page, no card.\n\n— Mario\nPinger 🏓` }] },
        { type: 'email', delay: 0, delay_unit: 'days', variants: [{ subject: 'Re: Your WordPress maintenance clients — quick question', body: `Hey {{firstName}},\n\nLast one.\n\nWe've been talking to a lot of WP maintenance shops lately and the feedback is consistent — the ROI isn't from the monitoring, it's from reducing support interrupt time. Agencies say it adds 3–5 hours back per week just from fewer \"is my site okay?\" check-in calls.\n\nIf that's worth testing: https://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=wp-wave1, free tier, five minutes.\n\nGood luck with {{company}}.\n\n— Mario\nPinger 🏓` }] }
      ]
    }],
    email_list: ['mario@trypinger.com'],
    daily_limit: 15,
    email_gap: 3,
    random_wait_max: 7,
    stop_on_reply: true,
    stop_on_auto_reply: true,
    open_tracking: true,
    link_tracking: true,
    insert_unsubscribe_header: true,
    auto_variant_select: { trigger: 'open_rate' }
  };
}

function c1OpenersSubsequence(parent_campaign) {
  return {
    parent_campaign,
    name: 'C1_OpenersOnly_Reengagement',
    conditions: { lead_activity: [91, 2] }, // campaign completed w/o reply OR any open event
    subsequence_schedule: { schedules: [weekdaysET] },
    sequences: [{
      steps: [
        {
          type: 'email',
          pre_delay: 16,
          pre_delay_unit: 'days',
          delay: 14,
          delay_unit: 'days',
          variants: [{ subject: 'Re: Free Pinger Studio — want in?', body: `Hey {{firstName}},\n\nOne more — only because you opened a couple of these.\n\nPinger is now out of design partner mode and in public beta. Free tier is still available, no card needed.\n\nIf monitoring for your agency clients is something you've been meaning to sort out: https://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1. Genuinely takes 5 minutes to add a site and see a status page live.\n\nNo more follow-ups after this.\n\n— Mario\nPinger 🏓` }]
        },
        {
          type: 'email',
          delay: 0,
          delay_unit: 'days',
          variants: [{ subject: '[Agency] + Pinger — one last thing', body: `Hey {{firstName}},\n\nLast one.\n\nWe've crossed 50 agencies on Pinger now. The most common thing I hear from agencies after the first week: \"I can't believe I was waiting for clients to call me.\"\n\nIf that resonates, the door's still open: https://pingerhq.com/?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1 — free tier, no card.\n\nTake care,\n— Mario\nPinger 🏓` }]
        }
      ]
    }]
  };
}

async function api(pathname, method = 'GET', body) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
  if (!res.ok) throw new Error(`${method} ${pathname} -> ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const idx = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
  const iEmail = idx('email');
  const iFirst = idx('firstName') >= 0 ? idx('firstName') : idx('first_name');
  const iCompany = idx('company');
  const iSource = idx('source');
  const iProject = idx('specificProject') >= 0 ? idx('specificProject') : idx('specific_project');

  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const email = (cols[iEmail] || '').trim();
    if (!email || !email.includes('@')) return null;
    return {
      email,
      first_name: (cols[iFirst] || '').trim() || null,
      company_name: (cols[iCompany] || '').trim() || null,
      custom_variables: {
        source: (cols[iSource] || '').trim() || 'their site',
        specificProject: (cols[iProject] || '').trim() || "your agency's portfolio"
      }
    };
  }).filter(Boolean);
}

async function main() {
  const payloads = { campaign1: campaign1(), campaign2: campaign2() };

  if (!APPLY && !DO_RAMP) {
    const out = path.resolve('/root/PastaOS/COO_Pasta/instantly_api/instantly_payload_preview.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(payloads, null, 2));
    console.log(`Wrote payload preview to ${out}`);
    return;
  }

  if (DO_RAMP) {
    const campaignIds = (process.env.INSTANTLY_CAMPAIGN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!campaignIds.length) throw new Error('Set INSTANTLY_CAMPAIGN_IDS="id1,id2" to ramp daily_limit to 40.');
    for (const id of campaignIds) {
      const updated = await api(`/campaigns/${id}`, 'PATCH', { daily_limit: 40 });
      console.log('Ramped campaign:', updated.id || id);
    }
    return;
  }

  const c1 = await api('/campaigns', 'POST', payloads.campaign1);
  const c2 = await api('/campaigns', 'POST', payloads.campaign2);
  console.log('Created campaigns:', c1.id, c2.id);

  const sub = await api('/subsequences', 'POST', c1OpenersSubsequence(c1.id));
  console.log('Created C1 subsequence:', sub.id);

  if (fs.existsSync(CSV_PATH)) {
    const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
    const leads = parseCsv(csvText);
    const chunk = 1000;
    for (let i = 0; i < leads.length; i += chunk) {
      const batch = leads.slice(i, i + chunk);
      await api('/leads/add', 'POST', {
        campaign_id: c1.id,
        leads: batch,
        verify_leads_on_import: true,
        skip_if_in_workspace: true,
        skip_if_in_campaign: true
      });
    }
    console.log(`Uploaded ${leads.length} leads to campaign ${c1.id}`);
  } else {
    console.log(`CSV not found at ${CSV_PATH}; skipped lead upload.`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
