import React, { useState } from 'react';
import { User, Lock, Activity, Monitor, FileImage, Calendar, Users, Settings, LogOut, Zap, Shield, Clock } from 'lucide-react';
import '././index.css';

const LandingPage = ({ onNavigate }) => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-900">
        <nav className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-white text-2xl font-bold">RadiTech</span>
              <p className="text-blue-300 text-sm">X-Ray Management System</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Technician Login</span>
          </button>
        </nav>
  
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-6">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Advanced
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Radiologic
              </span>
              <span className="block text-4xl md:text-5xl text-blue-300">Technology</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Streamline your X-ray workflow with our comprehensive imaging management system designed specifically for radiologic technologists.
            </p>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Monitor className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">Image Management</h3>
                <p className="text-slate-300 text-sm">Efficient DICOM viewing and processing</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Calendar className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">Patient Scheduling</h3>
                <p className="text-slate-300 text-sm">Seamless appointment coordination</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Shield className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">HIPAA Compliant</h3>
                <p className="text-slate-300 text-sm">Secure patient data management</p>
              </div>
            </div>
  
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('login')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Access Workstation</span>
              </button>
              <button className="border-2 border-blue-400 text-blue-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-400 hover:text-white transform hover:scale-105 transition-all duration-200">
                System Requirements
              </button>
            </div>
          </div>
        </div>
  
        {/* Medical themed floating elements */}
        <div className="fixed top-20 left-10 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse"></div>
        <div className="fixed top-40 right-20 w-12 h-12 bg-cyan-400/20 rounded-full animate-bounce"></div>
        <div className="fixed bottom-20 left-20 w-10 h-10 bg-blue-400/20 rounded-full animate-ping"></div>
      </div>
    );
  };

export default LandingPage;
  
  