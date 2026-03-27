import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, TextField } from "@mui/material";
import { Controller, useForm, type Path } from "react-hook-form";
import PhoneInput from "react-phone-number-input/input";
import api from "../../../api";

import {
    ErrorBox,
    FullRow,
    FormRow,
    Label,
    Input,
    FormActions,
    PrimaryBtn,
    Select,
    TextArea,
    ClientGrid,
} from "./clientElement";
import type {
    Person,
    SelectionWithDetails,
    IntakeFormConfig,
    FormFieldConfig,
    FormSectionConfig,
    FormGroupConfig,
} from "../person";

const HOUSING_INTAKE_LAYOUT = "housing_intake_pdf";
type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };
type BackendValidationError = { errors?: Record<string, string> };
type PhoneFieldShape = {
    value?: string;
    onChange: (value?: string) => void;
    onBlur: () => void;
    name: string;
    ref: (instance: HTMLInputElement | null) => void;
};
const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object";
const isSelectionWithDetails = (value: unknown): value is SelectionWithDetails =>
    isObjectRecord(value) && typeof value.value === "string";
const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
const asSelectionWithDetailsArray = (value: unknown): SelectionWithDetails[] =>
    Array.isArray(value) ? value.filter(isSelectionWithDetails) : [];

function renderHousingIntakeSection(
    section: FormSectionConfig,
    renderField: (field: FormFieldConfig, path: string) => ReactNode,
    getPath: (section: FormSectionConfig, field: FormFieldConfig, group?: FormGroupConfig) => string,
) {
    const fields = section.fields ?? [];
    const leadKeys = new Set(["status", "statusDetails"]);
    const leadFields = fields.filter((f) => leadKeys.has(f.key));
    const tailFields = fields.filter((f) => !leadKeys.has(f.key));
    return (
        <>
            {leadFields.map((field) => renderField(field, getPath(section, field)))}
            {section.groups?.map((group) =>
                group.fields.map((field) => renderField(field, getPath(section, field, group))),
            )}
            {tailFields.map((field) => renderField(field, getPath(section, field)))}
        </>
    );
}

type DetailsProps = {
    id: string | undefined;
    isNew: boolean;
    initialData: Person | null;
    formConfig: IntakeFormConfig | null;
    onSave?: (data: Person) => void;
};

