import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 flex flex-col items-center justify-center min-w-screen">
      <main className="card w-full max-w-4xl mx-auto px-4 pt-8 pb-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold leading-9 text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 24, 2026</p>

        <div className="prose prose-lg max-w-none text-left">
          <h2>Information We Collect</h2>
          <p>
            LottoTally's primary function is to help you reconcile lottery sales and commissions. To provide this service,
            we collect information you provide directly when you create an account or use our services. This includes:
          </p>
          <ul>
            <li>Account information: Your store name, state, and email address.</li>
            <li>Business data: Lottery terminal sales, scratch-off sales, book numbers, and commission rates.</li>
            <li>Usage information: Standard analytics for service improvement.</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain the LottoTally service for your business.</li>
            <li>Calculate lottery commissions and generate reports accurately.</li>
            <li>Communicate important service updates or issues.</li>
            <li>Improve our services based on how they are used.</li>
          </ul>

          <h2 id="information-sharing">Information Sharing & Security</h2>
          <p>
            Your business data is sensitive and private. We adhere to strict policies:
          </p>
          <ul>
            <li><strong>No Selling Data:</strong> We do not sell, trade, or rent your business or personal information to third parties.
            </li>
            <li><strong>Banking-Grade Encryption:</strong> Your data is protected in transit and at rest using industry-standard encryption methods to ensure security and privacy.
            </li>
          </ul>

          <h2>Your Data Rights</h2>
          <p>You control your data:</p>
          <ul>
            <li>Access and update your account and business data at any time in the Settings section.</li>
            <li>Export your business data via a CSV download (functionality coming soon).</li>
            <li>Request account deletion, which will remove your associated data.</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or how your data is handled, please reach out to us:
          </p>
          <p>
            <a
              href="mailto:privacy@lottotally.com"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              privacy@lottotally.com
            </a>
          </p>
        </div>
      </main>
      <div className="mt-8 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
        >
          <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20"
            fill="currentColor">
            <path fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"></path>
          </svg>
          Back to LottoTally
        </Link>
      </div>
    </div>
  );
}
