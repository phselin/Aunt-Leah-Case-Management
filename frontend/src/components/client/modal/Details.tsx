import { Autocomplete, TextField } from "@mui/material";
import axios from "axios";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input/input";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import api from "../../../api";

import type {
  FormFieldConfig,
  FormGroupConfig,
  FormSectionConfig,
  IntakeFormConfig,
  Person,
  SelectionWithDetails,
} from "../person";
import {
  ClientGrid,
  ErrorBox,
  FormActions,
  FormRow,
  FullRow,
  Input,
  Label,
  PrimaryBtn,
  Select,
  SuccessBox,
  TextArea,
} from "./clientElement";

const HOUSING_INTAKE_LAYOUT = "housing_intake_pdf";

const DEFAULT_TEXT_MAX_LENGTH = 100;
const DEFAULT_TEXTAREA_MAX_LENGTH = 600;
const DEFAULT_DETAILS_MAX_LENGTH = 300;

const limitByLength = (text: string, maxLength: number) =>
  text.slice(0, maxLength);

function renderHousingIntakeSection(
  section: FormSectionConfig,
  renderField: (field: FormFieldConfig, path: string) => ReactNode,
  getPath: (
    section: FormSectionConfig,
    field: FormFieldConfig,
    group?: FormGroupConfig,
  ) => string,
) {
  const fields = section.fields ?? [];
  const leadKeys = new Set(["status", "statusDetails"]);
  const leadFields = fields.filter((f) => leadKeys.has(f.key));
  const tailFields = fields.filter((f) => !leadKeys.has(f.key));
  return (
    <>
      {leadFields.map((field) => renderField(field, getPath(section, field)))}
      {section.groups?.map((group) =>
        group.fields.map((field) =>
          renderField(field, getPath(section, field, group)),
        ),
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

const SectionCard = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Details = ({
  id,
  isNew,
  initialData,
  formConfig,
  onSave,
}: DetailsProps) => {
  const navigate = useNavigate();
  const [localErr, setLocalErr] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Person>();

  useEffect(() => {
    if (localErr) {
      const timer = setTimeout(() => setLocalErr(""), 3000);
      return () => clearTimeout(timer);
    }
    if (localSuccess) {
      const timer = setTimeout(() => setLocalSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [localErr, localSuccess]);

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const cleanData = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanData);
    if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, cleanData(v)]),
      );
    }

    if (typeof obj === "string") {
      const trimmed = obj.trim();
      return trimmed === "" ? null : trimmed;
    }

    return obj;
  };

  const onSubmit = async (data: Person) => {
    setLocalErr("");
    try {
      if (isNew) {
        const res = await api.post("/people", cleanData(data));
        setLocalSuccess("Client added successfully");
        navigate(`/client/${res.data._id}`);
      } else {
        const res = await api.put(`/people/${id}`, cleanData(data));
        onSave?.(res.data);
        setLocalSuccess("Client saved successfully");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setLocalErr(
          "You do not have the permission to update client information",
        );
        setValue("programs", initialData?.programs || []);
      } else {
        setLocalErr(`Failed to ${isNew ? "add" : "update"} client`);
        const backend_errors = err.response?.data?.errors;
        console.log(err.response?.data);
        if (backend_errors && Array.isArray(backend_errors)) {
          backend_errors.forEach((item) => {
            Object.entries(item).forEach(([field, msg]) => {
              setError(field as any, {
                type: "server",
                message: String(msg),
              });
            });
          });
        }
      }
    }
  };

  const fieldError = (path: string) => {
    const parts = path.split(".");
    let err: any = errors;
    for (const part of parts) err = err?.[part];
    return err?.message as string | undefined;
  };

  if (!formConfig) return null;

  const getPath = (
    section: FormSectionConfig,
    field: FormFieldConfig,
    group?: FormGroupConfig,
  ) => {
    const parts: string[] = [];
    if (section.key) parts.push(section.key);
    if (group) parts.push(group.key);
    parts.push(field.key);
    return parts.join(".") as any;
  };

  const renderField = (field: FormFieldConfig, path: string) => {
    const label = `${field.label}${field.required ? " *" : ""}`;
    const options = field.options || [];
    const isObjectOptions =
      options.length > 0 && typeof options[0] === "object";

    switch (field.type) {
      case "email":
        return (
          <FormRow key={path}>
            <Label>{label}</Label>
            <Input type="email" maxLength={50} {...register(path as any)} />
            <FieldError msg={fieldError(path)} />
          </FormRow>
        );

      case "date": {
        const today = new Date();
        const isDob = field.key === "dob";
        const minDate = new Date(
          today.getFullYear() - 120,
          today.getMonth(),
          today.getDate(),
        );
        const maxDate = isDob
          ? new Date(
              today.getFullYear() - 18,
              today.getMonth(),
              today.getDate(),
            )
          : today;
        return (
          <FormRow key={path}>
            <Label>{label}</Label>
            <Input
              type="date"
              min={minDate.toLocaleDateString("en-CA")}
              max={maxDate.toLocaleDateString("en-CA")}
              {...register(path as any, {
                validate: (val) => {
                  if (!val) return true;
                  const date = new Date(val);
                  if (date > today) return "Date cannot be in the future";
                  if (date < minDate)
                    return "Date cannot be more than 120 years ago";
                  if (isDob && date > maxDate)
                    return "Must be at least 18 years old";
                  return true;
                },
              })}
            />
            <FieldError msg={fieldError(path)} />
          </FormRow>
        );
      }

      case "phone":
        return (
          <FormRow key={path}>
            <Label>{label}</Label>
            <Controller
              name={path as any}
              control={control}
              render={({ field: f }) => (
                <PhoneInput {...f} country="CA" inputComponent={Input} />
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
            <Controller
              name={path as any}
              control={control}
              render={({ field: { value, onChange, ...rest } }) => (
                <Select value={value ?? ""} onChange={onChange} {...rest}>
                  <option value="">Select</option>
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
              )}
            />
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
                name={path as any}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    multiple
                    options={(options as string[]) || []}
                    value={value || []}
                    filterSelectedOptions
                    onChange={(_, v) => onChange(v)}
                    sx={autocompleteMultiSx}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={`Search ${field.label.toLowerCase()}...`}
                      />
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
                name={path as any}
                control={control}
                defaultValue={[]}
                render={({ field: { value = [], onChange } }) => (
                  <MultiDropdownWithDetails
                    value={value}
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
                name={path as any}
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
              <Controller
                name={path as any}
                control={control}
                render={({ field: f }) => (
                  <TextArea
                    rows={4}
                    value={f.value ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      f.onChange(
                        limitByLength(
                          e.target.value,
                          DEFAULT_TEXTAREA_MAX_LENGTH,
                        ),
                      )
                    }
                  />
                )}
              />
              <FieldError msg={fieldError(path)} />
            </FormRow>
          </FullRow>
        );

      default:
        return (
          <FormRow key={path}>
            <Label>{label}</Label>
            <Controller
              name={path as any}
              control={control}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: f }) => (
                <Input
                  type="text"
                  value={f.value ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    f.onChange(
                      limitByLength(
                        e.target.value,
                        field.maxLength ?? DEFAULT_TEXT_MAX_LENGTH,
                      ),
                    )
                  }
                />
              )}
            />
            <FieldError msg={fieldError(path)} />
          </FormRow>
        );
    }
  };

  return (
    <div style={{ padding: "20px 28px 28px" }}>
      {localErr && <ErrorBox>{localErr}</ErrorBox>}
      {localSuccess && <SuccessBox>{localSuccess}</SuccessBox>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormActions>
          <PrimaryBtn type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isNew
                ? "Create Client"
                : "Save Changes"}
          </PrimaryBtn>
        </FormActions>
        {formConfig.sections.map((section, i) => (
          <SectionCard key={i}>
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
              {section.layout === HOUSING_INTAKE_LAYOUT ? (
                renderHousingIntakeSection(section, renderField, getPath)
              ) : (
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
                        renderField(field, getPath(section, field, group)),
                      )}
                    </Fragment>
                  ))}
                  {section.fields?.map((field) =>
                    renderField(field, getPath(section, field)),
                  )}
                </>
              )}
            </ClientGrid>
          </SectionCard>
        ))}
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
      list.map((s) =>
        s.value === val ? { ...s, details: details || undefined } : s,
      ),
    );
  };

  const detailFields = options.filter(
    (o) => o.hasDetails && valueKeys.includes(o.value),
  );

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
        <div
          key={opt.value}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
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
              updateDetail(
                opt.value,
                limitByLength(e.target.value, DEFAULT_DETAILS_MAX_LENGTH),
              )
            }
            style={{ flex: 1 }}
          />
        </div>
      ))}
    </div>
  );
};

export default Details;
