import useDocumentTitle from "../hooks/useDocumentTitle";
import usePageMeta from "../hooks/usePageMeta";

export default function Terms() {
  useDocumentTitle("Terms of Service");
  usePageMeta({
    description: "Terms of Service for TheWay Bible App. Account terms, acceptable use, content ownership, and more.",
    ogTitle: "Terms of Service — TheWay Bible App",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-warm-brown mb-6">Terms of Service</h1>
      <p className="text-xs text-warm-brown-light mb-6">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 text-sm text-warm-brown leading-relaxed">
        <Section title="Agreement to Terms">
          <p>
            By accessing or using TheWay Bible App ("the app"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the app.
          </p>
        </Section>

        <Section title="Description of Service">
          <p>
            TheWay Bible App is a Bible study application that provides tools to read Scripture, study original-language word definitions, memorize verses, journal, track prayer requests, and explore topical Scripture references. The app is offered to users at no cost for core features.
          </p>
        </Section>

        <Section title="Accounts">
          <p>
            You may use TheWay Bible App without creating an account. If you choose to create an account, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide accurate and current information</li>
            <li>Keep your password secure and confidential</li>
            <li>Be responsible for all activity that occurs under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          <p className="mt-2">
            You must be at least 13 years old to create an account. If you are under 18, you may use the app only with the involvement of a parent or guardian.
          </p>
        </Section>

        <Section title="Acceptable Use">
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the app for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the app or its systems</li>
            <li>Interfere with or disrupt the app's operation</li>
            <li>Reverse-engineer, decompile, or attempt to extract the source code</li>
            <li>Use automated means (bots, scrapers) to access the app at scale</li>
            <li>Submit content that is unlawful, hateful, defamatory, or violates anyone's rights</li>
            <li>Impersonate another person or misrepresent your affiliation with anyone</li>
          </ul>
        </Section>

        <Section title="Your Content">
          <p>
            Notes, highlights, journal entries, prayer requests, and other content you create in TheWay Bible App remain yours. You retain all rights to that content. By using the app, you grant us a limited license to store, sync, and display your content solely for the purpose of providing the service to you.
          </p>
          <p className="mt-2">
            You can export or delete your content at any time from Settings.
          </p>
        </Section>

        <Section title="Intellectual Property">
          <p>
            The TheWay Bible App brand, logo, design, code, and original content are owned by us and protected by copyright and other intellectual property laws. The biblical text shown in the app is sourced from the public-domain King James Version.
          </p>
          <p className="mt-2">
            Third-party content (commentaries, dictionaries, photo backgrounds via Unsplash, etc.) belongs to their respective owners and is used under their applicable licenses or terms.
          </p>
        </Section>

        <Section title="Disclaimer of Warranties">
          <p>
            TheWay Bible App is provided "as is" and "as available" without warranties of any kind, express or implied, including (but not limited to) warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className="mt-2">
            We do not warrant that the app will be uninterrupted, error-free, or that defects will be corrected. AI-generated content (word studies, chapter summaries, etc.) is provided for study reference and may contain errors; it is not a substitute for personal study, qualified teaching, or pastoral guidance.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, TheWay Bible App and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the app — including (without limitation) lost data, lost profits, or any other intangible loss.
          </p>
          <p className="mt-2">
            Our total liability for any claim related to the app is limited to the greater of (a) the amount you have paid us in the past 12 months for the service, or (b) one hundred US dollars ($100).
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            TheWay Bible App relies on third-party services (Supabase, Resend, Vercel, Unsplash, Anthropic, Bible APIs, and others) to function. Your use of the app is also subject to those providers' terms of service. We are not responsible for the practices or content of third-party services.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You may stop using the app and delete your account at any time. We may suspend or terminate your access to the app — with or without notice — if you violate these terms or engage in activity that harms other users, our infrastructure, or our reputation.
          </p>
        </Section>

        <Section title="Changes to These Terms">
          <p>
            We may update these terms from time to time. We will notify users of material changes by updating the "Last updated" date at the top of this page and, where appropriate, sending an email or in-app notice. Continued use of the app after a change constitutes acceptance of the new terms.
          </p>
        </Section>

        <Section title="Governing Law">
          <p>
            These terms are governed by the laws of the United States and the state in which the operator resides, without regard to conflict-of-law principles. Any disputes will be resolved in the courts of that jurisdiction.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email <a href="mailto:hello@thewaybible.app" className="text-gold underline">hello@thewaybible.app</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-warm-brown mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
