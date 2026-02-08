import Header from "./Header";
import { useRouter } from "next/router";

const Layout = ({ children }) => {
  const router = useRouter();

  const noNavBarPages = ["/", "/login", "/signup"];
  const showNavBar = !noNavBarPages.includes(router.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {showNavBar && <Header />}
      <main className={showNavBar ? "flex-1 pt-2 w-full" : "flex-1 w-full"}>
        {children}
      </main>
      {showNavBar && (
        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 mt-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            CampusConnect &copy; {new Date().getFullYear()}
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
