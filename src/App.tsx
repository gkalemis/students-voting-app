import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useT } from './context/LocaleContext';
import { Login } from './pages/Login';
import { Account } from './pages/Account';
import { Dashboard } from './pages/Dashboard';
import { Session } from './pages/Session';
import { Join } from './pages/Join';
import { Projector } from './pages/Projector';
import { Admin } from './pages/Admin';

export function App() {
  const { user, ready } = useAuth();
  const { t } = useT();

  if (!ready) {
    return <main className="center">{t('loading')}</main>;
  }

  const forcePasswordChange = Boolean(user?.must_change_password);
  const home = forcePasswordChange ? '/account' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join/:publicId" element={<Join />} />
      <Route path="/projector/:publicId" element={<Projector />} />

      <Route
        path="/dashboard"
        element={
          user && !forcePasswordChange ? (
            <Dashboard />
          ) : (
            <Navigate to={user ? '/account' : '/login'} />
          )
        }
      />
      <Route
        path="/account"
        element={user ? <Account /> : <Navigate to="/login" />}
      />
      <Route
        path="/session/:id"
        element={
          user && !forcePasswordChange ? (
            <Session />
          ) : (
            <Navigate to={user ? '/account' : '/login'} />
          )
        }
      />
      <Route
        path="/admin"
        element={
          user?.role === 'ADMIN' && !forcePasswordChange ? (
            <Admin />
          ) : (
            <Navigate to={home} />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? home : '/login'} />} />
    </Routes>
  );
}
