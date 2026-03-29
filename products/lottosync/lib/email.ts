import dotenv from 'dotenv';

dotenv.config({ path: '/root/PastaOS/products/lottosync/.env.vercel-production', override: true });

const AGENTMAIL_API_BASE = process.env.AGENTMAIL_API_BASE ?? 'https://api.agentmail.to/v0';
const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
const AGENTMAIL_FROM_INBOX = process.env.AGENTMAIL_FROM_INBOX ?? 'hello@lottotally.com';

if (!AGENTMAIL_API_KEY) {
  console.warn('AGENTMAIL_API_KEY not found. Email functionality may not work.');
}

export async function sendEmail({
  from,
  to,
  subject,
  html,
  text,
}: {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  if (!AGENTMAIL_API_KEY) {
    console.error('AgentMail not configured. Cannot send email.');
    return { error: 'AgentMail not configured.' };
  }

  try {
    const payload: Record<string, unknown> = {
      to: Array.isArray(to) ? to : [to],
      subject,
    };
    if (html) payload.html = html;
    if (text) payload.text = text;

    const url = `${AGENTMAIL_API_BASE}/inboxes/${AGENTMAIL_FROM_INBOX}/messages/send`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`AgentMail send failed (${res.status}): ${err}`);
      return { error: `AgentMail send failed (${res.status}): ${err}` };
    }

    const data = await res.json();
    console.log('Email sent via AgentMail:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { error };
  }
}
