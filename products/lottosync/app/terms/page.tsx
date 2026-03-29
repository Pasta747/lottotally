import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: March 24, 2026</p>

          <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
              <p>By using LottoTally, you agree to these terms. Your use of the service signifies your acceptance of these conditions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">2. LottoTally Service</h2>
              <p>LottoTally provides tools for independent convenience store operators to manage lottery sales, track scratch-off inventory, and calculate commissions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Your Account</h2>
              <p>You are responsible for maintaining the confidentiality of your account and password, and for all activities under your account. Notify us immediately of any unauthorized use.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                <li>Violate any applicable laws or regulations related to lottery sales</li>
                <li>Interfere with the service&apos;s operation or security</li>
                <li>Attempt unauthorized access to any part of the service or user data</li>
                <li>Use the service to transmit malicious code or engage in fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Data Accuracy & Responsibility</h2>
              <p>You are responsible for the accuracy of data entered into LottoTally. While we assist with calculations, you must independently verify all commission amounts with your official lottery provider.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Service Availability & Updates</h2>
              <p>We strive for high availability but cannot guarantee uninterrupted service. We will notify users of significant changes or planned downtime.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Pricing and Payment</h2>
              <p>Subscription details are on our pricing page. Fees are billed in advance and non-refundable except as required by law. A 14-day free trial is offered.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Termination</h2>
              <p>You may terminate at any time. We reserve the right to terminate accounts that violate these terms. Upon termination, access to the service and data will cease.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Liability Limitation</h2>
              <p>LottoTally is not liable for any indirect, incidental, or consequential damages arising from the use of its services.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">10. Changes to Terms</h2>
              <p>We may update these terms periodically. Significant changes will be communicated via email or an announcement within the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Contact Information</h2>
              <p>Questions? Reach out:</p>
              <p className="mt-1">
                <a href="mailto:support@lottotally.com" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  support@lottotally.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
