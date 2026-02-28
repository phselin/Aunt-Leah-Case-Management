import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { Autocomplete, Dialog, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


import {
  CloseBtn, ErrorBox, FullRow,
  FormRow, Label, Input, TextArea, FormActions, SecondaryBtn, PrimaryBtn, Select,
  ClientCard, ClientHeader,
  ClientTitleWrap,
  ClientTitle,
  ClientSubtitle,
  ClientGrid
} from "../components/client/add-edit/clientElement";
import { personSchema, type Person } from "../components/client/search/person";

const ClientModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { setErrMsg, reloadClients } = useOutletContext<{
    setErrMsg: (msg: string) => void;
    reloadClients: () => void;
  }>();

  const [localErr, setLocalErr] = useState("");
  const [programs, setPrograms] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Person>({
    resolver: zodResolver(personSchema),
  });

  useEffect(() => {
    const loadClient = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/people/${id}`, {
          withCredentials: true,
        });
        const data = res.data;

        setValue("firstname", data.firstname || "");
        setValue("lastname", data.lastname || "");
        setValue("dob", data.dob || "");
        setValue("gender", data.gender || "");
        setValue("address", data.address || "");
        setValue("phone", data.phone || "");
        setValue("email", data.email || "");
        setValue("referralDate", data.referralDate || "");
        setValue("programs", data.programs || []);
        setValue("pronouns", data.pronouns || "");
        setValue("preferredContactMethod", data.preferredContactMethod || "");

        setPrograms((await axios.get("http://localhost:8000/programNames", { withCredentials: true })).data)
      } catch (err) {
        setErrMsg("Unable to find client details");
        navigate("/client");
      }
    };

    if (id && !isNew) {
      loadClient();
    }
  }, [id, isNew, navigate, setErrMsg, setValue]);

  const onSubmit = async (data: Person) => {
    setLocalErr("");
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value
      ])
    );
    try {
      if (isNew) {
        await axios.post("http://localhost:8000/people", cleanData, {
          withCredentials: true,
        });
      } else {
        await axios.put(`http://localhost:8000/people/${id}`, cleanData, {
          withCredentials: true,
        });
      }
      alert(`Client ${isNew ? "added" : "saved"} successfully`)
      reloadClients();
      navigate("/client");
    } catch (e: any) {
      const backendErrors = e.response?.data?.errors;

      if (backendErrors) {
        Object.entries(backendErrors).forEach(([field, msg]) => {
          setError(field as keyof Person, { message: msg as string });
        });
      }

      setLocalErr(`Failed to ${isNew ? 'add' : 'update'} client`);
    }
  };

  const handleCancel = () => navigate("/client");

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
            <ClientTitle>{isNew ? "Add New Client" : "Edit Client"}</ClientTitle>
            <ClientSubtitle>{"Enter client details below"}</ClientSubtitle>
          </ClientTitleWrap>
          <CloseBtn onClick={handleCancel}>✕</CloseBtn>
        </ClientHeader>

        {localErr && <ErrorBox>{localErr}</ErrorBox>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <ClientGrid>

            <FormRow>
              <Label>First Name *</Label>
              <Input {...register("firstname")} />
              {errors.firstname && <span style={{ color: "red", fontSize: "12px" }}>{errors.firstname.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Last Name *</Label>
              <Input {...register("lastname")} />
              {errors.lastname && <span style={{ color: "red", fontSize: "12px" }}>{errors.lastname.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Email</Label>
              <Input {...register("email")} />
              {errors.email && <span style={{ color: "red", fontSize: "12px" }}>{errors.email.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Phone</Label>
              <Input {...register("phone")} />
              {errors.phone && <span style={{ color: "red", fontSize: "12px" }}>{errors.phone.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Preferred Contact</Label>
              <Select {...register("preferredContactMethod")}>
                <option value="">Select method</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </Select>
              {errors.preferredContactMethod && <span style={{ color: "red", fontSize: "12px" }}>{errors.preferredContactMethod.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Date of Birth</Label>
              <Input type="date" {...register("dob")} />
              {errors.dob && <span style={{ color: "red", fontSize: "12px" }}>{errors.dob.message}</span>}
            </FormRow>

            <FullRow>
              <FormRow>
                <Label>Address</Label>
                <TextArea {...register("address")} />
                {errors.address && <span style={{ color: "red", fontSize: "12px" }}>{errors.address.message}</span>}
              </FormRow>
            </FullRow>

            <FormRow>
              <Label>Gender</Label>
              <Select {...register("gender")}>
                <option value="">Select a gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer not to say">Prefer Not to Say</option>
              </Select>
              {errors.gender && <span style={{ color: "red", fontSize: "12px" }}>{errors.gender.message}</span>}
            </FormRow>

            <FormRow>
              <Label>Pronouns</Label>
              <Input {...register("pronouns")} />
              {errors.pronouns && <span style={{ color: "red", fontSize: "12px" }}>{errors.pronouns.message}</span>}
            </FormRow>

            <FullRow>
              <FormRow>
                <Label>Programs</Label>
                <Controller
                  name="programs"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      options={programs}
                      value={value || []}
                      onChange={(_, newValue) => onChange(newValue)}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Search and add programs..." />
                      )}
                    />
                  )}
                />
              </FormRow>
            </FullRow>

            <FormRow>
              <Label>Referral Date</Label>
              <Input type="date" {...register("referralDate")} />
              {errors.referralDate && <span style={{ color: "red", fontSize: "12px" }}>{errors.referralDate.message}</span>}
            </FormRow>

          </ClientGrid>

          <FormActions>
            <SecondaryBtn type="button" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </SecondaryBtn>
            <PrimaryBtn type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (isNew ? "Create Client" : "Save Changes")}
            </PrimaryBtn>
          </FormActions>
        </form>

      </ClientCard>
    </Dialog >
  );
};

export default ClientModal;