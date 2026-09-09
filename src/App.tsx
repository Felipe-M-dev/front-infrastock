import {
  useEffect,
  type ReactNode,
} from 'react';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastProvider';
import AppLayout from './layouts/AppLayout';

import CompaniesPage from './pages/CompaniesPage';
import CredentialsPage from './pages/CredentialsPage';
import DashboardPage from './pages/DashboardPage';
import InventoryReviewPlanPage from './pages/InventoryReviewPlanPage';
import IpManagementPage from './pages/IpManagementPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import ProfilePage from './pages/ProfilePage';
import ServerDetailPage from './pages/ServerDetailPage';
import ServersPage from './pages/ServersPage';
import SoftwareUpdatePlanPage from './pages/SoftwareUpdatePlanPage';
import SoftwareVersionsPage from './pages/SoftwareVersionsPage';
import SystemsPage from './pages/SystemsPage';
import UsersPage from './pages/UsersPage';

import {
  getUser,
  restoreTheme,
} from './services/session.service';

type AppRole =
  | 'ADMIN'
  | 'EDITOR'
  | 'VIEWER';

interface RoleRouteProps {
  roles:
    AppRole[];

  children:
    ReactNode;
}

function RoleRoute({
  roles,
  children,
}: RoleRouteProps) {
  const user =
    getUser();

  if (
    !user ||
    !roles.includes(
      user.role,
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

function App() {
  useEffect(() => {
    restoreTheme();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          element={
            <ProtectedRoute />
          }
        >
          <Route
            element={
              <AppLayout />
            }
          >
            <Route
              path="/dashboard"
              element={
                <DashboardPage />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfilePage />
              }
            />

            <Route
              path="/servers"
              element={
                <ServersPage />
              }
            />

            <Route
              path="/servers/:id"
              element={
                <ServerDetailPage />
              }
            />

            <Route
              path="/systems"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                    'EDITOR',
                  ]}
                >
                  <SystemsPage />
                </RoleRoute>
              }
            />

            <Route
              path="/software-versions"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                    'EDITOR',
                  ]}
                >
                  <SoftwareVersionsPage />
                </RoleRoute>
              }
            />

            <Route
              path="/software-update-plan"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                    'EDITOR',
                  ]}
                >
                  <SoftwareUpdatePlanPage />
                </RoleRoute>
              }
            />

            <Route
              path="/inventory-review-plan"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                    'EDITOR',
                  ]}
                >
                  <InventoryReviewPlanPage />
                </RoleRoute>
              }
            />

            <Route
              path="/ip-management"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                  ]}
                >
                  <IpManagementPage />
                </RoleRoute>
              }
            />

            <Route
              path="/pricing"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                    'EDITOR',
                    'VIEWER',
                  ]}
                >
                  <PricingPage />
                </RoleRoute>
              }
            />

            <Route
              path="/credentials"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                  ]}
                >
                  <CredentialsPage />
                </RoleRoute>
              }
            />

            <Route
              path="/users"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                  ]}
                >
                  <UsersPage />
                </RoleRoute>
              }
            />

            <Route
              path="/companies"
              element={
                <RoleRoute
                  roles={[
                    'ADMIN',
                  ]}
                >
                  <CompaniesPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
