import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './Planos.css';

export default function Planos() {
  const [planoAtual, setPlanoAtual] = useState('gratuito');
  const [permissoes, setPermissoes] = useState({
    pomodoroPersonalizado: false,
    focoPersonalizado: false,
    metaEstudo: false,
    estatisticas: false,
    cronograma: false
  });

  // Permissões por plano
  const permissoesPorPlano = {
    gratuito: {
      pomodoroPersonalizado: false,
      focoPersonalizado: false,
      metaEstudo: false,
      estatisticas: false,
      cronograma: false
    },
    basico: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    },
    pro: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    }
  };

  // Carregar plano do localStorage
  useEffect(() => {
    const planoSalvo = localStorage.getItem('planoUsuario') || 'gratuito';
    setPlanoAtual(planoSalvo);
    setPermissoes(permissoesPorPlano[planoSalvo]);
    
    // Atualizar badge e botoes
    atualizarBadgePlano(planoSalvo);
    
    // Disparar evento para atualizar menu
    window.dispatchEvent(new CustomEvent('planoAtualizado', { detail: { plano: planoSalvo, permissoes: permissoesPorPlano[planoSalvo] } }));
  }, []);

  // Atualizar badge
  const atualizarBadgePlano = (plano) => {
    const badge = document.getElementById('badgePlano');
    if (badge) {
      const nomePlano = plano.charAt(0).toUpperCase() + plano.slice(1);
      badge.textContent = `Seu plano: ${nomePlano}`;
      
      let cor;
      if (plano === 'pro') cor = '#981515';
      else if (plano === 'basico') cor = '#f59e0b';
      else cor = '#22c55e';
      
      badge.style.background = cor;
      badge.style.color = 'white';
    }
  };

  // Escolher plano
  const escolherPlano = (tipo) => {
    if (tipo === planoAtual) {
      Swal.fire({
        icon: 'info',
        title: 'Você já está neste plano!',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    Swal.fire({
      title: 'Confirmar mudança',
      html: `Deseja mudar para o plano <strong>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, mudar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9f042c'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.setItem('planoUsuario', tipo);
        setPlanoAtual(tipo);
        setPermissoes(permissoesPorPlano[tipo]);
        atualizarBadgePlano(tipo);
        
        // Disparar evento para atualizar menu
        window.dispatchEvent(new CustomEvent('planoAtualizado', { detail: { plano: tipo, permissoes: permissoesPorPlano[tipo] } }));
        
        Swal.fire({
          icon: 'success',
          title: 'Plano atualizado!',
          text: `Agora você está no plano ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  // Obter cor do botão baseado no plano
  const getButtonStyle = (plano) => {
    const isAtual = plano === planoAtual;
    const isDestaque = plano === 'basico';
    
    if (isAtual) {
      return {
        text: 'Plano atual',
        className: 'btn-atual',
        disabled: true,
        style: { opacity: 0.6, cursor: 'not-allowed' }
      };
    }
    
    return {
      text: plano === 'gratuito' ? 'Mudar para Gratuito' : `Assinar ${plano.charAt(0).toUpperCase() + plano.slice(1)}`,
      className: isDestaque ? 'btn-destaque' : 'btn-dark',
      disabled: false,
      style: {}
    };
  };

  return (
    <section id="planosSection">
      <h1>Planos</h1>

      <div id="planoAtualBadge" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span id="badgePlano" style={{ padding: '8px 20px', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem', background: '#22c55e', color: 'white' }}>
          Seu plano: {planoAtual.charAt(0).toUpperCase() + planoAtual.slice(1)}
        </span>
      </div>

      <div className="row g-4 justify-content-center" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* GRATUITO */}
        <div className="col-md-4">
          <div className="card card-planos text-center">
            <h3>Gratuito</h3>
            <h2 className="preco">R$0</h2>
            <ul className="lista-planos">
              <li>Funcionalidades de cada inteligência</li>
              <li>Chat com IA (5 por semana)</li>
              <li>Revisão de conteúdos</li>
            </ul>
            <button
              className={`btn w-100 ${getButtonStyle('gratuito').className}`}
              onClick={() => escolherPlano('gratuito')}
              disabled={getButtonStyle('gratuito').disabled}
              style={getButtonStyle('gratuito').style}
            >
              {getButtonStyle('gratuito').text}
            </button>
          </div>
        </div>

        {/* BÁSICO */}
        <div className="col-md-4">
          <div className="card card-planos destaque text-center">
            <span className="badge-destaque">MAIS POPULAR</span>
            <h3>Básico</h3>
            <h2 className="preco">R$19<span className="periodo">/mês</span></h2>
            <ul className="lista-planos">
              <li>Funcionalidades de cada inteligência</li>
              <li>Chat com IA (20 por semana)</li>
              <li>Revisão de conteúdos</li>
              <li>Personalização no guia de estudos</li>
              <li>Edição do tempo pomodoro</li>
              <li>Cronograma inteligente</li>
              <li>Estatísticas mensais e semanais</li>
            </ul>
            <button
              className={`btn w-100 ${getButtonStyle('basico').className}`}
              onClick={() => escolherPlano('basico')}
              disabled={getButtonStyle('basico').disabled}
              style={getButtonStyle('basico').style}
            >
              {getButtonStyle('basico').text}
            </button>
          </div>
        </div>

        {/* PRO */}
        <div className="col-md-4">
          <div className="card card-planos text-center">
            <h3>Pro</h3>
            <h2 className="preco">R$39<span className="periodo">/mês</span></h2>
            <ul className="lista-planos">
              <li>Funcionalidades de cada inteligência</li>
              <li>Chat com IA ilimitado</li>
              <li>Revisão de conteúdos</li>
              <li>Personalização no guia de estudos</li>
              <li>Edição do tempo pomodoro</li>
              <li>Cronograma inteligente</li>
              <li>Estatísticas mensais e semanais</li>
              <li>IA para criação de flashcard</li>
              <li>Desenvolvimento de inteligências secundárias</li>
            </ul>
            <button
              className={`btn w-100 ${getButtonStyle('pro').className}`}
              onClick={() => escolherPlano('pro')}
              disabled={getButtonStyle('pro').disabled}
              style={getButtonStyle('pro').style}
            >
              {getButtonStyle('pro').text}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

// Função global para verificar acesso (para ser usada em outros componentes)
export const verificarAcesso = (funcionalidade) => {
  const planoSalvo = localStorage.getItem('planoUsuario') || 'gratuito';
  
  const permissoesPorPlano = {
    gratuito: {
      pomodoroPersonalizado: false,
      focoPersonalizado: false,
      metaEstudo: false,
      estatisticas: false,
      cronograma: false
    },
    basico: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    },
    pro: {
      pomodoroPersonalizado: true,
      focoPersonalizado: true,
      metaEstudo: true,
      estatisticas: true,
      cronograma: true
    }
  };
  
  const plano = planoSalvo;
  const permissoes = permissoesPorPlano[plano] || permissoesPorPlano.gratuito;
  
  if (!permissoes[funcionalidade]) {
    Swal.fire({
      icon: 'info',
      title: 'Recurso Premium',
      html: `
        <p>Esta funcionalidade está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.</p>
        <p style="font-size: 0.8rem; color: #6b7280;">Seu plano atual: <strong>${plano.charAt(0).toUpperCase() + plano.slice(1)}</strong></p>
      `,
      confirmButtonText: 'Ver Planos',
      confirmButtonColor: '#9f042c',
      showCancelButton: true,
      cancelButtonText: 'Fechar'
    }).then(result => {
      if (result.isConfirmed) {
        // Navegar para a seção de planos
        const planosSection = document.getElementById('planosSection');
        if (planosSection) {
          planosSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
    return false;
  }
  return true;
};