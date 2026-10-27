import { useState, useEffect } from "react";
import "./navabarsidebar.css";
import Tarefas from './tarefas';
import Notas from './notas';
import Cornell from './cornell'; // Importação correta
import Mnemonica from "./Mnemonica";
import MapaMental from "./MapaMental";
import Fluxograma from "./Fluxograma";
import Feynman from "./Feynman";
import GruposEstudo from "./GruposEstudo";
import LeituraSavoring from "./LeituraSavoring";
import TestePratico from "./TestePratico";
import VideoEducativo from "./VideoEducativo";
import Podcast from "./Podcast";
import Calendario from "./calendario";
import Relogio from "./relogio";
import Estatisticas from "./estatisticas";
import Cronograma from "./cronograma";
import Revisao from "./Revisao";
import Planos from "./Planos";
import Inicio from "./inicio";
import Metodos from "./Metodos";
import Swal from 'sweetalert2';
import { apiFetch } from '../api';

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
  // Planos agora integrado exclusivamente nas Configurações do Usuário
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

        <div className="navbar-right" onClick={() => onAbrirConfig('menu')} title="Abrir Configurações">
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
  const planoNormalizado = (planoAtual || 'gratuito').toLowerCase().trim();
  const bloqueios = {
    gratuito: ['estatistica', 'cronogramaNovo'],
    basico: [],
    pro: []
  };
  const bloqueadas = bloqueios[planoNormalizado] || [];

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
                      if (item.id === 'revisao') {
                        localStorage.setItem('revisaoTipoAtivo', 'baralhos');
                        window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'revisao' }));
                      }
                      onNavegar(item.id);
                      onFechar();
                    }}
                  >
                    <i className={`bi ${item.icon} nav-icon`}></i>
                    <span>{item.label}</span>
                    {isBloqueado && (
                      <span className="badge-sidebar-lock" title="Disponível nos planos Básico e Pro">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                    )}
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

