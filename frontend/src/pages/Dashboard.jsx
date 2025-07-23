import React, { useState } from 'react';
import ImageInfoModal from './ImageInfoModal';
import { Activity, FileImage, Calendar, Users, Settings, LogOut, Zap, Clock, Monitor } from 'lucide-react';
//import './index.css';

const Dashboard = ({ onNavigate, user, logout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  const quickStats = [
    { label: 'Today\'s Exams', value: '18', change: '+3 from yesterday', icon: FileImage },
    { label: 'Queue Status', value: '4', change: 'Pending studies', icon: Clock },
    { label: 'Equipment Status', value: '3/3', change: 'All systems operational', icon: Monitor },
    { label: 'Average Time', value: '12m', change: '-2m from last week', icon: Zap }
  ];

  const recentExams = [
    { id: 'XR-2024-001', patient: 'Smith, John', exam: 'Chest X-Ray', time: '14:30', status: 'Complete' },
    { id: 'XR-2024-002', patient: 'Johnson, Mary', exam: 'Hand X-Ray', time: '14:45', status: 'In Progress' },
    { id: 'XR-2024-003', patient: 'Williams, Robert', exam: 'Spine X-Ray', time: '15:00', status: 'Scheduled' },
    { id: 'XR-2024-004', patient: 'Brown, Lisa', exam: 'Knee X-Ray', time: '15:15', status: 'Scheduled' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-gray-900 text-xl font-bold">RadiTech</span>
                <span className="text-gray-500 text-sm ml-2">Workstation</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.department} • License: {user?.license}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{currentTime}</p>
                <p className="text-xs text-gray-500">{currentDate}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.change}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Queue */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Today's Exam Queue
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FileImage className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{exam.patient}</p>
                        <p className="text-sm text-gray-500">{exam.exam} • {exam.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{exam.time}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === 'Complete' ? 'bg-green-100 text-green-800' :
                        exam.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {exam.status}
                      </span>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-white hover:bg-blue-800 transition-colors">
                        Report
                      </button>
                      <ImageInfoModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        patientName="Smith, John"
                        studyId="XR-2024-001"
                        title="Chest X-Ray Study"
                        modality="X-Ray"
                        bodyPart="Chest"
                        status="Complete"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Full Schedule
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
              + <button
              onClick={() => onNavigate('newExam')} // 🔹 go to the new-exam page
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FileImage className="w-4 h-4 mr-2" />
                New Exam
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Patient Search
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Monitor className="w-4 h-4 mr-2" />
                  Equipment Check
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Status</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">X-Ray Room 1</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">X-Ray Room 2</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Portable Unit</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;