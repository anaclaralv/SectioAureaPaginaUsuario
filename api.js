const API_BASE_URL = (window.location.origin && window.location.origin !== 'null' && !window.location.href.startsWith('file:')) 
    ? window.location.origin + '/SectioAureaPaginaUsuario/api' 
    : 'http://localhost/SectioAureaPaginaUsuario/api';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
        ...options,
        headers,
    };
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    if (response.status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.endsWith('ProjetoIntegrador.html')) {
            window.location.href = 'ProjetoIntegrador.html';
        }
    }
    return response;
}

window.apiFetch = apiFetch;
window.API_BASE_URL = API_BASE_URL;

window.normalizarInteligencia = function(nomeDb) {
    if (!nomeDb || typeof nomeDb !== 'string') return "";
    const mapa = {
        "Linguística": "linguistica",
        "linguistica": "linguistica",
        "Lógico-matemática": "logico",
        "Lógico-Matemática": "logico",
        "lógico-matemática": "logico",
        "lógico-matematica": "logico",
        "logico-matematica": "logico",
        "Musical": "musical",
        "musical": "musical",
        "Cinestésica": "corporal",
        "cinestésica": "corporal",
        "cinestesica": "corporal",
        "Corporal-Cinestésica": "corporal",
        "corporal-cinestésica": "corporal",
        "corporal-cinestesica": "corporal",
        "Espacial": "espacial",
        "espacial": "espacial",
        "Interpessoal": "interpessoal",
        "interpessoal": "interpessoal",
        "Intrapessoal": "intrapessoal",
        "intrapessoal": "intrapessoal"
    };
    return mapa[nomeDb] || mapa[nomeDb.trim()] || nomeDb.toLowerCase().trim();
};

window.normalizarInteligenciaParaBanco = function(slug) {
    const mapa = {
        "linguistica": "Linguística",
        "logico": "Lógico-matemática",
        "musical": "Musical",
        "corporal": "Cinestésica",
        "espacial": "Espacial",
        "interpessoal": "Interpessoal",
        "intrapessoal": "Intrapessoal"
    };
    return mapa[slug] || slug;
};
