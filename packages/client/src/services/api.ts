import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
});

export const checkHealth = async () => {
  const url = API_BASE ? `${API_BASE}/health` : '/health';
  const { data } = await axios.get(url);
  return data;
};

export { api };