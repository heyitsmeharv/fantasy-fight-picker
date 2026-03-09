import { useNavigate } from "react-router-dom";
import SectionHeading from "../components/common/SectionHeading";
import EventCard from "../components/events/EventCard";
import { useResults } from "../context/ResultsContext";

const UpcomingPage = () => {
  const navigate = useNavigate();
  const { events } = useResults();

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Schedule" title="Upcoming cards" />
      <div className="grid gap-5 xl:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onOpen={() => navigate(`/events/${event.id}`)} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingPage;