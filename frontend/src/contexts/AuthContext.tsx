import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'CLIENTE' | 'NEGOCIO' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');

    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken'),
  );

  function login(token: string, loggedUser: User) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));

    setAccessToken(token);
    setUser(loggedUser);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!user && !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider',
    );
  }

  return context;
}