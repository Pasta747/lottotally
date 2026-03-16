const AGENTMAIL_API_BASE = process.env.AGENTMAIL_API_BASE ?? "https://api.agentmail.to/v0";
const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;

function requiredApiKey() {
  if (!AGENTMAIL_API_KEY) {
    throw new Error("Missing AGENTMAIL_API_KEY");
  }
  return AGENTMAIL_API_KEY;
}

export async function sendTransactionalEmail(params: {
  fromInbox: string;
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  labels?: string[];
}) {
  const res = await fetch(`${AGENTMAIL_API_BASE}/inboxes/${params.fromInbox}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      labels: params.labels,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AgentMail send failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<{ message_id: string; thread_id: string }>;
}

export async function sendWelcomeEmail(to: string) {
  return sendTransactionalEmail({
    fromInbox: process.env.AGENTMAIL_HELLO_INBOX ?? "hello@pingerhq.com",
    to,
    subject: "Welcome to Pinger",
    text: "Welcome to Pinger! Your account is ready.",
    html: "<p>Welcome to <strong>Pinger</strong>! Your account is ready.</p>",
    labels: ["transactional", "welcome"],
  });
}
