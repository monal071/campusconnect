import NavBar from "./NavBar";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Layout = ({ children }) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Pages where we don't show the NavBar or footer
  const noNavBarPages = ["/", "/login", "/signup"];
  const showNavBar = !noNavBarPages.includes(router.pathname);

  const isLoggedIn = status === "authenticated" && !!session;
  const isAdmin = session?.user?.role === "admin";
  const isProfileComplete = session?.user?.isProfileComplete;
  const hasValidRole = session?.user?.role && ["student", "faculty", "admin"].includes(session?.user?.role);

  // Redirect users with incomplete profile to signup
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // If profile is not complete or no valid role, redirect to signup
      if ((!hasValidRole || !isProfileComplete) && !noNavBarPages.includes(router.pathname)) {
        router.replace("/signup");
        return;
      }

      // Admin users can only access admin page
      if (isAdmin) {
        const allowedAdminPages = ["/admin", "/login", "/", "/signup"];
        if (!allowedAdminPages.includes(router.pathname)) {
          router.replace("/admin");
        }
      }
    }
  }, [status, session, hasValidRole, isProfileComplete, isAdmin, router.pathname]);

  // If user has incomplete profile on a protected page, show loading while redirecting
  if (
    status === "authenticated" &&
    session?.user &&
    (!hasValidRole || !isProfileComplete) &&
    !noNavBarPages.includes(router.pathname)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Please complete your registration...
          </p>
        </div>
      </div>
    );
  }

  // If admin is on non-admin page, show loading while redirecting
  if (
    status === "authenticated" &&
    isAdmin &&
    router.pathname !== "/admin" &&
    !noNavBarPages.includes(router.pathname)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to Admin Panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {showNavBar && (
        <NavBar isLoggedIn={isLoggedIn} isGuest={false} isAdmin={isAdmin} />
      )}
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
      {showNavBar && !isAdmin && (
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
