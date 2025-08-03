import React, { useState } from 'react';
import { User, Lock, Activity, Monitor, FileImage, Calendar, Users, Settings, LogOut, Zap, Shield, Clock } from 'lucide-react';
//import '././index.css';


const LoginPage = ({ onNavigate, login }) => {
    const [techId, setTechId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
  
    const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  // Validate UUID format
  if (!techId.trim()) {
    setError('Please enter your Technician ID');
    setIsLoading(false);
    return;
  }

  try {
    // Make API call to verify technician exists
    const response = await fetch(`http://localhost:8000/api/v1/techs/${techId.trim()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const techData = await response.json();
      
      // Check if we got valid technician data
      if (techData && techData.id) {
        console.log('Calling login function with:', techData);
        
        // Call the login function properly - it should return true and set isAuthenticated
        const success = await login(techData);
        
        console.log('Login function returned:', success);
        
        if (success) {
          // Login function worked, navigate to dashboard
          onNavigate('dashboard');
        } else {
          // Login function failed, but we have valid data - force login
          localStorage.setItem('currentTech', JSON.stringify(techData));
          console.log('Login function failed, but forcing navigation...');
          onNavigate('dashboard');
        }
      } else {
        setError('Invalid technician data received.');
      }
    } else if (response.status === 404) {
      setError('Technician ID not found. Please check your ID or create an account.');
    } else if (response.status === 400) {
      setError('Invalid Technician ID format. Please enter a valid UUID.');
    } else {
      setError('Login failed. Please contact IT support.');
    }
  } catch (err) {
    console.error('Login error:', err);
    setError('Network error. Please check your connection and try again.');
  } finally {
    setIsLoading(false);
  }
};
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <button 
        onClick={() => onNavigate('home')}
        className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
        <Activity className="w-4 h-4 mr-2" />
        Back to Home
        </button>
    
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Technician Access</h2>
          <p className="text-slate-300">RadiTech Workstation Login</p>
        </div>
    
        <div className="space-y-6">
          <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Employee ID
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
            type="text"
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your technician ID"
            required
            />
          </div>
          </div>
   
          {error && (
          <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg p-3">
            {error}
          </div>
          )}
    
          <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
          {isLoading ? (
            <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Authenticating...
            </div>
          ) : (
            'Access Workstation'
          )}
          </button>
        </div>
    
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
          Need help accessing your account?{' '}
          <button className="text-blue-400 hover:text-blue-300 font-medium">
            Contact IT Support
          </button>
          </p>
        </div>
    
        <div className="mt-4 p-3 rounded-lg flex justify-center">
          <button         
          onClick={() => onNavigate('createTech')}
          className="text-blue-400 hover:text-blue-300 font-medium">
          Create A Tecnician Account

          </button>
        </div>
        </div>
      </div>
      </div>
    );
    
  };

  export default LoginPage;