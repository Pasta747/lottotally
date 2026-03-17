#!/usr/bin/env node
// X API v2 posting tool for PastaOS agents
// Usage: node post.mjs --account pingerhq --text "Hello world"
// Usage: node post.mjs --account canopyfilter --text "Hello world"

import { TwitterApi } from 'twitter-api-v2';

const ACCOUNTS = {
  pingerhq: {
    appKey: '0dpvXD1GHVtrtGxo03XIwxlu1',
    appSecret: 'GcwOC163NizwLBjTzUH2YVjJE13iddqpz1TUVRRuTe1ra9nUwG',
    accessToken: '2030023689635512320-55KLivExfFWZTeXDqQrAsuPXqxKbjv',
    accessSecret: 'SsDzzj7kJnYuYSr2kCCAZgvm8OV0srTlkqGzHFkp8r4So',
  },
  canopyfilter: {
    appKey: 'FBzBky84j2RUvguFPMu4AHKjw',
    appSecret: 'MduvtVorQIzBsB8gPkYru56ZyD0IR0gg6NTusCrDEoAA8P2We7',
    accessToken: '2030172305603883008-gf1tPewoqD04Y2YCpV24fAv6wxswCu',
    accessSecret: 'Ffdrcc5uziXYZS3OhZwHQl5H394irQW6b2V0h7kTJDneq',
  },
};

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--account') args.account = process.argv[++i];
    else if (process.argv[i] === '--text') args.text = process.argv[++i];
    else if (process.argv[i] === '--verify') args.verify = true;
    else if (process.argv[i] === '--reply-to') args.replyTo = process.argv[++i];
  }
  return args;
}

const args = parseArgs();

if (!args.account || !ACCOUNTS[args.account]) {
  console.error('Available accounts:', Object.keys(ACCOUNTS).join(', '));
  console.error('Usage: node post.mjs --account <name> --text "tweet" [--reply-to <id>]');
  console.error('       node post.mjs --account <name> --verify');
  process.exit(1);
}

const creds = ACCOUNTS[args.account];
const client = new TwitterApi(creds);

if (args.verify) {
  const me = await client.v2.me({ 'user.fields': 'description,public_metrics' });
  console.log(JSON.stringify(me.data, null, 2));
} else if (args.text) {
  const params = {};
  if (args.replyTo) params.reply = { in_reply_to_tweet_id: args.replyTo };
  const result = await client.v2.tweet(args.text, params);
  console.log('Posted! Tweet ID:', result.data.id);
  console.log('URL: https://x.com/' + args.account + '/status/' + result.data.id);
} else {
  console.error('Specify --text "tweet content" or --verify');
  process.exit(1);
}
