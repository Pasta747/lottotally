import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 flex flex-col items-center justify-center min-w-screen">
      <main className="card w-full max-w-4xl mx-auto px-4 pt-8 pb-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold leading-9 text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 24, 2026</p>

        <div className="prose prose-lg max-w-none text-left">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using LottoTally, a service for lottery sales reconciliation and commission tracking, you agree to these terms.
            Your use of the service signifies your acceptance of these conditions.
          </p>

          <h2>2. LottoTally Service</h2>
          <p>
            LottoTally provides tools for independent convenience store operators to manage lottery sales, track 
            scratch-off inventory, and calculate commissions. Our service aims to simplify these processes.
          </p>

          <h2>3. Your Account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account, including your password,
            and for all activities that occur under your account. Notify LottoTally immediately of any unauthorized use.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations related to lottery sales or business operations.</li>
            <li>Interfere with the service's operation or security.</li>
            <li>Attempt unauthorized access to any part of the service or user data.</li>
            <li>Use the service to transmit any malicious code or engage in any fraudulent activity.</li>
          </ul>

          <h2>5. Data Accuracy & Responsibility</h2>
          <p>
            You are responsible for the accuracy of the data entered into LottoTally, including sales figures and 
            scratch-off inventory. While LottoTally assists with calculations, you must independently verify all 
            commission amounts with your official lottery provider.
          </p>

          <h2>6. Service Availability & Updates</h2>
          <p>
            We strive for high availability but cannot guarantee uninterrupted service. LottoTally may undergo 
            maintenance. We will notify users of significant changes or planned downtime.
          </p>

          <h2>7. Pricing and Payment</h2>
          <p>
            Subscription details are available on our pricing page. Fees are billed in advance and are non-refundable,
            except as required by law. A 14-day free trial is offered.
          </p>

          <h2>8. Termination</h2>
          <p>
            You may terminate your account at any time. LottoTally reserves the right to terminate accounts that 
            violate these terms. Upon termination, your access to the service and data will cease.
          </p>

          <h2>9. Liability Limitation</h2>
          <p>
            LottoTally is not liable for any indirect, incidental, or consequential damages arising from the use of its services.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms of Service periodically. Significant changes will be communicated via email 
            or an announcement within the service.
          </p>

          <h2>Contact Information</h2>
          <p>
            For questions regarding these Terms of Service, please contact our support team:
          </p>
          <p>
            <a
              href="mailto:support@lottotally.com"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              support@lottotally.com
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
