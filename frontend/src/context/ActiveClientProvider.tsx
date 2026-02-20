import { createContext, useState, useCallback, useContext } from 'react';

interface ActiveClientContextType {
  activeClientId: string | null;
  setActiveClientId: (id: string | null) => void;
};

const ActiveClientContext = createContext<ActiveClientContextType>({
  activeClientId: null,
  setActiveClientId: () => {},
});

export const ActiveClientProvider = ({ children }: { children:React.ReactNode }) => {
  const [activeClientId, setActiveClientIdState] = useState<string | null>(() => 
    sessionStorage.getItem("active-client")
  );

  const setActiveClientId = useCallback((id: string | null) => {
    if (id) {
      sessionStorage.setItem("active-client", id);
    } else {
      sessionStorage.removeItem("active-client");
    }
    setActiveClientIdState(id);
  }, []);

  return (
    <ActiveClientContext.Provider value={{ activeClientId, setActiveClientId }}>
      {children}
    </ActiveClientContext.Provider>
  );
};

export const useActiveClient = () => useContext(ActiveClientContext);
export default ActiveClientContext;