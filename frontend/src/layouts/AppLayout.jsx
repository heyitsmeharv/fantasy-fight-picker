import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import NavButton from "../components/common/NavButton";
import { usePicks } from "../context/PicksContext";
import { useAuth } from "../context/AuthContext";
import { useResults } from "../context/ResultsContext";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import fantasyFightPickerLogo from "../../img/ffp.png";

const getEventId = (event) => event?.id ?? event?.eventId ?? null;

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getEventCard } = usePicks();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { events } = useResults();
  const { showToast } = useToast();

  const featuredEvent = events[0] || null;
  const featuredEventId = getEventId(featuredEvent);
  const featuredEventCard = featuredEventId ? getEventCard(featuredEventId) : null;
  const selectedCount = featuredEventCard?.selectedCount ?? 0;
  const totalFights = Array.isArray(featuredEvent?.fights) ? featuredEvent.fights.length : 0;
  const displayName = user?.name || "Account";

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Upcoming", path: "/upcoming" },
    ...(featuredEventId ? [{ label: "Event", path: `/events/${featuredEventId}` }] : []),
    { label: "Fighters", path: "/fighters" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "League", path: "/league" },
    { label: "My Picks", path: "/my-picks" },
    ...(isAdmin ? [{ label: "Admin Events", path: "/admin/events" }] : []),
    ...(isAdmin ? [{ label: "Admin Results", path: "/admin/results" }] : []),
    ...(isAdmin ? [{ label: "Admin Fighters", path: "/admin/fighters" }] : []),
  ];

  const handleLogout = () => {
    logout();

    showToast({
      title: "Logged out",
      description: "You've been signed out.",
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,10,17,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <header className="mb-8 rounded-[22px] border border-white/10 bg-black/80 px-5 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm md:px-6">
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start xl:gap-8">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <img
                  src={fantasyFightPickerLogo}
                  alt="Fantasy Fight Picker logo"
                  className="h-20 w-20 shrink-0 object-contain md:h-24 md:w-24"
                />

                <div className="min-w-0">
                  <p className="text-[28px] font-bold uppercase leading-[0.94] tracking-[0.08em] text-white md:text-[36px]">
                    Fantasy Fight
                    <span className="block">Picker</span>
                  </p>

                  <p className="mt-2 max-w-[300px] text-sm leading-6 text-slate-400 md:text-[15px]">
                    Fantasy-style predictions inspired by the FPL experience
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 xl:items-stretch">
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                {featuredEvent ? (
                  <div className="flex min-w-[220px] max-w-[320px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {featuredEvent.name}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-white">
                        {selectedCount}/{totalFights}
                      </p>
                      <p className="text-[11px] leading-none text-slate-400">picked</p>
                    </div>
                  </div>
                ) : null}

                {isAuthenticated ? (
                  <>
                    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 md:flex">
                      <User className="h-4 w-4" />
                      <span className="max-w-[140px] truncate">{displayName}</span>
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

              <nav className="flex flex-wrap items-center gap-2 xl:justify-start">
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
            </div>
          </div>
        </header>

        <main className="pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;