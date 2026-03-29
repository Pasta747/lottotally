import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] py-12 px-4">
      <main className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-8"
        >
          <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to LottoTally
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: March 24, 2026</p>

          <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Information We Collect</h2>
              <p>LottoTally's primary function is to help you reconcile lottery sales and commissions. To provide this service, we collect information you provide directly when you create an account or use our services:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                <li>Account information: your store name, state, and email address</li>
                <li>Business data: lottery terminal sales, scratch-off sales, book numbers, and commission rates</li>
                <li>Usage information: standard analytics for service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                <li>Provide and maintain the LottoTally service for your business</li>
                <li>Calculate lottery commissions and generate reports accurately</li>
                <li>Communicate important service updates or issues</li>
                <li>Improve our services based on how they are used</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Information Sharing & Security</h2>
              <p>Your business data is sensitive and private. We adhere to strict policies:</p>
              <ul className="mt-2 space-y-2 list-disc list-inside text-slate-600">
                <li><strong>No Selling Data:</strong> We do not sell, trade, or rent your business or personal information to third parties.</li>
                <li><strong>Banking-Grade Encryption:</strong> Your data is protected in transit and at rest using industry-standard encryption.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Your Data Rights</h2>
              <p>You control your data:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                <li>Access and update your account and business data at any time in Settings</li>
                <li>Export your business data via CSV download (coming soon)</li>
                <li>Request account deletion, which removes your associated data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact Us</h2>
              <p>Questions about this Privacy Policy? Reach out:</p>
              <p className="mt-1">
                <a href="mailto:privacy@lottotally.com" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  privacy@lottotally.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
