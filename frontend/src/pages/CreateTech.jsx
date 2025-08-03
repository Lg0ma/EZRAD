import React, { useState } from 'react';
import { User, Phone, Building, Activity, Shield, UserPlus, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const CreateTech = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    officeName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    // Phone validation (if provided)
    if (formData.phone.trim()) {
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        errors.phone = 'Phone number must have at least 10 digits';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Prepare data for API call
        const techData = {
        full_name: formData.fullName.trim(),
      };
      
      // Only add optional fields if they have values
      if (formData.phone.trim()) {
        techData.phone = formData.phone.trim();
      }
      if (formData.officeName.trim()) {
        techData.office_name = formData.officeName.trim();
      }

      // Make API call to create technician
        const response = await fetch('http://localhost:8000/api/v1/techs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(techData)
      });

      if (response.ok) {
        const newTech = await response.json();
        setSuccess(`Technician "${newTech.full_name}" created successfully!`);
        
        // Clear form
        setFormData({
          fullName: '',
          phone: '',
          officeName: ''
        });
        
        // Auto-navigate back after 2 seconds
        setTimeout(() => {
          onNavigate('login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create technician account');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to login link */}
        <button 
          onClick={() => onNavigate('login')}
          className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Create Technician Account</h2>
            <p className="text-slate-300">RadiTech Staff Registration</p>
          </div>

          <div className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.fullName ? 'border-red-400' : 'border-white/20'
                  }`}
                  placeholder="Enter full name"
                  required
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.fullName}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.phone ? 'border-red-400' : 'border-white/20'
                  }`}
                  placeholder="(555) 123-4567"
                />
              </div>
              {validationErrors.phone && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Office Name Field */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Office/Department
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={formData.officeName}
                  onChange={(e) => handleInputChange('officeName', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Radiology Department"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg p-3 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-400 text-sm text-center bg-green-400/10 border border-green-400/20 rounded-lg p-3 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || success}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Account Created!
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Technician Account
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => onNavigate('login')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Back to Login
              </button>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
            <p className="text-xs text-blue-300 text-center">
              🔒 HIPAA Compliant • Secure Registration System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTech;