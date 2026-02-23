import { useContext, useState } from "react";
import AuthContext from "../context/AuthProvider";
import Itinerary from "../components/home/homeItinerary";
import dayjs, { Dayjs } from "dayjs";
import CalendarComponent from "../components/calendar";

const Home = () => {
  const { auth } = useContext(AuthContext);
  const [selectedDate, onChange] = useState<Dayjs | null>(dayjs());

  return (
    <div style={{ padding: "24px" }}>
      {auth.user ? (
        <h1 style={{ margin: 0 }}>
          Welcome, {auth.user.firstname} {auth.user.lastname}
        </h1>
      ) : (
        <h1 style={{ margin: 0 }}>Home</h1>
      )}

      <div style={{ marginTop: "16px", display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: "320px" }}>
          <CalendarComponent
            value={selectedDate}
            onChange={onChange}
          />
        </div>
        <Itinerary value={selectedDate} />
      </div>
    </div>
  );
};

export default Home;