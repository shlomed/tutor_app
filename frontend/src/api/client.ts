import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('access_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Only redirect on expired session, not on login failure
      if (hadToken) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
