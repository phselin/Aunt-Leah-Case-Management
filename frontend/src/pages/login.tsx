import { useRef, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AuthContext from '../context/AuthProvider';
import axios from 'axios';

// Design tokens
const COLORS = {
  rose: '#D16279',
  subheading: '#9A6A71',
  border: '#D1D1D1',
  placeholder: '#B0B0B0',
  errorBg: '#fff3f4',
  errorBorder: '#ffd0d6',
  errorText: '#7a0b1e',
} as const;

const LoginLayout = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 0 0 38%;
  background: ${COLORS.rose};
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
  color: ${COLORS.rose};
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const FormSubheading = styled.p`
  margin: 0 0 32px 0;
  font-size: 0.9375rem;
  font-weight: 400;
  color: ${COLORS.subheading};
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
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
  color: ${COLORS.rose};
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  font-size: 1rem;
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  background: #ffffff;
  color: #222;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: ${COLORS.placeholder};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.rose};
  }
`;

const LoginButton = styled.button`
  margin-top: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background: ${COLORS.rose};
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  align-self: flex-start;
  min-width: 120px;

  &:hover {
    filter: brightness(0.98);
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.rose};
    outline-offset: 2px;
  }
`;

const ErrorAlert = styled.p<{ $visible: boolean }>`
  margin: 0 0 16px 0;
  padding: 12px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${COLORS.errorText};
  background: ${COLORS.errorBg};
  border: 1px solid ${COLORS.errorBorder};
  border-radius: 10px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  visibility: ${(p) => (p.$visible ? 'visible' : 'hidden')};
  position: ${(p) => (p.$visible ? 'relative' : 'absolute')};
  left: ${(p) => (p.$visible ? 'auto' : '-9999px')};
  width: ${(p) => (p.$visible ? 'auto' : '1px')};
  height: ${(p) => (p.$visible ? 'auto' : '1px')};
  overflow: hidden;
  clip: ${(p) => (p.$visible ? 'auto' : 'rect(0,0,0,0)')};
`;

const Login = () => {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  const clearError = () => setErrMsg('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'http://localhost:8000/login',
        { email: user, password: pwd },
        { withCredentials: true }
      );
      setAuth({ user: response.data.user });
      navigate('/home');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail ?? 'Login failed');
      } else {
        setErrMsg('Unable to connect to server');
      }
      errRef.current?.focus();
    }
  };

  return (
    <LoginLayout>
      <LeftPanel>
        <LogoImage
          src="/auntleahslogo.svg"
          alt="Aunt Leah's"
        />
      </LeftPanel>
      <RightPanel>
        <FormHeading>Welcome Back</FormHeading>
        <FormSubheading>Please login to your account</FormSubheading>
        <ErrorAlert
          ref={errRef}
          $visible={!!errMsg}
          aria-live="assertive"
        >
          {errMsg}
        </ErrorAlert>
        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              ref={userRef}
              autoComplete="off"
              placeholder="Enter your username"
              onChange={(e) => {
              setUser(e.target.value);
              clearError();
            }}
              value={user}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter your password"
              onChange={(e) => {
              setPwd(e.target.value);
              clearError();
            }}
              value={pwd}
              required
            />
          </FieldGroup>
          <LoginButton type="submit">Login</LoginButton>
        </Form>
      </RightPanel>
    </LoginLayout>
  );
};

export default Login;
