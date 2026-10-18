import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './notas.css'; 
import { apiFetch } from '../api';

export default function Cornell() {
  const [notasCornell, setNotasCornell] = useState([]);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [inteligenciaAtual, setInteligenciaAtual] = useState('logico');
  const [form, setForm] = useState({ titulo: '', pergunta: '', resposta: '', resumo: '' });

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

  useEffect(() => {
    setInteligenciaAtual(localStorage.getItem('inteligenciaUsuario') || 'logico');
    carregarCornell();
  }, []);

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
          resumo: form.resumo 
        })
      });
      if (response.ok) {
        setForm({ titulo: '', pergunta: '', resposta: '', resumo: '' });
        carregarCornell();
        Swal.fire({ icon: 'success', title: 'Salvo!', timer: 1500, showConfirmButton: false });
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
              <p style={{ margin: 0 }}><strong>📝 Método Cornell:</strong> Divida a página em duas colunas:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '12px' }}>
                <div style={{ padding: '10px', background: '#fff3f3', borderLeft: '4px solid #dc3545', borderRadius: '4px' }}>
                  <strong style={{ color: '#dc3545' }}>❓ Esquerda:</strong> Perguntas
                </div>
                <div style={{ padding: '10px', background: '#f0fff4', borderLeft: '4px solid #28a745', borderRadius: '4px' }}>
                  <strong style={{ color: '#28a745' }}>💡 Direita:</strong> Respostas
                </div>
              </div>
            </div>
            <button 
              className={`btn-revisao ${modoRevisao ? 'ativo' : ''}`} 
              onClick={() => setModoRevisao(!modoRevisao)} 
              style={{ background: modoRevisao ? cores.primaria : 'transparent', color: modoRevisao ? '#fff' : cores.primaria, border: `2px solid ${cores.primaria}`, padding: '8px 16px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <i className={`bi ${modoRevisao ? 'bi-eye-slash' : 'bi-eye'}`}></i> {modoRevisao ? 'Desativar' : 'Ativar'} Revisão
            </button>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="cornell-input" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', color: '#dc3545' }}>❓ Perguntas e Fórmulas</label>
              <textarea value={form.pergunta} onChange={(e) => setForm({ ...form, pergunta: e.target.value })} rows="4" className="form-control" style={{ borderColor: '#dc3545' }} placeholder="Ex: Qual a fórmula de Bhaskara?" />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', color: '#28a745' }}>💡 Respostas e Explicações</label>
              <textarea value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value })} rows="4" className="form-control" style={{ borderColor: '#28a745' }} placeholder="Ex: x = (-b ± √(b²-4ac)) / 2a" />
            </div>
          </div>
          
          {/* Campo de Resumo */}
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#6b7280' }}>📝 Resumo (Opcional)</label>
            <textarea value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} rows="2" className="form-control" placeholder="Resuma o conteúdo aprendido..." />
          </div>

          <button onClick={salvarCornell} style={{ background: cores.primaria, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-plus-lg"></i> Adicionar ao Caderno
          </button>
        </div>

        {/* LISTA DE NOTAS */}
        <div className="notas-lista">
          <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📒 Caderno Cornell</span>
            <span style={{ fontSize: '14px', color: '#999' }}>{notasCornell.length} anotações</span>
          </h3>
          
          {notasCornell.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
              <i className="bi bi-journal-text" style={{ fontSize: '48px', color: '#ccc' }}></i>
              <p style={{ color: '#666' }}>Nenhuma anotação ainda.</p>
            </div>
          ) : (
            <div className={`row g-3 ${modoRevisao ? 'modo-revisao' : ''}`}>
              {notasCornell.map((nota) => (
                <div key={nota.id_cornell} className="col-md-6">
                  <div className="card-nota" style={{ background: '#fff', border: `2px solid ${cores.primaria}`, borderRadius: '12px', padding: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      
                      <div style={{ borderRight: '2px solid #e0e0e0', paddingRight: '15px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc3545' }}>❓ PERGUNTA:</span>
                        <p style={{ color: '#dc3545', fontWeight: '500', marginTop: '5px' }}>{nota.pergunta}</p>
                        {modoRevisao && (
                          <button onClick={() => Swal.fire('Resposta', nota.resposta, 'info')} style={{ background: cores.primaria, color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}>
                            <i className="bi bi-eye"></i> Ver Resposta
                          </button>
                        )}
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>💡 RESPOSTA:</span>
                        <p className={`texto-resposta ${modoRevisao ? 'revisao-oculta' : ''}`} style={{ color: '#28a745', fontWeight: '500', marginTop: '5px', filter: modoRevisao ? 'blur(8px)' : 'none' }}>{nota.resposta}</p>
                      </div>
                    </div>
                    
                    {nota.resumo && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e0e0e0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280' }}>📝 RESUMO:</span>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: '2px 0 0 0' }}>{nota.resumo}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>📅 {new Date(nota.data_criacao).toLocaleString('pt-BR')}</span>
                      <button onClick={() => excluirCornell(nota.id_cornell)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        <i className="bi bi-trash"></i> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}