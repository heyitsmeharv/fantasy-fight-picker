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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(210,10,17,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-8 rounded-[20px] border border-white/10 bg-black/80 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={fantasyFightPickerLogo}
                alt="Fantasy Fight Picker logo"
                className="h-28 w-28 shrink-0 object-contain md:h-32 md:w-32"
              />

              <div className="min-w-0 pt-1">
                <p className="text-[30px] font-bold uppercase tracking-[0.08em] leading-[0.95] text-white md:text-[38px]">
                  Fantasy Fight
                  <span className="block">Picker</span>
                </p>
                <p className="mt-3 max-w-[360px] text-base leading-7 text-slate-400">
                  Fantasy-style predictions inspired by the FPL experience
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:min-w-0 xl:items-end">
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                {featuredEvent ? (
                  <div className="flex max-w-[340px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-white">
                        {featuredEvent.name}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-white">
                        {selectedCount}/{totalFights}
                      </p>
                      <p className="text-[11px] leading-none text-slate-400">picked</p>
                    </div>
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

              <nav className="flex flex-wrap gap-2 xl:justify-end">
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

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;