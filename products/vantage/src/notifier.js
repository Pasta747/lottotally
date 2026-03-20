const fs = require('fs');
const path = require('path');

const OUTBOX = path.join(__dirname, '..', 'outbox');

function sendSignalMessage(user, text) {
  fs.mkdirSync(OUTBOX, { recursive: true });
  const line = {
    ts: new Date().toISOString(),
    userId: user.userId,
    whatsapp: user.whatsapp,
    text,
    channel: 'whatsapp',
  };

  // Beta delivery path: append queue file for operator/OpenClaw relay.
  fs.appendFileSync(path.join(OUTBOX, 'whatsapp-queue.jsonl'), `${JSON.stringify(line)}\n`);
  console.log(`[notify] ${user.userId} ${user.whatsapp}: ${text}`);
}

module.exports = { sendSignalMessage };
