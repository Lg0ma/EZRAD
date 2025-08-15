import React, { useState, useEffect } from 'react';
// ImageInfoModal is no longer imported here
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

// Accept onOpenModal as a prop
const Dashboard = ({ onNavigate, user, logout, onOpenModal }) => {
  // Removed isModalOpen and selectedExam state
  const [allExams, setAllExams] = useState([]);
  const [todayExams, setTodayExams] = useState([]);
  const [displayExams, setDisplayExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const [statistics, setStatistics] = useState({
    totalToday: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    upcoming: 0,
    averageTime: '0m',
    operationalSystems: 3
  });

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString();

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

  const formatExamId = (id, createdAt) => {
    const year = new Date(createdAt || new Date()).getFullYear();
    const paddedId = String(id).padStart(3, '0');
    return `XR-${year}-${paddedId}`;
  };

  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Complete',
      'cancelled': 'Cancelled'
    };
    return statusMap[status?.toLowerCase()] || status || 'Scheduled';
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const examDate = new Date(dateString);
    const today = new Date();
    return examDate.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const examDate = new Date(dateString);
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return examDate > now && examDate <= in24Hours;
  };

  const fetchPatientById = async (patientId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/patients/${patientId}`);
      if (!response.ok) throw new Error(`Failed to fetch patient ${patientId}`);
      const patientData = await response.json();
      return {
        id: patientData.id,
        name: `${patientData.last_name}, ${patientData.first_name}`,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        fullData: patientData
      };
    } catch (error) {
      console.error(`Error fetching patient ${patientId}:`, error);
      return { id: patientId, name: 'Unknown Patient', fullData: null };
    }
  };

  const fetchPatientsForExams = async (exams) => {
    const patientIds = [...new Set(exams.map(exam => exam.patient_id).filter(Boolean))];
    if (patientIds.length === 0) return {};
    const patientPromises = patientIds.map(id => fetchPatientById(id));
    const patients = await Promise.allSettled(patientPromises);
    const patientMap = {};
    patients.forEach((result, index) => {
      patientMap[patientIds[index]] = result.status === 'fulfilled' ? result.value : { id: patientIds[index], name: 'Unknown Patient', fullData: null };
    });
    return patientMap;
  };

  const calculateStatistics = (exams) => {
    const stats = { totalToday: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, upcoming: 0, averageTime: '12m', operationalSystems: 3 };
    exams.forEach(exam => {
      const examDateField = exam.scheduled_time || exam.exam_date || exam.created_at;
      if (isToday(examDateField)) stats.totalToday++;
      const status = exam.status?.toLowerCase() || 'pending';
      switch (status) {
        case 'pending':
          stats.pending++;
          if (isUpcoming(examDateField)) stats.upcoming++;
          break;
        case 'in_progress': stats.inProgress++; break;
        case 'completed': stats.completed++; break;
        case 'cancelled': stats.cancelled++; break;
        default: stats.pending++;
      }
    });
    return stats;
  };

  const formatExamForDisplay = (exam, patientMap = {}) => {
    const patient = patientMap[exam.patient_id];
    return {
      id: formatExamId(exam.id, exam.created_at),
      patient: patient ? patient.name : (exam.patient_name || 'Unknown Patient'),
      exam: exam.exam_type || 'X-Ray',
      time: formatTime(exam.scheduled_time || exam.exam_time || exam.created_at),
      status: formatStatus(exam.status),
      rawData: exam,
      patientData: patient
    };
  };

  const fetchExams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allExamsResponse = await fetch('http://localhost:8000/api/v1/exams/?limit=100');
      if (!allExamsResponse.ok) throw new Error('Failed to fetch exams');
      const allExamsData = await allExamsResponse.json();
      setAllExams(allExamsData);
      const todayString = new Date().toISOString().split('T')[0];
      const todaysExams = allExamsData.filter(exam => (exam.scheduled_time || exam.exam_date || exam.created_at)?.split('T')[0] === todayString);
      setTodayExams(todaysExams);
      const examsToDisplay = (todaysExams.length > 0 ? todaysExams : allExamsData).slice(0, 4);
      const patientMap = await fetchPatientsForExams(examsToDisplay);
      setDisplayExams(examsToDisplay.map(exam => formatExamForDisplay(exam, patientMap)));
      setStatistics(calculateStatistics(allExamsData));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exam data. Please check the connection.');
      setDisplayExams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    const interval = setInterval(fetchExams, 30000);
    return () => clearInterval(interval);
  }, []);

  // This now calls the prop passed down from main.jsx
  const handleOpenModal = (exam) => {
    onOpenModal(exam);
  };

  const getQuickStats = () => [
    { label: 'Today\'s Exams', value: String(statistics.totalToday), change: statistics.pending > 0 ? `${statistics.pending} pending` : 'All completed', icon: FileImage },
    { label: 'Queue Status', value: String(statistics.pending), change: 'Pending studies', icon: Clock },
    { label: 'Equipment Status', value: `${statistics.operationalSystems}/3`, change: 'All systems operational', icon: Monitor },
    { label: 'Average Time', value: statistics.averageTime, change: 'Per examination', icon: Zap }
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
                  {todayExams.length > 0 ? "Today's Exam Queue" : "Recent Exams"}
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
              
              {isLoading && displayExams.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-3 text-slate-300">Loading exams...</span>
                </div>
              ) : displayExams.length > 0 ? (
                <div className="space-y-4">
                  {displayExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FileImage className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{exam.patient}</p>
                          <p className="text-sm text-slate-300">{exam.exam} • {exam.id}</p>
                          {exam.patientData && exam.patientData.fullData && (
                            <p className="text-xs text-slate-400">
                              DOB: {exam.patientData.fullData.date_of_birth} • 
                              {exam.patientData.fullData.gender ? ` ${exam.patientData.fullData.gender}` : ''}
                            </p>
                          )}
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
                  <p className="text-slate-300">No exams scheduled</p>
                  <button
                    onClick={() => onNavigate('newExam')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule New Exam
                  </button>
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => onNavigate('newExam')}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 font-semibold">
                  Schedule New Exam
                </button>
                {allExams.length > 4 && (
                  <button 
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold border border-white/20">
                    View All ({allExams.length} total)
                  </button>
                )}
              </div>
            </div>
            
            {/* The Modal is no longer rendered here */}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={fetchExams}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </button>
                <button className="w-full flex items-center justify-center px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium"
                  onClick={() => onNavigate('imageUploadTest')}>
                  <Users className="w-4 h-4 mr-2" />
                  Image Test
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">
                  {todayExams.length > 0 ? "Today's Summary" : "Recent Activity"}
                </h3>
              </div>
              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Exams</span>
                  <span className="text-white font-medium">
                    {todayExams.length > 0 ? statistics.totalToday : allExams.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending</span>
                  <span className="text-yellow-300 font-medium">{statistics.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">In Progress</span>
                  <span className="text-blue-300 font-medium">{statistics.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed</span>
                  <span className="text-green-300 font-medium">{statistics.completed}</span>
                </div>
                {statistics.cancelled > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cancelled</span>
                    <span className="text-red-300 font-medium">{statistics.cancelled}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Upcoming (24h)</span>
                    <span className="text-cyan-300 font-medium">{statistics.upcoming}</span>
                  </div>
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
