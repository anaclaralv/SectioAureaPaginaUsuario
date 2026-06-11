import { useEffect, useState } from 'react';
import NavbarSidebar from './components/navabarsidebar';
import './App.css';

function App() {
  const [corPrimaria, setCorPrimaria] = useState('#6c757d');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipoURL = params.get('tipo');
    const corURL = params.get('cor');

    if (corURL) {
      // Salva no localStorage para uso futuro
      localStorage.setItem('inteligenciaUsuario', tipoURL);
      localStorage.setItem('corPrimaria', corURL);
      
      // Aplica a cor
      setCorPrimaria(corURL);
      document.documentElement.style.setProperty('--cor-primaria', corURL);
      
      // Limpa a URL sem recarregar
      window.history.replaceState({}, '', '/');
    }
  }, []);

  return (
    <div className="App">
      <NavbarSidebar corPrimaria={corPrimaria} />
    </div>
  );
}

export default App;