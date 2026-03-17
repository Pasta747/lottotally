#!/usr/bin/env node
const fs = require('fs');
const { TwitterApi } = require('/root/PastaOS/tools/x-api/node_modules/twitter-api-v2');

const ACCOUNTS = {
  pingerhq: {
    appKey: '0dpvXD1GHVtrtGxo03XIwxlu1',
    appSecret: 'GcwOC163NizwLBjTzUH2YVjJE13iddqpz1TUVRRuTe1ra9nUwG',
    accessToken: '2030023689635512320-HwuukQqimNPb6bQguF7TMPU0dRe9b9',
    accessSecret: 'sMeUVpmL5GSOYxWmHLtnQxWMiDH5JFc5w5QzmkJDNsEf0',
    userId: '2030023689635512320',
    profile: {
      description: 'Uptime monitoring + beautiful status pages for agencies. Ship reliability, not anxiety. 🏓 pingerhq.com',
      url: 'https://pingerhq.com',
      image: '/root/PastaOS/products/pinger/brand/concepts-v5/004-single-clean-logo-mark-on-white-backgrou.png',
      banner: '/root/PastaOS/COO_Pasta/tmp-pinger-banner.png',
    },
    followUsernames: ['webflow','framer','vercel','netlify','cloudflare','render','railway','sentry','datadoghq','posthog','supabase','neondatabase','uptimerobot','betterstackhq','indiehackers','levelsio','tinyseed','transistorfm','convertkit','nathanbarry']
  },
  canopyfilter: {
    appKey: 'FBzBky84j2RUvguFPMu4AHKjw',
    appSecret: 'MduvtVorQIzBsB8gPkYru56ZyD0IR0gg6NTusCrDEoAA8P2We7',
    accessToken: '2030172305603883008-9dh62xAJ4OCrY3NzaNdDHFPjL114e5',
    accessSecret: '3POLoJaFUutLugvPQ9LbF6EB8OkPGL7o2B1faSOyqa5vt',
    userId: '2030172305603883008',
    profile: {
      description: 'For creators who want to engage with their community on their terms. 🌿',
      url: 'https://canopyfilter.com',
      image: '/root/PastaOS/products/canopy-filter/brand/concepts-v2/002-minimal-logo-mark-an-arch-shaped-badge-w.png',
      banner: '/root/PastaOS/COO_Pasta/tmp-canopy-banner.png',
    },
    followUsernames: ['shepodcasts','descriptapp','riversidedotfm','buzzsprout','captivatefm','podmatch_com','transistorfm','convertkit','kit','substackinc','patreon','beaconsai','stanstore','uscreen','circle','thinkific','teachable','nathanbarry','lijin18','cathyheller']
  }
};

const account = process.argv[2];
if (!ACCOUNTS[account]) {
  console.error('usage: node tmp_x_launch.cjs <account>');
  process.exit(1);
}
const cfg = ACCOUNTS[account];
const client = new TwitterApi(cfg);
const out = { account, profile: {}, follows: { followed: [], skipped: [], failed: [] }, limitations: [] };

(async () => {
  try {
    const prof = await client.v1.updateAccountProfile({ description: cfg.profile.description, url: cfg.profile.url });
    out.profile.description = prof.description;
    out.profile.url = cfg.profile.url;
  } catch (e) {
    out.limitations.push(`updateAccountProfile failed: ${(e.data && (e.data.detail || JSON.stringify(e.data))) || e.message}`);
  }

  try {
    await client.v1.updateAccountProfileImage(fs.readFileSync(cfg.profile.image));
    out.profile.image = cfg.profile.image;
  } catch (e) {
    out.limitations.push(`updateAccountProfileImage failed: ${(e.data && (e.data.detail || JSON.stringify(e.data))) || e.message}`);
  }

  try {
    await client.v1.updateAccountProfileBanner(fs.readFileSync(cfg.profile.banner));
    out.profile.banner = cfg.profile.banner;
  } catch (e) {
    out.limitations.push(`updateAccountProfileBanner failed: ${(e.data && (e.data.detail || JSON.stringify(e.data))) || e.message}`);
  }

  for (const username of cfg.followUsernames) {
    try {
      const user = await client.v2.userByUsername(username);
      const targetId = user && user.data && user.data.id;
      if (!targetId) {
        out.follows.failed.push({ username, error: 'lookup returned no user' });
        continue;
      }
      const res = await client.v2.follow(cfg.userId, targetId);
      if (res && res.data && res.data.following) out.follows.followed.push({ username, id: targetId });
      else out.follows.skipped.push({ username, reason: JSON.stringify((res && res.data) || {}) });
    } catch (e) {
      out.follows.failed.push({ username, error: (e.data && (e.data.detail || JSON.stringify(e.data))) || e.message || String(e) });
    }
  }

  console.log(JSON.stringify(out, null, 2));
})();