import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import ImprovedToaster from "../components/ImprovedToaster";
import ProgressBar from "../components/ProgressBar";
const KeyboardShortcuts = dynamic(() => import("../components/KeyboardShortcuts"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("../components/PWAInstallPrompt"), { ssr: false });
const OnboardingTour = dynamic(() => import("../components/OnboardingTour"), { ssr: false });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const isPublicPage = ["/", "/login", "/signup", "/auth/signin"].includes(router.pathname);

  useEffect(() => {
    setMounted(true);

    if (!("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (process.env.NODE_ENV === "production") {
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.filter((registration) => registration.active?.scriptURL === `${location.origin}/sw.js`)
        .forEach((registration) => registration.unregister());
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <RecoilRoot>
          <ThemeProvider defaultTheme="dark" attribute="class">
            {/* Route Progress Bar */}
            <ProgressBar />

            <Layout>
              <Component {...pageProps} />

              {/* Enhanced Toast Notifications (top-right) */}
              <ImprovedToaster />

              {/* Keyboard Shortcuts */}
              {mounted && !isPublicPage && <KeyboardShortcuts />}

              {/* PWA Install Prompt */}
              {mounted && !isPublicPage && <PWAInstallPrompt />}

              {/* Onboarding Tour (shows for new users) */}
              {mounted && !isPublicPage && <OnboardingTour />}
            </Layout>
          </ThemeProvider>
        </RecoilRoot>
      </SessionProvider>
    </ErrorBoundary>
  );
}
