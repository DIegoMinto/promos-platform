import { createContext } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role:
    | 'CLIENTE'
    | 'NEGOCIO'
    | 'ADMIN';
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (
    accessToken: string,
    user: User,
  ) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );