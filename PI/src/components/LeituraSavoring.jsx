import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './LeituraSavoring.css';

const TEXTOS_EXEMPLO = [
  {
    titulo: "Neuroplasticidade e Aprendizagem Profunda",
    texto: `A neuroplasticidade é a capacidade extraordinária do cérebro de reorganizar suas estruturas e conexões sinápticas em resposta a novos aprendizados, experiências e desafios intelectuais. Durante séculos acreditou-se que o cérebro adulto era estático, mas a neurociência moderna comprovou que continuamos moldando nossa fiação neural ao longo de toda a vida.

Quando aprendemos algo com foco intencional e reflexão, os neurônios disparam juntos repetidamente, fortalecendo as sinapses por meio da potenciação de longa duração. Esse processo não acontece de forma instantânea durante uma leitura superficial, mas sim quando permitimos intervalos de assimilação e consolidação na memória de trabalho.

A prática da Leitura Savoring funciona como um catalisador dessa plasticidade. Ao saborear cada parágrafo, conectar ideias prévias e formular resumos em palavras próprias, você força o cérebro a construir novos esquemas conceituais, transformando dados soltos em sabedoria permanente.`
  },
  {
    titulo: "A Arte da Leitura Atenta na Era Digital",
    texto: `Vivemos em uma época dominada pela sobrecarga de estímulos rápidos, onde a atenção fragmentada nos condiciona a escanear telas em vez de compreender textos em profundidade. Esse hábito de leitura diagonal atende à necessidade de filtrar informação, mas prejudica gravemente nossa capacidade de reflexão e discernimento crítico.

A leitura consciente (Savoring) propõe desacelerar o ritmo de consumo para restaurar a presença mental. Ler devagar não é sinal de ineficiência; pelo contrário, é a única maneira de captar nuances, questionar pressupostos e dialogar com o pensamento do autor.

Ao fazer pausas calculadas entre trechos, permitimos que as ideias ressoem internamente. Essa postura deliberada converte a leitura de uma obrigação mecânica em um verdadeiro encontro intelectual e filosófico.`
  }
];

