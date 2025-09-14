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
  X,
  Loader
} from 'lucide-react';

// Normalize API error payloads (FastAPI/Validation/Custom)
function formatApiError(data) {
  if (!data) return 'Unknown error';
  if (Array.isArray(data.detail)) {
    return data.detail
      .map(e => {
        const path = Array.isArray(e.loc) ? e.loc.join('.') : (e.loc || 'field');
        return `${path}: ${e.msg}`;
      })
      .join('; ');
  }
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (data.error && typeof data.error === 'string') return data.error;
  try { return JSON.stringify(data); } catch { return 'Unparseable error'; }
}

const NewExamPage = ({ onNavigate, user, logout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
  const [selectedPatientId, setSelectedPatientId] = useState(null);

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

  // Real patient search using your backend API
  const handlePatientSearch = async (searchTerm) => {
    if (searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use your patients search endpoint
      const response = await fetch(`http://localhost:8000/api/v1/patients/search?full_name=${encodeURIComponent(searchTerm)}&limit=10`);
      
      if (response.ok) {
        const patients = await response.json();
        setSearchResults(patients);
      } else {
        console.error('Failed to search patients');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select existing patient and populate form
  const selectExistingPatient = async (patient) => {
    setSelectedPatientId(patient.id);
    
    // Populate form with existing patient data
    setPatientData(prev => ({
      ...prev,
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zip_code || '',
      insuranceProvider: patient.insurance_provider || '',
      policyNumber: patient.policy_number || '',
      groupNumber: patient.group_number || ''
    }));
    
    setSearchResults([]);
    setCurrentStep(2); // Move to exam details step
  };

  const capitalizeGender = (gender) => {
    if (typeof gender === 'string' && gender.length > 0) {
      return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    }
    return gender;
  };
  
  const createPatient = async () => {
    try {
      const patientPayload = {
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        date_of_birth: patientData.dateOfBirth,
        // FIX: This line now capitalizes the gender before sending
        gender: capitalizeGender(patientData.gender),
        phone: patientData.phone,
        email: patientData.email || null,
        address: patientData.address || null,
        city: patientData.city || null,
        state: patientData.state || null,
        zip_code: patientData.zipCode || null,
        insurance_provider: patientData.insuranceProvider || null,
        policy_number: patientData.policyNumber || null,
        group_number: patientData.groupNumber || null,
        created_by: user?.id || null
      };

      const response = await fetch('http://localhost:8000/api/v1/patients/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientPayload)
      });

      if (!response.ok) {
        let errorData = null;
        try { errorData = await response.json(); } catch {}
        const msg = formatApiError(errorData) || `${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const newPatient = await response.json();
      return newPatient.id;
      
    } catch (error) {
      throw new Error(`Failed to create patient: ${error.message || error}`);
    }
  };
    
  // Create exam using your backend API
  const createExam = async (patientId) => {
    try {
      // Combine exam date and time for scheduled_time
      let scheduledTime = null;
      if (patientData.examDate && patientData.examTime) {
        scheduledTime = `${patientData.examDate}T${patientData.examTime}:00`;
      }

      const examPayload = {
        // Patient linkage
        patient_name: `${patientData.firstName} ${patientData.lastName}`,
        patient_id: patientId,

        // Core exam info
        exam_type: patientData.examType,
        body_part: patientData.bodyPart,
        priority: patientData.priority,

        // Clinical text
        description: patientData.clinicalHistory || `${patientData.examType} examination`,

        // Scheduling — send both split fields (required by backend) and combined for compatibility
        exam_date: patientData.examDate,           // e.g., "2025-09-14"
        exam_time: patientData.examTime,           // e.g., "14:30"
        scheduled_time: scheduledTime,             // keep if backend still supports it

        // Personnel
        technician_id: user?.id || user?.techId || null,
        doctor_id: null,                           // until you wire UUIDs
        ordering_physician_name: patientData.orderingPhysician || null,
        created_by: user?.id || user?.techId || null,

        // Notes
        notes: [
          patientData.specialInstructions,
          patientData.contrast ? 'Contrast required' : null,
          patientData.pregnancy ? 'Possible pregnancy - use precautions' : null,
          patientData.implants ? 'Patient has metal implants/devices' : null
        ].filter(Boolean).join('; ') || null,

        // Optional room/equipment
        room: patientData.room || null,
      };
      
      const response = await fetch('http://localhost:8000/api/v1/exams/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examPayload)
      });

      if (!response.ok) {
        let errorData = null;
        try { errorData = await response.json(); } catch {}
        const msg = formatApiError(errorData) || `${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const newExam = await response.json();
      return newExam;
      
    } catch (error) {
      throw new Error(`Failed to create exam: ${error.message || error}`);
    }
  };

  // Main submit handler
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let patientId = selectedPatientId;
      
      // If no existing patient selected, create new patient
      if (!patientId) {
        patientId = await createPatient();
      }
      
      // Create the exam
      const newExam = await createExam(patientId);
      
      setSuccess(`Exam scheduled successfully! Exam ID: ${newExam.id}`);
      
      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        onNavigate('dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Submit error (raw):', error);
      setError(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Validation for each step
  const canProceedToStep2 = () => {
    return patientData.firstName && 
           patientData.lastName && 
           patientData.dateOfBirth && 
           patientData.gender && 
           patientData.phone;
  };

  const canProceedToStep3 = () => {
    return patientData.examType && 
           patientData.bodyPart && 
           patientData.orderingPhysician && 
           patientData.examDate && 
           patientData.examTime;
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
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handlePatientSearch(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => selectExistingPatient(patient)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-gray-500">DOB: {patient.date_of_birth}</p>
                    <p className="text-sm text-gray-500">{patient.phone}</p>
                    {patient.email && <p className="text-sm text-gray-500">{patient.email}</p>}
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    ID: {patient.id.substring(0, 8)}...
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={patientData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              value={patientData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              value={patientData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={patientData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Optional Insurance Section */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Insurance Information (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
              <input
                type="text"
                value={patientData.insuranceProvider}
                onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Blue Cross Blue Shield"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
              <input
                type="text"
                value={patientData.policyNumber}
                onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
              <input
                type="text"
                value={patientData.groupNumber}
                onChange={(e) => handleInputChange('groupNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Time *</label>
          <input
            type="time"
            value={patientData.examTime}
            onChange={(e) => handleInputChange('examTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Room/Equipment</label>
          <select
            value={patientData.room}
            onChange={(e) => handleInputChange('room', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {patientData.email && <p><span className="font-medium">Email:</span> {patientData.email}</p>}
            {selectedPatientId && (
              <p className="text-green-600"><span className="font-medium">Status:</span> Existing Patient</p>
            )}
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
            {patientData.room && <p><span className="font-medium">Room:</span> {patientData.room}</p>}
            <p><span className="font-medium">Technician:</span> {user?.name || 'Current User'}</p>
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

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
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
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100"
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
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100"
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
              disabled={currentStep === 1 || isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => onNavigate('dashboard')}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    isLoading || 
                    (currentStep === 1 && !canProceedToStep2()) || 
                    (currentStep === 2 && !canProceedToStep3())
                  }
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Schedule Exam</span>
                    </>
                  )}
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