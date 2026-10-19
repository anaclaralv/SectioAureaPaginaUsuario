// 👇 APONTANDO PARA A API NOVA
const API_BASE_URL = 'http://localhost/api_sectio_aurea';

async function apiFetch(endpoint, options = {}) {
   // Troque a linha do token por essa:
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Fallback para convidado (mantido por segurança)
    if (token === 'guest_session') {
        if (endpoint === 'perfil') {
            const u = JSON.parse(sessionStorage.getItem('user') || '{}');
            return new Response(JSON.stringify(u), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
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