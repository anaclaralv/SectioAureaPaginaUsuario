import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './cornell.css';
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
        const data = await response.json();
        setNotasCornell(Array.isArray(data) ? data : []);
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
      title: 'Excluir anotação?', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Sim, excluir',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancelar'
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

  const materiasComNotas = [...new Set(notasCornell.map(n => n.id_materia).filter(Boolean))];

  return (
    <section id="cornellSection">
      <div className="cornell-container-main">
        {/* Cabeçalho Padronizado */}
        <div className="cornell-header-bar">
          <div className="cornell-header-titles">
            <h1>
              <i className="bi bi-layout-split"></i> Método Cornell
            </h1>
            <p className="cornell-subtitle">
              Organize seus estudos em duas colunas: pistas e perguntas à esquerda, resumos e respostas à direita
            </p>
          </div>

          <div className="cornell-perfil-badge-destaque" style={{ background: cores.primaria }}>
            <span>{nomeInteligencia[inteligenciaAtual] || nomeInteligencia.logico}</span>
          </div>
        </div>

        {/* 4 Cards de Métricas */}
        <div className="cornell-metricas-grid">
          <div className="cor-metric-card">
            <div className="cor-metric-icon total">
              <i className="bi bi-journal-text"></i>
            </div>
            <div className="cor-metric-info">
              <span className="cor-metric-num">{notasCornell.length}</span>
              <span className="cor-metric-label">Notas no Caderno</span>
            </div>
          </div>

          <div className="cor-metric-card">
            <div className="cor-metric-icon materias">
              <i className="bi bi-collection-fill"></i>
            </div>
            <div className="cor-metric-info">
              <span className="cor-metric-num">{materiasComNotas.length}</span>
              <span className="cor-metric-label">Disciplinas Ativas</span>
            </div>
          </div>

          <div className="cor-metric-card">
            <div className="cor-metric-icon revisao">
              <i className={`bi ${modoRevisao ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
            </div>
            <div className="cor-metric-info">
              <span className="cor-metric-num">{modoRevisao ? 'Ativo' : 'Padrão'}</span>
              <span className="cor-metric-label">Modo Revisão</span>
            </div>
          </div>

          <div className="cor-metric-card">
            <div className="cor-metric-icon perguntas">
              <i className="bi bi-question-circle-fill"></i>
            </div>
            <div className="cor-metric-info">
              <span className="cor-metric-num">{notasCornell.length}</span>
              <span className="cor-metric-label">Perguntas-Chave</span>
            </div>
          </div>
        </div>

        {/* Banner Explicativo */}
        <div className="cornell-banner-explicativo">
          <div className="cornell-banner-topo">
            <h3 className="cornell-banner-titulo">
              <i className="bi bi-info-circle-fill" style={{ color: cores.primaria }}></i> Dinâmica do Método Cornell
            </h3>
            <div className="cornell-banner-acoes">
              {modoRevisao && notasFiltradas.length > 0 && (
                <button
                  type="button"
                  className="btn-desborrar-todas"
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
                >
                  <i className={`bi ${notasFiltradas.every(n => respostasReveladas[n.id_cornell]) ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  {notasFiltradas.every(n => respostasReveladas[n.id_cornell]) ? 'Borrar Todas' : 'Desborrar Todas'}
                </button>
              )}
              <button 
                type="button"
                className={`btn-toggle-revisao ${modoRevisao ? 'ativo' : ''}`} 
                onClick={toggleModoRevisao}
              >
                <i className={`bi ${modoRevisao ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                {modoRevisao ? 'Desativar Revisão' : 'Ativar Modo Revisão'}
              </button>
            </div>
          </div>

          <div className="cornell-metodologia-grid">
            <div className="metodologia-bloco esquerda">
              <strong><i className="bi bi-question-circle-fill"></i> Coluna da Esquerda (Pistas e Perguntas)</strong>
              <span>Anote fórmulas, palavras-chave, dúvidas e conceitos essenciais que servem como gatilhos mentais.</span>
            </div>
            <div className="metodologia-bloco direita">
              <strong><i className="bi bi-lightbulb-fill"></i> Coluna da Direita (Respostas e Explicações)</strong>
              <span>Desenvolva a resolução detalhada, deduções e sínteses com suas próprias palavras.</span>
            </div>
          </div>
        </div>

        {/* Formulário de Criação Cornell */}
        <div className="cornell-form-card">
          <div className="cornell-form-header">
            <h3><i className="bi bi-pencil-square" style={{ color: cores.primaria }}></i> Nova Anotação Cornell</h3>
            <button
              type="button"
              className="btn-add-materia-inline"
              onClick={() => setCriandoMateria(!criandoMateria)}
              title={criandoMateria ? 'Escolher existente' : 'Criar nova matéria'}
              style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <i className={`bi ${criandoMateria ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>
              {criandoMateria ? 'Selecionar Existente' : 'Nova Matéria'}
            </button>
          </div>

          {/* Seletor ou Criação Inline */}
          <div className="cornell-materia-linha">
            <label><i className="bi bi-journal-bookmark-fill"></i> Disciplina Associada:</label>
            {criandoMateria ? (
              <div className="box-nova-materia-inline">
                <div className="nova-materia-header">
                  <h6><i className="bi bi-stars"></i> Cadastrar Nova Disciplina</h6>
                </div>
                <div className="d-flex gap-2 mb-2 flex-wrap">
                  <input
                    type="text"
                    className="input-flashcard"
                    style={{ flex: '1 1 220px' }}
                    placeholder="Nome da disciplina (ex: Biologia Molecular)"
                    value={novaMateriaNome}
                    onChange={(e) => setNovaMateriaNome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') salvarNovaMateria(); }}
                    autoFocus
                  />
                  <input
                    type="color"
                    className="color-picker-flashcard"
                    value={novaMateriaCor}
                    onChange={(e) => setNovaMateriaCor(e.target.value)}
                    title="Escolha a cor da disciplina"
                  />
                  <button
                    type="button"
                    className="btn-salvar-materia-inline"
                    disabled={salvandoMateria}
                    onClick={salvarNovaMateria}
                  >
                    {salvandoMateria ? 'Salvando...' : 'Salvar Disciplina'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancelar-materia-inline"
                    onClick={() => setCriandoMateria(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <select
                className="input-flashcard"
                value={form.id_materia}
                onChange={(e) => setForm({ ...form, id_materia: e.target.value })}
                style={{ maxWidth: '420px' }}
              >
                <option value="">Nenhuma disciplina (Caderno Geral)</option>
                {materias.map((m) => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Grid de 2 Colunas de Inputs */}
          <div className="cornell-duas-colunas-grid">
            <div className="cornell-coluna-campo esquerda">
              <label><i className="bi bi-question-circle-fill"></i> Perguntas, Fórmulas e Gatilhos</label>
              <textarea 
                value={form.pergunta} 
                onChange={(e) => setForm({ ...form, pergunta: e.target.value })} 
                rows="4" 
                className="cornell-textarea" 
                placeholder="Ex: Como funciona o ciclo de Krebs? Qual a fórmula da velocidade média?" 
              />
            </div>
            <div className="cornell-coluna-campo direita">
              <label><i className="bi bi-lightbulb-fill"></i> Respostas, Resoluções e Explicações</label>
              <textarea 
                value={form.resposta} 
                onChange={(e) => setForm({ ...form, resposta: e.target.value })} 
                rows="4" 
                className="cornell-textarea" 
                placeholder="Ex: Ocorre na matriz mitocondrial e produz NADH e FADH2. Vm = ΔS / Δt..." 
              />
            </div>
          </div>

          <button 
            type="button"
            onClick={salvarCornell} 
            className="btn-salvar-cornell"
          >
            <i className="bi bi-plus-circle-fill"></i> Adicionar ao Caderno Cornell
          </button>
        </div>

        {/* Toolbar com Filtros */}
        <div className="cornell-toolbar-bar">
          <h3 className="cornell-toolbar-titulo">
            <i className="bi bi-journal-bookmark-fill" style={{ color: cores.primaria }}></i>
            Suas Anotações
            <span>({notasFiltradas.length} {notasFiltradas.length === 1 ? 'registro' : 'registros'})</span>
          </h3>

          <div className="cornell-filtros-nav">
            <button
              type="button"
              className={`btn-cor-filtro ${materiaFiltro === 'todas' ? 'ativo' : ''}`}
              onClick={() => setMateriaFiltro('todas')}
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
                  className={`btn-cor-filtro ${isSelected ? 'ativo' : ''}`}
                  onClick={() => setMateriaFiltro(String(m.id_materia))}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.cor || cores.primaria, display: 'inline-block' }}></span>
                  {m.nome} ({count})
                </button>
              );
            })}
            {notasCornell.some(n => !n.id_materia) && (
              <button
                type="button"
                className={`btn-cor-filtro ${materiaFiltro === 'sem_materia' ? 'ativo' : ''}`}
                onClick={() => setMateriaFiltro('sem_materia')}
              >
                Geral ({notasCornell.filter(n => !n.id_materia).length})
              </button>
            )}
          </div>
        </div>

        {/* Grade de Cards Cornell */}
        {notasFiltradas.length === 0 ? (
          <div className="cornell-vazio-card">
            <i className="bi bi-journal-text"></i>
            <h4>Nenhuma anotação encontrada</h4>
            <p>
              {notasCornell.length === 0
                ? 'Seu caderno Cornell está vazio. Crie sua primeira pergunta e resposta acima!'
                : 'Nenhuma anotação corresponde ao filtro selecionado.'}
            </p>
          </div>
        ) : (
          <div className="cornell-notas-grid">
            {notasFiltradas.map((nota) => {
              const estaRevelada = Boolean(respostasReveladas[nota.id_cornell]);
              const estaBorrada = modoRevisao && !estaRevelada;
              const corCartao = nota.cor_materia || cores.primaria;

              return (
                <div
                  key={nota.id_cornell}
                  className="cornell-card-item"
                  style={{ borderTop: `4px solid ${corCartao}` }}
                >
                  <div className="cornell-card-top">
                    <span
                      className="badge-materia-cornell"
                      style={{
                        background: `${corCartao}18`,
                        color: corCartao,
                        border: `1px solid ${corCartao}35`
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: corCartao, display: 'inline-block' }}></span>
                      {nota.nome_materia || 'Geral'}
                    </span>
                    <span className="cornell-card-data">
                      <i className="bi bi-clock"></i> {new Date(nota.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="cornell-card-duas-colunas">
                    {/* Esquerda: Pergunta */}
                    <div className="cornell-card-coluna esquerda">
                      <div className="cornell-col-header esquerda">
                        <span><i className="bi bi-question-circle"></i> Pergunta</span>
                      </div>
                      <p className="cornell-texto-pergunta">{nota.pergunta}</p>
                    </div>

                    {/* Direita: Resposta */}
                    <div
                      className="cornell-card-coluna direita"
                      onClick={() => { if (modoRevisao) toggleRevelarResposta(nota.id_cornell); }}
                      style={{ cursor: modoRevisao ? 'pointer' : 'default' }}
                    >
                      <div className="cornell-col-header direita">
                        <span><i className="bi bi-lightbulb"></i> Resposta</span>
                        {modoRevisao && (
                          <span style={{ fontSize: '0.74rem', textTransform: 'none', color: estaRevelada ? '#64748b' : '#059669', fontWeight: 600 }}>
                            {estaRevelada ? 'Visível' : 'Toque p/ ver'}
                          </span>
                        )}
                      </div>
                      <p className={`cornell-texto-resposta ${estaBorrada ? 'borrada' : ''}`}>
                        {nota.resposta}
                      </p>
                    </div>
                  </div>

                  <div className="cornell-card-footer">
                    {modoRevisao ? (
                      <button
                        type="button"
                        className="btn-toggle-revelar-card"
                        onClick={() => toggleRevelarResposta(nota.id_cornell)}
                      >
                        <i className={`bi ${estaRevelada ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        {estaRevelada ? 'Ocultar Resposta' : 'Revelar Resposta'}
                      </button>
                    ) : <span />}

                    <button
                      type="button"
                      className="btn-excluir-cornell"
                      onClick={() => excluirCornell(nota.id_cornell)}
                      title="Excluir anotação"
                    >
                      <i className="bi bi-trash3-fill"></i> Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
