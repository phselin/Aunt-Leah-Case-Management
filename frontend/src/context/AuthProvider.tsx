import { createContext, useState } from "react";
import type { Dispatch, SetStateAction } from "react";


interface AuthData {
    user?: {
        id: string;
        email: string;
        role: string;
        firstname: string;
        lastname: string;
    }
}

interface AuthContextType {
    auth: AuthData;
    setAuth: Dispatch<SetStateAction<AuthData>>;
}

const AuthContext = createContext<AuthContextType>({
    auth: {},
    setAuth: () => {} 
});

export const AuthProvider = ({ children }: {children:React.ReactNode}) => {
    const [auth, setAuth ] = useState({});

    return (
        <AuthContext.Provider value= {{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;