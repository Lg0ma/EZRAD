import React, { useState, useEffect } from 'react';
import ImageInfoModal from './ImageInfoModal';
import { 
  Activity, 
  FileImage, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Zap, 
  Clock, 
  Monitor,
  RefreshCw,
  AlertCircle 
} from 'lucide-react';

const Dashboard = ({ onNavigate, user, logout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [recentExams, setRecentExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickStats, setQuickStats] = useState({
    todayExams: 0,
    pendingExams: 0,
    operationalSystems: 3,
    averageTime: '12m'
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  // Format time from datetime string
  const formatTime = (datetime) => {
    if (!datetime) return '--:--';
    try {
      const date = new Date(datetime);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '--:--';
    }
  };

  // Format exam ID
  const formatExamId = (id, createdAt) => {
    const year = new Date(createdAt).getFullYear();
    const paddedId = String(id).padStart(3, '0');
    return `XR-${year}-${paddedId}`;
  };

  // Map status from API to display format
  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Complete',
      'cancelled': 'Cancelled'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  // Fetch exams from API
  const fetchExams = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch today's exams
      const response = await fetch('http://localhost:8000/api/v1/exams/today', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If today's exams fail, try to get all recent exams
        const allExamsResponse = await fetch('http://localhost:8000/api/v1/exams/?limit=10', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!allExamsResponse.ok) {
          throw new Error('Failed to fetch exams');
        }

        const allData = await allExamsResponse.json();
        
        // Format the exam data for display
        const formattedExams = allData.slice(0, 4).map(exam => ({
          id: formatExamId(exam.id, exam.created_at),
          patient: exam.patient_name,
          exam: exam.exam_type || 'X-Ray',
          time: formatTime(exam.scheduled_time || exam.created_at),
          status: formatStatus(exam.status),
          rawData: exam // Keep raw data for modal
        }));

        setRecentExams(formattedExams);
      } else {
        const data = await response.json();
        
        // Format the exam data for display
        const formattedExams = data.slice(0, 4).map(exam => ({
          id: formatExamId(exam.id, exam.created_at),
          patient: exam.patient_name,
          exam: exam.exam_type || 'X-Ray',
          time: formatTime(exam.scheduled_time || exam.created_at),
          status: formatStatus(exam.status),
          rawData: exam // Keep raw data for modal
        }));

        setRecentExams(formattedExams);
      }

      // Fetch statistics for quick stats
      const statsResponse = await fetch('http://localhost:8000/api/v1/exams/statistics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setQuickStats({
          todayExams: stats.today_exams || 0,
          pendingExams: stats.pending_exams || 0,
          operationalSystems: 3, // This would come from equipment API
          averageTime: '12m' // This would be calculated from exam durations
        });
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exam data');
      
      // Set fallback data if API fails
      const fallbackData = [
        { id: 'XR-2024-001', patient: 'Smith, John', exam: 'Chest X-Ray', time: '14:30', status: 'Complete' },
        { id: 'XR-2024-002', patient: 'Johnson, Mary', exam: 'Hand X-Ray', time: '14:45', status: 'In Progress' },
        { id: 'XR-2024-003', patient: 'Williams, Robert', exam: 'Spine X-Ray', time: '15:00', status: 'Scheduled' },
        { id: 'XR-2024-004', patient: 'Brown, Lisa', exam: 'Knee X-Ray', time: '15:15', status: 'Scheduled' }
      ];
      setRecentExams(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchExams();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchExams, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle opening modal with exam data
  const handleOpenModal = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  // Format quick stats for display
  const getQuickStats = () => [
    { 
      label: 'Today\'s Exams', 
      value: String(quickStats.todayExams), 
      change: quickStats.todayExams > 0 ? `${quickStats.pendingExams} pending` : 'No exams scheduled', 
      icon: FileImage 
    },
    { 
      label: 'Queue Status', 
      value: String(quickStats.pendingExams), 
      change: 'Pending studies', 
      icon: Clock 
    },
    { 
      label: 'Equipment Status', 
      value: `${quickStats.operationalSystems}/3`, 
      change: 'All systems operational', 
      icon: Monitor 
    },
    { 
      label: 'Average Time', 
      value: quickStats.averageTime, 
      change: 'Per examination', 
      icon: Zap 
    }
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
          {getQuickStats().map((stat, index) => (
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  Today's Exam Queue
                </h3>
                <button
                  onClick={fetchExams}
                  className="text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {lastRefresh && (
                <p className="text-xs text-slate-400 mt-1">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-300">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {isLoading && recentExams.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-3 text-slate-300">Loading exams...</span>
                </div>
              ) : recentExams.length > 0 ? (
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
                          onClick={() => handleOpenModal(exam)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105">
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileImage className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300">No exams scheduled for today</p>
                  <button
                    onClick={() => onNavigate('newExam')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule New Exam
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => onNavigate('newExam')}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 font-semibold">
                View Full Schedule
              </button>
            </div>
            
            {selectedExam && (
              <ImageInfoModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedExam(null);
                }}
                patientName={selectedExam.patient}
                studyId={selectedExam.id}
                title={selectedExam.exam}
                modality={selectedExam.rawData?.modality || "X-Ray"}
                bodyPart={selectedExam.rawData?.body_part || "Not specified"}
                status={selectedExam.status}
              />
            )}
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
                <button 
                  onClick={fetchExams}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
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

            {/* Data Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Today's Summary</h3>
              </div>
              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Exams</span>
                  <span className="text-white font-medium">{quickStats.todayExams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending</span>
                  <span className="text-yellow-300 font-medium">{quickStats.pendingExams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="text-green-300 font-medium">
                    {recentExams.filter(e => e.status === 'Complete').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">In Progress</span>
                  <span className="text-blue-300 font-medium">
                    {recentExams.filter(e => e.status === 'In Progress').length}
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