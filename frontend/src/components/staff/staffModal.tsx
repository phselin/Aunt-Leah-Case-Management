import { Autocomplete, TextField } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import axios from "axios";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input/input";
import styled from "styled-components";
import api from "../../api";
import {
  ErrorBox,
  FormRow,
  Input,
  Label,
  PrimaryBtn,
  SecondaryBtn,
  Select,
} from "../client/modal/clientElement";
import { type StaffMember } from "./staff";

interface StaffFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  role: "admin" | "super-admin" | "staff";
  active: boolean;
  programs: string[];
  mfaEnabled: boolean;
  password?: string;
}

type Props = {
  open: boolean;
  isNew: boolean;
  staffData: StaffMember | null;
  onClose: () => void;
  onSave: (updated: StaffMember) => void;
  onError: (msg: string) => void;
};

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;

  @media screen and (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FullRow = styled.div`
  grid-column: 1 / -1;
`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <span style={{ color: "red", fontSize: 12 }}>{msg}</span> : null;

const PasswordMasked = styled.div`
  font-family: "Poppins", sans-serif;
  font-size: 14px;
  color: #9ca3af;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PasswordWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const EyeButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #9ca3af;
  transition: color 0.2s ease;

  &:hover {
    color: #6b7280;
  }
`;

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

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

const StaffModal = ({ open, isNew, staffData, onClose, onSave }: Props) => {
  const [localErr, setLocalErr] = useState("");
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormData>();

  const mfaEnabled = watch("mfaEnabled");
  const selectedRole = watch("role");
  const [showPassword, setShowPassword] = useState(false);

  // Load available programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get("/programs/names");
        // Flatten programs structure into a list of program strings
        const data = res.data;
        if (Array.isArray(data)) {
          setAvailablePrograms(data);
        } else if (data && typeof data === "object") {
          // If it's a nested structure, flatten all values
          const flat: string[] = [];
          const flatten = (obj: any) => {
            if (Array.isArray(obj)) {
              obj.forEach((item) => {
                if (typeof item === "string") flat.push(item);
                else flatten(item);
              });
            } else if (typeof obj === "object" && obj !== null) {
              Object.values(obj).forEach(flatten);
            }
          };
          flatten(data);
          setAvailablePrograms(flat);
        }
      } catch {
        // Silently fail — programs dropdown will just be empty
      }
    };
    if (open) fetchPrograms();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (staffData) {
        reset({
          firstname: staffData.firstname,
          lastname: staffData.lastname,
          email: staffData.email,
          phone: staffData.phone ?? "",
          role: staffData.role,
          active: staffData.active,
          programs: staffData.programs ?? [],
          mfaEnabled: staffData.mfaEnabled ?? false,
          password: "",
        });
      } else {
        reset({
          firstname: "",
          lastname: "",
          email: "",
          phone: "",
          role: "staff",
          active: true,
          programs: [],
          mfaEnabled: false,
          password: "",
        });
      }
      setLocalErr("");
      setShowPassword(false);
    }
  }, [open, staffData, reset]);

  useEffect(() => {
    if (localErr) {
      const timer = setTimeout(() => setLocalErr(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [localErr]);

  const onSubmit = async (data: StaffFormData) => {
    setLocalErr("");

    // Build the payload — omit password if MFA is enabled or password is empty
    const payload: any = {
      firstname: data.firstname?.trim(),
      lastname: data.lastname?.trim(),
      email: data.email?.trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      active: data.active,
      programs: data.programs,
      mfaEnabled: data.mfaEnabled,
    };

    if (!data.mfaEnabled && data.password) {
      payload.password = data.password;
    }

    try {
      if (isNew) {
        const res = await api.post("/staff", payload);
        onSave(res.data);
      } else if (staffData) {
        const res = await api.put(`/staff/${staffData._id}`, payload);
        onSave(res.data);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status) {
        if (err.response.status === 403) {
          setLocalErr(err.response.data?.detail || "Access denied");
        } else if (err.response.status === 409) {
          setLocalErr(
            err.response.data?.detail ||
              "Staff member with this email already exists",
          );
        } else {
          setLocalErr(`Failed to ${isNew ? "add" : "update"} staff member`);
          const backend_errors = err.response?.data?.errors;
          if (backend_errors && Array.isArray(backend_errors)) {
            backend_errors.forEach((item: any) => {
              Object.entries(item).forEach(([field, msg]) => {
                setError(field as any, {
                  type: "server",
                  message: String(msg),
                });
              });
            });
          }
        }
      } else {
        setLocalErr(`Failed to ${isNew ? "add" : "update"} staff member`);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "Poppins, sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#111827",
          pb: 0,
        }}
      >
        {isNew ? "Add New Staff Member" : "Edit Staff Member"}
        <IconButton onClick={onClose} size="small">
          <X size={20} color="#6B7280" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {localErr && (
            <ErrorBox style={{ marginBottom: 16 }}>{localErr}</ErrorBox>
          )}

          <FormGrid>
            {/* First Name */}
            <FormRow>
              <Label>First Name *</Label>
              <Input
                type="text"
                {...register("firstname", {
                  required: "First name is required",
                })}
              />
              <FieldError msg={errors.firstname?.message} />
            </FormRow>

            {/* Last Name */}
            <FormRow>
              <Label>Last Name *</Label>
              <Input
                type="text"
                {...register("lastname", {
                  required: "Last name is required",
                })}
              />
              <FieldError msg={errors.lastname?.message} />
            </FormRow>

            {/* Email */}
            <FormRow>
              <Label>Email *</Label>
              <Input
                type="email"
                {...register("email", { required: "Email is required" })}
              />
              <FieldError msg={errors.email?.message} />
            </FormRow>

            {/* Phone */}
            <FormRow>
              <Label>Phone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field: { value, onChange, ...rest } }) => (
                  <PhoneInput
                    {...rest}
                    value={value ?? undefined}
                    onChange={(v) => onChange(v ?? null)}
                    country="CA"
                    inputComponent={Input}
                  />
                )}
              />
              <FieldError msg={errors.phone?.message} />
            </FormRow>

            {/* Role */}
            <FormRow>
              <Label>Role *</Label>
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role is required" }}
                render={({ field: { value, onChange, ...rest } }) => (
                  <Select value={value ?? ""} onChange={onChange} {...rest}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </Select>
                )}
              />
              <FieldError msg={errors.role?.message} />
            </FormRow>

            {/* Active */}
            <FormRow>
              <Label>Status</Label>
              <Controller
                name="active"
                control={control}
                render={({ field: { value, onChange, ...rest } }) => (
                  <Select
                    value={value ? "true" : "false"}
                    onChange={(e) => onChange(e.target.value === "true")}
                    {...rest}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                )}
              />
            </FormRow>

            {/* MFA Enabled — super-admin can only disable, not enable. Staff sets up MFA on first login. */}
            {!isNew && (
              <FullRow>
                <FormRow>
                  <Controller
                    name="mfaEnabled"
                    control={control}
                    render={({ field: { value, onChange } }) => {
                      const canToggle = !!staffData?.mfaEnabled;
                      return (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 14,
                            cursor: canToggle ? "pointer" : "not-allowed",
                            fontFamily: "Poppins, sans-serif",
                            opacity: canToggle ? 1 : 0.55,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!value}
                            disabled={!canToggle}
                            onChange={(e) => onChange(e.target.checked)}
                          />
                          MFA Enabled
                          {!canToggle && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "#9CA3AF",
                                marginLeft: 4,
                              }}
                            >
                              (set up by staff member on first login)
                            </span>
                          )}
                        </label>
                      );
                    }}
                  />
                </FormRow>
              </FullRow>
            )}

            {/* Password */}
            <FullRow>
              <FormRow>
                <Label>Password</Label>
                {mfaEnabled ? (
                  <PasswordMasked>
                    <LockIcon />
                    Password is managed via MFA and cannot be viewed or edited
                  </PasswordMasked>
                ) : (
                  <>
                    <PasswordWrapper>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          isNew
                            ? "Enter password"
                            : "Enter new password (leave blank to keep current)"
                        }
                        style={{ paddingRight: "40px", width: "100%" }}
                        {...register("password")}
                      />
                      <EyeButton
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </EyeButton>
                    </PasswordWrapper>
                    <FieldError msg={errors.password?.message} />
                  </>
                )}
              </FormRow>
            </FullRow>

            {/* Programs (multi-dropdown with set subtraction) */}
            {selectedRole == "staff" && (
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
                        filterSelectedOptions
                        onChange={(_, v) => onChange(v)}
                        sx={autocompleteMultiSx}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search programs..."
                          />
                        )}
                      />
                    )}
                  />
                  <FieldError msg={errors.programs?.message} />
                </FormRow>
              </FullRow>
            )}
          </FormGrid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <SecondaryBtn type="button" onClick={onClose}>
            Cancel
          </SecondaryBtn>
          <PrimaryBtn type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isNew
                ? "Add Staff Member"
                : "Save Changes"}
          </PrimaryBtn>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StaffModal;
