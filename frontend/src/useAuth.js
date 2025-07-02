import { useState } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (employeeId, password) => {
    if (employeeId && password) {
      setIsAuthenticated(true);
      setUser({ 
        employeeId, 
        name: 'Sarah Johnson, RT(R)', 
        department: 'Radiology',
        license: 'RT-12345'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, user, login, logout };
};