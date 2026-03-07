import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Autocomplete, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from "react-phone-number-input/input";

import {
    ErrorBox,
    FullRow,
    FormRow,
    Label,
    Input,
    TextArea,
    FormActions,
    SecondaryBtn,
    PrimaryBtn,
    Select,
    ClientGrid,
} from "./clientElement";
import { personSchema, type Person } from "../person";

type DetailsProps = {
    id: string | undefined;
    isNew: boolean;
    initialData: Person | null;
    availablePrograms: string[];
};

const Details = ({
    id,
    isNew,
    initialData,
    availablePrograms,
}: DetailsProps) => {
    const navigate = useNavigate();
    const [localErr, setLocalErr] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<Person>({
        resolver: zodResolver(personSchema),
    });

    useEffect(() => {
        if (localErr) {
            const timer = setTimeout(() => setLocalErr(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [localErr]);

    useEffect(() => {
        if (initialData) {
            reset({
                firstname: initialData.firstname || "",
                lastname: initialData.lastname || "",
                dob: initialData.dob || "",
                gender: initialData.gender || "",
                address: initialData.address || "",
                phone: initialData.phone || "",
                email: initialData.email || "",
                referralDate: initialData.referralDate || "",
                programs: initialData.programs || [],
                pronouns: initialData.pronouns || "",
                preferredContactMethod: initialData.preferredContactMethod || "",
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: Person) => {
        setLocalErr("");
        const cleanData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key,
                value === "" ? null : value,
            ])
        );
        try {
            if (isNew) {
                const res = await axios.post("http://localhost:8000/people", cleanData, {
                    withCredentials: true,
                });
                alert("Client added successfully");
                navigate(`/client/${res.data._id}`)
            } else {
                await axios.put(`http://localhost:8000/people/${id}`, cleanData, {
                    withCredentials: true,
                });
                alert("Client saved successfully");
            }
        } catch (e: any) {
            const backendErrors = e.response?.data?.errors;
            if (backendErrors) {
                Object.entries(backendErrors).forEach(([field, msg]) => {
                    setError(field as keyof Person, { message: msg as string });
                });
            }
            setLocalErr(`Failed to ${isNew ? "add" : "update"} client`);
        }
    };

    const handleCancel = () => {
        console.log("handling cancel");
        isNew ? navigate("/client") : reset();
    }

    return (
        <div style={{ padding: "20px 28px 28px" }}>
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
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <PhoneInput {...field} country="CA" inputComponent={Input} />
                            )}
                        />
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
                                        options={availablePrograms}
                                        value={value || []}
                                        onChange={(_, newValue) => onChange(newValue)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                minHeight: 40,
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                '& fieldset': { borderColor: '#ececec' },
                                                '&:hover fieldset': { borderColor: '#ececec' },
                                                '&.Mui-focused fieldset': { borderColor: '#bdbdbd', borderWidth: '1px' },
                                            },
                                        }}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Search and add programs..." />
                                        )}
                                    />
                                )}
                            />
                        </FormRow>
                        {errors.programs && <span style={{ color: "red", fontSize: "12px" }}>{errors.programs.message}</span>}
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
        </div>
    );
};

export default Details;