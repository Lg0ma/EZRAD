import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import { useAuth } from './useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewExamPage from './pages/NewExamPage';

import './index.css';

const Main = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, user, login, logout } = useAuth();

  const navigate = (page) => setCurrentPage(page);


  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onNavigate={navigate} />;

      case 'login':
        return isAuthenticated
          ? <Dashboard onNavigate={navigate} user={user} logout={logout} />
          : <LoginPage onNavigate={navigate} login={login} />;

      case 'dashboard':
        return isAuthenticated
          ? <Dashboard onNavigate={navigate} user={user} logout={logout} />
          : <LoginPage onNavigate={navigate} login={login} />;

      case 'newExam':                       
        return isAuthenticated
          ? <NewExamPage onNavigate={navigate} user={user} />
          : <LoginPage onNavigate={navigate} login={login} />;

      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {renderPage()}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);