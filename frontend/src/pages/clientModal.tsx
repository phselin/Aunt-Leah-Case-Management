import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { Dialog } from "@mui/material";

import {
  CloseBtn, ErrorBox, FullRow,
  FormRow, Label, Input, TextArea, Hint, FormActions, SecondaryBtn, PrimaryBtn, Select,
  ClientCard, ClientHeader,
  ClientTitleWrap,
  ClientTitle,
  ClientSubtitle,
  ClientGrid
} from "../components/client/add-edit/clientElement";

// TODO need a better way to deal with dynamic fields

const ClientModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { setErrMsg, reloadClients } = useOutletContext<{
    setErrMsg: (msg: string) => void;
    reloadClients: () => void;
  }>();

  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [programsText, setProgramsText] = useState("");
  const [referralDate, setReferralDate] = useState("");

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/people/${id}`, {
          withCredentials: true,
        });
        const data = res.data;

        setFirstname(data.firstname || "");
        setLastname(data.lastname || "");
        setDob(data.dob || "");
        setGender(data.gender || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setProgramsText((data.programs || []).join(", "));
        setReferralDate(data.referralDate || "");

      } catch (err) {
        setErrMsg("Unable to find client details");
        navigate("/client");
      }
    };

    if (id && !isNew) {
      loadClient();
    }
  }, [id, isNew, navigate, setErrMsg]);

  const handleSubmit = async () => {
    setLocalErr("");

    const fn = firstname.trim();
    const ln = lastname.trim();
    if (!fn || !ln) {
      setLocalErr("First name and last name are required.");
      return;
    }

    const payload = {
      firstname: fn,
      lastname: ln,
      dob: dob || undefined,
      gender: gender || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      programs: programsText.split(",").map((s) => s.trim()).filter(Boolean),
      referralDate: referralDate || undefined,
    };

    try {
      setSubmitting(true);

      if (isNew) {
        await axios.post("http://localhost:8000/people", payload, {
          withCredentials: true,
        });
      } else {
        await axios.put(`http://localhost:8000/people/${id}`, payload, {
          withCredentials: true,
        });
      }
      reloadClients();
      navigate("/client");
    } catch (err: any) {
      setLocalErr(`Failed to ${isNew ? 'add' : 'update'} client`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/client");

  const titleText = isNew ? "Add New Client" : `${firstname} ${lastname}`.trim() || "Edit Client";
  const subtitleText = isNew ? "Enter client details below" : "Update client details below";
  const buttonText = isNew ? "Create Client" : "Save Changes";

  return (
    <Dialog open={true} onClose={handleCancel} maxWidth="lg" fullWidth PaperProps={{
      sx: {
        padding: '24px',
        borderRadius: '12px'
      }
    }}>
      <ClientCard >
        <ClientHeader>
          <ClientTitleWrap>
            <ClientTitle>{titleText}</ClientTitle>
            <ClientSubtitle>{subtitleText}</ClientSubtitle>
          </ClientTitleWrap>
          <CloseBtn onClick={handleCancel}>✕</CloseBtn>
        </ClientHeader>

        {localErr && <ErrorBox>{localErr}</ErrorBox>}

        <ClientGrid>
          <FormRow>
            <Label>First Name *</Label>
            <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </FormRow>

          <FormRow>
            <Label>Last Name *</Label>
            <Input value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </FormRow>

          <FormRow>
            <Label>Date of Birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </FormRow>

          <FormRow>
            <Label>Gender</Label>
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select a gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-Binary</option>
              <option value="prefer not to say">Prefer Not to Say</option>
            </Select>
          </FormRow>

          <FormRow>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormRow>

          <FormRow>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormRow>

          <FullRow>
            <FormRow>
              <Label>Address</Label>
              <TextArea value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormRow>
          </FullRow>

          <FullRow>
            <FormRow>
              <Label>Programs</Label>
              <Input
                value={programsText}
                onChange={(e) => setProgramsText(e.target.value)}
                placeholder="Education, Employment, Housing"
              />
              <Hint>Separate programs with commas</Hint>
            </FormRow>
          </FullRow>

          <FormRow>
            <Label>Referral Date</Label>
            <Input type="date" value={referralDate} onChange={(e) => setReferralDate(e.target.value)} />
          </FormRow>
        </ClientGrid>

        <FormActions>
          <SecondaryBtn onClick={handleCancel} disabled={submitting}>
            Cancel
          </SecondaryBtn>
          <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : buttonText}
          </PrimaryBtn>
        </FormActions>
      </ClientCard>
    </Dialog>
  );
};

export default ClientModal;