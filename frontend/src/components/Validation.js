// Input validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateUsername = (username) => {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

export const validatePhone = (tel) => {
  const phoneRegex = /^[0-9]{9,10}$/;
  return phoneRegex.test(tel);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateCoordinates = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  
  return !isNaN(latNum) && !isNaN(lngNum) && 
         latNum >= -90 && latNum <= 90 && 
         lngNum >= -180 && lngNum <= 180;
};
