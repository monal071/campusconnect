import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Legal.module.css";

export default function Terms() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Terms | CampusConnect</title>
        <meta name="description" content="Guidelines for using CampusConnect." />
      </Head>
      <header className={styles.header}><Link href="/">← CampusConnect</Link></header>
      <main className={styles.main}>
        <h1>Terms of use</h1>
        <p className={styles.updated}>Last updated 30 September 2026</p>
        <p>CampusConnect is a student project for the CHARUSAT community. It is not an official university service. Use the site respectfully and check important academic or event details with their original source.</p>
        <section>
          <h2>Accounts</h2>
          <p>Sign-in is intended for eligible CHARUSAT email accounts. Keep access to your Google account secure. Do not impersonate someone else or use another person&apos;s account.</p>
        </section>
        <section>
          <h2>Content and conduct</h2>
          <p>Only share material you have permission to share. Do not post abusive, misleading, unlawful, or private information about someone else. You remain responsible for the content you contribute, including resources and listings.</p>
          <p>Content from other users is provided by those users. CampusConnect does not verify every post, event, resource, or job listing.</p>
        </section>
        <section>
          <h2>Availability and changes</h2>
          <p>This is a college project and features may change or be unavailable at times. If you find a problem, contact <a href="mailto:pmonal071@gmail.com">pmonal071@gmail.com</a>.</p>
        </section>
        <section>
          <h2>Privacy</h2>
          <p>Read the <Link href="/privacy">Privacy page</Link> to learn how your information is used.</p>
        </section>
      </main>
      <footer className={styles.footer}><Link href="/">Home</Link><Link href="/privacy">Privacy</Link></footer>
    </div>
  );
}