const Details = ({ id, isNew, initialData, formConfig, onSave }: DetailsProps) => {
    const navigate = useNavigate();
    const [localErr, setLocalErr] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        setError,
        control,
        formState: { errors, isSubmitting },
    } = useForm<Person>();

    useEffect(() => {
        if (localErr) {
            const timer = setTimeout(() => setLocalErr(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [localErr]);

    useEffect(() => {
        if (initialData) reset(initialData);
    }, [initialData, reset]);

    const cleanData = (obj: JsonLike): JsonLike => {
        if (Array.isArray(obj)) return obj.map(cleanData);
        if (obj && typeof obj === "object") {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, cleanData(v)])
            ) as JsonLike;
        }
        return obj === "" ? null : obj;
    };

    const onSubmit = async (data: Person) => {
        setLocalErr("");
        try {
            if (isNew) {
                const res = await api.post("/people", cleanData(data));
                alert("Client added successfully");
                navigate(`/client/${res.data._id}`);
            } else {
                const res = await api.put(`/people/${id}`, cleanData(data));
                onSave?.(res.data);
                alert("Client saved successfully");
            }
        } catch (e: unknown) {
            const backendErrors = (
                isObjectRecord(e) &&
                "response" in e &&
                isObjectRecord(e.response) &&
                "data" in e.response &&
                isObjectRecord(e.response.data)
                    ? (e.response.data as BackendValidationError).errors
                    : undefined
            );
            if (backendErrors) {
                Object.entries(backendErrors).forEach(([field, msg]) => {
                    setError(field as Path<Person>, { message: msg });
                });
            }
            setLocalErr(`Failed to ${isNew ? "add" : "update"} client`);
        }
    };

    const fieldError = (path: string) => {
        const parts = path.split(".");
        let err: unknown = errors;
        for (const part of parts) {
            if (!isObjectRecord(err)) return undefined;
            err = err[part];
        }
        if (!isObjectRecord(err)) return undefined;
        const msg = err.message;
        return typeof msg === "string" ? msg : undefined;
    };

    if (!formConfig) return null;

    const getPath = (
        section: FormSectionConfig,
        field: FormFieldConfig,
        group?: FormGroupConfig,
    ): Path<Person> => {
        const parts: string[] = [];
        if (section.key) parts.push(section.key);
        if (group) parts.push(group.key);
        parts.push(field.key);
        return parts.join(".") as Path<Person>;
    };

    const renderField = (field: FormFieldConfig, path: string) => {
        const label = `${field.label}${field.required ? " *" : ""}`;
        const options = field.options || [];
        const isObjectOptions = options.length > 0 && typeof options[0] === "object";

        switch (field.type) {
            case "email":
                return (
                    <FormRow key={path}>
                        <Label>{label}</Label>
                        <Input
                            type="email"
                            {...register(path as Path<Person>)}
                        />
                        <FieldError msg={fieldError(path)} />
                    </FormRow>
                );

            case "date":
                return (
                    <FormRow key={path}>
                        <Label>{label}</Label>
                        <Input
                            type="date"
                            {...register(path as Path<Person>)}
                        />
                        <FieldError msg={fieldError(path)} />
                    </FormRow>
                )

            case "phone":
                return (
                    <FormRow key={path}>
                        <Label>{label}</Label>
                        <Controller
                            name={path as Path<Person>}
                            control={control}
                            render={({ field: f }) => (
                                <PhoneInput
                                    {...(f as PhoneFieldShape)}
                                    country="CA"
                                    inputComponent={Input}
                                />
                            )}
                        />
                        <FieldError msg={fieldError(path)} />
                    </FormRow>
                );

            case "dropdown": {
                const objectOpts = isObjectOptions
                    ? (options as { value: string; label: string }[]).filter(
                          (o) => o.value !== "",
                      )
                    : [];
                return (
                    <FormRow key={path}>
                        <Label>{label}</Label>
                        <Select {...register(path as Path<Person>)}>
                            <option value="" disabled hidden>
                                Select
                            </option>
                            {isObjectOptions
                                ? objectOpts.map((o) => (
                                      <option key={o.value} value={o.value}>
                                          {o.label}
                                      </option>
                                  ))
                                : (options as string[]).map((o) => (
                                      <option key={o} value={o}>
                                          {o}
                                      </option>
                                  ))}
                        </Select>
                        <FieldError msg={fieldError(path)} />
                    </FormRow>
                );
            }

            case "multi-dropdown":
                return (
                    <FullRow key={path}>
                        <FormRow>
                            <Label>{label}</Label>
                            <Controller
                                name={path as Path<Person>}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <Autocomplete
                                        multiple
                                        options={(options as string[]) || []}
                                        value={asStringArray(value)}
                                        filterSelectedOptions
                                        onChange={(_, v) => onChange(v)}
                                        sx={autocompleteMultiSx}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder={`Search ${field.label.toLowerCase()}...`} />
                                        )}
                                    />
                                )}
                            />
                            <FieldError msg={fieldError(path)} />
                        </FormRow>
                    </FullRow>
                );

            case "multi-dropdown-with-details":
                return (
                    <FullRow key={path}>
                        <FormRow>
                            {label.trim() ? <Label>{label}</Label> : null}
                            <Controller
                                name={path as Path<Person>}
                                control={control}
                                defaultValue={[]}
                                render={({ field: { value, onChange } }) => (
                                    <MultiDropdownWithDetails
                                        value={asSelectionWithDetailsArray(value)}
                                        onChange={onChange}
                                        options={
                                            options as {
                                                value: string;
                                                label: string;
                                                hasDetails?: boolean;
                                            }[]
                                        }
                                        placeholder="Select"
                                    />
                                )}
                            />
                            <FieldError msg={fieldError(path)} />
                        </FormRow>
                    </FullRow>
                );

            case "checkbox-boolean":
                return (
                    <FullRow key={path}>
                        <FormRow>
                            <Controller
                                name={path as Path<Person>}
                                control={control}
                                defaultValue={false}
                                render={({ field: { value, onChange } }) => (
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            fontSize: 14,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => onChange(e.target.checked)}
                                        />
                                        {label}
                                    </label>
                                )}
                            />
                            <FieldError msg={fieldError(path)} />
                        </FormRow>
                    </FullRow>
                );

            case "text-long":
                return (
                    <FullRow key={path}>
                        <FormRow>
                            <Label>{label}</Label>
                            <TextArea {...register(path as Path<Person>)} rows={4} />
                            <FieldError msg={fieldError(path)} />
                        </FormRow>
                    </FullRow>
                );

            default:
                return (
                    <FormRow key={path}>
                        <Label>{label}</Label>
                        <Input
                            type="text"
                            {...register(path as Path<Person>)}
                        />
                        <FieldError msg={fieldError(path)} />
                    </FormRow>
                );
        }
    };

    return (
        <div style={{ padding: "20px 28px 28px" }}>
            {localErr && <ErrorBox>{localErr}</ErrorBox>}
            <form onSubmit={handleSubmit(onSubmit)}>
                {formConfig.sections.map((section, i) => (
                    <div key={i}>
                        <SectionHeader title={section.label} />
                        {section.description ? (
                            <p
                                style={{
                                    margin: "0 0 12px",
                                    fontSize: 13,
                                    color:
                                        section.descriptionTone === "emphasis"
                                            ? "#b42318"
                                            : "#4b5563",
                                    lineHeight: 1.45,
                                }}
                            >
                                {section.description}
                            </p>
                        ) : null}
                        <ClientGrid>
                            {section.layout === HOUSING_INTAKE_LAYOUT
                                ? renderHousingIntakeSection(section, renderField, getPath)
                                : (
                                    <>
                                        {section.groups?.map((group, gi) => (
                                            <Fragment key={gi}>
                                                {group.label ? (
                                                    <FullRow>
                                                        <h4
                                                            style={{
                                                                margin: "8px 0 4px",
                                                                fontSize: 14,
                                                                fontWeight: 600,
                                                                color: "#111827",
                                                            }}
                                                        >
                                                            {group.label}
                                                        </h4>
                                                    </FullRow>
                                                ) : null}
                                                {group.fields.map((field) =>
                                                    renderField(
                                                        field,
                                                        getPath(section, field, group),
                                                    ),
                                                )}
                                            </Fragment>
                                        ))}
                                        {section.fields?.map((field) =>
                                            renderField(field, getPath(section, field))
                                        )}
                                    </>
                                )}
                        </ClientGrid>
                    </div>
                ))}
                <FormActions>
                    <PrimaryBtn type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isNew ? "Create Client" : "Save Changes"}
                    </PrimaryBtn>
                </FormActions>
            </form>
        </div>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginTop: 24, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
    </div>
);

