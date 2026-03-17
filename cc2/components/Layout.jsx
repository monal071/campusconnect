import NavBar from "./NavBar";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const Layout = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Pages where we don't show the NavBar or footer
  const noNavBarPages = ["/", "/login", "/signup"];
  const showNavBar = !noNavBarPages.includes(router.pathname);

  const isLoggedIn = status === "authenticated" && !!session;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {showNavBar && <NavBar isLoggedIn={isLoggedIn} isGuest={false} />}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={
          showNavBar ? "flex-1 container pt-16 w-full" : "flex-1 w-full"
        }
      >
        {children}
      </motion.main>
      {showNavBar && (
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-8">
          <div className="container-main py-0">
            <div className="flex flex-col md:flex-row justify-center items-center">
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  CampusConnect
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
