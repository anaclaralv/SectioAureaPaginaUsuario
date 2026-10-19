import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './notas.css'; 
import { apiFetch } from '../api';

export default function Cornell() {
  const [notasCornell, setNotasCornell] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [modoRevisao, setModoRevisao] = useState(false);
  const [respostasReveladas, setRespostasReveladas] = useState({});
  const [inteligenciaAtual, setInteligenciaAtual] = useState('logico');
  
  // Formulário com matéria
  const [form, setForm] = useState({ titulo: '', pergunta: '', resposta: '', id_materia: '' });

  // Cadastro rápido inline de matéria
  const [criandoMateria, setCriandoMateria] = useState(false);
  const [novaMateriaNome, setNovaMateriaNome] = useState('');
  const [novaMateriaCor, setNovaMateriaCor] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const toggleRevelarResposta = (id) => {
    setRespostasReveladas((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleModoRevisao = () => {
    setModoRevisao((prev) => {
      const proximo = !prev;
      if (!proximo) {
        setRespostasReveladas({});
      }
      return proximo;
    });
  };

  const getCoresInteligencia = () => {
    const cores = {
      logico: { primaria: '#ffbd59' },
      intrapessoal: { primaria: '#5170ff' },
      espacial: { primaria: '#d203a4' },
      linguistica: { primaria: '#9f042c' },
      musical: { primaria: '#8a03d2' },
      corporal: { primaria: '#00bf63' },
      interpessoal: { primaria: '#ff5f00' }
    };
    return cores[inteligenciaAtual] || cores.logico;
  };
  const cores = getCoresInteligencia();

  const carregarCornell = async () => {
    try {
      const response = await apiFetch('cornell');
      if (response.ok) {
        setNotasCornell(await response.json());
      }
    } catch (err) { console.error(err); }
  };

  const carregarMaterias = async () => {
    try {
      const res = await apiFetch('materias');
      if (res.ok) {
        const data = await res.json();
        setMaterias(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setInteligenciaAtual(localStorage.getItem('inteligenciaUsuario') || 'logico');
    carregarCornell();
    carregarMaterias();
  }, []);

  const salvarNovaMateria = async () => {
    const nomeTrim = novaMateriaNome.trim();
    if (!nomeTrim) {
      return Swal.fire({ icon: 'warning', title: 'Digite o nome da matéria!', timer: 1500, showConfirmButton: false });
    }
    setSalvandoMateria(true);
    try {
      const res = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: nomeTrim, cor: novaMateriaCor || '#9f042c' })
      });
      if (res.ok) {
        const data = await res.json();
        await carregarMaterias();
        setForm((prev) => ({ ...prev, id_materia: String(data.id_materia) }));
        setCriandoMateria(false);
        setNovaMateriaNome('');
        Swal.fire({ icon: 'success', title: 'Matéria cadastrada!', timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire('Erro', 'Não foi possível cadastrar a matéria.', 'error');
      }
    } catch (err) {
      Swal.fire('Erro', 'Erro de conexão', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  const salvarCornell = async () => {
    if (!form.pergunta.trim() || !form.resposta.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Preencha a pergunta e a resposta!', timer: 1500, showConfirmButton: false });
    }

    try {
      const response = await apiFetch('cornell', {
        method: 'POST',
        body: JSON.stringify({
          titulo: form.titulo || 'Cornell: ' + form.pergunta.substring(0, 20),
          pergunta: form.pergunta,
          resposta: form.resposta,
          resumo: '',
          id_materia: form.id_materia ? parseInt(form.id_materia) : null
        })
      });
      if (response.ok) {
        setForm({ titulo: '', pergunta: '', resposta: '', id_materia: form.id_materia });
        carregarCornell();
        Swal.fire({ icon: 'success', title: 'Salvo no Caderno!', timer: 1500, showConfirmButton: false });
      }
    } catch (err) { Swal.fire('Erro', 'Erro de conexão', 'error'); }
  };

  const excluirCornell = (id) => {
    Swal.fire({
      title: 'Excluir anotação?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await apiFetch(`cornell/${id}`, { method: 'DELETE' });
        carregarCornell();
      }
    });
  };

  const nomeInteligencia = {
    logico: '🧮 Lógico-Matemática',
    intrapessoal: '🧠 Intrapessoal',
    espacial: '🌌 Espacial',
    linguistica: '📖 Linguística',
    musical: '🎵 Musical',
    corporal: '🏃 Corporal',
    interpessoal: '👥 Interpessoal'
  };

  // Filtragem por matéria
  const notasFiltradas = notasCornell.filter((nota) => {
    if (materiaFiltro === 'todas') return true;
    if (materiaFiltro === 'sem_materia') return !nota.id_materia;
    return String(nota.id_materia) === String(materiaFiltro);
  });

  return (
    <section id="cornellSection">
      <h1 className="mb-3">
        <i className="bi bi-journal-text" style={{ color: cores.primaria }}></i> Método Cornell
        <span style={{ background: cores.primaria, marginLeft: '12px', fontSize: '14px', padding: '4px 12px', borderRadius: '20px', color: '#fff' }}>
          {nomeInteligencia[inteligenciaAtual] || nomeInteligencia.logico}
        </span>
      </h1>

      <div className="cornell-container">
        {/* CABEÇALHO EXPLICATIVO */}
        <div className="cornell-info" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px', borderLeft: `4px solid ${cores.primaria}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ margin: 0 }}><strong>📝 Método Cornell por Matérias:</strong> Organize perguntas e respostas associando a cada disciplina:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '12px' }}>
                <div style={{ padding: '10px', background: '#fff3f3', borderLeft: '4px solid #dc3545', borderRadius: '4px' }}>
                  <strong style={{ color: '#dc3545' }}>❓ Esquerda:</strong> Perguntas e Fórmulas
                </div>
                <div style={{ padding: '10px', background: '#f0fff4', borderLeft: '4px solid #28a745', borderRadius: '4px' }}>
                  <strong style={{ color: '#28a745' }}>💡 Direita:</strong> Respostas e Explicações
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {modoRevisao && notasFiltradas.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const todosRevelados = notasFiltradas.every(n => respostasReveladas[n.id_cornell]);
                    if (todosRevelados) {
                      setRespostasReveladas({});
                    } else {
                      const novo = { ...respostasReveladas };
                      notasFiltradas.forEach(n => novo[n.id_cornell] = true);
                      setRespostasReveladas(novo);
                    }
                  }}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  {notasFiltradas.every(n => respostasReveladas[n.id_cornell]) ? '🔒 Borrar Todas' : '👁️ Desborrar Todas'}
                </button>
              )}
              <button 
                type="button"
                className={`btn-revisao ${modoRevisao ? 'ativo' : ''}`} 
                onClick={toggleModoRevisao} 
                style={{ background: modoRevisao ? cores.primaria : 'transparent', color: modoRevisao ? '#fff' : cores.primaria, border: `2px solid ${cores.primaria}`, padding: '8px 16px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <i className={`bi ${modoRevisao ? 'bi-eye-slash' : 'bi-eye'}`}></i> {modoRevisao ? 'Desativar' : 'Ativar'} Revisão
              </button>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE DUAS COLUNAS */}
        <div className="cornell-input" style={{ marginBottom: '30px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          
          {/* SELETOR DE MATÉRIA */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold', color: '#374151', margin: 0, fontSize: '0.95rem' }}>
                📚 Matéria:
              </label>
              <button
                type="button"
                onClick={() => setCriandoMateria(!criandoMateria)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: criandoMateria ? '#6b7280' : cores.primaria,
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {criandoMateria ? '✕ Escolher existente' : '+ Nova Matéria'}
              </button>
            </div>

            {criandoMateria ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ flex: '1 1 200px' }}
                    placeholder="Nome da matéria (ex: Biologia, Química)"
                    value={novaMateriaNome}
                    onChange={(e) => setNovaMateriaNome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') salvarNovaMateria(); }}
                    autoFocus
                  />
                  <input
                    type="color"
                    value={novaMateriaCor}
                    onChange={(e) => setNovaMateriaCor(e.target.value)}
                    style={{ width: '40px', height: '34px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                    title="Escolha a cor da matéria"
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={salvandoMateria}
                    onClick={salvarNovaMateria}
                    style={{ background: cores.primaria, color: '#fff', fontWeight: '600' }}
                  >
                    {salvandoMateria ? 'Salvando...' : 'Salvar Matéria'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCriandoMateria(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <select
                className="form-select"
                value={form.id_materia}
                onChange={(e) => setForm({ ...form, id_materia: e.target.value })}
                style={{ maxWidth: '400px' }}
              >
                <option value="">Nenhuma matéria (Geral)</option>
                {materias.map((m) => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', color: '#dc3545', display: 'block', marginBottom: '6px' }}>❓ Perguntas e Fórmulas</label>
              <textarea 
                value={form.pergunta} 
                onChange={(e) => setForm({ ...form, pergunta: e.target.value })} 
                rows="5" 
                className="form-control" 
                style={{ borderColor: '#dc3545', resize: 'vertical' }} 
                placeholder="Ex: Qual a fórmula de Bhaskara?" 
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', color: '#28a745', display: 'block', marginBottom: '6px' }}>💡 Respostas e Explicações</label>
              <textarea 
                value={form.resposta} 
                onChange={(e) => setForm({ ...form, resposta: e.target.value })} 
                rows="5" 
                className="form-control" 
                style={{ borderColor: '#28a745', resize: 'vertical' }} 
                placeholder="Ex: x = (-b ± √(b²-4ac)) / 2a" 
              />
            </div>
          </div>

          <button 
            type="button"
            onClick={salvarCornell} 
            style={{ background: cores.primaria, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="bi bi-plus-lg"></i> Adicionar ao Caderno
          </button>
        </div>

        {/* LISTA DE NOTAS COM FILTROS DE MATÉRIA */}
        <div className="notas-lista">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
              📒 Caderno Cornell
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal', marginLeft: '10px' }}>
                ({notasFiltradas.length} {notasFiltradas.length === 1 ? 'anotação' : 'anotações'}
                {materiaFiltro !== 'todas' && ` de ${notasCornell.length}`})
              </span>
            </h3>

            {/* ABAS / FILTROS POR MATÉRIA */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setMateriaFiltro('todas')}
                style={{
                  background: materiaFiltro === 'todas' ? cores.primaria : '#f1f5f9',
                  color: materiaFiltro === 'todas' ? '#fff' : '#475569',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Todas ({notasCornell.length})
              </button>

              {materias.map((m) => {
                const count = notasCornell.filter(n => String(n.id_materia) === String(m.id_materia)).length;
                if (count === 0) return null;
                const isSelected = String(materiaFiltro) === String(m.id_materia);
                return (
                  <button
                    key={m.id_materia}
                    type="button"
                    onClick={() => setMateriaFiltro(String(m.id_materia))}
                    style={{
                      background: isSelected ? (m.cor || cores.primaria) : '#f1f5f9',
                      color: isSelected ? '#fff' : '#475569',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {!isSelected && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: m.cor || cores.primaria
                        }}
                      />
                    )}
                    {m.nome} ({count})
                  </button>
                );
              })}

              {notasCornell.some(n => !n.id_materia) && (
                <button
                  type="button"
                  onClick={() => setMateriaFiltro('sem_materia')}
                  style={{
                    background: materiaFiltro === 'sem_materia' ? '#64748b' : '#f1f5f9',
                    color: materiaFiltro === 'sem_materia' ? '#fff' : '#475569',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Geral ({notasCornell.filter(n => !n.id_materia).length})
                </button>
              )}
            </div>
          </div>
          
          {notasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <i className="bi bi-journal-text" style={{ fontSize: '48px', color: '#94a3b8' }}></i>
              <p style={{ color: '#64748b', margin: '10px 0 0 0', fontWeight: '500' }}>
                {notasCornell.length === 0
                  ? 'Nenhuma anotação cadastrada ainda. Crie a primeira acima!'
                  : 'Nenhuma anotação encontrada para o filtro selecionado.'}
              </p>
              {materiaFiltro !== 'todas' && notasCornell.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMateriaFiltro('todas')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cores.primaria,
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    textDecoration: 'underline'
                  }}
                >
                  Ver todas as anotações
                </button>
              )}
            </div>
          ) : (
            <div className={`row g-3 ${modoRevisao ? 'modo-revisao' : ''}`}>
              {notasFiltradas.map((nota) => {
                const estaRevelada = Boolean(respostasReveladas[nota.id_cornell]);
                const estaBorrada = modoRevisao && !estaRevelada;
                const corCartao = nota.cor_materia || cores.primaria;

                return (
                  <div key={nota.id_cornell} className="col-md-6">
                    <div className="card-nota" style={{ background: '#fff', border: `2px solid ${corCartao}`, borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      
                      {/* HEADER DO CARD COM MATÉRIA E DATA */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          {nota.nome_materia ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: `${corCartao}15`,
                                color: corCartao,
                                border: `1px solid ${corCartao}40`,
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: corCartao
                                }}
                              />
                              {nota.nome_materia}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: '#f1f5f9',
                                color: '#64748b',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              Geral
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          📅 {new Date(nota.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        
                        {/* COLUNA ESQUERDA: PERGUNTA */}
                        <div style={{ borderRight: '2px solid #e0e0e0', paddingRight: '15px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc3545' }}>❓ PERGUNTA:</span>
                          <p style={{ color: '#dc3545', fontWeight: '500', marginTop: '5px', whiteSpace: 'pre-wrap' }}>{nota.pergunta}</p>
                          {modoRevisao && (
                            <button
                              type="button"
                              onClick={() => toggleRevelarResposta(nota.id_cornell)}
                              style={{
                                background: estaRevelada ? '#e2e8f0' : corCartao,
                                color: estaRevelada ? '#334155' : '#fff',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginTop: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                              title={estaRevelada ? 'Clique para borrar novamente' : 'Clique para desborrar a resposta'}
                            >
                              <i className={`bi ${estaRevelada ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                              {estaRevelada ? 'Borrar Resposta' : 'Desborrar Resposta'}
                            </button>
                          )}
                        </div>

                        {/* COLUNA DIREITA: RESPOSTA */}
                        <div
                          onClick={() => { if (modoRevisao) toggleRevelarResposta(nota.id_cornell); }}
                          style={{ cursor: modoRevisao ? 'pointer' : 'default', position: 'relative' }}
                          title={modoRevisao ? (estaRevelada ? 'Clique para borrar a resposta' : 'Clique para desborrar a resposta') : undefined}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>💡 RESPOSTA:</span>
                            {modoRevisao && (
                              <span style={{ fontSize: '11px', color: estaRevelada ? '#64748b' : '#16a34a', fontWeight: '600' }}>
                                {estaRevelada ? '👁️ Revelada' : '👆 Clique p/ desborrar'}
                              </span>
                            )}
                          </div>
                          <p
                            className={`texto-resposta ${estaBorrada ? 'revisao-oculta' : ''}`}
                            style={{
                              color: '#28a745',
                              fontWeight: '500',
                              marginTop: '5px',
                              whiteSpace: 'pre-wrap',
                              filter: estaBorrada ? 'blur(8px)' : 'none',
                              transition: 'filter 0.25s ease',
                              userSelect: estaBorrada ? 'none' : 'text'
                            }}
                          >
                            {nota.resposta}
                          </p>
                        </div>
                      </div>

                      {/* FOOTER DO CARD */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                        <button
                          type="button"
                          onClick={() => excluirCornell(nota.id_cornell)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          <i className="bi bi-trash"></i> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}