const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <span style={{ color: "red", fontSize: 12 }}>{msg}</span> : null;

const autocompleteMultiSx = {
    "& .MuiOutlinedInput-root": {
        backgroundColor: "#fff",
        minHeight: 40,
        padding: "0 12px",
        borderRadius: "8px",
        fontSize: "14px",
        fontFamily: "inherit",
        "& fieldset": { borderColor: "#E5E7EB" },
        "&:hover fieldset": { borderColor: "#E5E7EB" },
        "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#10B981",
            borderWidth: "1px",
        },
    },
} as const;

const MultiDropdownWithDetails = ({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: SelectionWithDetails[];
    onChange: (v: SelectionWithDetails[]) => void;
    options: { value: string; label: string; hasDetails?: boolean }[];
    placeholder?: string;
}) => {
    const list = value || [];
    const valueKeys = list.map((s) => s.value);
    const optionByValue = Object.fromEntries(options.map((o) => [o.value, o]));

    const syncSelection = (keys: string[]) => {
        const prev = Object.fromEntries(list.map((s) => [s.value, s.details]));
        onChange(keys.map((k) => ({ value: k, details: prev[k] || undefined })));
    };

    const updateDetail = (val: string, details: string) => {
        onChange(
            list.map((s) => (s.value === val ? { ...s, details: details || undefined } : s)),
        );
    };

    const detailFields = options.filter((o) => o.hasDetails && valueKeys.includes(o.value));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Autocomplete
                multiple
                options={options.map((o) => o.value)}
                value={valueKeys}
                getOptionLabel={(key) => optionByValue[key]?.label ?? key}
                isOptionEqualToValue={(a, b) => a === b}
                filterSelectedOptions
                onChange={(_, keys) => syncSelection(keys)}
                sx={autocompleteMultiSx}
                renderInput={(params) => (
                    <TextField {...params} placeholder={placeholder ?? "Select"} />
                )}
            />
            {detailFields.map((opt) => (
                <div key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            minWidth: 140,
                            maxWidth: "42%",
                        }}
                    >
                        {opt.label}:
                    </span>
                    <Input
                        placeholder="Please specify..."
                        value={list.find((s) => s.value === opt.value)?.details || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateDetail(opt.value, e.target.value)
                        }
                        style={{ flex: 1 }}
                    />
                </div>
            ))}
        </div>
    );
};

export default Details;