// ===================== MODAL DE CONFIGURAÇÃO COMPLETO ESTILO MOBILE =====================
function ModalConfiguracao({ usuario, planoAtual, tipoInteligencia, corPrimaria, abaInicial = 'menu', onSalvar, onFechar }) {
  const [abaAtiva, setAbaAtiva] = useState(abaInicial);
  const [nome, setNome] = useState(usuario.nome || "");
  const [email, setEmail] = useState(usuario.email || "");
  const [fotoPreview, setFotoPreview] = useState(usuario.foto || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
  const [novaFoto, setNovaFoto] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains('dark') || localStorage.getItem('tema') === 'dark' || localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      document.body.classList.add('modo-escuro');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.remove('modo-escuro');
    }
  }, [isDark]);

  const toggleModoEscuro = () => {
    const proximo = !isDark;
    setIsDark(proximo);
    localStorage.setItem('tema', proximo ? 'dark' : 'light');
    localStorage.setItem('theme', proximo ? 'dark' : 'light');
  };

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

  const handleSair = () => {
    Swal.fire({
      title: 'Sair da conta?',
      text: "Você será desconectado e redirecionado para a tela inicial.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9f042c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'http://localhost/SectioAureaPaginaUsuario/ProjetoIntegrador.html';
      }
    });
  };

  const escolherPlano = (tipo) => {
    const tipoNorm = (tipo || 'gratuito').toLowerCase().trim();
    const planoAtualNorm = (planoAtual || 'gratuito').toLowerCase().trim();

    if (tipoNorm === planoAtualNorm) {
      Swal.fire({
        icon: 'info',
        title: 'Você já está neste plano!',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    const nomeFormatado = tipoNorm.charAt(0).toUpperCase() + tipoNorm.slice(1);

    Swal.fire({
      title: 'Confirmar mudança',
      html: `Deseja mudar para o plano <strong>${nomeFormatado}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, mudar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9f042c'
    }).then(async (result) => {
      if (result.isConfirmed) {
        localStorage.setItem('planoUsuario', tipoNorm);
        sessionStorage.setItem('planoUsuario', tipoNorm);
        window.dispatchEvent(new CustomEvent('planoAtualizado', { detail: { plano: tipoNorm } }));

        try {
          await apiFetch('perfil', {
            method: 'PUT',
            body: JSON.stringify({ plano: nomeFormatado })
          });
        } catch (e) {
          console.warn("Aviso ao salvar plano na API:", e);
        }

        Swal.fire({
          icon: 'success',
          title: 'Plano atualizado!',
          text: `Agora você está no plano ${nomeFormatado}.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const planoAtivo = (planoAtual || 'gratuito').toLowerCase().trim();
  const nomePlanoCapitalizado = planoAtivo.charAt(0).toUpperCase() + planoAtivo.slice(1);
  const inteligenciaNome = (tipoInteligencia || localStorage.getItem('inteligenciaUsuario') || 'Personalizada').toUpperCase();

  return (
    <div className="modal-config-backdrop" onClick={onFechar}>
      <div className="modal-config-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-config-card">

          {/* CABEÇALHO DO MODAL */}
          <div className="modal-config-header">
            {abaAtiva !== 'menu' ? (
              <button className="btn-voltar-modal" onClick={() => setAbaAtiva('menu')} title="Voltar">
                <i className="bi bi-arrow-left"></i> Voltar
              </button>
            ) : (
              <h4 className="modal-config-title">Configurações</h4>
            )}
            <button type="button" className="btn-fechar-modal" onClick={onFechar} aria-label="Fechar">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="modal-config-body">

            {/* ==================== 1. ABA MENU PRINCIPAL ==================== */}
            {abaAtiva === 'menu' && (
              <div className="config-menu-view">
                
                {/* CARD RESUMO DO PERFIL */}
                <div className="config-profile-card">
                  <img
                    src={usuario.foto || fotoPreview}
                    alt="Foto do Usuário"
                    className="config-avatar-img"
                  />
                  <div className="config-profile-info">
                    <h5 className="config-profile-name">{usuario.nome || "Usuário"}</h5>
                    <span className="config-profile-email">{usuario.email || "usuario@email.com"}</span>
                    <div className="config-badges-wrapper">
                      <span className="badge-inteligencia-tag" style={{ backgroundColor: corPrimaria || '#6c757d' }}>
                        <i className="bi bi-mortarboard-fill me-1"></i> {inteligenciaNome}
                      </span>
                      <span className={`badge-plano-tag badge-plano-${planoAtivo}`}>
                        <i className="bi bi-gem me-1"></i> {nomePlanoCapitalizado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LINHA TOGGLE MODO ESCURO (IDÊNTICA À FOTO DE REFERÊNCIA) */}
                <div className="config-toggle-row" onClick={toggleModoEscuro}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="config-icon-circle">
                      <i className={`bi ${isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
                    </div>
                    <div>
                      <span className="config-row-title">Modo Escuro</span>
                      <div className="config-row-sub">Alterne entre visual claro e escuro</div>
                    </div>
                  </div>
                  <div className={`custom-switch-track ${isDark ? 'active' : ''}`}>
                    <div className="custom-switch-thumb"></div>
                  </div>
                </div>

                {/* LISTA DE OPÇÕES EM CARDS ARREDONDADOS COM SETA */}
                <div className="config-buttons-list">
                  
                  {/* PLANOS DE ASSINATURA */}
                  <div className="config-item-card" onClick={() => setAbaAtiva('planos')}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-planos">
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <div>
                        <div className="config-item-title">Planos de Assinatura</div>
                        <div className="config-item-sub">Veja seus benefícios e altere seu plano</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge-status-plano plano-${planoAtivo}`}>{nomePlanoCapitalizado}</span>
                      <i className="bi bi-chevron-right config-item-arrow"></i>
                    </div>
                  </div>

                  {/* EDITAR PERFIL */}
                  <div className="config-item-card" onClick={() => setAbaAtiva('perfil')}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-perfil">
                        <i className="bi bi-pencil-square"></i>
                      </div>
                      <div>
                        <div className="config-item-title">Editar Perfil</div>
                        <div className="config-item-sub">Altere seu nome, e-mail e foto</div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right config-item-arrow"></i>
                  </div>

                  {/* MÉTODOS DE ESTUDO */}
                  <div className="config-item-card" onClick={() => setAbaAtiva('metodos')}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-metodos">
                        <i className="bi bi-lightbulb-fill"></i>
                      </div>
                      <div>
                        <div className="config-item-title">Métodos de Estudo</div>
                        <div className="config-item-sub">Explicação básica das técnicas disponíveis</div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right config-item-arrow"></i>
                  </div>

                  {/* SOBRE O PROJETO */}
                  <div className="config-item-card" onClick={() => setAbaAtiva('projeto')}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-projeto">
                        <i className="bi bi-book-half"></i>
                      </div>
                      <div>
                        <div className="config-item-title">Sobre o Projeto</div>
                        <div className="config-item-sub">Teoria de Howard Gardner & Sectio Áurea</div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right config-item-arrow"></i>
                  </div>

                  {/* SOBRE NÓS */}
                  <div className="config-item-card" onClick={() => setAbaAtiva('sobre')}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-sobre">
                        <i className="bi bi-people-fill"></i>
                      </div>
                      <div>
                        <div className="config-item-title">Sobre Nós</div>
                        <div className="config-item-sub">Missão e desenvolvimento da plataforma</div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right config-item-arrow"></i>
                  </div>

                  {/* SAIR DA CONTA */}
                  <div className="config-item-card config-item-sair" onClick={handleSair}>
                    <div className="config-item-left">
                      <div className="config-item-icon icon-sair">
                        <i className="bi bi-box-arrow-right"></i>
                      </div>
                      <div>
                        <div className="config-item-title text-danger">Sair da Conta</div>
                        <div className="config-item-sub">Desconectar e encerrar sessão</div>
                      </div>
                    </div>
                    <span className="btn-sair-pill">Sair</span>
                  </div>

                </div>

                <div className="modal-config-footer">
                  <button type="button" className="btn-ok-config" onClick={onFechar}>
                    OK
                  </button>
                </div>

              </div>
            )}

            {/* ==================== 2. ABA PLANOS DE ASSINATURA ==================== */}
            {abaAtiva === 'planos' && (
              <div className="config-planos-view">
                <h5 className="planos-section-title">Planos de Assinatura</h5>
                <p className="planos-section-desc">Escolha o plano ideal para potencializar seus estudos</p>

                <div className="planos-cards-stack">

                  {/* CARD GRATUITO */}
                  <div className={`card-plano-item ${planoAtivo === 'gratuito' ? 'ativo' : ''}`}>
                    <div className="card-plano-top">
                      <span className="card-plano-tipo">GRATUITO</span>
                      {planoAtivo === 'gratuito' && (
                        <span className="badge-plano-atual-pill">Plano Atual</span>
                      )}
                    </div>
                    <div className="card-plano-preco preco-verde">R$ 0</div>
                    <ul className="card-plano-features">
                      <li><i className="bi bi-check-circle-fill text-success"></i> Funcionalidades da sua inteligência</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Chat com IA (5 por semana)</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Revisão de conteúdos básica</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Pomodoro e anotações</li>
                    </ul>
                    <div className="card-plano-action">
                      <button
                        className={`btn-plano-btn ${planoAtivo === 'gratuito' ? 'btn-plano-selecionado' : 'btn-plano-trocar'}`}
                        disabled={planoAtivo === 'gratuito'}
                        onClick={() => escolherPlano('gratuito')}
                      >
                        {planoAtivo === 'gratuito' ? 'Plano Atual' : 'Mudar para Gratuito'}
                      </button>
                    </div>
                  </div>

                  {/* CARD BÁSICO */}
                  <div className={`card-plano-item ${planoAtivo === 'basico' ? 'ativo' : ''}`}>
                    <div className="card-plano-top">
                      <span className="card-plano-tipo">BÁSICO</span>
                      {planoAtivo === 'basico' && (
                        <span className="badge-plano-atual-pill">Plano Atual</span>
                      )}
                    </div>
                    <div className="card-plano-preco">
                      R$ 19<span className="card-plano-periodo">/mês</span>
                    </div>
                    <ul className="card-plano-features">
                      <li><i className="bi bi-check-circle-fill text-success"></i> Funcionalidades de cada inteligência</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Chat com IA (20 por semana)</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Revisão de conteúdos completa</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Personalização no guia de estudos</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Edição do tempo pomodoro</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Cronograma inteligente</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Estatísticas mensais e semanais</li>
                    </ul>
                    <div className="card-plano-action">
                      <button
                        className={`btn-plano-btn ${planoAtivo === 'basico' ? 'btn-plano-selecionado' : 'btn-plano-trocar'}`}
                        disabled={planoAtivo === 'basico'}
                        onClick={() => escolherPlano('basico')}
                      >
                        {planoAtivo === 'basico' ? 'Plano Atual' : 'Assinar Básico'}
                      </button>
                    </div>
                  </div>

                  {/* CARD PRO */}
                  <div className={`card-plano-item ${planoAtivo === 'pro' ? 'ativo' : ''}`}>
                    <div className="card-plano-top">
                      <span className="card-plano-tipo">PRO</span>
                      {planoAtivo === 'pro' && (
                        <span className="badge-plano-atual-pill">Plano Atual</span>
                      )}
                    </div>
                    <div className="card-plano-preco">
                      R$ 39<span className="card-plano-periodo">/mês</span>
                    </div>
                    <ul className="card-plano-features">
                      <li><i className="bi bi-check-circle-fill text-success"></i> Todas as funcionalidades do Básico</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Chat com IA ilimitado</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Revisão de conteúdos e simulados</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Personalização no guia de estudos</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Edição do tempo pomodoro</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Cronograma Inteligente</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Estatísticas mensais e semanais</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> IA para criação de flashcard</li>
                      <li><i className="bi bi-check-circle-fill text-success"></i> Desenvolvimento de inteligências secundárias</li>
                    </ul>
                    <div className="card-plano-action">
                      <button
                        className={`btn-plano-btn ${planoAtivo === 'pro' ? 'btn-plano-selecionado' : 'btn-plano-trocar'}`}
                        disabled={planoAtivo === 'pro'}
                        onClick={() => escolherPlano('pro')}
                      >
                        {planoAtivo === 'pro' ? 'Plano Atual' : 'Assinar Pro'}
                      </button>
                    </div>
                  </div>

                </div>

                <div className="modal-config-footer d-flex justify-content-between">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setAbaAtiva('menu')}>
                    Voltar
                  </button>
                  <button type="button" className="btn-ok-config" onClick={onFechar}>
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* ==================== 3. ABA EDITAR PERFIL ==================== */}
            {abaAtiva === 'perfil' && (
              <div className="config-perfil-view">
                <div className="text-center mb-4">
                  <div className="perfil-avatar-uploader">
                    <img
                      src={fotoPreview}
                      alt="Foto do Usuário"
                      className="perfil-avatar-preview"
                    />
                    <label htmlFor="inputNovaFoto" className="btn-upload-avatar" title="Alterar Foto">
                      <i className="bi bi-camera-fill"></i>
                    </label>
                    <input
                      id="inputNovaFoto"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFotoChange}
                    />
                  </div>
                  <div className="small text-muted mt-2">Clique na câmera para enviar uma nova foto</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control config-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold small">E-mail</label>
                  <input
                    type="email"
                    className="form-control config-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setAbaAtiva('menu')}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" style={{ backgroundColor: corPrimaria || '#9f042c', border: 'none' }} onClick={handleSalvar}>
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* ==================== 4. ABA MÉTODOS DE ESTUDO ==================== */}
            {abaAtiva === 'metodos' && (
              <div className="config-info-view">
                <h5 className="info-title">Métodos de Estudo no Sectio Áurea</h5>
                <p className="info-intro">
                  Nossa plataforma integra técnicas cientificamente validadas para potencializar a retenção e a clareza do aprendizado:
                </p>

                <div className="metodos-info-grid">
                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-feynman"><i className="bi bi-chat-quote-fill"></i></div>
                    <div className="metodo-info-content">
                      <h6>Técnica Feynman</h6>
                      <p>Ensine e explique o conteúdo com suas próprias palavras de forma simples, como se falasse com uma criança. Isso expõe e corrige lacunas conceituais.</p>
                    </div>
                  </div>

                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-cornell"><i className="bi bi-layout-text-sidebar-reverse"></i></div>
                    <div className="metodo-info-content">
                      <h6>Método Cornell</h6>
                      <p>Organize suas notas em 3 áreas essenciais: anotações da aula, tópicos-chave na margem esquerda e um resumo sintético na base para revisões rápidas.</p>
                    </div>
                  </div>

                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-mapas"><i className="bi bi-diagram-3-fill"></i></div>
                    <div className="metodo-info-content">
                      <h6>Mapas Mentais & Fluxogramas</h6>
                      <p>Estruture ideias de forma radial e visual. Conectar tópicos com cores e ramificações ativa o córtex visual e fortalece a memória espacial.</p>
                    </div>
                  </div>

                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-flashcards"><i className="bi bi-card-text"></i></div>
                    <div className="metodo-info-content">
                      <h6>Flashcards & Repetição Espaçada</h6>
                      <p>Pratique a recordação ativa com perguntas e respostas. As revisões são agendadas em intervalos estratégicos para combater a curva do esquecimento.</p>
                    </div>
                  </div>

                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-pomodoro"><i className="bi bi-clock-history"></i></div>
                    <div className="metodo-info-content">
                      <h6>Relógio Pomodoro</h6>
                      <p>Trabalhe em blocos de foco intenso (25 min) com pausas curtas (5 min). Essa cadência previne a fadiga mental e mantém a produtividade em alta.</p>
                    </div>
                  </div>

                  <div className="metodo-info-card">
                    <div className="metodo-badge-icon icon-savoring"><i className="bi bi-headphones"></i></div>
                    <div className="metodo-info-content">
                      <h6>Leitura Savoring & Gravação (Podcast)</h6>
                      <p>Leitura com degustação reflexiva e produção de gravações em áudio para reforço auditivo e revisão prática durante deslocamentos.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setAbaAtiva('menu')}>
                    Voltar ao Menu
                  </button>
                </div>
              </div>
            )}

            {/* ==================== 5. ABA SOBRE O PROJETO ==================== */}
            {abaAtiva === 'projeto' && (
              <div className="config-info-view">
                <h5 className="info-title">Sobre o Projeto Sectio Áurea</h5>
                
                <div className="projeto-card-destaque mb-3">
                  <div className="projeto-destaque-header">
                    <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                    <strong>A Teoria de Howard Gardner</strong>
                  </div>
                  <p>
                    Em 1983, o renomado psicólogo e pesquisador da Universidade de Harvard, <strong>Howard Gardner</strong>, revolucionou a pedagogia ao publicar a <em>Teoria das Inteligências Múltiplas</em>.
                  </p>
                  <p>
                    Gardner demonstrou que a inteligência humana não é uma capacidade única medida por testes tradicionais de QI, mas sim uma combinação de potenciais biopsicológicos distintos:
                  </p>
                  <ul className="gardner-lista">
                    <li><strong>Linguística:</strong> Facilidade com palavras, redação e leitura.</li>
                    <li><strong>Lógico-Matemática:</strong> Raciocínio dedutivo, cálculo e análise de dados.</li>
                    <li><strong>Espacial:</strong> Orientação gráfica, visualização e diagramas.</li>
                    <li><strong>Musical:</strong> Reconhecimento de padrões rítmicos e melódicos.</li>
                    <li><strong>Corporal-Cinestésica:</strong> Aprendizado através da ação e prática física.</li>
                    <li><strong>Interpessoal:</strong> Sensibilidade social, diálogo e dinâmicas de grupo.</li>
                    <li><strong>Intrapessoal:</strong> Metacognição, foco interior e autodisciplina.</li>
                  </ul>
                </div>

                <div className="projeto-card-destaque">
                  <div className="projeto-destaque-header">
                    <i className="bi bi-compass-fill text-primary me-2"></i>
                    <strong>Por que "Sectio Áurea"?</strong>
                  </div>
                  <p>
                    O termo latino <em>Sectio Aurea</em> (Proporção Áurea) simboliza o equilíbrio harmônico e a perfeição natural.
                  </p>
                  <p className="mb-0">
                    O objetivo da nossa plataforma é aplicar essa harmonia aos seus estudos: adaptar cores, cronogramas e métodos cognitivos especificamente ao seu tipo de inteligência, tornando o ato de aprender eficiente, estimulante e leve.
                  </p>
                </div>

                <div className="mt-4 text-end">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setAbaAtiva('menu')}>
                    Voltar ao Menu
                  </button>
                </div>
              </div>
            )}

            {/* ==================== 6. ABA SOBRE NÓS ==================== */}
            {abaAtiva === 'sobre' && (
              <div className="config-info-view">
                <h5 className="info-title">Sobre Nós & O Projeto Integrador</h5>
                
                <div className="projeto-card-destaque mb-3">
                  <div className="projeto-destaque-header">
                    <i className="bi bi-heart-fill text-danger me-2"></i>
                    <strong>Nossa Missão</strong>
                  </div>
                  <p>
                    O <strong>Sectio Áurea</strong> nasceu como um Projeto Integrador desenvolvido com paixão e rigor acadêmico para atender uma necessidade real de estudantes de todo o país.
                  </p>
                  <p className="mb-0">
                    Acreditamos que <strong>não existem alunos que não sabem estudar</strong> — existem apenas métodos padronizados que desconsideram como o cérebro de cada indivíduo processa o mundo.
                  </p>
                </div>

                <div className="projeto-card-destaque">
                  <div className="projeto-destaque-header">
                    <i className="bi bi-stars text-warning me-2"></i>
                    <strong>Nosso Compromisso</strong>
                  </div>
                  <p className="mb-0">
                    Construir uma ferramenta moderna, acolhedora e acessível, onde tecnologia, psicologia cognitiva e design se encontram para apoiar você em cada conquista acadêmica.
                  </p>
                </div>

                <div className="mt-4 text-end">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setAbaAtiva('menu')}>
                    Voltar ao Menu
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

// ===================== SEÇÃO ATIVA =====================
function SecaoAtiva({ id }) {
  const plano = (localStorage.getItem('planoUsuario') || sessionStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
  const bloqueios = {
    gratuito: ['estatistica', 'cronogramaNovo'],
    basico: [],
    pro: []
  };
  const bloqueadas = bloqueios[plano] || [];

  if (bloqueadas.includes(id)) {
    const nomeRecurso = id === 'estatistica' ? 'Estatísticas de Estudo' : 'Cronograma Inteligente';
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '600px', margin: '40px auto', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '2rem' }}>
          <i className="bi bi-lock-fill"></i>
        </div>
        <h2 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Recurso Premium</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
          O acesso a <strong>{nomeRecurso}</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>. Desbloqueie ferramentas avançadas para potencializar seus estudos!
        </p>
        <button
          className="btn"
          style={{ background: '#9f042c', color: '#fff', fontWeight: 'bold', padding: '12px 24px', borderRadius: '10px' }}
          onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }))}
        >
          <i className="bi bi-star-fill me-2"></i> Conhecer Planos
        </button>
      </div>
    );
  }

  switch (id) {
    case 'inicio': return <Inicio />;
    case 'tarefas': return <Tarefas />;
    case 'notas': return <Notas />;
    case 'cornell': return <Cornell />; // 👈 ADICIONADO AQUI
    case 'mnemonica': return <Mnemonica />; // 👈 NOVO MÓDULO MNEMÔNICA
    case 'mapamental': return <MapaMental />; // 👈 NOVO MÓDULO MAPA MENTAL
    case 'fluxograma': return <Fluxograma />; // 👈 NOVO MÓDULO FLUXOGRAMA
    case 'feynman': return <Feynman />; // 👈 NOVO MÓDULO TÉCNICA FEYNMAN
    case 'grupos': return <GruposEstudo />; // 👈 NOVO MÓDULO GRUPOS DE ESTUDO
    case 'leitura': return <LeituraSavoring />; // 👈 NOVO MÓDULO LEITURA SAVORING
    case 'testePratico': return <TestePratico />; // 👈 NOVO MÓDULO TESTE PRÁTICO & PROVAS PDF
    case 'videoEducativo': return <VideoEducativo />; // 👈 NOVO MÓDULO ESTUDO COM VÍDEOS EDUCATIVOS
    case 'podcast': return <Podcast />; // 👈 NOVO MÓDULO GRAVAÇÃO DE PODCAST
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
  const [planoAtual, setPlanoAtual] = useState(() => {
    return (localStorage.getItem('planoUsuario') || sessionStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
  });
  
  useEffect(() => {
    const plano = (localStorage.getItem('planoUsuario') || sessionStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
    setPlanoAtual(plano);
    
    const handlePlanoAtualizado = (event) => {
      const novoPlano = (event.detail?.plano || 'gratuito').toLowerCase().trim();
      setPlanoAtual(novoPlano);
      localStorage.setItem('planoUsuario', novoPlano);
      sessionStorage.setItem('planoUsuario', novoPlano);
    };
    window.addEventListener('planoAtualizado', handlePlanoAtualizado);
    return () => window.removeEventListener('planoAtualizado', handlePlanoAtualizado);
  }, []);

  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState("inicio");
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  
  const [usuario, setUsuario] = useState(() => {
    const userSalvo = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userSalvo) {
      try {
        const u = JSON.parse(userSalvo);
        return { nome: u.nome || "Usuário", email: u.email || "", foto: u.foto || null };
      } catch (e) {}
    }
    return { nome: "Usuário", email: "usuario@email.com", foto: null };
  });

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const response = await apiFetch('perfil');
        if (response.ok) {
          const data = await response.json();
          const planoDoUsuario = (data.plano || 'gratuito').toLowerCase().trim();

          setUsuario({
            nome: data.nome || "Usuário",
            email: data.email || "",
            foto: data.foto || null
          });
          
          setPlanoAtual(planoDoUsuario);
          localStorage.setItem('planoUsuario', planoDoUsuario);
          sessionStorage.setItem('planoUsuario', planoDoUsuario);

          const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
          const userAtual = JSON.parse(storage.getItem("user") || "{}");
          storage.setItem("user", JSON.stringify({ ...userAtual, ...data, plano: planoDoUsuario }));
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      }
    };
    buscarPerfil();
  }, []);

  const toggleSidebar = () => setSidebarAberta(prev => !prev);
  const fecharSidebar = () => setSidebarAberta(false);
  
  const navegarPara = (tela) => {
    const plano = (localStorage.getItem('planoUsuario') || planoAtual || 'gratuito').toLowerCase().trim();
    const bloqueios = {
      gratuito: ['estatistica', 'cronogramaNovo'],
      basico: [],
      pro: []
    };
    const bloqueadas = bloqueios[plano] || [];

    if (bloqueadas.includes(tela)) {
      const nomeRecurso = tela === 'estatistica' ? 'Estatística' : 'Cronograma';
      Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: `Esta funcionalidade (<strong>${nomeRecurso}</strong>) está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.`,
        confirmButtonText: '<i class="bi bi-star-fill me-1"></i> Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then(result => {
        if (result.isConfirmed) {
          abrirConfig('planos');
        }
      });
      return;
    }

    if (tela === 'planos') {
      abrirConfig('planos');
      return;
    }

    setTelaAtiva(tela);
  };

  const [abaInicialConfig, setAbaInicialConfig] = useState('menu');

  const abrirConfig = (aba = 'menu') => {
    setAbaInicialConfig(aba);
    setModalConfigAberto(true);
  };
  const fecharConfig = () => setModalConfigAberto(false);

  useEffect(() => {
    const handleNavegar = (event) => {
      if (event.detail === 'planos') {
        abrirConfig('planos');
        return;
      }
      navegarPara(event.detail);
    };
    
    window.addEventListener('navegarPara', handleNavegar);
    return () => window.removeEventListener('navegarPara', handleNavegar);
  }, []);

  const salvarConfiguracao = async ({ nome, email, foto }) => {
    try {
      const response = await apiFetch('perfil', {
        method: 'PUT',
        body: JSON.stringify({ nome, email, foto })
      });

      if (response.ok) {
        setUsuario({ nome, email, foto });
        
        const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
        const userAtual = JSON.parse(storage.getItem("user") || "{}");
        storage.setItem("user", JSON.stringify({ ...userAtual, nome, email, foto }));
        
        setModalConfigAberto(false);
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Configurações salvas com sucesso.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível salvar os dados.', 'error');
    }
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
          planoAtual={planoAtual}
          tipoInteligencia={tipoInteligencia}
          corPrimaria={corPrimaria}
          abaInicial={abaInicialConfig}
          onSalvar={salvarConfiguracao}
          onFechar={fecharConfig}
        />
      )}
    </>
  );
}