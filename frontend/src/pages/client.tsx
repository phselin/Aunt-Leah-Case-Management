import { useParams } from "react-router-dom";
import ClientSearch from "./clientSearch";
import ClientDetails from "./clientDetails";

const Client = () => {
  const { id } = useParams();

  return (
    <div className="clientPage">
      {id ? <ClientDetails /> : <ClientSearch />}
    </div>
  );
};

export default Client;