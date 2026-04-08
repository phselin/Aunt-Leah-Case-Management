import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AuthContext from "../context/AuthProvider";
import axios from "axios";
import { palette } from "../theme/palette";
import api from "../api";
import QRCode from "react-qr-code";
import OtpInput from "react-otp-input";

const LoginLayout = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 0 0 38%;
  background: ${palette.magentaPink};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const LogoImage = styled.img`
  max-width: 280px;
  width: 100%;
  height: auto;
  object-fit: contain;
`;

const RightPanel = styled.div`
  flex: 1;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 56px;
`;

const FormHeading = styled.h1`
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: ${palette.deepRed};
  font-family: "Poppins", sans-serif;
  font-weight: 600;
`;

const FormSubheading = styled.p`
  margin: 0 0 32px 0;
  font-size: 0.9375rem;
  font-weight: 400;
  color: ${palette.seafoamGreen};
  font-family: "Poppins", sans-serif;
`;

const Form = styled.form`
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${palette.deepRed};
  font-family: "Poppins", sans-serif;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 1rem;
  border: 1px solid ${palette.seafoamGreen};
  border-radius: 10px;
  background: #ffffff;
  color: #222;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: ${palette.seafoamGreen};
  }

  &:focus {
    outline: none;
    border-color: ${palette.brightPeriwinkle};
  }
`;

const LoginButton = styled.button`
  margin-top: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background: ${palette.magentaPink};
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  align-self: flex-start;
  min-width: 120px;

  &:hover {
    filter: brightness(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${palette.magentaPink};
    outline-offset: 2px;
  }
`;

const ErrorAlert = styled.p<{ $visible: boolean }>`
  margin: 0 0 16px 0;
  padding: 12px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: red;
  background: ${palette.white};
  border: 1px solid red;
  border-radius: 10px;
  font-family: "Poppins", sans-serif;
  visibility: ${(p) => (p.$visible ? "visible" : "hidden")};
  position: ${(p) => (p.$visible ? "relative" : "absolute")};
  left: ${(p) => (p.$visible ? "auto" : "-9999px")};
  width: ${(p) => (p.$visible ? "auto" : "1px")};
  height: ${(p) => (p.$visible ? "auto" : "1px")};
  overflow: hidden;
  clip: ${(p) => (p.$visible ? "auto" : "rect(0,0,0,0)")};
`;

const Login = () => {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const [step, setStep] = useState<"LOGIN" | "MFA" | "SETUP">("LOGIN");
  const [mfaSession, setMfaSession] = useState("");
  const [otp, setOTP] = useState("");
  const [qrURI, setQrURI] = useState("");
  const [newPwd, setNewPwd] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrMsg("");

    try {
      if (step === "LOGIN") {
        const res = await api.post("/login", { email: email, password: pwd });
        const session = res.data.mfaSession;
        setMfaSession(session);
        if (res.data.setupRequired) {
          const setupRes = await api.post("/mfa/setup", {
            mfaSession: session,
          });
          setQrURI(setupRes.data.uri);
          setStep("SETUP");
        } else if (res.data.mfaRequired) {
          setStep("MFA");
        }
      } else if (step === "MFA") {
        const res = await api.post("/login/mfa", {
          mfaSession: mfaSession,
          otp: otp,
        });
        setAuth({ user: res.data.user });
        navigate("/home");
      } else if (step === "SETUP") {
        const res = await api.post("/mfa/confirm", {
          mfaSession: mfaSession,
          otp: otp,
          password: newPwd,
        });
        setAuth({ user: res.data.user });
        navigate("/home");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail ?? "Login failed");
      } else {
        setErrMsg("Unable to connect to server");
      }
      errRef.current?.focus();
    }
  };

  return (
    <LoginLayout>
      <LeftPanel>
        <LogoImage src="/auntleahslogo.svg" alt="Aunt Leah's" />
      </LeftPanel>
      <RightPanel>
        <FormHeading>
          {step === "LOGIN"
            ? "Welcome Back"
            : step === "MFA"
              ? "Verification"
              : "MFA Setup"}
        </FormHeading>
        <FormSubheading>
          {step === "LOGIN"
            ? "Please login to your account"
            : step === "MFA"
              ? "Please enter the 6-digit code from your authenticator app"
              : "Scan the QR code and set a new password"}
        </FormSubheading>
        <ErrorAlert ref={errRef} $visible={!!errMsg} aria-live="assertive">
          {errMsg}
        </ErrorAlert>
        <Form onSubmit={handleSubmit}>
          {step === "LOGIN" && (
            <>
              <FieldGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  ref={inputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                />
              </FieldGroup>
            </>
          )}
          {step === "SETUP" && (
            // https://www.npmjs.com/package/react-qr-code
            <div
              style={{
                height: "auto",
                maxWidth: 256,
                width: "100%",
              }}
            >
              <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={qrURI}
                viewBox={`0 0 256 256`}
              />
            </div>
          )}
          {(step === "MFA" || step === "SETUP") && (
            <FieldGroup>
              <Label>Authenticator Code</Label>
              <OtpInput
                value={otp}
                onChange={setOTP}
                numInputs={6}
                renderInput={(props) => <input {...props} />}
                inputStyle={{
                  width: "3rem",
                  height: "3rem",
                  fontSize: "1.25rem",
                  borderRadius: 10,
                  border: `1px solid ${palette.seafoamGreen}`,
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
                containerStyle={{ gap: 8 }}
                shouldAutoFocus={step === "MFA"}
              />
            </FieldGroup>
          )}
          {step === "SETUP" && (
            <FieldGroup>
              <Label>New Password</Label>
              <Input
                type="password"
                ref={inputRef}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={8}
              />
            </FieldGroup>
          )}
          <LoginButton type="submit">
            {step === "LOGIN"
              ? "Login"
              : step === "MFA"
                ? "Verify & Login"
                : "Update Password & Login"}
          </LoginButton>
        </Form>
      </RightPanel>
    </LoginLayout>
  );
};

export default Login;
