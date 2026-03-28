import { createContext, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import api from "../api";

interface AuthData {
  user?: {
    id: string;
    email: string;
    role: string;
    firstname: string;
    lastname: string;
  };
}

interface AuthContextType {
  auth: AuthData;
  setAuth: Dispatch<SetStateAction<AuthData>>;
}

const AuthContext = createContext<AuthContextType>({
  auth: {},
  setAuth: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthData>({});

  useEffect(() => {
    api
      .get("/me")
      .then((res) => setAuth({ user: res.data.user }))
      .catch(() => setAuth({}));
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
