import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { useAuth } from './useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

import './index.css'; // Tailwind and custom styles

const Main = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, user, login, logout } = useAuth();

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        if (isAuthenticated) {
          return <Dashboard onNavigate={navigate} user={user} logout={logout} />;
        }
        return <LoginPage onNavigate={navigate} login={login} />;
      case 'dashboard':
        if (isAuthenticated) {
          return <Dashboard onNavigate={navigate} user={user} logout={logout} />;
        }
        return <LoginPage onNavigate={navigate} login={login} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return <div className="min-h-screen bg-gray-100 text-gray-900">{renderPage()}</div>;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);