import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import NavButton from "../components/common/NavButton";
import { usePicks } from "../context/PicksContext";
import { useAuth } from "../context/AuthContext";
import { useResults } from "../context/ResultsContext";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import fantasyUfcLogo from "../../fantasy-ufc.png";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getEventCard } = usePicks();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { events } = useResults();
  const { showToast } = useToast();

  const featuredEvent = events[0] || null;
  const featuredEventCard = featuredEvent ? getEventCard(featuredEvent.id) : null;
  const selectedCount = featuredEventCard?.selectedCount ?? 0;
  const totalFights = Array.isArray(featuredEvent?.fights) ? featuredEvent.fights.length : 0;

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Upcoming", path: "/upcoming" },
    ...(featuredEvent ? [{ label: "Event", path: `/events/${featuredEvent.id}` }] : []),
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

            <div className="flex items-center gap-3">
              {featuredEvent ? (
                <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 md:flex md:items-center md:gap-3">
                  <span className="font-semibold text-white">{featuredEvent.name}</span>
                  <span className="text-slate-500">•</span>
                  <span>
                    {selectedCount}/{totalFights} picked
                  </span>
                </div>
              ) : null}

              {isAuthenticated ? (
                <>
                  <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 md:flex md:items-center md:gap-2">
                    <User className="h-4 w-4" />
                    <span>{user?.name || "Account"}</span>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;