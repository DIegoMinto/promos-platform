import {
  useState,
  type ReactNode,
} from 'react';

import {
  AuthContext,
  type AuthContextType,
} from './AuthContextValue';

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthContextType['user']>(() => {
      const storedUser =
        localStorage.getItem('user');

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    });

  const [accessToken, setAccessToken] =
    useState<string | null>(
      () =>
        localStorage.getItem(
          'accessToken',
        ),
    );

  function login(
    token: string,
    loggedUser: NonNullable<
      AuthContextType['user']
    >,
  ) {
    localStorage.setItem(
      'accessToken',
      token,
    );

    localStorage.setItem(
      'user',
      JSON.stringify(loggedUser),
    );

    setAccessToken(token);
    setUser(loggedUser);
  }

  function logout() {
    localStorage.removeItem(
      'accessToken',
    );

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
        isAuthenticated:
          !!user && !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}