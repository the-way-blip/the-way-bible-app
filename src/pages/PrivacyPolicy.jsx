import useDocumentTitle from "../hooks/useDocumentTitle";
import usePageMeta from "../hooks/usePageMeta";

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy");
  usePageMeta({
    description: "Privacy policy for TheWay Bible App. What data we collect, how we use it, and your rights.",
    ogTitle: "Privacy Policy — TheWay Bible App",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-brown mb-6">Privacy Policy</h1>
      <p className="text-xs text-warm-brown-light mb-6">Last updated: September 30, 2026</p>

      <div className="space-y-6 text-sm text-warm-brown leading-relaxed">
        <Section title="Overview">
          <p>
            TheWay Bible App is a Bible study application. We are committed to protecting your privacy.
            This policy explains what data we collect, how we use it, and your rights.
          </p>
        </Section>

        <Section title="Data We Collect">
          <p className="font-medium mb-2">Study data stored on your device (also synced when signed in):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reading progress and history</li>
            <li>Highlights, notes, and journal entries</li>
            <li>Memory verses and practice data</li>
            <li>App preferences (font size, theme, etc.)</li>
          </ul>
          <p className="mt-3 font-medium mb-2">If you create an account:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address (for authentication)</li>
            <li>Display name (optional)</li>
            <li>Earlier signup versions also requested phone, city, state, and communication preferences. Contact us to request deletion of previously supplied information.</li>
            <li>Your study data may be synced to our servers for backup and cross-device access</li>
          </ul>
        </Section>

        <Section title="How We Use Your Data">
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve the Bible study experience</li>
            <li>To sync your data across devices (if you sign in)</li>
            <li>To generate word study and chapter analysis using AI services</li>
          </ul>
          <p className="mt-2">
            We do not sell your personal data. We do not serve ads. We use the analytics services described below to understand usage.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — authentication and data storage (if you create an account). Your email, name, profile preferences, highlights, notes, journal entries, memory verses, and reading progress are stored on Supabase servers with encryption at rest.</li>
            <li><strong>Resend</strong> — transactional email delivery. Used to send account confirmation and password reset emails to the address you sign up with.</li>
            <li><strong>GoHighLevel (CRM)</strong> — if you explicitly select devotional emails, we send your email, optional name, and subscription preference. This version does not send prayer text, onboarding answers, or reading milestones to the CRM. Earlier versions sent signup details and activity information, including prayer request text. Contact us to request removal of previously shared data.</li>
            <li><strong>Bible API</strong> — KJV Bible text retrieval. Requests include the requested passage and network information such as your IP address.</li>
            <li><strong>Anthropic (Claude)</strong> — AI-powered word study generation. Verse text is sent for analysis; no account information is included in those requests.</li>
            <li><strong>Vercel</strong> — app hosting and serverless functions.</li>
            <li><strong>Vercel Analytics</strong> — aggregate page views and conversion events so we can improve the app. No tracking across other sites.</li>
            <li><strong>Sentry</strong> — error and crash reporting, including stack traces and sampled performance diagnostics. Automatic inclusion of account identity and IP addresses is disabled in this version. Diagnostic requests still involve network metadata.</li>
            <li><strong>Google Analytics</strong> — website usage and interaction measurement. Google Analytics may use cookies or browser identifiers and receive page URLs, events, device information, and network metadata. It is loaded on the public website.</li>
            <li><strong>Pexels and Unsplash</strong> — stock photo backgrounds for the verse-share image feature. Only the search query you choose (e.g. "mountain") is sent; no personal data.</li>
          </ul>
        </Section>

        <Section title="Marketing & Email Communications">
          <p>
            If you choose devotional emails during signup, you will receive periodic
            emails from TheWay Bible App. You can unsubscribe at any time using the link at the bottom
            of any email, or by replying to ask us to remove you. Unsubscribing will not
            affect your ability to use the app.
          </p>
        </Section>

        <Section title="Data Storage & Security">
          <p>
            Most of your data is stored locally on your device using IndexedDB and localStorage.
            If you create an account, some data is stored on Supabase servers with encryption at rest.
            You can export or delete all your data at any time from Settings.
          </p>
        </Section>

        <Section title="Your Rights">
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> all your data via the Export feature in Settings</li>
            <li><strong>Correct</strong> profile information directly in the app</li>
            <li><strong>Delete</strong> all locally stored data via Clear Data in Settings</li>
            <li><strong>Delete your account</strong> using the account deletion control in Settings. Contact us for deletion requests involving email subscriptions, previously shared CRM data, or other retained records.</li>
            <li><strong>Use the app without an account</strong> (study records remain on your device; hosting, analytics, diagnostics, and requested content services still receive network requests)</li>
            <li><strong>Unsubscribe from emails</strong> at any time</li>
            <li><strong>Object</strong> to or <strong>restrict</strong> certain processing — contact us with your request</li>
          </ul>
        </Section>

        <Section title="Children's Privacy">
          <p>
            This app does not knowingly collect personal information from children under 13.
            Guest access does not require an account, but still makes network requests to the services described above.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy from time to time. Changes will be reflected on this page
            with an updated date.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about this privacy policy, to request access, correction, or
            deletion of your data, or to unsubscribe from emails, contact us at{" "}
            <a href="mailto:dillon@branddesignco.com" className="text-gold underline">
              dillon@branddesignco.com
            </a>
            . We respond to all data requests within 30 days.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-warm-brown mb-2">{title}</h2>
      {children}
    </div>
  );
}
