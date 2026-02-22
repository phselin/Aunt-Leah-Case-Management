import { useState } from "react";
import {
  AddClientCard,
  AddClientHeader,
  AddClientTitleWrap,
  AddClientTitle,
  AddClientSubtitle,
  CloseBtn,
  ErrorBox,
  AddClientGrid,
  FullRow,
  FormRow,
  Label,
  Input,
  TextArea,
  Hint,
  FormActions,
  SecondaryBtn,
  PrimaryBtn,
} from "./addClientElement";

export type CreateClientPayload = {
  firstname: string;
  lastname: string;
  dob?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  programs: string[];
  referralDate?: string;
};

type Props = {
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateClientPayload) => void | Promise<void>;
};

const AddClient = ({ submitting, onCancel, onSubmit }: Props) => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [programsText, setProgramsText] = useState("");
  const [referralDate, setReferralDate] = useState("");

  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async () => {
    setLocalErr("");

    const fn = firstname.trim();
    const ln = lastname.trim();
    if (!fn || !ln) {
      setLocalErr("First name and last name are required.");
      return;
    }

    const payload: CreateClientPayload = {
      firstname: fn,
      lastname: ln,
      dob: dob || undefined,
      gender: gender || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      programs: programsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      referralDate: referralDate || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <AddClientCard>
      <AddClientHeader>
        <AddClientTitleWrap>
          <AddClientTitle>Add New Client</AddClientTitle>
          <AddClientSubtitle>
            Enter client details below
          </AddClientSubtitle>
        </AddClientTitleWrap>

        <CloseBtn onClick={onCancel}>✕</CloseBtn>
      </AddClientHeader>

      {localErr && <ErrorBox>{localErr}</ErrorBox>}

      <AddClientGrid>
        <FormRow>
          <Label>First Name *</Label>
          <Input
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </FormRow>

        <FormRow>
          <Label>Last Name *</Label>
          <Input
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
        </FormRow>

        <FormRow>
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </FormRow>

        <FormRow>
          <Label>Gender</Label>
          <Input
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          />
        </FormRow>

        <FormRow>
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormRow>

        <FormRow>
          <Label>Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormRow>

        <FullRow>
          <FormRow>
            <Label>Address</Label>
            <TextArea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
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
          <Input
            type="date"
            value={referralDate}
            onChange={(e) => setReferralDate(e.target.value)}
          />
        </FormRow>
      </AddClientGrid>

      <FormActions>
        <SecondaryBtn onClick={onCancel} disabled={submitting}>
          Cancel
        </SecondaryBtn>
        <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create Client"}
        </PrimaryBtn>
      </FormActions>
    </AddClientCard>
  );
};

export default AddClient;