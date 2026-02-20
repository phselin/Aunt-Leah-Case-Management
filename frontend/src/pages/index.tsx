import { useContext, useState } from "react";
import AuthContext from "../context/AuthProvider";
import HomeCalendar from "../components/home/homeCalendar";
import Itinerary from "../components/home/homeItinerary";


type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const Home = () => {
  const { auth } = useContext(AuthContext);
  const [value, onChange] = useState<Value>(new Date());

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
        <HomeCalendar value={value} onChange={onChange} />
        <Itinerary value={value} />
      </div>
    </div>
  );
};

export default Home;