import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { ScrollToTopButton } from "./ScrollToTopButton";

export function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-accent-foreground"
      >
        تخطّي إلى المحتوى / Skip to content
      </a>
      <Navbar />
      {/* key on path so each navigation gently fades the new page in */}
      <main
        id="main-content"
        key={pathname}
        className="page-enter flex-1 pb-16 lg:pb-0"
      >
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <ScrollToTopButton />
    </div>
  );
}
