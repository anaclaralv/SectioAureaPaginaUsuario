import { useState, useEffect } from "react";
import "./navabarsidebar.css";
import Tarefas from './tarefas';
import Notas from './notas';
import Calendario from "./calendario";
import Relogio from "./relogio";
import Estatisticas from "./estatisticas";
import Cronograma from "./cronograma";
import Revisao from "./Revisao";
import Planos from "./Planos";
import Inicio from "./inicio";
import Metodos from "./Metodos";
import Swal from 'sweetalert2';

// ===================== ÍCONES DAS INTELIGÊNCIAS =====================
const iconesInteligencia = {
  linguistica: "Icones/linguistica.png",
  logico: "Icones/logico.png",
  musical: "Icones/musical.png",
  corporal: "Icones/corporal.png",
  espacial: "Icones/espacial.png",
  interpessoal: "Icones/interpessoal.png",
  intrapessoal: "Icones/intrapessoal.png"
};

// ===================== DADOS =====================
const menuItems = [
  { id: "inicio", icon: "bi-house-fill", label: "Início" },
  { id: "tarefas", icon: "bi-check2-square", label: "Tarefas" },
  { id: "notas", icon: "bi-journal-bookmark", label: "Notas" },
  { id: "calendario", icon: "bi-calendar-event", label: "Calendário" },
  { id: "relogio", icon: "bi-clock", label: "Relógio" },
  { id: "estatistica", icon: "bi-graph-up", label: "Estatística" },
  { id: "cronogramaNovo", icon: "bi-diagram-3", label: "Cronograma" },
  { id: "metodos", icon: "bi-lightbulb", label: "Métodos" },
  { id: "revisao", icon: "bi-arrow-repeat", label: "Revisão" },
  { id: "planos", icon: "bi-star-fill", label: "Planos" },
];

