import React, { useState } from 'react';
import { 
  Activity, 
  FileImage, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Search,
  User,
  Phone,

  Clock,
  MapPin,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

const NewExamPage = ({ onNavigate, user, logout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [patientData, setPatientData] = useState({
    // Patient Demographics
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Insurance Information
    insuranceProvider: '',
    policyNumber: '',
    groupNumber: '',
    
    // Exam Details
    examType: '',
    bodyPart: '',
    priority: 'routine',
    orderingPhysician: '',
    clinicalHistory: '',
    examDate: '',
    examTime: '',
    room: '',
    
    // Special Instructions
    specialInstructions: '',
    contrast: false,
    pregnancy: false,
    implants: false
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const handleInputChange = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePatientSearch = async (searchTerm) => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock search results
    const mockResults = [
      {
        id: 'P001',
        firstName: 'John',
        lastName: 'Smith',
        dateOfBirth: '1985-03-15',
        phone: '(555) 123-4567',
        lastExam: '2024-01-15'
      },
      {
        id: 'P002',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1990-07-22',
        phone: '(555) 987-6543',
        lastExam: '2023-12-10'
      }
    ];
    
    setSearchResults(mockResults.filter(patient => 
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    ));
    setIsSearching(false);
  };

  const selectExistingPatient = (patient) => {
    setPatientData(prev => ({
      ...prev,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone
    }));
    setSearchResults([]);
    setCurrentStep(2);
  };

  const examTypes = [
    'Chest X-Ray',
    'Hand X-Ray',
    'Foot X-Ray',
    'Spine X-Ray',
    'Knee X-Ray',
    'Shoulder X-Ray',
    'Hip X-Ray',
    'Abdominal X-Ray',
    'Pelvis X-Ray',
    'Skull X-Ray'
  ];

  const bodyParts = [
    'Chest', 'Hand', 'Foot', 'Spine', 'Knee', 'Shoulder', 
    'Hip', 'Abdomen', 'Pelvis', 'Skull', 'Wrist', 'Ankle'
  ];

  const physicians = [
    'Dr. Johnson, Michael',
    'Dr. Williams, Sarah',
    'Dr. Brown, David',
    'Dr. Davis, Lisa',
    'Dr. Miller, Robert'
  ];

  const rooms = ['X-Ray Room 1', 'X-Ray Room 2', 'Portable Unit'];

  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  const handleSubmit = () => {
    // Here you would normally submit to your backend
    console.log('Exam Data:', patientData);
    alert('New exam scheduled successfully!');
    onNavigate('dashboard');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Patient Search</h3>
        <p className="text-blue-700 text-sm">Search for existing patient or create new patient record</p>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handlePatientSearch(e.target.value)}
          />
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => selectExistingPatient(patient)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                    <p className="text-sm text-gray-500">DOB: {patient.dateOfBirth}</p>
                    <p className="text-sm text-gray-500">{patient.phone}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Last exam: {patient.lastExam}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={patientData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={patientData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              value={patientData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              value={patientData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={patientData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={patientData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Exam Information</h3>
        <p className="text-green-700 text-sm">Configure the examination details and scheduling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
          <select
            value={patientData.examType}
            onChange={(e) => handleInputChange('examType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Exam Type</option>
            {examTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body Part *</label>
          <select
            value={patientData.bodyPart}
            onChange={(e) => handleInputChange('bodyPart', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Body Part</option>
            {bodyParts.map(part => (
              <option key={part} value={part}>{part}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={patientData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordering Physician *</label>
          <select
            value={patientData.orderingPhysician}
            onChange={(e) => handleInputChange('orderingPhysician', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Physician</option>
            {physicians.map(physician => (
              <option key={physician} value={physician}>{physician}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
          <input
            type="date"
            value={patientData.examDate}
            onChange={(e) => handleInputChange('examDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Time *</label>
          <input
            type="time"
            value={patientData.examTime}
            onChange={(e) => handleInputChange('examTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Room/Equipment</label>
          <select
            value={patientData.room}
            onChange={(e) => handleInputChange('room', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Room</option>
            {rooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Clinical History</label>
          <textarea
            value={patientData.clinicalHistory}
            onChange={(e) => handleInputChange('clinicalHistory', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter relevant clinical history..."
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Safety Screening</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={patientData.contrast}
              onChange={(e) => handleInputChange('contrast', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Contrast required</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={patientData.pregnancy}
              onChange={(e) => handleInputChange('pregnancy', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Possible pregnancy</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={patientData.implants}
              onChange={(e) => handleInputChange('implants', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Metal implants/devices</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Review & Confirm</h3>
        <p className="text-purple-700 text-sm">Please review all information before scheduling the exam</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Patient Information
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {patientData.firstName} {patientData.lastName}</p>
            <p><span className="font-medium">DOB:</span> {patientData.dateOfBirth}</p>
            <p><span className="font-medium">Gender:</span> {patientData.gender}</p>
            <p><span className="font-medium">Phone:</span> {patientData.phone}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileImage className="w-5 h-5 mr-2 text-blue-600" />
            Exam Details
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Type:</span> {patientData.examType}</p>
            <p><span className="font-medium">Body Part:</span> {patientData.bodyPart}</p>
            <p><span className="font-medium">Priority:</span> {patientData.priority}</p>
            <p><span className="font-medium">Physician:</span> {patientData.orderingPhysician}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Scheduling
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Date:</span> {patientData.examDate}</p>
            <p><span className="font-medium">Time:</span> {patientData.examTime}</p>
            <p><span className="font-medium">Room:</span> {patientData.room}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            Safety Screening
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Contrast:</span> {patientData.contrast ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Pregnancy:</span> {patientData.pregnancy ? 'Possible' : 'No'}</p>
            <p><span className="font-medium">Implants:</span> {patientData.implants ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {patientData.clinicalHistory && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Clinical History</h4>
          <p className="text-sm text-gray-700">{patientData.clinicalHistory}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300 mx-2"></div>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-gray-900 text-xl font-bold">RadiTech</span>
                <span className="text-gray-500 text-sm ml-2">New Exam</span>
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
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Patient Info' : step === 2 ? 'Exam Details' : 'Review'}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-px ml-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Next</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Schedule Exam</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewExamPage;