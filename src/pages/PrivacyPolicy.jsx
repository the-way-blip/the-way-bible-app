import useDocumentTitle from "../hooks/useDocumentTitle";

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-brown mb-6">Privacy Policy</h1>
      <p className="text-xs text-warm-brown-light mb-6">Last updated: May 4, 2026</p>

      <div className="space-y-6 text-sm text-warm-brown leading-relaxed">
        <Section title="Overview">
          <p>
            The Way is a Bible study application. We are committed to protecting your privacy.
            This policy explains what data we collect, how we use it, and your rights.
          </p>
        </Section>

        <Section title="Data We Collect">
          <p className="font-medium mb-2">Data stored on your device (local only):</p>
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
            We do not sell your personal data. We do not serve ads. We do not track you across other websites.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — authentication and data storage (if you create an account). Your email, name, profile preferences, highlights, notes, journal entries, memory verses, and reading progress are stored on Supabase servers with encryption at rest.</li>
            <li><strong>Resend</strong> — transactional email delivery. Used to send account confirmation and password reset emails to the address you sign up with.</li>
            <li><strong>GoHighLevel (CRM)</strong> — when you sign up, complete onboarding, submit a prayer request, or hit a reading milestone, we send your email, name, and event tags to our CRM so we can send you relevant devotional emails and updates. We never share this data with other parties for advertising.</li>
            <li><strong>Bible API</strong> — KJV Bible text retrieval. No personal data is sent.</li>
            <li><strong>Anthropic (Claude)</strong> — AI-powered word study generation. Verse text is sent for analysis; no account information is included in those requests.</li>
            <li><strong>Vercel</strong> — app hosting and serverless functions.</li>
          </ul>
        </Section>

        <Section title="Marketing & Email Communications">
          <p>
            If you sign up for a daily devotional during signup, you will receive periodic
            emails from The Way. You can unsubscribe at any time using the link at the bottom
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
            <li><strong>Delete your account</strong> and all associated cloud data — email us at the contact below and we will permanently remove everything within 30 days</li>
            <li><strong>Use the app without an account</strong> (fully local mode — no data leaves your device)</li>
            <li><strong>Unsubscribe from emails</strong> at any time</li>
            <li><strong>Object</strong> to or <strong>restrict</strong> certain processing — contact us with your request</li>
          </ul>
        </Section>

        <Section title="Children's Privacy">
          <p>
            This app does not knowingly collect personal information from children under 13.
            The app can be used without an account, in which case no personal data is transmitted.
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
