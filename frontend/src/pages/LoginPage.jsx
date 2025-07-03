import React, { useState } from 'react';
import { User, Lock, Activity, Monitor, FileImage, Calendar, Users, Settings, LogOut, Zap, Shield, Clock } from 'lucide-react';
//import '././index.css';


const LoginPage = ({ onNavigate, login }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
  
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
  
      const success = login(employeeId, password);
      if (success) {
        onNavigate('dashboard');
      } else {
        setError('Invalid employee ID or password. Please contact IT support.');
      }
      setIsLoading(false);
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
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your employee ID"
                    required
                  />
                </div>
              </div>
  
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
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
  
            <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
              <p className="text-xs text-blue-300 text-center">
                🔒 HIPAA Compliant • Secure Medical Environment
              </p>
            </div>
          </div>
        </div>
      </div>
    );
    
  };

  export default LoginPage;