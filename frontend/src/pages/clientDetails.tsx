import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useActiveClient } from "../context/ActiveClientProvider";
import type { Person } from "../components/client/search/person";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveClientId } = useActiveClient();
  
  const [client, setClient] = useState<Person | null>(null);


  useEffect(() => {
    const loadClient = async () => {
        // needed for type compatibility
        if (!id) {
            setActiveClientId(null);
            navigate("/client")
            return;
        }
      try {
        const res = await axios.get(`http://localhost:8000/people/${id}`, {
          withCredentials: true,
        });
        console.log(res.data);
        setClient(res.data);
        setActiveClientId(id);
      } catch (err) {
        setActiveClientId(null);
         navigate("/client");
      }
    };

    if (id) loadClient();
  }, [id]);

  const navigateToSearch = () => {
    setActiveClientId(null);
    navigate("/client");
  };

  return (
    <div>      
      <button type="button" onClick={navigateToSearch}>Back to Search </button>

      {client && (
        <div>
          <h2>
            {client.firstname} {client.lastname}
          </h2>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;