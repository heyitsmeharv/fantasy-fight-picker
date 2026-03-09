import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import NavButton from "../components/common/NavButton";
import { upcomingEvents } from "../data/mockData";
import { usePicks } from "../context/PicksContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import fantasyUfcLogo from "../../fantasy-ufc.png";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getEventCard } = usePicks();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { showToast } = useToast();

  const featuredEvent = upcomingEvents[0];
  const featuredEventCard = getEventCard(featuredEvent.id);
  const selectedCount = featuredEventCard?.selectedCount ?? 0;
  const totalFights = Array.isArray(featuredEvent.fights)
    ? featuredEvent.fights.length
    : 0;

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Upcoming", path: "/upcoming" },
    { label: "Event", path: `/events/${featuredEvent.id}` },
    { label: "Fighters", path: "/fighters" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "League", path: "/league" },
    { label: "My Picks", path: "/my-picks" },
    ...(isAdmin ? [{ label: "Admin", path: "/admin/results" }] : []),
  ];

  const handleLogout = () => {
    logout();

    showToast({
      title: "Logged out",
      description: "You’ve been signed out.",
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,10,17,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-8 rounded-[20px] border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={fantasyUfcLogo}
                alt="Fantasy UFC logo"
                className="h-12 w-12 rounded-md object-cover shadow-lg shadow-red-950/30"
              />
              <div>
                <p className="text-2xl font-bold uppercase tracking-[0.08em] text-white">
                  Fantasy UFC
                </p>
                <p className="text-sm text-slate-400">
                  Fantasy-style UFC predictions inspired by the fight night experience
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <NavButton
                    key={item.path}
                    active={isActive}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </NavButton>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="rounded-full border border-white/10 bg-[#d20a11]/15 p-2 text-white">
                <User className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  {isAuthenticated ? user?.name || "User" : "Guest"}
                </p>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  {selectedCount}/{totalFights} picks locked in
                </p>
              </div>

              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="rounded-full text-slate-200 hover:bg-white/5 hover:text-white"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;