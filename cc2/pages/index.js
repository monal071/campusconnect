import Head from "next/head";
import Link from "next/link";
import { AcademicCapIcon, ArrowRightIcon, BookOpenIcon, CalendarDaysIcon, UserGroupIcon, BriefcaseIcon, ChatBubbleLeftRightIcon, BeakerIcon } from "@heroicons/react/24/outline";
import styles from "../styles/Landing.module.css";

const features = [
  { icon: BookOpenIcon, title: "A little help with the syllabus.", tag: "STUDY TOGETHER", description: "Find notes, share useful resources, and learn from the people taking the same classes.", href: "/resources", link: "Explore resources", color: "mint" },
  { icon: CalendarDaysIcon, title: "Make room for campus life.", tag: "SHOW UP", description: "Discover workshops, college events, and the things happening beyond your timetable.", href: "/events", link: "Find an event", color: "peach" },
  { icon: BriefcaseIcon, title: "Your next chapter starts here.", tag: "LOOK AHEAD", description: "Browse internships and job opportunities as you build your skills and plan what comes next.", href: "/jobs", link: "Browse opportunities", color: "lilac" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <Head>
        <title>CampusConnect — Your campus, connected</title>
        <meta name="description" content="A home for the CHARUSAT community. Share notes, discover events, connect with classmates, and find your next opportunity." />
      </Head>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="CampusConnect home"><span className={styles.brandIcon}><AcademicCapIcon /></span>campus<span className={styles.brandAccent}>connect</span><span className={styles.brandDot}>.</span></Link>
        <nav aria-label="Main navigation" className={styles.nav}><a href="#explore">Explore campus</a><a href="#how-it-works">How it works</a></nav>
        <Link href="/login" className={styles.navButton}>Sign in <ArrowRightIcon /></Link>
      </header>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> BUILT FOR THE CHARUSAT COMMUNITY</p>
          <h1>College is better<br />when you&apos;re<br /><em>connected.</em></h1>
          <p className={styles.intro}>The notes you need. The people you should meet. The opportunities you don&apos;t want to miss. Your campus life, all in one place.</p>
          <div className={styles.actions}><Link href="/signup" className={styles.primary}>Find your community <ArrowRightIcon /></Link><a href="#explore" className={styles.secondary}>Take a look around <span>↗</span></a></div>
          <p className={styles.heroNote}><AcademicCapIcon /> For students and faculty. Made for everyday campus life.</p>
        </div>
        <div className={styles.campusBoard} aria-label="An overview of what you can do on CampusConnect">
          <div className={styles.boardHeading}><span>YOUR CAMPUS, AT A GLANCE</span><span className={styles.liveDot} /></div>
          <div className={styles.boardTitle}>Good things happen<br />when we come together<span>.</span></div>
          <Link href="/resources" className={styles.noteCard}><span className={styles.noteIcon}><BookOpenIcon /></span><div><small>THE STUDY CORNER</small><h3>Big ideas. Shared notes.</h3><p>Give your next study session a head start.</p></div><ArrowRightIcon className={styles.cardArrow} /></Link>
          <div className={styles.boardGrid}>
            <Link href="/events" className={styles.eventTile}><CalendarDaysIcon /><small>BEYOND THE CLASSROOM</small><h3>Find your<br />next experience.</h3><span>Explore events ↗</span></Link>
            <Link href="/login?callbackUrl=%2Fcommunities" className={styles.communityTile}><div className={styles.avatarStack}><span>Hi</span><span>!</span><span>☺</span></div><small>FIND YOUR PEOPLE</small><h3>Different interests.<br />One community.</h3><span>Meet your campus ↗</span></Link>
          </div>
          <div className={styles.boardFooter}><span><span className={styles.smallDot} /> A little more connected, every day.</span><span>✳</span></div>
          <div className={styles.boardSticker}><BeakerIcon /><span>Learn.<br />Share. Grow.</span></div>
        </div>
      </section>
      <div className={styles.topicStrip}><span>ONE CAMPUS. MANY POSSIBILITIES.</span><span><BookOpenIcon />Shared knowledge</span><span><UserGroupIcon />Real connections</span><span><CalendarDaysIcon />New experiences</span><span><BriefcaseIcon />What&apos;s next</span></div>
      <section id="explore" className={styles.explore}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>A PLACE FOR EVERY PART OF COLLEGE</p><h2>Less searching.<br />More discovering.</h2></div><p>From your first lecture to your next big step,<br />keep the useful things close.</p></div>
        <div className={styles.featureGrid}>{features.map(({ icon: Icon, title, tag, description, href, link, color }) => <article key={href} className={styles.featureCard}><div className={`${styles.featureIcon} ${styles[color]}`}><Icon /></div><small>{tag}</small><h3>{title}</h3><p>{description}</p><Link href={href}>{link}<ArrowRightIcon /></Link></article>)}</div>
      </section>
      <section id="how-it-works" className={styles.joinSection}>
        <div><p className={styles.eyebrow}>YOU BELONG HERE</p><h2>Your campus.<br />Your people.<br /><em>Your place to grow.</em></h2><p>Sign in with your CHARUSAT Google account, set up your profile, and start exploring.</p><Link href="/signup" className={styles.primary}>Let&apos;s get you connected <ArrowRightIcon /></Link></div>
        <ol className={styles.steps}><li><span>01</span><div><h3>Make yourself at home</h3><p>Create your student or faculty profile with your university account.</p></div></li><li><span>02</span><div><h3>Follow your curiosity</h3><p>Discover resources, campus events, quizzes, and communities.</p></div></li><li><span>03</span><div><h3>Bring something to the table</h3><p>Share a resource, start a conversation, or connect with a classmate.</p></div></li></ol>
      </section>
      <footer className={styles.footer}><Link href="/" className={styles.brand}><AcademicCapIcon />campusconnect.</Link><p>A closer campus starts with a connection.</p><Link href="/login">Join the conversation <ChatBubbleLeftRightIcon /></Link></footer>
    </div>
  );
}
