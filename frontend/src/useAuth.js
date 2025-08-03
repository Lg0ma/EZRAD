import { useState } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (techData) => {
    // Check if we have valid technician data
    if (techData && techData.id && techData.full_name) {
      setIsAuthenticated(true);
      setUser({
        id: techData.id,
        employeeId: techData.id, // Use the tech ID as employee ID
        name: techData.full_name,
        office: techData.office_name,
        phone: techData.phone,
        department: 'Radiology', // Default department
        license: 'RT-' + techData.id.slice(0, 8) // Generate license from ID
      });
      
      // Also store in localStorage as backup
      localStorage.setItem('currentTech', JSON.stringify(techData));
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('currentTech'); // Clean up localStorage
  };

  return { isAuthenticated, user, login, logout };
};