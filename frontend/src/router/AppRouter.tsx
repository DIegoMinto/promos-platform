import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import PromotionDetail from '../pages/PromotionDetail';

import BusinessDashboard from '../dashboard/BusinessDashboard';

import AdminDashboard from '../admin/AdminDashboard';
import AdminUsers from '../admin/AdminUsers';
import AdminBusinesses from '../admin/AdminBusinesses';
import AdminPromotions from '../admin/AdminPromotions';
import AdminCategories from '../admin/AdminCategories';
import AdminLayout from '../admin/components/AdminLayout';

import { useAuth } from '../context/useAuth';

export default function AppRouter() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PÚBLICO
        ========================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/perfil"
          element={<Profile />}
        />

        <Route
          path="/promociones/:id"
          element={<PromotionDetail />}
        />

        {/* =========================
            NEGOCIO
        ========================= */}

        <Route
          path="/negocio/*"
          element={
            user?.role === 'NEGOCIO' ? (
              <BusinessDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            isAdmin ? (
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/negocios"
          element={
            isAdmin ? (
              <AdminLayout>
                <AdminBusinesses />
              </AdminLayout>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/promociones"
          element={
            isAdmin ? (
              <AdminLayout>
                <AdminPromotions />
              </AdminLayout>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/admin/categorias"
          element={
            isAdmin ? (
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            RUTA NO ENCONTRADA
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}