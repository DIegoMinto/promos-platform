import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

import DashboardSidebar from './components/DashboardSidebar';

import DashboardOverview from './pages/DashboardOverview';
import MyPromotions from './pages/MyPromotions';
import CreatePromotion from './pages/CreatePromotion';
import EditPromotion from './pages/EditPromotion';
import MyBusiness from './pages/MyBusiness';

export default function BusinessDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar user={user} />

      <main className="min-h-screen pb-24 md:ml-64 md:pb-8">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route
              index
              element={<DashboardOverview />}
            />

            <Route
              path="promociones"
              element={<MyPromotions />}
            />

            <Route
              path="promociones/nueva"
              element={<CreatePromotion />}
            />

            <Route
              path="promociones/:id/editar"
              element={<EditPromotion />}
            />

            <Route
              path="mi-negocio"
              element={<MyBusiness />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/negocio"
                  replace
                />
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}