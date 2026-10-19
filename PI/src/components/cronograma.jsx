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
      // Carrega matérias
      const resMat = await apiFetch('materias');
      if (resMat.ok) setMaterias(await resMat.json());

      // Carrega cronograma
      const resCron = await apiFetch('cronogramas');
      if (resCron.ok) setCronograma(await resCron.json());
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

  return (
    <section id="cronogramaNovoSection">
      <div className="layout-container">
        <h1>Cronograma Inteligente</h1>

        <div className="form-cronogramaNovo">
          <input
            type="text"
            placeholder="Nome da matéria"
            value={novaMateria.nome}
            onChange={(e) => setNovaMateria({ ...novaMateria, nome: e.target.value })}
          />
          <input
            type="color"
            value={novaMateria.cor}
            onChange={(e) => setNovaMateria({ ...novaMateria, cor: e.target.value })}
          />
          <button onClick={adicionarMateria}>Adicionar Matéria</button>
        </div>

        <h4>Matérias</h4>
        <div className="materias-area">
          {materias.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', width: '100%' }}>Nenhuma matéria cadastrada.</p>
          ) : (
            materias.map(materia => (
              <div
                key={materia.id_materia}
                className="materia-bloco"
                style={{ background: materia.cor }}
                draggable
                onDragStart={(e) => onDragStart(e, materia)}
                onDoubleClick={() => editarMateria(materia)}
              >
                {materia.nome}
              </div>
            ))
          )}
        </div>

        <p className="drag-text">Arraste a matéria para um dia da semana</p>

        <div className="cronogramaNovo-grid">
          {diasSemana.map(dia => (
            <div
              key={dia.id}
              className="dia"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, dia.id)}
            >
              <h5>{dia.nome}</h5>
              <div className="dia-drop">
                {getBlocosPorDia(dia.id).map(bloco => (
                  <div
                    key={bloco.id_cronograma}
                    className="bloco-materia"
                    style={{ background: materias.find(m => m.id_materia === bloco.id_materia)?.cor || '#ccc' }}
                    onDoubleClick={() => editarBloco(bloco)}
                  >
                    {bloco.nome_materia} ({bloco.hora_inicio.substring(0,5)} - {bloco.hora_final.substring(0,5)})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}