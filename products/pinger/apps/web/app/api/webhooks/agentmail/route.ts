import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const secret = process.env.AGENTMAIL_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Missing AGENTMAIL_WEBHOOK_SECRET" }, { status: 500 });
    }

    const rawBody = await req.text();
    const h = await headers();

    const svixHeaders = {
      "svix-id": h.get("svix-id") ?? "",
      "svix-timestamp": h.get("svix-timestamp") ?? "",
      "svix-signature": h.get("svix-signature") ?? "",
    };

    const wh = new Webhook(secret);
    const event = wh.verify(rawBody, svixHeaders) as {
      event_type?: string;
      data?: {
        inbox_id?: string;
        message_id?: string;
        from?: string;
        to?: string | string[];
        subject?: string;
        text?: string;
        extracted_text?: string;
      };
    };

    if (event.event_type === "message.received") {
      const data = event.data;
      const payload = {
        inbox: data?.inbox_id,
        from: data?.from,
        to: data?.to,
        subject: data?.subject,
      };
      console.log("[AgentMail webhook] inbound message", payload);

      // Persist support ticket
      const fromAddress = data?.from ?? "unknown";
      const subject = data?.subject ?? "(no subject)";
      const body = data?.extracted_text ?? data?.text ?? "";
      const messageId = data?.message_id ?? "";

      await prisma.supportTicket.create({
        data: {
          externalId: messageId,
          fromEmail: fromAddress,
          subject,
          body,
          inboxId: data?.inbox_id ?? "",
          status: "OPEN",
        },
      });

      console.log("[AgentMail webhook] support ticket created", { from: fromAddress, subject });

      // Route: if subject contains "urgent" or "down", mark as HIGH priority
      const isUrgent = /\b(urgent|down|outage|critical)\b/i.test(subject + " " + body);
      if (isUrgent) {
        console.log("[AgentMail webhook] HIGH priority ticket detected", { from: fromAddress, subject });
        // Future: trigger PagerDuty / Slack alert / email escalation
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[AgentMail webhook] verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
