import React, { useState } from 'react';
import { User, Lock, Activity, Monitor, FileImage, Calendar, Users, Settings, LogOut, Zap, Shield, Clock, Wifi } from 'lucide-react';
//import '././index.css';

const LandingPage = ({ onNavigate }) => {

  //---------------------------------------------------------------------------------------------------
  const [apiStatus, setApiStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Function to test database by creating a test table
  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setApiStatus(null);
    
    try {
      // Generate a unique test table name
      const timestamp = new Date().getTime();
      const testTableData = {
        table_name: `test_table_${timestamp}`,
        description: `Test table created at ${new Date().toISOString()}`,
        columns: [
          { name: "id", type: "SERIAL PRIMARY KEY" },
          { name: "test_field", type: "VARCHAR(255)" },
          { name: "created_at", type: "TIMESTAMP DEFAULT NOW()" }
        ]
      };

      const response = await fetch('http://localhost:8000/api/v1/database/create-test-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTableData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setApiStatus({ 
          success: true, 
          message: 'Test Table Created Successfully!', 
          data: {
            action: 'Table Created',
            table: result,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        const errorData = await response.json();
        setApiStatus({ 
          success: false, 
          message: `Database Error: ${response.status} - ${errorData.detail || response.statusText}` 
        });
      }
    } catch (error) {
      setApiStatus({ 
        success: false, 
        message: `Connection Failed: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch user count from the database
  const fetchUserCount = async () => {
    setIsLoadingUsers(true);
    setUserCount(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setUserCount(users.length);
        setApiStatus({ 
          success: true, 
          message: `Found ${users.length} users in the database!`,
          data: {
            action: 'Users Retrieved',
            count: users.length,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        const errorData = await response.json();
        setApiStatus({ 
          success: false, 
          message: `Failed to fetch users: ${response.status} - ${errorData.detail || response.statusText}` 
        });
      }
    } catch (error) {
      setApiStatus({ 
        success: false, 
        message: `Connection Failed: ${error.message}` 
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  //---------------------------------------------------------------------------------------------------
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
        {/*-------------------------------------------------------------------------------------------------------------*/}

              <button 
                onClick={testDatabaseConnection}
                disabled={isLoading}
                className="bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wifi className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Creating Table...' : 'Test Database'}</span>
              </button>
              <button 
                onClick={fetchUserCount}
                disabled={isLoadingUsers}
                className="bg-purple-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className={`w-5 h-5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>{isLoadingUsers ? 'Loading...' : 'Get Users'}</span>
              </button>
              <button className="border-2 border-blue-400 text-blue-400 px-6 py-4 rounded-lg text-lg font-semibold hover:bg-blue-400 hover:text-white transform hover:scale-105 transition-all duration-200">
                System Requirements
              </button>
            </div>

        {/*-------------------------------------------------------------------------------------------------------------*/}

            {/* API Status Display */}
            {apiStatus && (
              <div className={`mt-6 p-4 rounded-lg ${
                apiStatus.success 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                  : 'bg-red-500/20 border border-red-500/50 text-red-300'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    apiStatus.success ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="font-semibold">{apiStatus.message}</span>
                </div>
                {apiStatus.success && apiStatus.data && (
                  <div className="mt-3 text-sm text-slate-300">
                    {apiStatus.data.action && <p className="font-medium">Action: {apiStatus.data.action}</p>}
                    {apiStatus.data.count !== undefined && (
                      <div className="mt-2 bg-blue-600/20 p-3 rounded">
                        <p className="font-medium text-blue-200">User Count: {apiStatus.data.count}</p>
                      </div>
                    )}
                    {apiStatus.data.table && (
                      <div className="mt-2 bg-green-600/20 p-3 rounded">
                        <p className="font-medium text-green-200">Created Table:</p>
                        <p>Name: {apiStatus.data.table.table_name || apiStatus.data.table.name}</p>
                        <p>Status: {apiStatus.data.table.status || 'Created'}</p>
                        {apiStatus.data.table.description && <p>Description: {apiStatus.data.table.description}</p>}
                        {apiStatus.data.table.columns && (
                          <div className="mt-2">
                            <p className="font-medium text-green-200">Columns:</p>
                            {apiStatus.data.table.columns.map((col, idx) => (
                              <p key={idx} className="text-xs">• {col.name}: {col.type}</p>
                            ))}
                          </div>
                        )}
                        <p className="text-xs">Created: {apiStatus.data.table.created_at || new Date().toISOString()}</p>
                      </div>
                    )}
                    {apiStatus.data.timestamp && (
                      <p className="text-xs mt-2">Test completed at: {new Date(apiStatus.data.timestamp).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/*-------------------------------------------------------------------------------------------------------------*/}
  
        {/* Medical themed floating elements */}
        <div className="fixed top-20 left-10 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse"></div>
        <div className="fixed top-40 right-20 w-12 h-12 bg-cyan-400/20 rounded-full animate-bounce"></div>
        <div className="fixed bottom-20 left-20 w-10 h-10 bg-blue-400/20 rounded-full animate-ping"></div>
      </div>
    );
  };

export default LandingPage;
  
  