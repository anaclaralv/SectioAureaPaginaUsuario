import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './cronograma.css';
import { apiFetch } from '../api';

export default function Cronograma() {
  const [materias, setMaterias] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [novaMateria, setNovaMateria] = useState({ nome: '', cor: '#9f042c' });
  
  const diasSemana = [
    { id: 'segunda', nome: 'Segunda' }, { id: 'terca', nome: 'Terça' },
    { id: 'quarta', nome: 'Quarta' }, { id: 'quinta', nome: 'Quinta' },
    { id: 'sexta', nome: 'Sexta' }, { id: 'sabado', nome: 'Sábado' },
    { id: 'domingo', nome: 'Domingo' }
  ];

  const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();

  useEffect(() => {
    if (plano === 'gratuito') {
      Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: 'O <strong>Cronograma Inteligente</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
        confirmButtonText: 'Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
        }
      });
      return;
    }
    carregarDados();
  }, [plano]);

  if (plano === 'gratuito') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '600px', margin: '40px auto', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '2rem' }}>
          <i className="bi bi-lock-fill"></i>
        </div>
        <h2 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Recurso Premium</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
          O <strong>Cronograma Inteligente</strong> é uma funcionalidade exclusiva dos planos <strong>Básico</strong> e <strong>Pro</strong>. Organize seus horários semanais por matéria com automação de rotinas!
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

  const carregarDados = async () => {
    try {
      let listaMaterias = [];
      // Carrega matérias
      const resMat = await apiFetch('materias');
      if (resMat.ok) {
        listaMaterias = await resMat.json();
        setMaterias(listaMaterias);
      }

      // Carrega cronograma
      const resCron = await apiFetch('cronogramas');
      if (resCron.ok) {
        const dadosCron = await resCron.json();
        setCronograma(dadosCron);

        // Sincroniza com localStorage para a página inicial
        const cronogramaFormatado = (Array.isArray(dadosCron) ? dadosCron : []).map(c => {
          const mat = listaMaterias.find(m => String(m.id_materia) === String(c.id_materia));
          const cor = c.cor_materia || mat?.cor || '#9f042c';
          const inicio = (c.hora_inicio || '').substring(0, 5);
          const fim = (c.hora_final || '').substring(0, 5);
          return {
            ...c,
            id: c.id_cronograma,
            dia: c.dia_semana,
            inicio,
            fim,
            cor_materia: cor,
            materia: {
              id: c.id_materia,
              nome: c.nome_materia || mat?.nome || 'Matéria',
              cor
            }
          };
        });
        localStorage.setItem('cronogramaNovo', JSON.stringify(cronogramaFormatado));
        window.dispatchEvent(new CustomEvent('cronogramaAtualizado', { detail: cronogramaFormatado }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  const adicionarMateria = async () => {
    if (!novaMateria.nome.trim()) {
      Swal.fire({ icon: 'warning', title: 'Ops!', text: 'Digite o nome da matéria!', timer: 2000 });
      return;
    }

    try {
      const response = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: novaMateria.nome, cor: novaMateria.cor })
      });

      if (response.ok) {
        setNovaMateria({ nome: '', cor: '#9f042c' });
        carregarDados();
        Swal.fire({ icon: 'success', title: 'Matéria criada!', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erro ao criar', text: 'Verifique a conexão.' });
    }
  };

  const adicionarBloco = (materia, dia) => {
    Swal.fire({
      title: `Horário de ${materia.nome}`,
      html: `
        <div style="display: flex; gap: 10px; justify-content: center;">
          <div><label>Início</label><input type="time" id="inicio" class="swal2-input" value="08:00"></div>
          <div><label>Fim</label><input type="time" id="fim" class="swal2-input" value="09:00"></div>
        </div>
      `,
      confirmButtonText: 'Salvar',
      showCancelButton: true,
      preConfirm: () => {
        const inicio = document.getElementById('inicio').value;
        const fim = document.getElementById('fim').value;
        if (!inicio || !fim) return Swal.showValidationMessage('Preencha os horários!');
        if (fim <= inicio) return Swal.showValidationMessage('O fim deve ser maior que o início!');
        return { inicio, fim };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiFetch('cronogramas', {
            method: 'POST',
            body: JSON.stringify({
              id_materia: materia.id_materia,
              dia_semana: dia,
              hora_inicio: result.value.inicio,
              hora_final: result.value.fim
            })
          });

          if (response.ok) {
            carregarDados();
            Swal.fire({ icon: 'success', title: 'Horário adicionado!', timer: 1500, showConfirmButton: false });
          } else {
            Swal.fire('Erro', 'Conflito de horário ou matéria inválida.', 'error');
          }
        } catch (err) {
          Swal.fire('Erro', 'Não foi possível salvar.', 'error');
        }
      }
    });
  };

  const editarBloco = (bloco) => {
    Swal.fire({
      title: 'Editar Horário',
      html: `
        <input type="time" id="editInicio" class="swal2-input" value="${bloco.hora_inicio.substring(0,5)}">
        <input type="time" id="editFim" class="swal2-input" value="${bloco.hora_final.substring(0,5)}">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Salvar',
      denyButtonText: 'Excluir',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const inicio = document.getElementById('editInicio').value;
        const fim = document.getElementById('editFim').value;
        
        try {
          await apiFetch(`cronogramas/${bloco.id_cronograma}`, {
            method: 'PUT',
            body: JSON.stringify({
              id_materia: bloco.id_materia,
              dia_semana: bloco.dia_semana,
              hora_inicio: inicio,
              hora_final: fim
            })
          });
          carregarDados();
        } catch (err) { console.error(err); }
      } else if (result.isDenied) {
        try {
          await apiFetch(`cronogramas/${bloco.id_cronograma}`, { method: 'DELETE' });
          carregarDados();
        } catch (err) { console.error(err); }
      }
    });
  };

  const editarMateria = (materia) => {
    Swal.fire({
      title: `Editar "${materia.nome}"`,
      html: `
        <input type="text" id="editNome" class="swal2-input" value="${materia.nome}">
        <input type="color" id="editCor" class="swal2-input" value="${materia.cor}">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Salvar',
      denyButtonText: 'Excluir Matéria',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const nome = document.getElementById('editNome').value;
        const cor = document.getElementById('editCor').value;
        try {
          await apiFetch(`materias/${materia.id_materia}`, {
            method: 'PUT', body: JSON.stringify({ nome, cor })
          });
          carregarDados();
        } catch (err) { console.error(err); }
      } else if (result.isDenied) {
        try {
          await apiFetch(`materias/${materia.id_materia}`, { method: 'DELETE' });
          carregarDados();
        } catch (err) { console.error(err); }
      }
    });
  };

  // Controles de Drag and Drop mantidos (visual original)
  const onDragStart = (e, materia) => {
    e.dataTransfer.setData('text/plain', materia.id_materia);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const onDrop = (e, dia) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const materiaId = e.dataTransfer.getData('text/plain');
    const materia = materias.find(m => String(m.id_materia) === String(materiaId));
    if (materia) adicionarBloco(materia, dia);
  };

  const getBlocosPorDia = (dia) => {
    return cronograma
      .filter(b => b.dia_semana === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const diasOcupados = new Set(cronograma.map(c => c.dia_semana)).size;
  const mediaBlocos = diasOcupados > 0 ? (cronograma.length / diasOcupados).toFixed(1) : '0';

  return (
    <section id="cronogramaNovoSection">
      <div className="cronograma-container-main">
        {/* Cabeçalho Padronizado (estilo Calendário) */}
        <div className="cronograma-header-bar">
          <div className="cronograma-header-titles">
            <h1><i className="bi bi-diagram-3-fill"></i> Cronograma Inteligente</h1>
            <p className="cronograma-subtitle">Distribuição semanal de estudos, rotinas e grade horária personalizada</p>
          </div>
          <button
            className="btn-novo-cronograma-main"
            onClick={() => document.getElementById('novaMateriaNomeInput')?.focus()}
          >
            <i className="bi bi-plus-lg"></i> Nova Matéria
          </button>
        </div>

        {/* Cards de Métricas (estilo Calendário) */}
        <div className="cronograma-metricas-grid">
          <div className="crono-metric-card">
            <div className="crono-metric-icon materias">
              <i className="bi bi-journal-bookmark-fill"></i>
            </div>
            <div className="crono-metric-info">
              <span className="crono-metric-num">{materias.length}</span>
              <span className="crono-metric-label">Matérias Ativas</span>
            </div>
          </div>

          <div className="crono-metric-card">
            <div className="crono-metric-icon blocos">
              <i className="bi bi-calendar3-range"></i>
            </div>
            <div className="crono-metric-info">
              <span className="crono-metric-num">{cronograma.length}</span>
              <span className="crono-metric-label">Blocos Agendados</span>
            </div>
          </div>

          <div className="crono-metric-card">
            <div className="crono-metric-icon dias">
              <i className="bi bi-calendar-check-fill"></i>
            </div>
            <div className="crono-metric-info">
              <span className="crono-metric-num">{diasOcupados} / 7</span>
              <span className="crono-metric-label">Dias com Estudo</span>
            </div>
          </div>

          <div className="crono-metric-card">
            <div className="crono-metric-icon media">
              <i className="bi bi-speedometer2"></i>
            </div>
            <div className="crono-metric-info">
              <span className="crono-metric-num">{mediaBlocos}</span>
              <span className="crono-metric-label">Média / Dia Útil</span>
            </div>
          </div>
        </div>

        {/* Card de Gestão de Matérias */}
        <div className="cronograma-card-main mb-4">
          <div className="cronograma-card-header mb-3">
            <div>
              <h3><i className="bi bi-palette-fill me-2" style={{ color: 'var(--cor-primaria)' }}></i> Minhas Matérias</h3>
              <p className="cronograma-card-sub">Cadastre as disciplinas e arraste-as para os dias da semana abaixo</p>
            </div>
          </div>

          <div className="form-cronograma-modern mb-3">
            <input
              id="novaMateriaNomeInput"
              type="text"
              placeholder="Nome da disciplina (ex: Biologia, Cálculo, História)..."
              value={novaMateria.nome}
              onChange={(e) => setNovaMateria({ ...novaMateria, nome: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionarMateria(); }}
            />
            <div className="color-picker-wrap">
              <label>Cor:</label>
              <input
                type="color"
                value={novaMateria.cor}
                onChange={(e) => setNovaMateria({ ...novaMateria, cor: e.target.value })}
              />
            </div>
            <button className="btn-add-materia-action" onClick={adicionarMateria}>
              <i className="bi bi-plus-circle-fill me-1"></i> Cadastrar Matéria
            </button>
          </div>

          <div className="materias-area">
            {materias.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', width: '100%', margin: 0, padding: '16px' }}>
                Nenhuma matéria cadastrada. Digite o nome acima e clique em "Cadastrar Matéria".
              </p>
            ) : (
              materias.map(materia => (
                <div
                  key={materia.id_materia}
                  className="materia-bloco"
                  style={{ background: materia.cor }}
                  draggable
                  onDragStart={(e) => onDragStart(e, materia)}
                  onDoubleClick={() => editarMateria(materia)}
                  title="Dê duplo clique para editar ou remover. Arraste para o dia desejado."
                >
                  <i className="bi bi-grip-vertical me-1"></i> {materia.nome}
                </div>
              ))
            )}
          </div>
          <p className="drag-hint-text mt-2 mb-0">
            <i className="bi bi-info-circle me-1"></i> <strong>Dica:</strong> Arraste a matéria até o dia desejado ou dê duplo clique nela para renomear/excluir.
          </p>
        </div>

        {/* Card do Grid Semanal */}
        <div className="cronograma-card-main">
          <div className="cronograma-card-header mb-3">
            <div>
              <h3><i className="bi bi-calendar-week me-2" style={{ color: 'var(--cor-primaria)' }}></i> Grade Semanal</h3>
              <p className="cronograma-card-sub">Solte as disciplinas nas colunas correspondentes para programar seus horários</p>
            </div>
          </div>

          <div className="cronogramaNovo-grid">
            {diasSemana.map(dia => (
              <div
                key={dia.id}
                className="dia"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, dia.id)}
              >
                <div className="dia-header">
                  <h5>{dia.nome}</h5>
                  <span className="dia-badge-count">{getBlocosPorDia(dia.id).length}</span>
                </div>
                <div className="dia-drop">
                  {getBlocosPorDia(dia.id).length === 0 ? (
                    <div className="dia-drop-vazio">
                      <span>Solte aqui</span>
                    </div>
                  ) : (
                    getBlocosPorDia(dia.id).map(bloco => (
                      <div
                        key={bloco.id_cronograma}
                        className="bloco-materia"
                        style={{ background: bloco.cor_materia || materias.find(m => String(m.id_materia) === String(bloco.id_materia))?.cor || '#9f042c' }}
                        onDoubleClick={() => editarBloco(bloco)}
                        title="Duplo clique para editar horário ou excluir"
                      >
                        <div className="bloco-materia-nome">{bloco.nome_materia}</div>
                        <div className="bloco-materia-hora">
                          <i className="bi bi-clock me-1"></i> {bloco.hora_inicio.substring(0,5)} - {bloco.hora_final.substring(0,5)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}