import { useEffect, useState } from 'react';
import NavbarSidebar from './components/navabarsidebar';

// 👇 O SEGREDO: SALVA O TOKEN DA URL ANTES DO REACT CARREGAR
const params = new URLSearchParams(window.location.search);
const tokenURL = params.get('token');

if (tokenURL && tokenURL !== 'undefined' && tokenURL !== 'null') {
  const tokenAntigo = localStorage.getItem('token');
  if (tokenAntigo !== tokenURL) {
    localStorage.removeItem('user');
    localStorage.removeItem('grupos_estudo_sistema');
    localStorage.removeItem('flashcards_sistema');
    localStorage.removeItem('materias');
    sessionStorage.removeItem('user');
  }
  localStorage.setItem('token', tokenURL);
  sessionStorage.setItem('token', tokenURL);
  window.history.replaceState({}, '', '/'); 
}

function App() {
  const [corPrimaria, setCorPrimaria] = useState('#6c757d');
  const [tipoInteligencia, setTipoInteligencia] = useState(null);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    // 1. Pega as configs visuais
    const tipoURL = params.get('tipo');
    const corURL = params.get('cor');

    if (corURL && tipoURL) {
      localStorage.setItem('inteligenciaUsuario', tipoURL);
      localStorage.setItem('corPrimaria', corURL);
      setCorPrimaria(corURL);
      setTipoInteligencia(tipoURL);
      document.documentElement.style.setProperty('--cor-primaria', corURL);
    } else {
      const corSalva = localStorage.getItem('corPrimaria');
      const tipoSalvo = localStorage.getItem('inteligenciaUsuario');
      if (corSalva) {
        setCorPrimaria(corSalva);
        document.documentElement.style.setProperty('--cor-primaria', corSalva);
      }
      if (tipoSalvo) setTipoInteligencia(tipoSalvo);
    }

    // 2. Verifica o login
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      setLogado(true);
    }
  }, []);

  if (!logado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f8f8', fontFamily: 'sans-serif' }}>
        <h2>Você não está logado.</h2>
        <p>Por favor, faça o login na página inicial.</p>
        <a href="http://localhost/SectioAureaPaginaUsuario/ProjetoIntegrador.html" 
           style={{ marginTop: '20px', padding: '12px 24px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          Ir para o Login
        </a>
      </div>
    );
  }

  return (
    <div className="App">
      <NavbarSidebar corPrimaria={corPrimaria} tipoInteligencia={tipoInteligencia} />
    </div>
  );
}

export default App;
