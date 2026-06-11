import { useState } from "react";
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

// ===================== DADOS =====================
const menuItems = [
  { id: "inicio",          icon: "bi-house-fill",       label: "Início" },
  { id: "tarefas",         icon: "bi-check2-square",    label: "Tarefas" },
  { id: "notas",           icon: "bi-journal-bookmark", label: "Notas" },
  { id: "calendario",      icon: "bi-calendar-event",   label: "Calendário" },
  { id: "relogio",         icon: "bi-clock",            label: "Relógio" },
  { id: "estatistica",     icon: "bi-graph-up",         label: "Estatística" },
  { id: "cronogramaNovo",  icon: "bi-diagram-3",        label: "Cronograma" },
  { id: "metodos",         icon: "bi-lightbulb",        label: "Métodos" },
  { id: "revisao",         icon: "bi-arrow-repeat",     label: "Revisão" },
  { id: "planos",          icon: "bi-star-fill",        label: "Planos" },
];

// ===================== NAVBAR =====================
function Navbar({ onToggleSidebar, usuario, corPrimaria }) {
  return (
    <nav className="navbar" style={{ backgroundColor: corPrimaria }}>
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={onToggleSidebar}>
            <i className="bi bi-list"></i>
          </button>
          <a href="#" className="navbar-brand">
            <img
              src="Icones/logoBranca.png"
              alt="logo"
              onError={e => { e.target.style.display = "none"; }}
            />
            <span className="brand-text">Sectio Aurea</span>
          </a>
        </div>

       <div className="navbar-right">
          <img
            src={usuario.foto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
            alt="avatar"
            className="user-avatar"
            style={{ borderColor: corPrimaria }}  // ← Borda do avatar
          />
        </div>
      </div>
    </nav>
  );
}

// ===================== SIDEBAR =====================
function Sidebar({ aberta, telaAtiva, onNavegar, onFechar }) {
  return (
    <>
      {aberta && (
        <div className="sidebar-overlay" onClick={onFechar} />
      )}

      <aside className={`sidebar ${aberta ? 'sidebar-aberta' : 'sidebar-fechada'}`}>
        <div id="menuLateral">
          <ul className="nav-list">
            {menuItems.map(item => (
              <li key={item.id}>
                <a
                  href="#"
                  className={`nav-link ${telaAtiva === item.id ? 'active' : ''}`}
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
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

// ===================== SEÇÃO ATIVA =====================
function SecaoAtiva({ id }) {
  switch (id) {
    case 'inicio':
      return <Inicio/>;
    case 'tarefas':
      return <Tarefas />;
    case 'notas':
      return <Notas />;
    case 'calendario':
      return <Calendario/>;
      
    case 'relogio':
      return <Relogio/>;

    case 'estatistica':
      return <Estatisticas/>;

    case 'cronogramaNovo':
      return <Cronograma/>;

    case 'metodos':
      return (
        <div className="placeholder">
          <i className="bi bi-lightbulb placeholder-icon"></i>
          <h2>Métodos</h2>
          <p>Em breve...</p>
        </div>
      );
    case 'revisao':
      return <Revisao/>;
    case 'planos':
      return <Planos/>;
      
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
export default function NavbarSidebar({ corPrimaria }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState("inicio");
  const [usuario] = useState({
    nome: "Usuário",
    email: "usuario@email.com",
    foto: null,
  });

  const toggleSidebar = () => setSidebarAberta(prev => !prev);
  const fecharSidebar = () => setSidebarAberta(false);
  const navegarPara = (tela) => setTelaAtiva(tela);

 return (
    <>
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        usuario={usuario} 
        corPrimaria={corPrimaria}  // ← Passe para Navbar
      />

      <Sidebar
        aberta={sidebarAberta}
        telaAtiva={telaAtiva}
        onNavegar={navegarPara}
        onFechar={fecharSidebar}
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
    </>
  );
}