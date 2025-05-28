import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      return { ...response.data, role: response.data.role }; // Add role
    } catch (error) {
      throw error.response?.data || "Login failed";
    }
  };

export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Signup failed";
  }
};
