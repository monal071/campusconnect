import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <RecoilRoot>
          <ThemeProvider defaultTheme="dark" attribute="class">
            <Layout>
              <Component {...pageProps} />
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #374151',
                  },
                  success: {
                    style: {
                      background: '#065f46',
                      color: '#fff',
                    },
                  },
                  error: {
                    style: {
                      background: '#7f1d1d',
                      color: '#fff',
                    },
                  },
                }}
              />
            </Layout>
          </ThemeProvider>
        </RecoilRoot>
      </SessionProvider>
    </ErrorBoundary>
  );
}