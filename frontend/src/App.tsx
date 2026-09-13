import { useState } from 'react';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [page, setPage] = useState<
    'home' | 'login' | 'register'
  >('home');

  if (page === 'login') {
    return (
      <Login
        onBackToHome={() => setPage('home')}
        onLoginSuccess={() => setPage('home')}
      />
    );
  }

  if (page === 'register') {
    return (
      <Register
        onBackToHome={() => setPage('home')}
        onRegisterSuccess={() => setPage('login')}
      />
    );
  }

  return (
    <Home
      onLogin={() => setPage('login')}
      onRegister={() => setPage('register')}
    />
  );
}

export default App;