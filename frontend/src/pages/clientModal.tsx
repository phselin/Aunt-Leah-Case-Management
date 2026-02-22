import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { Dialog } from "@mui/material";
import type { Person } from "../components/client/search/person";
import AddClient, { type CreateClientPayload } from "../components/client//add/addClient";

const ClientModal = () => {
  const { id } = useParams();

  const { setErrMsg, reloadClients } = useOutletContext<{
    setErrMsg: (msg: string) => void;
    reloadClients: () => void;
  }>();

  const navigate = useNavigate();
  const isNew = id === "new";

  const [client, setClient] = useState<Partial<Person>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/people/${id}`, {
          withCredentials: true,
        });
        setClient(res.data);
      } catch (err) {
        setErrMsg("Unable to find client details");
        navigate("/client");
      }
    };

    if (id && !isNew) {
      loadClient();
    }
  }, [id, isNew, navigate, setErrMsg]);

  const handleCreate = async (payload: CreateClientPayload) => {
    try {
      setSubmitting(true);

      await axios.post("http://localhost:8000/people", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      reloadClients();       
      navigate("/client");    
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to add client";
      setErrMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={() => navigate("/client")} maxWidth="lg" fullWidth>
      {isNew ? (
        <AddClient
          submitting={submitting}
          onCancel={() => navigate("/client")}
          onSubmit={handleCreate}
        />
      ) : (
        <div style={{ padding: 16, minWidth: 420 }}>
          <h2>
            {`${client?.firstname ?? ""} ${client?.lastname ?? ""}`.trim()}
          </h2>

          <button onClick={() => navigate("/client")}>Close</button>
        </div>
      )}
    </Dialog>
  );
};

export default ClientModal;