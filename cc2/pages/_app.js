import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import ImprovedToaster from "../components/ImprovedToaster";
import ProgressBar from "../components/ProgressBar";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import PWAInstallPrompt from "../components/PWAInstallPrompt";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration);
          })
          .catch((error) => {
            console.log("Service Worker registration failed:", error);
          });
      });
    }
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
              {mounted && <KeyboardShortcuts />}

              {/* PWA Install Prompt */}
              {mounted && <PWAInstallPrompt />}
            </Layout>
          </ThemeProvider>
        </RecoilRoot>
      </SessionProvider>
    </ErrorBoundary>
  );
}
