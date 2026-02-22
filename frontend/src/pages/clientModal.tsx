import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { Dialog } from "@mui/material";
import type { Person } from "../components/client/search/person";


const ClientModal = () => {
  const {id} = useParams();
  const { setErrMsg } = useOutletContext<{ setErrMsg: (msg: string) => void }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [client, setClient] = useState<Partial<Person>>({});

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/people/${id}`, {
          withCredentials: true,
        });
        setClient(res.data);
      } catch (err) {
        setErrMsg("Unable to find client casenotes")
        navigate("/client")
      } 
    };

    if (id && !isNew) {
      loadClient();
    }
  }, [id, isNew]);


  return (
    <Dialog open={true} onClose={() => navigate("/client")}>
        <div>
        <h2>
          {isNew 
            ? "Add New Client" 
            : `${client?.firstname} ${client?.lastname}`}
        </h2>

        <button onClick={() => navigate("/client")}>Close</button>
      </div>
    </Dialog>
  );
};

export default ClientModal;