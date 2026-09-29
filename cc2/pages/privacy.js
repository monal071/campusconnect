import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Legal.module.css";

export default function Privacy() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Privacy | CampusConnect</title>
        <meta name="description" content="How CampusConnect uses your information." />
      </Head>
      <header className={styles.header}><Link href="/">← CampusConnect</Link></header>
      <main className={styles.main}>
        <h1>Privacy</h1>
        <p className={styles.updated}>Last updated 30 September 2026</p>
        <p>CampusConnect is a student project for the CHARUSAT community. This page explains what information the site uses when you sign in and participate.</p>
        <section>
          <h2>Information we collect</h2>
          <p>When you sign in with Google, CampusConnect receives your name, email address, and profile photo from your Google account. It uses your university email to check eligibility and create your account. We do not request access to your Gmail, Drive, or other Google content.</p>
          <p>Information you choose to add may include your profile details, posts, messages, event participation, uploaded resources, job listings, quiz responses, and connections with other users. The site also uses session cookies so you can stay signed in.</p>
        </section>
        <section>
          <h2>How information is used and shared</h2>
          <p>We use this information to provide accounts, campus features, and content you choose to share. Your profile and content you publish in shared areas may be visible to other CampusConnect users. Messages are intended for their participants.</p>
          <p>Service providers help run the site: Vercel hosts the app, MongoDB Atlas stores app data, and UploadThing handles files you upload. Google provides sign-in. Information is sent to these providers as needed for those functions.</p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>You can edit some profile details and remove some content in the app. For questions or requests about your account and data, use the support contact shown during Google sign-in. Do not upload information that you do not want to share with the intended audience.</p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>We may update this page when the project or its data practices change. The updated date above shows the latest version.</p>
        </section>
      </main>
      <footer className={styles.footer}><Link href="/">Home</Link><Link href="/terms">Terms</Link></footer>
    </div>
  );
}
