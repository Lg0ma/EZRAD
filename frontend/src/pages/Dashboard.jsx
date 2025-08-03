import React, { useState } from 'react';
import ImageInfoModal from './ImageInfoModal';
import { Activity, FileImage, Calendar, Users, Settings, LogOut, Zap, Clock, Monitor } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white text-xl font-bold">RadiTech</span>
                <span className="text-slate-300 text-sm ml-2">Workstation</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-300">{user?.department} • License: {user?.license}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">{currentTime}</p>
                <p className="text-xs text-slate-400">{currentDate}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
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
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-300">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.change}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Queue */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Today's Exam Queue
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FileImage className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{exam.patient}</p>
                        <p className="text-sm text-slate-300">{exam.exam} • {exam.id}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-white">{exam.time}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exam.status === 'Complete' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          exam.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105">
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 font-semibold">
                View Full Schedule
              </button>
            </div>
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

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => onNavigate('newExam')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 font-semibold">
                  <FileImage className="w-4 h-4 mr-2" />
                  New Exam
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Patient Search
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium">
                  <Monitor className="w-4 h-4 mr-2" />
                  Equipment Check
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Equipment Status</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">X-Ray Room 1</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">X-Ray Room 2</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Portable Unit</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
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