const API_BASE_URL = 'http://localhost/api_sectio_aurea';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { ...options, headers };
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

  if (response.status === 401) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'http://localhost/SectioAureaPaginaUsuario/ProjetoIntegrador.html';
  }
  return response;
}