// ===================== NAVBAR =====================
function Navbar({ onToggleSidebar, usuario, corPrimaria, tipoInteligencia, onAbrirConfig }) {
  const logoSrc = tipoInteligencia
    ? iconesInteligencia[tipoInteligencia]
    : "Icones/logoBranca.png";

  return (
    <nav className="navbar" style={{ backgroundColor: corPrimaria }}>
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={onToggleSidebar}>
            <i className="bi bi-list"></i>
          </button>
          <a href="#" className="navbar-brand">
            <img
              src={logoSrc}
              alt="logo"
              style={{ width: 45, height: 45, objectFit: 'contain' }}
            />
            <span className="brand-text">Sectio Aurea</span>
          </a>
        </div>

        <div className="navbar-right" onClick={onAbrirConfig}>
          <img
            src={usuario.foto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
            alt="avatar"
            className="user-avatar"
            style={{ borderColor: 'white' }}
          />
          <div className="user-text">
            <span className="user-name">{usuario.nome || "Usuário"}</span>
            <span className="user-email">{usuario.email || "usuario@email.com"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ===================== SIDEBAR =====================
function Sidebar({ aberta, telaAtiva, onNavegar, onFechar, planoAtual }) {
  const bloqueios = {
    gratuito: ['estatistica', 'cronogramaNovo'],
    basico: [],
    pro: []
  };
  const bloqueadas = bloqueios[planoAtual] || [];

  return (
    <>
      {aberta && <div className="sidebar-overlay" onClick={onFechar} />}
      <aside className={`sidebar ${aberta ? 'sidebar-aberta' : 'sidebar-fechada'}`}>
        <div id="menuLateral">
          <ul className="nav-list">
            {menuItems.map(item => {
              const isAtivo = telaAtiva === item.id;
              const isBloqueado = bloqueadas.includes(item.id);
              
              return (
                <li key={item.id}>
                  <a
                    href="#"
                    className={`nav-link ${isAtivo ? 'active' : ''} ${isBloqueado ? 'bloqueado' : ''}`}
                    onClick={e => {
                      e.preventDefault();
                      onNavegar(item.id);
                      onFechar();
                    }}
                  >
                    <i className={`bi ${item.icon} nav-icon`}></i>
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}

// ===================== MODAL DE CONFIGURAÇÃO =====================
function ModalConfiguracao({ usuario, onSalvar, onFechar }) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [fotoPreview, setFotoPreview] = useState(usuario.foto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
  const [novaFoto, setNovaFoto] = useState(null);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNovaFoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setFotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = () => {
    if (novaFoto) {
      const reader = new FileReader();
      reader.onload = (e) => {
        localStorage.setItem("userFoto", e.target.result);
        onSalvar({ nome, email, foto: e.target.result });
      };
      reader.readAsDataURL(novaFoto);
    } else {
      onSalvar({ nome, email, foto: usuario.foto });
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Configurações do Usuário</h5>
            <button type="button" className="btn-close" onClick={onFechar}></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-4">
              <div className="foto-usuario-container">
                <img
                  src={fotoPreview}
                  alt="Foto do Usuário"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid black'
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mt-2"
                  onChange={handleFotoChange}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Nome</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={handleSalvar}>Salvar Alterações</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== SEÇÃO ATIVA =====================
function SecaoAtiva({ id }) {
  switch (id) {
    case 'inicio': return <Inicio />;
    case 'tarefas': return <Tarefas />;
    case 'notas': return <Notas />;
    case 'calendario': return <Calendario />;
    case 'relogio': return <Relogio />;
    case 'estatistica': return <Estatisticas />;
    case 'cronogramaNovo': return <Cronograma />;
    case 'metodos': return <Metodos />;
    case 'revisao': return <Revisao />;
    case 'planos': return <Planos />;
    default:
      return (
        <div className="placeholder">
          <i className="bi bi-question-circle placeholder-icon"></i>
          <h2>Em breve</h2>
          <p>Esta seção está em desenvolvimento...</p>
        </div>
      );
  }
}

// ===================== COMPONENTE PRINCIPAL =====================
export default function NavbarSidebar({ corPrimaria, tipoInteligencia }) {
  const [planoAtual, setPlanoAtual] = useState('gratuito');
  
  // Carregar plano
  useEffect(() => {
    const plano = localStorage.getItem('planoUsuario') || 'gratuito';
    setPlanoAtual(plano);
    
    // Escutar mudanças de plano
    const handlePlanoAtualizado = (event) => {
      setPlanoAtual(event.detail.plano);
    };
    window.addEventListener('planoAtualizado', handlePlanoAtualizado);
    return () => window.removeEventListener('planoAtualizado', handlePlanoAtualizado);
  }, []);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState("inicio");
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [usuario, setUsuario] = useState({
    nome: localStorage.getItem("userName") || "Usuário",
    email: localStorage.getItem("userEmail") || "usuario@email.com",
    foto: localStorage.getItem("userFoto") || null,
  });

  const toggleSidebar = () => setSidebarAberta(prev => !prev);
  const fecharSidebar = () => setSidebarAberta(false);
 const navegarPara = (tela) => {
  const bloqueios = {
    gratuito: ['estatistica', 'cronogramaNovo'],
    basico: [],
    pro: []
  };
  const plano = localStorage.getItem('planoUsuario') || 'gratuito';
  const bloqueadas = bloqueios[plano] || [];

  if (bloqueadas.includes(tela)) {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: 'Esta funcionalidade está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        setTelaAtiva('planos');
      }
    });
    return; // NÃO deixa entrar na seção
  }

  setTelaAtiva(tela);
};
  const abrirConfig = () => setModalConfigAberto(true);
  const fecharConfig = () => setModalConfigAberto(false);

  // Escutar evento de navegação dos métodos
  useEffect(() => {
    const handleNavegar = (event) => {
      navegarPara(event.detail);
    };
    
    window.addEventListener('navegarPara', handleNavegar);
    return () => window.removeEventListener('navegarPara', handleNavegar);
  }, []);

  const salvarConfiguracao = ({ nome, email, foto }) => {
    setUsuario({ nome, email, foto });
    localStorage.setItem("userName", nome);
    localStorage.setItem("userEmail", email);
    setModalConfigAberto(false);

    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: 'Configurações salvas com sucesso.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <>
      <Navbar
        onToggleSidebar={toggleSidebar}
        usuario={usuario}
        corPrimaria={corPrimaria}
        tipoInteligencia={tipoInteligencia}
        onAbrirConfig={abrirConfig}
      />

      <Sidebar
  aberta={sidebarAberta}
  telaAtiva={telaAtiva}
  onNavegar={navegarPara}
  onFechar={fecharSidebar}
  planoAtual={planoAtual}
/>

      <main className={`app-main ${!sidebarAberta ? 'sidebar-fechada' : ''}`}>
        <div className="layout-container">
          <div className="linha-inferior">
            <div className="card-pequeno">
              <SecaoAtiva id={telaAtiva} />
            </div>
          </div>
        </div>
      </main>

      {modalConfigAberto && (
        <ModalConfiguracao
          usuario={usuario}
          onSalvar={salvarConfiguracao}
          onFechar={fecharConfig}
        />
      )}
    </>
  );
}