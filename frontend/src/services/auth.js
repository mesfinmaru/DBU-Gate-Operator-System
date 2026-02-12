import jwtDecode from 'jwt-decode';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Store token and user data
export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  
  // Decode and store user info
  const decoded = jwtDecode(token);
  localStorage.setItem(USER_KEY, JSON.stringify(decoded));
};

// Get current token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    logout();
    return false;
  }
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

// Logout user
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Get username
export const getUsername = () => {
  const user = getCurrentUser();
  return user ? user.username : 'Guest';
};