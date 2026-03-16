export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-zinc-600">Configure where incident alerts are delivered.</p>
      </header>

      <section className="rounded-xl border bg-white p-6">
        <p className="text-sm text-zinc-600">
          Notification channels (email/webhook/Slack) scaffolded; delivery settings UI pending backend
          persistence model.
        </p>
      </section>
    </div>
  );
}
