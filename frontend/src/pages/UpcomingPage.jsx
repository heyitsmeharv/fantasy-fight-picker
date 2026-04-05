import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SectionHeading from "../components/common/SectionHeading";
import EventCard from "../components/events/EventCard";
import { useResults } from "../context/ResultsContext";
import { getEventId } from "../utils/ids";

const SkeletonBlock = ({ className }) => (
  <motion.div
    className={`rounded-2xl bg-white/[0.06] ${className}`}
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const UpcomingPageSkeleton = () => (
  <div className="space-y-6">
    <SectionHeading eyebrow="Schedule" title="Upcoming cards" />
    <div className="grid gap-5 xl:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBlock key={i} className="h-40" />
      ))}
    </div>
  </div>
);

const UpcomingPage = () => {
  const navigate = useNavigate();
  const { events, loading } = useResults();

  if (loading) {
    return <UpcomingPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Schedule" title="Upcoming cards" />
      <div className="grid gap-5 xl:grid-cols-2">
        {events.filter((event) => event.status !== "closed").map((event) => {
          const eventId = getEventId(event);
          return (
            <EventCard
              key={eventId || event.name}
              event={event}
              onOpen={() => navigate(`/events/${eventId}`)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingPage;
