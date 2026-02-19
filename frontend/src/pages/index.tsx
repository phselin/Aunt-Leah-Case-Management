import { useContext } from "react";
import AuthContext from '../context/AuthProvider'

const Home = () => {
  const { auth } = useContext(AuthContext);
  return (
    <div>
      {auth.user ? (<h1>Welcome, {auth.user.firstname} {auth.user.lastname}</h1>) : (<h1>Home</h1>)}
    </div>
  );
};

export default Home;
