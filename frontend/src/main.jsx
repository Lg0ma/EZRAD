import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import { useAuth } from './useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewExamPage from './pages/NewExamPage';
import CreateTech from './pages/CreateTech';
import ImageUploadTestPage from './pages/ImageUploadTestPage';
import ImageInfoModal from './pages/ImageInfoModal'; // Import the modal here

import './index.css';

const Main = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, user, login, logout } = useAuth();

  // --- Modal state is now managed here ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExamForModal, setSelectedExamForModal] = useState(null);

  const navigate = (page) => setCurrentPage(page);

  // --- Functions to control the modal ---
  const handleOpenModal = (exam) => {
    setSelectedExamForModal(exam);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExamForModal(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onNavigate={navigate} />;

      case 'login':
        return isAuthenticated
          ? <Dashboard onNavigate={navigate} user={user} logout={logout} onOpenModal={handleOpenModal} />
          : <LoginPage onNavigate={navigate} login={login} />;

      case 'dashboard':
        return isAuthenticated
          ? <Dashboard onNavigate={navigate} user={user} logout={logout} onOpenModal={handleOpenModal} />
          : <LoginPage onNavigate={navigate} login={login} />;

      case 'newExam':                       
        return isAuthenticated
          ? <NewExamPage onNavigate={navigate} user={user} />
          : <LoginPage onNavigate={navigate} login={login} />;

      case 'createTech':
        return <CreateTech onNavigate={navigate} user={user} />;

      case 'imageUploadTest':
        return isAuthenticated
          ? <ImageUploadTestPage onNavigate={navigate} />
          : <LoginPage onNavigate={navigate} login={login} />;

      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };
  
  // Helper to format date for the modal
  const formatDate = (datetime) => {
    if (!datetime) return '';
    try {
      return new Date(datetime).toLocaleDateString();
    } catch {
      return '';
    }
  };
  
  // Helper to get technologist name for the modal
  const getTechnologistName = (exam = {}) => {
    return exam.technologist || exam.tech_name || exam.technologist_name || exam.tech || '';
  };


  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {renderPage()}

      {/* --- Render the modal at the top level --- */}
      {selectedExamForModal && (
        <ImageInfoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          patientName={selectedExamForModal.patient}
          studyId={selectedExamForModal.id}
          title={selectedExamForModal.exam}
          modality={selectedExamForModal.rawData?.modality}
          bodyPart={selectedExamForModal.rawData?.body_part}
          status={selectedExamForModal.status}
          studyDate={formatDate(selectedExamForModal.rawData?.scheduled_time || selectedExamForModal.rawData?.exam_date || selectedExamForModal.rawData?.created_at)}
          studyTime={selectedExamForModal.time}
          technologist={getTechnologistName(selectedExamForModal.rawData)}
          imageUrl={selectedExamForModal.rawData?.image_url}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