export default function LeituraSavoring() {
  // Lista de Leituras salvas
  const [leituras, setLeituras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  // Modos de Visualização
  const [modoEstudio, setModoEstudio] = useState(false);
  const [etapa, setEtapa] = useState(1); // 1: Preparação, 2: Leitura, 3: Reflexão, 4: Síntese
  const [leituraVisualizando, setLeituraVisualizando] = useState(null);

  // Estado da Sessão Atual
  const [titulo, setTitulo] = useState('');
  const [textoCompleto, setTextoCompleto] = useState('');
  const [tempoPorTrecho, setTempoPorTrecho] = useState(2); // minutos
  const [trechos, setTrechos] = useState([]);
  const [trechoAtual, setTrechoAtual] = useState(0);
  const [anotacoes, setAnotacoes] = useState([]);
  const [anotacaoTemp, setAnotacaoTemp] = useState('');
  const [resumoFinal, setResumoFinal] = useState('');
  const [idLeituraSalva, setIdLeituraSalva] = useState(null);

  // Timer e Controles do Modo Leitura
  const [tempoRestante, setTempoRestante] = useState(120);
  const [pausado, setPausado] = useState(false);
  const timerRef = useRef(null);

  // Preferências do Leitor (Customização visual)
  const [temaLeitura, setTemaLeitura] = useState('claro'); // claro, sepia, noturno
  const [tamanhoFonte, setTamanhoFonte] = useState('medio'); // pequeno, medio, grande

  // Carregar histórico da API
  const carregarHistorico = async () => {
    setCarregando(true);
    try {
      const res = await apiFetch('historicoleituras');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeituras(data);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de leituras:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  // Divisão Inteligente do Texto em Trechos
  const dividirEmTrechos = (texto) => {
    if (!texto || !texto.trim()) return [];
    
    // Divide por parágrafos não vazios
    const paragrafos = texto
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragrafos.length > 1) {
      return paragrafos;
    }

    // Se for um bloco único, divide em blocos de 2 a 3 frases
    const frases = texto
      .split(/(?<=[.!?])\s+/)
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const blocos = [];
    for (let i = 0; i < frases.length; i += 3) {
      blocos.push(frases.slice(i, i + 3).join(' '));
    }

    return blocos.length > 0 ? blocos : [texto.trim()];
  };

  // Iniciar Nova Leitura (reset)
  const iniciarNovaLeitura = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTitulo('');
    setTextoCompleto('');
    setTempoPorTrecho(2);
    setTrechos([]);
    setTrechoAtual(0);
    setAnotacoes([]);
    setAnotacaoTemp('');
    setResumoFinal('');
    setIdLeituraSalva(null);
    setEtapa(1);
    setModoEstudio(true);
    setLeituraVisualizando(null);
  };

  // Usar Texto de Exemplo
  const carregarExemplo = (idx) => {
    const ex = TEXTOS_EXEMPLO[idx];
    if (ex) {
      setTitulo(ex.titulo);
      setTextoCompleto(ex.texto);
    }
  };

  // Confirmar configuração e ir para Leitura (Etapa 2)
  const comecarLeituraSavoring = () => {
    if (!titulo.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Por favor, informe o título do texto.', confirmButtonColor: '#9f042c' });
      return;
    }
    if (!textoCompleto.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Por favor, insira ou cole o texto que deseja ler.', confirmButtonColor: '#9f042c' });
      return;
    }

    const chunks = dividirEmTrechos(textoCompleto);
    if (chunks.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Texto Inválido', text: 'Não foi possível dividir o texto em trechos.', confirmButtonColor: '#9f042c' });
      return;
    }

    setTrechos(chunks);
    setTrechoAtual(0);
    setAnotacoes([]);
    setAnotacaoTemp('');
    iniciarTrecho(0, chunks, tempoPorTrecho);
    setEtapa(2);
  };

  // Iniciar timer para um trecho específico
  const iniciarTrecho = (index, listaTrechos = trechos, tempoMin = tempoPorTrecho) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const segs = tempoMin * 60;
    setTempoRestante(segs);
    setPausado(false);

    timerRef.current = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          tocarSino();
          // Avança automaticamente para a reflexão
          setEtapa(3);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Tocar aviso suave quando o tempo termina
  const tocarSino = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Tom suave D5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // Áudio desativado no navegador
    }

    Swal.fire({
      icon: 'info',
      title: 'Momento de Reflexão!',
      text: 'O tempo deste trecho terminou. Saboreie o que acabou de ler e registre seus pensamentos.',
      timer: 2500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  };

  // Pausar / Continuar Timer
  const alternarPausa = () => {
    if (pausado) {
      setPausado(false);
      timerRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            tocarSino();
            setEtapa(3);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPausado(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Parar timer e ir para reflexão manual
  const irParaReflexao = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEtapa(3);
  };

  // Salvar anotação do trecho e ir para o próximo ou síntese
  const salvarAnotacaoTrecho = () => {
    const novasAnotacoes = [...anotacoes];
    if (anotacaoTemp.trim()) {
      novasAnotacoes.push({
        id: Date.now(),
        trecho: trechoAtual + 1,
        texto: anotacaoTemp.trim(),
        data: new Date().toISOString()
      });
      setAnotacoes(novasAnotacoes);
    }

    setAnotacaoTemp('');

    const proximoIndex = trechoAtual + 1;
    if (proximoIndex < trechos.length) {
      setTrechoAtual(proximoIndex);
      iniciarTrecho(proximoIndex);
      setEtapa(2);
    } else {
      // Concluiu todos os trechos -> Etapa 4 (Síntese)
      finalizarSessaoLeitura(novasAnotacoes);
    }
  };

  // Pular anotação do trecho
  const pularAnotacaoTrecho = () => {
    setAnotacaoTemp('');
    const proximoIndex = trechoAtual + 1;
    if (proximoIndex < trechos.length) {
      setTrechoAtual(proximoIndex);
      iniciarTrecho(proximoIndex);
      setEtapa(2);
    } else {
      finalizarSessaoLeitura(anotacoes);
    }
  };

  // Finalizar e salvar no banco automaticamente
  const finalizarSessaoLeitura = async (listaAnotacoes) => {
    setEtapa(4);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const payload = {
        titulo: titulo.trim(),
        data: new Date().toISOString(),
        totalTrechos: trechos.length,
        trechos: trechos.map((t, i) => ({ numero: i + 1, texto: t })),
        anotacoes: listaAnotacoes,
        resumo: resumoFinal.trim(),
        textoCompleto: textoCompleto.trim()
      };

      const res = await apiFetch('historicoleituras', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setIdLeituraSalva(data.id_leitura || data.id);
        carregarHistorico();
      }
    } catch (err) {
      console.error('Erro ao salvar leitura:', err);
    }
  };

  // Salvar / Atualizar Resumo Final
  const salvarResumoFinal = async () => {
    if (!idLeituraSalva) {
      // Se não havia sido salvo ainda, cria agora
      finalizarSessaoLeitura(anotacoes);
      Swal.fire({ icon: 'success', title: 'Salvo com sucesso!', timer: 1500, showConfirmButton: false });
      return;
    }

    try {
      const res = await apiFetch(`historicoleituras/${idLeituraSalva}`, {
        method: 'PUT',
        body: JSON.stringify({
          resumo: resumoFinal.trim(),
          anotacoes: anotacoes
        })
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Leitura Atualizada!',
          text: 'Sua síntese e anotações foram gravadas com sucesso.',
          confirmButtonColor: '#9f042c'
        });
        carregarHistorico();
      }
    } catch (err) {
      console.error('Erro ao atualizar resumo:', err);
      Swal.fire({ icon: 'error', title: 'Erro ao salvar', text: 'Tente novamente.', confirmButtonColor: '#9f042c' });
    }
  };

  // Editar anotação na etapa 4 ou no modal
  const editarAnotacao = (index, noModal = false) => {
    const alvo = noModal ? leituraVisualizando.anotacoes[index] : anotacoes[index];
    if (!alvo) return;

    Swal.fire({
      title: `✏️ Editar Reflexão - Trecho ${alvo.trecho}`,
      input: 'textarea',
      inputValue: alvo.texto,
      inputPlaceholder: 'Edite sua reflexão...',
      showCancelButton: true,
      confirmButtonText: 'Salvar Alteração',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#9f042c',
      cancelButtonColor: '#6b7280',
      inputValidator: (val) => (!val || !val.trim() ? 'A reflexão não pode ficar vazia' : null)
    }).then(async (result) => {
      if (result.isConfirmed) {
        const novoTexto = result.value.trim();

        if (noModal) {
          const novas = [...leituraVisualizando.anotacoes];
          novas[index].texto = novoTexto;
          setLeituraVisualizando({ ...leituraVisualizando, anotacoes: novas });

          await apiFetch(`historicoleituras/${leituraVisualizando.id}`, {
            method: 'PUT',
            body: JSON.stringify({ anotacoes: novas })
          });
          carregarHistorico();
        } else {
          const novas = [...anotacoes];
          novas[index].texto = novoTexto;
          setAnotacoes(novas);

          if (idLeituraSalva) {
            await apiFetch(`historicoleituras/${idLeituraSalva}`, {
              method: 'PUT',
              body: JSON.stringify({ anotacoes: novas })
            });
            carregarHistorico();
          }
        }

        Swal.fire({ icon: 'success', title: 'Anotação atualizada!', timer: 1200, showConfirmButton: false });
      }
    });
  };

  // Excluir leitura
  const excluirLeitura = (id) => {
    Swal.fire({
      title: 'Excluir Leitura?',
      text: 'Todo o histórico desta sessão, trechos e anotações serão removidos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await apiFetch(`historicoleituras/${id}`, { method: 'DELETE' });
          if (res.ok) {
            if (leituraVisualizando && leituraVisualizando.id === id) {
              setLeituraVisualizando(null);
            }
            carregarHistorico();
            Swal.fire({ icon: 'success', title: 'Excluída com sucesso!', timer: 1200, showConfirmButton: false });
          }
        } catch (err) {
          console.error('Erro ao excluir:', err);
        }
      }
    });
  };

  // Copiar resumo e insights para área de transferência
  const copiarNotas = (leitura = null) => {
    const dados = leitura || {
      titulo,
      data: new Date().toLocaleDateString('pt-BR'),
      trechos,
      anotacoes,
      resumo: resumoFinal
    };

    let texto = `📖 LEITURA SAVORING: ${dados.titulo}\n`;
    texto += `📅 Data: ${new Date(dados.data).toLocaleDateString('pt-BR')}\n\n`;

    if (dados.resumo) {
      texto += `📝 SÍNTESE FINAL:\n${dados.resumo}\n\n`;
    }

    texto += `💡 REFLEXÕES E INSIGHTS:\n`;
    if (dados.anotacoes && dados.anotacoes.length > 0) {
      dados.anotacoes.forEach(a => {
        texto += `• Trecho ${a.trecho}: "${a.texto}"\n`;
      });
    } else {
      texto += `Nenhuma anotação registrada.\n`;
    }

    navigator.clipboard.writeText(texto);
    Swal.fire({ icon: 'success', title: 'Copiado!', text: 'Resumo copiado para a área de transferência.', timer: 1500, showConfirmButton: false });
  };

  // Formatação de Segundos para mm:ss
  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Leituras Filtradas
  const leiturasFiltradas = leituras.filter(l => 
    l.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    l.texto_completo?.toLowerCase().includes(busca.toLowerCase())
  );

  // Cálculos de Estatísticas
  const totalLeituras = leituras.length;
  const totalTrechosLidos = leituras.reduce((acc, l) => acc + (l.totalTrechos || 0), 0);
  const totalReflexoes = leituras.reduce((acc, l) => acc + (l.anotacoes ? l.anotacoes.length : 0), 0);

  return (
    <div className="savoring-container">
      {/* ================= BARRA SUPERIOR ================= */}
      <header className="savoring-header">
        <div className="savoring-header-left">
          <button 
            className="savoring-btn-voltar"
            onClick={() => {
              if (modoEstudio) {
                Swal.fire({
                  title: 'Sair do Modo Leitura?',
                  text: 'Se você sair agora sem concluir, o progresso não salvo será perdido.',
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: 'Sair para o Histórico',
                  cancelButtonText: 'Continuar Lendo',
                  confirmButtonColor: '#9f042c'
                }).then((r) => {
                  if (r.isConfirmed) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setModoEstudio(false);
                  }
                });
              } else {
                window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'metodos' }));
              }
            }}
          >
            <i className="bi bi-arrow-left"></i> {modoEstudio ? 'Voltar ao Painel' : 'Voltar aos Métodos'}
          </button>
          
          <div className="savoring-title-group">
            <span className="savoring-badge">
              <i className="bi bi-book-half"></i> Leitura Consciente
            </span>
            <h1>Leitura Savoring</h1>
            <p className="savoring-subtitle">
              Leia devagar, absorva cada ideia em profundidade e transforme trechos em sabedoria permanente com pausas reflexivas.
            </p>
          </div>
        </div>

        {!modoEstudio && (
          <button className="savoring-btn-novo" onClick={iniciarNovaLeitura}>
            <i className="bi bi-plus-lg"></i> Nova Leitura Savoring
          </button>
        )}
      </header>

      {/* ============================================================== */}
      {/* MODO ESTÚDIO (LEITURA ATIVA EM 4 ETAPAS)                       */}
      {/* ============================================================== */}
      {modoEstudio ? (
        <div className="savoring-estudio-wrapper">
          {/* Stepper / Indicador de Etapas */}
          <div className="savoring-stepper">
            <div className={`step-item ${etapa >= 1 ? 'active' : ''} ${etapa === 1 ? 'current' : ''}`}>
              <div className="step-num">1</div>
              <div className="step-label">Preparação</div>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${etapa >= 2 ? 'active' : ''} ${etapa === 2 ? 'current' : ''}`}>
              <div className="step-num">2</div>
              <div className="step-label">Leitura Atenta</div>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${etapa >= 3 ? 'active' : ''} ${etapa === 3 ? 'current' : ''}`}>
              <div className="step-num">3</div>
              <div className="step-label">Reflexão & Insight</div>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${etapa >= 4 ? 'active' : ''} ${etapa === 4 ? 'current' : ''}`}>
              <div className="step-num">4</div>
              <div className="step-label">Síntese Final</div>
            </div>
          </div>

          {/* ---------------- ETAPA 1: PREPARAÇÃO ---------------- */}
          {etapa === 1 && (
            <div className="savoring-card savoring-card-prep">
              <div className="prep-header">
                <h2><i className="bi bi-pencil-square"></i> Prepare sua Sessão de Leitura</h2>
                <p>Escolha um texto relevante e defina o ritmo ideal para saborear cada trecho sem pressa.</p>
              </div>

              <div className="prep-form-grid">
                <div className="form-group">
                  <label><i className="bi bi-bookmark-fill"></i> Título da Leitura ou Artigo:</label>
                  <input
                    type="text"
                    className="savoring-input"
                    placeholder="Ex: Introdução à Neuroplasticidade, Capítulo 3..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label><i className="bi bi-hourglass-split"></i> Tempo por Trecho (Foco de Leitura):</label>
                  <select 
                    className="savoring-select"
                    value={tempoPorTrecho}
                    onChange={(e) => setTempoPorTrecho(Number(e.target.value))}
                  >
                    <option value={1}>1 minuto por trecho (rápido / trechos curtos)</option>
                    <option value={2}>2 minutos por trecho (ideal / leitura meditativa)</option>
                    <option value={3}>3 minutos por trecho (profundo / artigos densos)</option>
                    <option value={5}>5 minutos por trecho (máxima absorção acadêmica)</option>
                  </select>
                </div>
              </div>

              <div className="form-group mt-3">
                <div className="textarea-header">
                  <label><i className="bi bi-file-text"></i> Texto Completo para Leitura:</label>
                  <div className="exemplos-botoes">
                    <span>Textos de exemplo:</span>
                    <button type="button" onClick={() => carregarExemplo(0)}>Neuroplasticidade</button>
                    <button type="button" onClick={() => carregarExemplo(1)}>Leitura Digital</button>
                  </div>
                </div>
                <textarea
                  className="savoring-textarea"
                  rows={8}
                  placeholder="Cole aqui o artigo, capítulo de livro ou resumo que deseja estudar pausadamente..."
                  value={textoCompleto}
                  onChange={(e) => setTextoCompleto(e.target.value)}
                />
                <div className="textarea-footer">
                  <span>{textoCompleto.split(/\s+/).filter(Boolean).length} palavras</span>
                  <span>{dividirEmTrechos(textoCompleto).length} trechos previstos</span>
                </div>
              </div>

              {/* Pré-visualização de Trechos */}
              {textoCompleto.trim().length > 30 && (
                <div className="preview-trechos-box">
                  <h4><i className="bi bi-eye"></i> Divisão dos Trechos Calculada:</h4>
                  <div className="preview-trechos-grid">
                    {dividirEmTrechos(textoCompleto).map((p, idx) => (
                      <div key={idx} className="preview-trecho-item">
                        <strong>Trecho {idx + 1}</strong>
                        <p>{p.length > 120 ? p.substring(0, 120) + '...' : p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="prep-actions">
                <button 
                  className="savoring-btn-cancelar"
                  onClick={() => setModoEstudio(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="savoring-btn-iniciar"
                  onClick={comecarLeituraSavoring}
                >
                  <i className="bi bi-play-circle-fill"></i> Iniciar Leitura Savoring
                </button>
              </div>
            </div>
          )}

          {/* ---------------- ETAPA 2: LEITURA ATENTA ---------------- */}
          {etapa === 2 && (
            <div className={`savoring-card savoring-chamber tema-${temaLeitura} fonte-${tamanhoFonte}`}>
              {/* Barra de Ferramentas da Câmara de Leitura */}
              <div className="chamber-top-bar">
                <div className="chamber-progress-info">
                  <span className="trecho-badge">
                    Trecho {trechoAtual + 1} de {trechos.length}
                  </span>
                  <div className="chamber-progress-bar">
                    <div 
                      className="chamber-progress-fill" 
                      style={{ width: `${((trechoAtual + 1) / trechos.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="chamber-tools">
                  {/* Ajuste de Fonte */}
                  <div className="tool-btn-group">
                    <button 
                      className={tamanhoFonte === 'pequeno' ? 'active' : ''} 
                      onClick={() => setTamanhoFonte('pequeno')} 
                      title="Fonte menor"
                    >
                      A-
                    </button>
                    <button 
                      className={tamanhoFonte === 'medio' ? 'active' : ''} 
                      onClick={() => setTamanhoFonte('medio')} 
                      title="Fonte padrão"
                    >
                      A
                    </button>
                    <button 
                      className={tamanhoFonte === 'grande' ? 'active' : ''} 
                      onClick={() => setTamanhoFonte('grande')} 
                      title="Fonte maior"
                    >
                      A+
                    </button>
                  </div>

                  {/* Temas de Leitura */}
                  <div className="tool-btn-group">
                    <button 
                      className={`theme-dot claro ${temaLeitura === 'claro' ? 'active' : ''}`}
                      onClick={() => setTemaLeitura('claro')}
                      title="Tema Claro"
                    >
                      ☀️
                    </button>
                    <button 
                      className={`theme-dot sepia ${temaLeitura === 'sepia' ? 'active' : ''}`}
                      onClick={() => setTemaLeitura('sepia')}
                      title="Tema Sépia (Conforto)"
                    >
                      📜
                    </button>
                    <button 
                      className={`theme-dot noturno ${temaLeitura === 'noturno' ? 'active' : ''}`}
                      onClick={() => setTemaLeitura('noturno')}
                      title="Tema Noturno"
                    >
                      🌙
                    </button>
                  </div>
                </div>
              </div>

              {/* Título da Leitura */}
              <h3 className="chamber-reading-title">{titulo}</h3>

              {/* Texto do Trecho Atual */}
              <div className="chamber-text-content">
                <p>{trechos[trechoAtual]}</p>
              </div>

              {/* Rodapé com Timer e Controles */}
              <div className="chamber-bottom-controls">
                <div className="savoring-timer-box">
                  <div className={`timer-circle ${tempoRestante < 30 ? 'pulse-warning' : ''}`}>
                    <i className="bi bi-clock"></i>
                    <span className="timer-digits">{formatarTempo(tempoRestante)}</span>
                  </div>
                  <button 
                    className={`btn-timer-toggle ${pausado ? 'btn-resume' : 'btn-pause'}`}
                    onClick={alternarPausa}
                  >
                    {pausado ? (
                      <><i className="bi bi-play-fill"></i> Continuar Leitura</>
                    ) : (
                      <><i className="bi bi-pause-fill"></i> Pausar Leitura</>
                    )}
                  </button>
                </div>

                <div className="chamber-action-btns">
                  <button 
                    className="savoring-btn-refletir"
                    onClick={irParaReflexao}
                  >
                    <i className="bi bi-chat-quote-fill"></i> Concluir Leitura deste Trecho & Refletir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- ETAPA 3: REFLEXÃO & INSIGHT ---------------- */}
          {etapa === 3 && (
            <div className="savoring-card savoring-card-reflexao">
              <div className="reflexao-header">
                <span className="trecho-badge">Momento Savoring • Trecho {trechoAtual + 1} de {trechos.length}</span>
                <h2><i className="bi bi-lightbulb"></i> Pause e Saboreie o que Leu</h2>
                <p>A assimilação real acontece quando você conecta o texto ao seu próprio pensamento.</p>
              </div>

              {/* Trecho Lido para Referência Rápida */}
              <div className="reflexao-trecho-ref">
                <div className="ref-label"><i className="bi bi-quote"></i> Trecho Lido:</div>
                <div className="ref-content">{trechos[trechoAtual]}</div>
              </div>

              {/* Perguntas Guias */}
              <div className="socratic-prompts">
                <div className="prompt-pill"><i className="bi bi-stars"></i> Qual o ponto essencial deste trecho?</div>
                <div className="prompt-pill"><i className="bi bi-link-45deg"></i> Como isso se relaciona com o que você já sabia?</div>
                <div className="prompt-pill"><i className="bi bi-question-circle"></i> O que você achou mais instigante ou surpreendente?</div>
              </div>

              {/* Caixa de Texto da Anotação */}
              <div className="form-group">
                <label><i className="bi bi-pencil-fill"></i> Suas Reflexões e Insights:</label>
                <textarea
                  className="savoring-textarea reflexao-input"
                  rows={4}
                  placeholder="Escreva livremente suas impressões, conclusões ou conexões que fez durante a leitura..."
                  value={anotacaoTemp}
                  onChange={(e) => setAnotacaoTemp(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="reflexao-actions">
                <button 
                  className="savoring-btn-pular"
                  onClick={pularAnotacaoTrecho}
                >
                  Pular Reflexão (Avançar)
                </button>
                <button 
                  className="savoring-btn-salvar-trecho"
                  onClick={salvarAnotacaoTrecho}
                >
                  <i className="bi bi-check-lg"></i> Salvar Reflexão e Avançar
                </button>
              </div>
            </div>
          )}

          {/* ---------------- ETAPA 4: SÍNTESE & RESUMO FINAL ---------------- */}
          {etapa === 4 && (
            <div className="savoring-card savoring-card-resumo">
              <div className="resumo-parabens">
                <div className="trofeu-icon"><i className="bi bi-trophy-fill"></i></div>
                <h2>Parabéns! Leitura Savoring Concluída</h2>
                <p>Você completou todos os {trechos.length} trechos com atenção plena e reflexão.</p>
              </div>

              {/* Métricas da Sessão */}
              <div className="resumo-stats-row">
                <div className="stat-pill">
                  <i className="bi bi-book"></i>
                  <div>
                    <strong>{trechos.length}</strong>
                    <span>Trechos Lidos</span>
                  </div>
                </div>
                <div className="stat-pill">
                  <i className="bi bi-journal-text"></i>
                  <div>
                    <strong>{anotacoes.length}</strong>
                    <span>Reflexões Registradas</span>
                  </div>
                </div>
                <div className="stat-pill">
                  <i className="bi bi-clock-history"></i>
                  <div>
                    <strong>{trechos.length * tempoPorTrecho} min</strong>
                    <span>Tempo Dedicado</span>
                  </div>
                </div>
              </div>

              {/* Acervo de Anotações por Trecho */}
              <div className="resumo-anotacoes-secao">
                <h3><i className="bi bi-card-checklist"></i> Suas Reflexões por Trecho:</h3>
                {anotacoes.length === 0 ? (
                  <p className="sem-anotacoes-msg">Nenhuma anotação individual foi feita durante os trechos.</p>
                ) : (
                  <div className="anotacoes-lista">
                    {anotacoes.map((a, idx) => (
                      <div key={idx} className="anotacao-item-card">
                        <div className="anotacao-card-top">
                          <span className="trecho-tag">📖 Trecho {a.trecho}</span>
                          <button 
                            className="btn-editar-nota"
                            onClick={() => editarAnotacao(idx)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                        </div>
                        <div className="trecho-snippet">
                          {trechos[a.trecho - 1] || 'Texto original indisponível'}
                        </div>
                        <div className="minha-reflexao-box">
                          <label>💡 Meu insight:</label>
                          <p>{a.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campo para Síntese Final Consolidada */}
              <div className="resumo-sintese-final">
                <h3><i className="bi bi-feather"></i> Síntese Final (Com suas próprias palavras):</h3>
                <p className="sintese-dica">
                  Explique o texto como se estivesse ensinando alguém ou resumindo os pontos fundamentais aprendidos.
                </p>
                <textarea
                  className="savoring-textarea"
                  rows={5}
                  placeholder="Escreva sua síntese consolidada aqui..."
                  value={resumoFinal}
                  onChange={(e) => setResumoFinal(e.target.value)}
                />
              </div>

              {/* Ações da Etapa 4 */}
              <div className="resumo-footer-actions">
                <div className="footer-left">
                  <button className="btn-secundario" onClick={() => copiarNotas()}>
                    <i className="bi bi-clipboard-check"></i> Copiar Resumo
                  </button>
                  <button className="btn-secundario" onClick={() => window.print()}>
                    <i className="bi bi-printer"></i> Imprimir
                  </button>
                </div>

                <div className="footer-right">
                  <button className="btn-salvar-resumo" onClick={salvarResumoFinal}>
                    <i className="bi bi-save2-fill"></i> Salvar no Histórico
                  </button>
                  <button 
                    className="btn-concluir"
                    onClick={() => {
                      setModoEstudio(false);
                      carregarHistorico();
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i> Voltar ao Painel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* MODO DASHBOARD / HISTÓRICO DE LEITURAS                         */
        /* ============================================================== */
        <div className="savoring-dashboard">
          {/* Métricas Rápidas */}
          <div className="savoring-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-book-half"></i></div>
              <div className="metric-data">
                <span className="metric-number">{totalLeituras}</span>
                <span className="metric-label">Leituras Concluídas</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-layers-half"></i></div>
              <div className="metric-data">
                <span className="metric-number">{totalTrechosLidos}</span>
                <span className="metric-label">Trechos Saboreados</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-journal-check"></i></div>
              <div className="metric-data">
                <span className="metric-number">{totalReflexoes}</span>
                <span className="metric-label">Insights Registrados</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><i className="bi bi-lightbulb-fill"></i></div>
              <div className="metric-data">
                <span className="metric-number">40 min</span>
                <span className="metric-label">Tempo Médio Recomendado</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtro e Busca */}
          <div className="savoring-filter-bar">
            <div className="filter-search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Buscar leituras por título ou conteúdo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button className="btn-clear-search" onClick={() => setBusca('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>

            <div className="filter-count">
              Exibindo <strong>{leiturasFiltradas.length}</strong> de {leituras.length} leituras
            </div>
          </div>

          {/* Lista de Leituras Anteriores */}
          {carregando ? (
            <div className="savoring-loading">
              <div className="spinner"></div>
              <p>Carregando histórico de leituras...</p>
            </div>
          ) : leiturasFiltradas.length === 0 ? (
            <div className="savoring-empty-state">
              <div className="empty-icon"><i className="bi bi-book"></i></div>
              <h3>Nenhuma Leitura Encontrada</h3>
              <p>
                {busca 
                  ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.' 
                  : 'Você ainda não registrou nenhuma sessão de Leitura Savoring. Inicie sua primeira leitura consciente agora!'}
              </p>
              <button className="savoring-btn-novo" onClick={iniciarNovaLeitura}>
                <i className="bi bi-plus-circle-fill"></i> Iniciar Primeira Leitura Savoring
              </button>
            </div>
          ) : (
            <div className="savoring-history-grid">
              {leiturasFiltradas.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="card-top-row">
                    <span className="history-date">
                      <i className="bi bi-calendar3"></i> {new Date(item.data).toLocaleDateString('pt-BR')}
                    </span>
                    <button 
                      className="btn-delete-history"
                      onClick={() => excluirLeitura(item.id)}
                      title="Excluir leitura"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>

                  <h3 className="history-title">{item.titulo}</h3>

                  <div className="history-tags">
                    <span className="tag-pill">
                      <i className="bi bi-layers"></i> {item.totalTrechos || item.trechos?.length || 0} trechos
                    </span>
                    <span className="tag-pill">
                      <i className="bi bi-pencil"></i> {item.anotacoes ? item.anotacoes.length : 0} anotações
                    </span>
                  </div>

                  {item.resumo ? (
                    <div className="history-snippet">
                      <strong>Síntese:</strong> {item.resumo.length > 100 ? item.resumo.substring(0, 100) + '...' : item.resumo}
                    </div>
                  ) : item.texto_completo ? (
                    <div className="history-snippet">
                      <strong>Início:</strong> {item.texto_completo.length > 90 ? item.texto_completo.substring(0, 90) + '...' : item.texto_completo}
                    </div>
                  ) : null}

                  <div className="history-card-footer">
                    <button 
                      className="btn-abrir-leitura"
                      onClick={() => setLeituraVisualizando(item)}
                    >
                      <i className="bi bi-eye"></i> Revisar Trechos & Notas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DETALHADO DE REVISÃO DE LEITURA SALVA                    */}
      {/* ============================================================== */}
      {leituraVisualizando && (
        <div className="savoring-modal-overlay" onClick={() => setLeituraVisualizando(null)}>
          <div className="savoring-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div>
                <h2>{leituraVisualizando.titulo}</h2>
                <span className="modal-meta">
                  <i className="bi bi-calendar-event"></i> Realizada em {new Date(leituraVisualizando.data).toLocaleDateString('pt-BR')} • {leituraVisualizando.totalTrechos || leituraVisualizando.trechos?.length || 0} trechos
                </span>
              </div>
              <button className="btn-close-modal" onClick={() => setLeituraVisualizando(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              {/* Síntese Final */}
              {leituraVisualizando.resumo && (
                <div className="modal-sintese-box">
                  <h4><i className="bi bi-feather"></i> Síntese Consolidada:</h4>
                  <p>{leituraVisualizando.resumo}</p>
                </div>
              )}

              {/* Anotações por Trecho */}
              <h4><i className="bi bi-journal-text"></i> Trechos e Reflexões Registradas:</h4>
              {(!leituraVisualizando.anotacoes || leituraVisualizando.anotacoes.length === 0) ? (
                <p className="sem-anotacoes-msg">Nenhuma reflexão foi gravada durante esta leitura.</p>
              ) : (
                <div className="modal-anotacoes-list">
                  {leituraVisualizando.anotacoes.map((a, idx) => {
                    const trechoObj = leituraVisualizando.trechos 
                      ? leituraVisualizando.trechos.find(t => t.numero === a.trecho) 
                      : null;
                    const textoTrecho = trechoObj ? trechoObj.texto : (leituraVisualizando.trechos && leituraVisualizando.trechos[a.trecho - 1] ? (typeof leituraVisualizando.trechos[a.trecho - 1] === 'object' ? leituraVisualizando.trechos[a.trecho - 1].texto : leituraVisualizando.trechos[a.trecho - 1]) : 'Trecho de texto');

                    return (
                      <div key={idx} className="modal-anotacao-card">
                        <div className="anotacao-card-top">
                          <strong><i className="bi bi-bookmark-fill"></i> Trecho {a.trecho}</strong>
                          <button 
                            className="btn-editar-nota"
                            onClick={() => editarAnotacao(idx, true)}
                          >
                            <i className="bi bi-pencil"></i> Editar Reflexão
                          </button>
                        </div>
                        <div className="modal-trecho-original">
                          {textoTrecho}
                        </div>
                        <div className="modal-reflexao-user">
                          <strong>💡 Sua reflexão:</strong>
                          <p>{a.texto}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              <button className="btn-secundario" onClick={() => copiarNotas(leituraVisualizando)}>
                <i className="bi bi-clipboard"></i> Copiar Resumo
              </button>
              <button className="btn-fechar-modal" onClick={() => setLeituraVisualizando(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
