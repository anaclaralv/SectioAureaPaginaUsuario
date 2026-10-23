import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import './relogio.css';
import { apiFetch } from '../api';

export default function Relogio() {
  // ==================== ESTADOS PRINCIPAIS ====================
  const [materias, setMaterias] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [estudoAtual, setEstudoAtual] = useState(null);
  const [estudoPausado, setEstudoPausado] = useState(false);
  const [segundosSessaoAtual, setSegundosSessaoAtual] = useState(0);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  
  // Histórico do Cronômetro (API)
  const [historicoCronometro, setHistoricoCronometro] = useState([]);
  const [acordeonAberto, setAcordeonAberto] = useState(false);

  // Timer e Cronômetro
  const [timerTempo, setTimerTempo] = useState(0);
  const [timerRodando, setTimerRodando] = useState(false);
  const timerIntervalRef = useRef(null);

  const [cronometro, setCronometro] = useState(0);
  const [cronometroRodando, setCronometroRodando] = useState(false);
  const cronometroIntervalRef = useRef(null);

  // Pomodoro
  const [pomodoroTempo, setPomodoroTempo] = useState(1500);
  const [pomodoroRodando, setPomodoroRodando] = useState(false);
  const [modoPomodoro, setModoPomodoro] = useState('foco');
  const [tempoFocoConfig, setTempoFocoConfig] = useState(25);
  const [tempoPausaConfig, setTempoPausaConfig] = useState(5);
  const [estudoIdPomodoro, setEstudoIdPomodoro] = useState(null);
  const pomodoroIntervalRef = useRef(null);

  // Refs para sincronização sem stale closures
  const modoPomodoroRef = useRef('foco');
  const tempoFocoConfigRef = useRef(25);
  const tempoPausaConfigRef = useRef(5);
  const estudoIdPomodoroRef = useRef(null);
  const pomodoroTempoRef = useRef(1500);
  const pomodoroRodandoRef = useRef(false);
  const materiasRef = useRef([]);
  const estudoAtualRef = useRef(null);

  useEffect(() => { modoPomodoroRef.current = modoPomodoro; }, [modoPomodoro]);
  useEffect(() => { tempoFocoConfigRef.current = tempoFocoConfig; }, [tempoFocoConfig]);
  useEffect(() => { tempoPausaConfigRef.current = tempoPausaConfig; }, [tempoPausaConfig]);
  useEffect(() => { estudoIdPomodoroRef.current = estudoIdPomodoro; }, [estudoIdPomodoro]);
  useEffect(() => { pomodoroTempoRef.current = pomodoroTempo; }, [pomodoroTempo]);
  useEffect(() => { pomodoroRodandoRef.current = pomodoroRodando; }, [pomodoroRodando]);
  useEffect(() => { materiasRef.current = materias; }, [materias]);
  useEffect(() => { estudoAtualRef.current = estudoAtual; }, [estudoAtual]);

  // Modo Foco (React Nativo)
  const [modoFocoAtivo, setModoFocoAtivo] = useState(false);
  const [focoMateria, setFocoMateria] = useState(null);
  const [focoTempoTotal, setFocoTempoTotal] = useState(25 * 60);
  const [focoTempoRestante, setFocoTempoRestante] = useState(25 * 60);
  const [focoRodando, setFocoRodando] = useState(false);
  const [confirmandoSaidaFoco, setConfirmandoSaidaFoco] = useState(false);
  const focoIntervalRef = useRef(null);
  const focoTempoRestanteRef = useRef(25 * 60);
  useEffect(() => { focoTempoRestanteRef.current = focoTempoRestante; }, [focoTempoRestante]);

  // Estudo por matéria
  const estudoIntervalRef = useRef(null);

  // Metas (LocalStorage)
  const [metas, setMetas] = useState({ diaria: 0.5, semanal: 3.5, mensal: 14 });
  const [metaAtiva, setMetaAtiva] = useState('semanal');

  // Refs para Modais Bootstrap
  const modalPomodoroRef = useRef(null);
  const modalFocoRef = useRef(null);
  const modalMetaRef = useRef(null);
  const modalInstancePomodoro = useRef(null);
  const modalInstanceFoco = useRef(null);
  const modalInstanceMeta = useRef(null);

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatarTempo = (segundos) => {
    const total = Math.max(0, Math.floor(segundos || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatarTempoCurto = (segundos) => {
    const total = Math.max(0, Math.floor(segundos || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatarMeta = (horasDecimais) => {
    const totalSegundos = Math.round((horasDecimais || 0) * 3600);
    if (totalSegundos <= 0) return '0min';
    if (totalSegundos < 60) return `${totalSegundos}s`;
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.round((totalSegundos % 3600) / 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  const converterTempoParaSegundos = (tempoStr) => {
    if (!tempoStr) return 0;
    const partes = String(tempoStr).split(':');
    return (
      (parseInt(partes[0]) || 0) * 3600 +
      (parseInt(partes[1]) || 0) * 60 +
      (parseInt(partes[2]) || 0)
    );
  };

  const calcularSegundosMateria = (materia) => {
    if (!materia) return 0;
    let total = 0;
    historicoCronometro.forEach((sessao) => {
      const mesmoId = sessao.id_materia && String(sessao.id_materia) === String(materia.id_materia);
      const mesmoNome =
        !sessao.id_materia &&
        sessao.nome_materia &&
        sessao.nome_materia.toLowerCase() === String(materia.nome || '').toLowerCase();
      if (mesmoId || mesmoNome) {
        total += converterTempoParaSegundos(sessao.tempo_cronometro);
      }
    });
    if (estudoAtual && String(estudoAtual.id_materia) === String(materia.id_materia)) {
      total += segundosSessaoAtual;
    }
    return total;
  };

  const converterParaHoras = (horas, minutos) => {
    return (parseInt(horas) || 0) + ((parseInt(minutos) || 0) / 60);
  };

  // ==================== CARREGAR DADOS DA API ====================
  const carregarDados = async () => {
    try {
      const resMat = await apiFetch('materias');
      if (resMat.ok) setMaterias(await resMat.json());

      const resCron = await apiFetch('cronogramas');
      if (resCron.ok) setCronograma(await resCron.json());

      await carregarHistorico();
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  const carregarHistorico = async () => {
    try {
      const res = await apiFetch('cronometros');
      if (res.ok) {
        const data = await res.json();
        setHistoricoCronometro(data);
      }
    } catch (err) { console.error("Erro ao carregar histórico:", err); }
  };

  // Cadastro de Matéria Inline
  const [criandoMateriaTabela, setCriandoMateriaTabela] = useState(false);
  const [criandoMateriaPomodoro, setCriandoMateriaPomodoro] = useState(false);
  const [criandoMateriaFoco, setCriandoMateriaFoco] = useState(false);
  const [nomeNovaMateria, setNomeNovaMateria] = useState('');
  const [corNovaMateria, setCorNovaMateria] = useState('#9f042c');
  const [salvandoMateria, setSalvandoMateria] = useState(false);

  const salvarNovaMateria = async (origem = 'tabela') => {
    const nomeTrim = nomeNovaMateria.trim();
    if (!nomeTrim) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Por favor, digite o nome da matéria.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    setSalvandoMateria(true);
    try {
      const response = await apiFetch('materias', {
        method: 'POST',
        body: JSON.stringify({ nome: nomeTrim, cor: corNovaMateria || '#9f042c' })
      });

      if (response.ok) {
        const data = await response.json();
        const resMat = await apiFetch('materias');
        if (resMat.ok) {
          const novasMats = await resMat.json();
          setMaterias(Array.isArray(novasMats) ? novasMats : []);
        }

        setNomeNovaMateria('');
        setCorNovaMateria('#9f042c');

        if (origem === 'tabela') {
          setCriandoMateriaTabela(false);
        } else if (origem === 'pomodoro') {
          setCriandoMateriaPomodoro(false);
          setTimeout(() => {
            const pSelect = document.getElementById('pomodoroMateria');
            if (pSelect && data.id_materia) pSelect.value = String(data.id_materia);
          }, 50);
        } else if (origem === 'foco') {
          setCriandoMateriaFoco(false);
          setTimeout(() => {
            const fSelect = document.getElementById('focoMateriaSelect');
            if (fSelect && data.id_materia) fSelect.value = String(data.id_materia);
          }, 50);
        }

        Swal.fire({
          icon: 'success',
          title: 'Matéria cadastrada!',
          text: `"${nomeTrim}" foi adicionada com sucesso.`,
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        const erro = await response.json().catch(() => ({}));
        Swal.fire('Erro', erro.message || 'Não foi possível cadastrar a matéria.', 'error');
      }
    } catch (err) {
      Swal.fire('Erro', 'Falha ao conectar com o servidor.', 'error');
    } finally {
      setSalvandoMateria(false);
    }
  };

  useEffect(() => {
    carregarDados();
    
    // Carregar configs locais
    const notifSalvas = localStorage.getItem('notificacoesAtivas');
    if (notifSalvas !== null) setNotificacoesAtivas(notifSalvas === 'true');
    
    const metasSalvas = localStorage.getItem('metas');
    if (metasSalvas) setMetas(JSON.parse(metasSalvas));
    
    const metaAtivaSalva = localStorage.getItem('metaAtiva');
    if (metaAtivaSalva) setMetaAtiva(metaAtivaSalva);

    // Inicializar Modais Bootstrap
    if (window.bootstrap) {
      if (modalPomodoroRef.current) modalInstancePomodoro.current = new window.bootstrap.Modal(modalPomodoroRef.current);
      if (modalFocoRef.current) modalInstanceFoco.current = new window.bootstrap.Modal(modalFocoRef.current);
      if (modalMetaRef.current) modalInstanceMeta.current = new window.bootstrap.Modal(modalMetaRef.current);
    }

    return () => {
      clearInterval(estudoIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      clearInterval(cronometroIntervalRef.current);
      clearInterval(pomodoroIntervalRef.current);
    };
  }, []);

  // Salvar no localStorage as metas e notificações
  useEffect(() => { localStorage.setItem('notificacoesAtivas', notificacoesAtivas); }, [notificacoesAtivas]);
  useEffect(() => { localStorage.setItem('metas', JSON.stringify(metas)); }, [metas]);
  useEffect(() => { localStorage.setItem('metaAtiva', metaAtiva); }, [metaAtiva]);

  // ==================== SALVAR NA API (GERAL) ====================
  const salvarSessaoAPI = async (idMateria, segundos, descricao, exibirToast = true) => {
    if (!segundos || segundos <= 0) return false;

    const tempoFormatado = formatarTempo(segundos);
    const agora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dataHoje = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
    const dataLocal = `${dataHoje} ${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;

    const idMatNum = idMateria && !isNaN(parseInt(idMateria)) ? parseInt(idMateria) : null;

    const payload = {
      tempo_cronometro: tempoFormatado,
      descricao: descricao || 'Estudo',
      id_materia: idMatNum,
      created_at: dataLocal
    };

    try {
      const response = await apiFetch('cronometros', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        try {
          const chaveMat = idMatNum ? String(idMatNum) : 'geral';
          const salvo = JSON.parse(localStorage.getItem('tempoEstudo') || '{}');
          if (!salvo[chaveMat] || typeof salvo[chaveMat] !== 'object') {
            salvo[chaveMat] = { total: Number(salvo[chaveMat]) || 0, historico: {} };
          }
          salvo[chaveMat].total = (salvo[chaveMat].total || 0) + segundos;
          if (!salvo[chaveMat].historico) salvo[chaveMat].historico = {};
          salvo[chaveMat].historico[dataHoje] = (salvo[chaveMat].historico[dataHoje] || 0) + segundos;
          localStorage.setItem('tempoEstudo', JSON.stringify(salvo));
        } catch (e) {}

        await carregarHistorico();
        if (exibirToast) {
          Swal.fire({
            icon: 'success',
            title: 'Tempo salvo!',
            text: `${tempoFormatado} registrados em tempo de estudo.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
        return true;
      } else {
        const erro = await response.json().catch(() => ({}));
        Swal.fire('Erro', erro.message || 'Não foi possível salvar o tempo.', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Falha ao conectar com o servidor.', 'error');
      return false;
    }
  };

  const excluirRegistroHistorico = async (id) => {
    Swal.fire({
      title: 'Excluir registro?',
      text: 'Essa ação removerá o registro do seu histórico.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await apiFetch(`cronometros/${id}`, { method: 'DELETE' });
          if (res.ok) {
            await carregarHistorico();
            Swal.fire({
              icon: 'success',
              title: 'Excluído!',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          } else {
            const err = await res.json().catch(() => ({}));
            Swal.fire('Erro', err.message || 'Não foi possível excluir.', 'error');
          }
        } catch (e) {
          Swal.fire('Erro', 'Falha ao conectar à API.', 'error');
        }
      }
    });
  };

  // ==================== CRONÔMETRO AVULSO E INDEPENDENTE ====================
  const iniciarCronometro = () => {
    if (cronometroRodando) return;
    setCronometroRodando(true);
    clearInterval(cronometroIntervalRef.current);
    cronometroIntervalRef.current = setInterval(() => {
      setCronometro((prev) => prev + 1);
    }, 1000);
  };

  const pausarCronometro = () => {
    clearInterval(cronometroIntervalRef.current);
    setCronometroRodando(false);
  };

  const salvarCronometro = async () => {
    if (cronometro <= 0) {
      return Swal.fire({
        icon: 'info',
        title: 'Nenhum tempo',
        text: 'Inicie o cronômetro para registrar algum tempo.',
        timer: 1500,
        showConfirmButton: false
      });
    }

    pausarCronometro();
    const sucesso = await salvarSessaoAPI(null, cronometro, 'Cronômetro Avulso');
    if (sucesso) {
      setCronometro(0);
    }
  };

  const resetarCronometro = () => {
    if (cronometro > 0) {
      Swal.fire({
        title: 'Zerar cronômetro?',
        text: 'Deseja salvar o tempo registrado antes de zerar?',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Salvar e Zerar',
        denyButtonText: 'Apenas Zerar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#22c55e',
        denyButtonColor: '#ef4444'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await salvarCronometro();
        } else if (result.isDenied) {
          pausarCronometro();
          setCronometro(0);
        }
      });
    } else {
      pausarCronometro();
      setCronometro(0);
    }
  };

  // ==================== ESTUDO POR MATÉRIA ====================
  const iniciarEstudo = (idMateria) => {
    const materia = materias.find((m) => m.id_materia == idMateria);
    if (!materia) return;

    if (estudoAtual && estudoAtual.id_materia === materia.id_materia && estudoPausado) {
      setEstudoPausado(false);
      clearInterval(estudoIntervalRef.current);
      estudoIntervalRef.current = setInterval(() => {
        setSegundosSessaoAtual((prev) => prev + 1);
      }, 1000);
      return;
    }

    if (estudoAtual && estudoAtual.id_materia !== materia.id_materia) {
      Swal.fire({
        title: 'Trocar matéria?',
        text: `Você já está estudando ${estudoAtual.nome}. Deseja salvar e iniciar ${materia.nome}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, salvar e trocar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          if (segundosSessaoAtual > 0) {
            salvarSessaoAPI(estudoAtual.id_materia, segundosSessaoAtual, `Estudo (${estudoAtual.nome})`);
          }
          comecarEstudoDireto(materia);
        }
      });
      return;
    }

    comecarEstudoDireto(materia);
  };

  const comecarEstudoDireto = (materia) => {
    clearInterval(estudoIntervalRef.current);
    setEstudoAtual(materia);
    setEstudoPausado(false);
    setSegundosSessaoAtual(0);

    estudoIntervalRef.current = setInterval(() => {
      setSegundosSessaoAtual((prev) => prev + 1);
    }, 1000);

    if (notificacoesAtivas) {
      Swal.fire({
        icon: 'success',
        title: `Estudando: ${materia.nome}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const pausarEstudo = () => {
    clearInterval(estudoIntervalRef.current);
    setEstudoPausado(true);
  };

  const finalizarEstudo = () => {
    if (!estudoAtual) return;
    const materia = estudoAtual;

    Swal.fire({
      title: 'Finalizar estudo?',
      html: `<p>Matéria: <strong>${materia.nome}</strong></p><p>Tempo estudado: <strong>${formatarTempo(segundosSessaoAtual)}</strong></p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, finalizar e salvar',
      cancelButtonText: 'Continuar estudando',
      confirmButtonColor: '#22c55e'
    }).then(async (result) => {
      if (result.isConfirmed) {
        clearInterval(estudoIntervalRef.current);
        if (segundosSessaoAtual > 0) {
          await salvarSessaoAPI(materia.id_materia, segundosSessaoAtual, `Estudo (${materia.nome})`);
        }
        setEstudoAtual(null);
        setEstudoPausado(false);
        setSegundosSessaoAtual(0);
      }
    });
  };

  // ==================== TIMER REGRESSIVO ====================
  const iniciarTimer = () => {
    if (timerTempo > 0 && !timerRodando) {
      setTimerRodando(true);
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimerTempo((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRodando(false);
            Swal.fire({
              icon: 'info',
              title: '⏰ Tempo esgotado!',
              text: 'Seu timer finalizou.',
              timer: 3000,
              showConfirmButton: false
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    const min = parseInt(document.getElementById('timerMinutos')?.value) || 0;
    const seg = parseInt(document.getElementById('timerSegundos')?.value) || 0;
    const total = min * 60 + seg;
    if (total <= 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Tempo inválido',
        text: 'Insira um valor maior que 0 minutos ou segundos.',
        timer: 1500,
        showConfirmButton: false
      });
    }

    setTimerTempo(total);
    setTimerRodando(true);
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerTempo((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerRodando(false);
          Swal.fire({
            icon: 'info',
            title: '⏰ Tempo esgotado!',
            text: 'Seu timer finalizou.',
            timer: 3000,
            showConfirmButton: false
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pararTimer = () => {
    clearInterval(timerIntervalRef.current);
    setTimerRodando(false);
  };

  const resetarTimer = () => {
    pararTimer();
    setTimerTempo(0);
    const mInput = document.getElementById('timerMinutos');
    const sInput = document.getElementById('timerSegundos');
    if (mInput) mInput.value = '';
    if (sInput) sInput.value = '';
  };

  // ==================== POMODORO ====================
  const abrirModalPomodoro = () => {
    const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
    if (plano === 'gratuito') {
      return Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: 'O <strong>Pomodoro Personalizado</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
        confirmButtonText: 'Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
        }
      });
    }
    modalInstancePomodoro.current?.show();
  };

  const iniciarPomodoro = (forcarInicio = false) => {
    if (pomodoroRodandoRef.current && !forcarInicio) return;
    pomodoroRodandoRef.current = true;
    setPomodoroRodando(true);
    clearInterval(pomodoroIntervalRef.current);

    pomodoroIntervalRef.current = setInterval(() => {
      if (pomodoroTempoRef.current <= 1) {
        clearInterval(pomodoroIntervalRef.current);
        pomodoroRodandoRef.current = false;
        setPomodoroRodando(false);

        if (modoPomodoroRef.current === 'foco') {
          const matId = estudoIdPomodoroRef.current || estudoAtualRef.current?.id_materia || null;
          const tempoSegundos = Math.max(1, (tempoFocoConfigRef.current || 25) * 60);
          const listaMats = materiasRef.current || [];
          const nomeMateria = matId
            ? listaMats.find((m) => String(m.id_materia) === String(matId))?.nome
            : null;
          const desc = nomeMateria
            ? `Pomodoro (${nomeMateria})`
            : `Pomodoro (${tempoFocoConfigRef.current} min)`;

          const tempoPausaSeg = Math.max(1, (tempoPausaConfigRef.current || 5) * 60);
          modoPomodoroRef.current = 'pausa';
          pomodoroTempoRef.current = tempoPausaSeg;
          setModoPomodoro('pausa');
          setPomodoroTempo(tempoPausaSeg);

          salvarSessaoAPI(matId, tempoSegundos, desc, false).then((salvou) => {
            Swal.fire({
              icon: salvou ? 'success' : 'warning',
              title: '🍅 Foco concluído!',
              text: salvou
                ? `Tempo (${formatarTempo(tempoSegundos)}) salvo em tempo de estudo! Hora de uma pausa de ${tempoPausaConfigRef.current} min.`
                : 'Foco concluído, mas não foi possível salvar o tempo no servidor.',
              timer: 3500,
              showConfirmButton: false
            });
          });
        } else {
          const tempoFocoSeg = Math.max(1, (tempoFocoConfigRef.current || 25) * 60);
          modoPomodoroRef.current = 'foco';
          pomodoroTempoRef.current = tempoFocoSeg;
          setModoPomodoro('foco');
          setPomodoroTempo(tempoFocoSeg);

          Swal.fire({
            icon: 'info',
            title: '☕ Pausa finalizada!',
            text: 'Pronto para voltar ao foco?',
            timer: 3000,
            showConfirmButton: false
          });
        }
      } else {
        const novoTempo = pomodoroTempoRef.current - 1;
        pomodoroTempoRef.current = novoTempo;
        setPomodoroTempo(novoTempo);
      }
    }, 1000);
  };

  const iniciarPomodoroPersonalizado = () => {
    const materiaId = document.getElementById('pomodoroMateria')?.value;
    const tempoEstudoVal = Math.max(1, parseInt(document.getElementById('pomodoroTempoEstudo')?.value || 25));
    const tempoPausa = Math.max(1, parseInt(document.getElementById('pomodoroTempoPausa')?.value || 5));

    setTempoFocoConfig(tempoEstudoVal);
    setTempoPausaConfig(tempoPausa);
    setEstudoIdPomodoro(materiaId || null);

    tempoFocoConfigRef.current = tempoEstudoVal;
    tempoPausaConfigRef.current = tempoPausa;
    estudoIdPomodoroRef.current = materiaId || null;

    modoPomodoroRef.current = 'foco';
    setModoPomodoro('foco');
    setPomodoroTempo(tempoEstudoVal * 60);
    pomodoroTempoRef.current = tempoEstudoVal * 60;

    modalInstancePomodoro.current?.hide();

    clearInterval(pomodoroIntervalRef.current);
    pomodoroRodandoRef.current = false;
    setPomodoroRodando(false);
    iniciarPomodoro(true);
  };

  const pausarPomodoro = () => {
    clearInterval(pomodoroIntervalRef.current);
    pomodoroRodandoRef.current = false;
    setPomodoroRodando(false);
  };

  const salvarPomodoro = async () => {
    if (modoPomodoroRef.current !== 'foco') {
      return Swal.fire({
        icon: 'info',
        title: 'Modo Pausa',
        text: 'O tempo de pausa não é computado no histórico de estudos.',
        timer: 2000,
        showConfirmButton: false
      });
    }

    const tempoTotalFoco = tempoFocoConfigRef.current * 60;
    const segundosEstudados = tempoTotalFoco - pomodoroTempoRef.current;

    if (segundosEstudados < 10) {
      return Swal.fire({
        icon: 'info',
        title: 'Tempo insuficiente',
        text: 'Estude pelo menos 10 segundos antes de salvar.',
        timer: 2000,
        showConfirmButton: false
      });
    }

    pausarPomodoro();

    const matId = estudoIdPomodoroRef.current || estudoAtualRef.current?.id_materia || null;
    const listaMats = materiasRef.current || [];
    const nomeMateria = matId ? listaMats.find((m) => String(m.id_materia) === String(matId))?.nome : null;
    const desc = nomeMateria ? `Pomodoro (${nomeMateria})` : 'Pomodoro';

    const ok = await salvarSessaoAPI(matId, segundosEstudados, desc);
    if (ok) {
      const tempoFocoSeg = tempoFocoConfigRef.current * 60;
      modoPomodoroRef.current = 'foco';
      pomodoroTempoRef.current = tempoFocoSeg;
      setModoPomodoro('foco');
      setPomodoroTempo(tempoFocoSeg);
    }
  };

  const resetarPomodoro = () => {
    pausarPomodoro();
    const tempoTotalFoco = tempoFocoConfigRef.current * 60;
    const segundosEstudados = modoPomodoroRef.current === 'foco' ? tempoTotalFoco - pomodoroTempoRef.current : 0;

    if (modoPomodoroRef.current === 'foco' && segundosEstudados >= 20) {
      Swal.fire({
        title: 'Zerar Pomodoro?',
        html: `Você focou por <strong>${formatarTempo(segundosEstudados)}</strong>.<br/>Deseja salvar esse tempo no histórico antes de zerar?`,
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Salvar e Zerar',
        denyButtonText: 'Apenas Zerar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#22c55e',
        denyButtonColor: '#ef4444'
      }).then(async (result) => {
        if (result.isConfirmed) {
          const matId = estudoIdPomodoroRef.current || estudoAtualRef.current?.id_materia || null;
          const listaMats = materiasRef.current || [];
          const nomeMateria = matId ? listaMats.find((m) => String(m.id_materia) === String(matId))?.nome : null;
          const desc = nomeMateria ? `Pomodoro (${nomeMateria})` : 'Pomodoro';
          await salvarSessaoAPI(matId, segundosEstudados, desc);

          const tempoFocoSeg = tempoFocoConfigRef.current * 60;
          modoPomodoroRef.current = 'foco';
          pomodoroTempoRef.current = tempoFocoSeg;
          setModoPomodoro('foco');
          setPomodoroTempo(tempoFocoSeg);
        } else if (result.isDenied) {
          const tempoFocoSeg = tempoFocoConfigRef.current * 60;
          modoPomodoroRef.current = 'foco';
          pomodoroTempoRef.current = tempoFocoSeg;
          setModoPomodoro('foco');
          setPomodoroTempo(tempoFocoSeg);
        }
      });
    } else {
      const tempoFocoSeg = tempoFocoConfigRef.current * 60;
      modoPomodoroRef.current = 'foco';
      pomodoroTempoRef.current = tempoFocoSeg;
      setModoPomodoro('foco');
      setPomodoroTempo(tempoFocoSeg);
    }
  };

  // ==================== MODO FOCO (REACT NATIVO) ====================
  const abrirModalModoFoco = () => {
    const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
    if (plano === 'gratuito') {
      return Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: 'O <strong>Modo Foco</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
        confirmButtonText: 'Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
        }
      });
    }
    modalInstanceFoco.current?.show();
  };

  const iniciarModoFocoPersonalizado = () => {
    const materiaId = document.getElementById('focoMateriaSelect')?.value;
    const tempoFoco = parseInt(document.getElementById('focoTempoPersonalizado')?.value || 25);

    if (!materiaId) {
      return Swal.fire({
        icon: 'warning',
        title: 'Selecione uma matéria!',
        text: 'Escolha qual matéria você vai focar.',
        timer: 1500,
        showConfirmButton: false
      });
    }

    const mat = materias.find((m) => m.id_materia == materiaId);
    if (!mat) return;

    modalInstanceFoco.current?.hide();

    const segTotal = Math.max(1, tempoFoco) * 60;
    focoTempoRestanteRef.current = segTotal;
    setFocoMateria(mat);
    setFocoTempoTotal(segTotal);
    setFocoTempoRestante(segTotal);
    setConfirmandoSaidaFoco(false);
    setModoFocoAtivo(true);
    setFocoRodando(true);
  };

  useEffect(() => {
    if (modoFocoAtivo && focoRodando) {
      focoIntervalRef.current = setInterval(() => {
        if (focoTempoRestanteRef.current <= 1) {
          clearInterval(focoIntervalRef.current);
          focoTempoRestanteRef.current = 0;
          setFocoTempoRestante(0);
          setFocoRodando(false);
          setModoFocoAtivo(false);
          salvarSessaoAPI(focoMateria?.id_materia, focoTempoTotal, `Modo Foco (${focoMateria?.nome})`, false).then(() => {
            Swal.fire({
              icon: 'success',
              title: '🎉 Foco concluído!',
              text: `Parabéns! Você concluiu seus estudos em ${focoMateria?.nome || 'sua matéria'}!`,
              timer: 3500,
              showConfirmButton: false
            });
          });
        } else {
          const novoRestante = focoTempoRestanteRef.current - 1;
          focoTempoRestanteRef.current = novoRestante;
          setFocoTempoRestante(novoRestante);
        }
      }, 1000);
    } else {
      clearInterval(focoIntervalRef.current);
    }

    return () => clearInterval(focoIntervalRef.current);
  }, [modoFocoAtivo, focoRodando, focoMateria, focoTempoTotal]);

  const sairModoFoco = () => {
    const tempoEstudado = focoTempoTotal - focoTempoRestante;
    if (tempoEstudado >= 15 && focoMateria) {
      // Pausa o cronômetro e exibe confirmação inline dentro do card
      setFocoRodando(false);
      setConfirmandoSaidaFoco(true);
    } else {
      setConfirmandoSaidaFoco(false);
      setModoFocoAtivo(false);
      setFocoRodando(false);
    }
  };

  const salvarESairModoFoco = async () => {
    const tempoEstudado = focoTempoTotal - focoTempoRestante;
    if (focoMateria && tempoEstudado > 0) {
      await salvarSessaoAPI(focoMateria.id_materia, tempoEstudado, `Modo Foco (${focoMateria.nome})`);
      Swal.fire({
        icon: 'success',
        title: 'Tempo registrado!',
        text: `Seus estudos em "${focoMateria.nome}" foram salvos com sucesso.`,
        timer: 2000,
        showConfirmButton: false
      });
    }
    setConfirmandoSaidaFoco(false);
    setModoFocoAtivo(false);
    setFocoRodando(false);
  };

  const sairSemSalvarModoFoco = () => {
    setConfirmandoSaidaFoco(false);
    setModoFocoAtivo(false);
    setFocoRodando(false);
  };

  // ==================== METAS E RELÓGIO ====================
  const calcularHorasEstudadas = (periodo) => {
    const hoje = new Date();
    let totalSegundos = 0;
    const formatarData = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const hojeStr = formatarData(hoje);
    let dataInicioStr = hojeStr;

    if (periodo === 'semanal') {
      const d = new Date();
      d.setDate(hoje.getDate() - 7);
      dataInicioStr = formatarData(d);
    } else if (periodo === 'mensal') {
      const d = new Date();
      d.setDate(hoje.getDate() - 30);
      dataInicioStr = formatarData(d);
    }

    historicoCronometro.forEach((sessao) => {
      if (!sessao.created_at || !sessao.tempo_cronometro) return;
      const dataSessao = sessao.created_at.split(' ')[0];
      const dentroDoPeriodo = (periodo === 'diaria')
        ? (dataSessao >= hojeStr)
        : (dataSessao >= dataInicioStr);

      if (dentroDoPeriodo) {
        const partes = sessao.tempo_cronometro.split(':');
        const segs =
          (parseInt(partes[0]) || 0) * 3600 +
          (parseInt(partes[1]) || 0) * 60 +
          (parseInt(partes[2]) || 0);
        totalSegundos += segs;
      }
    });

    return totalSegundos / 3600;
  };

  const abrirModalMeta = () => {
    const plano = (localStorage.getItem('planoUsuario') || 'gratuito').toLowerCase().trim();
    if (plano === 'gratuito') {
      return Swal.fire({
        icon: 'info',
        title: 'Recurso Premium',
        html: 'A <strong>Meta de Estudo</strong> está disponível nos planos <strong>Básico</strong> e <strong>Pro</strong>.',
        confirmButtonText: 'Ver Planos',
        confirmButtonColor: '#9f042c',
        showCancelButton: true,
        cancelButtonText: 'Fechar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'planos' }));
        }
      });
    }
    modalInstanceMeta.current?.show();
  };

  const salvarMeta = () => {
    const dH = parseInt(document.getElementById('metaDiariaHoras')?.value || 0);
    const dM = parseInt(document.getElementById('metaDiariaMinutos')?.value || 0);
    const sH = parseInt(document.getElementById('metaSemanalHoras')?.value || 0);
    const sM = parseInt(document.getElementById('metaSemanalMinutos')?.value || 0);
    const mH = parseInt(document.getElementById('metaMensalHoras')?.value || 0);
    const mM = parseInt(document.getElementById('metaMensalMinutos')?.value || 0);

    const novasMetas = {
      diaria: converterParaHoras(dH, dM),
      semanal: converterParaHoras(sH, sM),
      mensal: converterParaHoras(mH, mM)
    };
    setMetas(novasMetas);
    modalInstanceMeta.current?.hide();
    Swal.fire({ icon: 'success', title: 'Metas salvas!', timer: 1500, showConfirmButton: false });
  };

  const obterMateriaAtual = () => {
    if (!cronograma || cronograma.length === 0) return null;
    const diasSemana = { 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado', 0: 'domingo' };
    const hoje = new Date();
    const diaSemana = diasSemana[hoje.getDay()];
    const horaAtual = String(hoje.getHours()).padStart(2, '0') + ':' + String(hoje.getMinutes()).padStart(2, '0');

    const blocosHoje = cronograma.filter((b) => b.dia_semana === diaSemana);
    const blocoAtual = blocosHoje.find(
      (b) => horaAtual >= b.hora_inicio?.substring(0, 5) && horaAtual < b.hora_final?.substring(0, 5)
    );

    if (blocoAtual) {
      return {
        materia: { nome: blocoAtual.nome_materia, id_materia: blocoAtual.id_materia },
        inicio: blocoAtual.hora_inicio.substring(0, 5),
        fim: blocoAtual.hora_final.substring(0, 5)
      };
    }
    return null;
  };

  const materiaAtualCronograma = obterMateriaAtual();
  const metaValor = metas[metaAtiva] || 0;
  const totalHoras = calcularHorasEstudadas(metaAtiva);
  const progresso = metaValor > 0 ? Math.min((totalHoras / metaValor) * 100, 100) : 0;
  const faltam = Math.max(metaValor - totalHoras, 0);

  return (
    <section id="relogioSection">
      {/* Cabeçalho Superior Padronizado (estilo Calendário) */}
      <div className="relogio-header-bar">
        <div className="relogio-header-titles">
          <h1><i className="bi bi-clock-fill"></i> Relógio de Estudos</h1>
          <p className="relogio-subtitle">Gerencie suas sessões de estudo, cronômetro, técnica Pomodoro e metas diárias</p>
        </div>
        <button className="btn-novo-relogio-main" onClick={() => abrirModalPomodoro()}>
          <i className="bi bi-play-circle-fill"></i> Iniciar Pomodoro
        </button>
      </div>

      {/* Painel de Métricas Padronizado (estilo Calendário) */}
      <div className="relogio-metricas-grid">
        <div className="rel-metric-card">
          <div className="rel-metric-icon tempo">
            <i className="bi bi-stopwatch-fill"></i>
          </div>
          <div className="rel-metric-info">
            <span className="rel-metric-num">{totalHoras >= 1 ? `${totalHoras.toFixed(1)}h` : formatarTempo(totalHoras * 3600)}</span>
            <span className="rel-metric-label">Tempo Estudado</span>
          </div>
        </div>

        <div className="rel-metric-card">
          <div className="rel-metric-icon sessoes">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div className="rel-metric-info">
            <span className="rel-metric-num">{historicoCronometro.length}</span>
            <span className="rel-metric-label">Sessões Realizadas</span>
          </div>
        </div>

        <div className="rel-metric-card">
          <div className="rel-metric-icon materias">
            <i className="bi bi-journal-bookmark-fill"></i>
          </div>
          <div className="rel-metric-info">
            <span className="rel-metric-num">{materias.length}</span>
            <span className="rel-metric-label">Matérias Ativas</span>
          </div>
        </div>

        <div className="rel-metric-card">
          <div className="rel-metric-icon meta">
            <i className="bi bi-trophy-fill"></i>
          </div>
          <div className="rel-metric-info">
            <span className="rel-metric-num">{Math.round(progresso)}%</span>
            <span className="rel-metric-label">Meta {metaAtiva}</span>
          </div>
        </div>
      </div>

      {/* ==================== ESTUDO POR MATÉRIA ==================== */}
      <div className="relogio-card-main mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="titulo-materia" style={{ margin: 0, border: 'none', padding: 0 }}>
              <i className="bi bi-book-half" style={{ color: 'var(--cor-primaria)', marginRight: '8px' }}></i>
              Estudo por Matéria
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
              Inicie o cronômetro individual de cada disciplina para contabilizar seu tempo
            </p>
          </div>
          <button
            onClick={() => {
              setCriandoMateriaTabela(!criandoMateriaTabela);
              setNomeNovaMateria('');
            }}
            className="btn-add-materia-modern"
            title={criandoMateriaTabela ? 'Fechar formulário' : 'Cadastrar nova matéria'}
          >
            {criandoMateriaTabela ? (
              <>✕ Cancelar</>
            ) : (
              <><i className="bi bi-plus-lg"></i> Adicionar Matéria</>
            )}
          </button>
        </div>

      {/* Formulário Inline de Nova Matéria na Tabela */}
      {criandoMateriaTabela && (
        <div style={{
          background: '#ffffff',
          border: '1.5px dashed var(--cor-primaria)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1f2937', fontWeight: 700 }}>
            ✨ Cadastrar Nova Matéria
          </h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                Nome da Matéria:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Biologia, Literatura, Redação"
                value={nomeNovaMateria}
                onChange={(e) => setNomeNovaMateria(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') salvarNovaMateria('tabela'); }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                Cor:
              </label>
              <input
                type="color"
                value={corNovaMateria}
                onChange={(e) => setCorNovaMateria(e.target.value)}
                style={{ width: '48px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                title="Escolha a cor da matéria"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn"
                disabled={salvandoMateria}
                onClick={() => salvarNovaMateria('tabela')}
                style={{ background: 'var(--cor-primaria)', color: '#fff', fontWeight: '600', padding: '8px 16px' }}
              >
                {salvandoMateria ? 'Salvando...' : 'Cadastrar Matéria'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setCriandoMateriaTabela(false);
                  setNomeNovaMateria('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="tabela-estudo mb-5">
        <thead>
          <tr>
            <th>Matéria</th>
            <th>Tempo Estudado</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {materias.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '25px 15px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>
                  Nenhuma matéria encontrada.
                </p>
                <button
                  onClick={() => setCriandoMateriaTabela(true)}
                  style={{
                    background: 'var(--cor-primaria)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="bi bi-plus-circle"></i> Cadastrar Primeira Matéria
                </button>
              </td>
            </tr>
          ) : (
            materias.map((m) => {
              const isEstaMateria = estudoAtual?.id_materia === m.id_materia;
              const tempoMateriaSegundos = calcularSegundosMateria(m);
              return (
                <tr key={m.id_materia} style={{ background: isEstaMateria ? '#fef2f2' : 'transparent' }}>
                  <td style={{ textAlign: 'left', paddingLeft: '20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: m.cor || 'var(--cor-primaria)',
                        marginRight: '8px'
                      }}
                    ></span>
                    <strong>{m.nome}</strong>
                    {isEstaMateria && (
                      <span
                        style={{
                          marginLeft: '10px',
                          fontWeight: '600',
                          color: estudoPausado ? '#f59e0b' : '#22c55e'
                        }}
                      >
                        {estudoPausado ? '⏸ Pausado' : '● Estudando'} ({formatarTempo(segundosSessaoAtual)})
                      </span>
                    )}
                  </td>
                  <td className="tempo" style={{ fontWeight: '700', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                    {formatarTempo(tempoMateriaSegundos)}
                  </td>
                  <td>
                    {isEstaMateria ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {estudoPausado ? (
                          <button
                            onClick={() => iniciarEstudo(m.id_materia)}
                            style={{
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '30px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            ▶ Continuar
                          </button>
                        ) : (
                          <button
                            onClick={pausarEstudo}
                            style={{
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '30px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            ⏸ Pausar
                          </button>
                        )}
                        <button
                          onClick={finalizarEstudo}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          ⏹ Finalizar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iniciarEstudo(m.id_materia)}
                        style={{
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          padding: '6px 18px',
                          borderRadius: '30px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ▶ Iniciar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>

      {/* ==================== 4 CARDS PRINCIPAIS ==================== */}
      <div
        className="relogio-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        {/* CARD 1: TIMER */}
        <div className="relogio-card">
          <h3>
            <i className="bi bi-hourglass-split"></i> Timer
          </h3>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '10px 0' }}>
            <input
              type="number"
              id="timerMinutos"
              placeholder="Min"
              min="0"
              max="180"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>:</span>
            <input
              type="number"
              id="timerSegundos"
              placeholder="Seg"
              min="0"
              max="59"
              style={{ width: '60px', textAlign: 'center' }}
            />
          </div>
          <div className="relogio-botoes">
            {!timerRodando ? (
              <button onClick={iniciarTimer}>{timerTempo > 0 ? 'Continuar' : 'Iniciar'}</button>
            ) : (
              <button onClick={pararTimer}>Pausar</button>
            )}
            <button onClick={resetarTimer}>Reset</button>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '10px' }}>
            {formatarTempoCurto(timerTempo)}
          </p>
        </div>

        {/* CARD 2: CRONÔMETRO AVULSO E INDEPENDENTE */}
        <div className="relogio-card">
          <h3>
            <i className="bi bi-stopwatch"></i> Cronômetro
          </h3>
          <p style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '10px 0' }}>
            {formatarTempo(cronometro)}
          </p>

          <div className="relogio-botoes">
            {!cronometroRodando ? (
              <button onClick={iniciarCronometro}>
                {cronometro > 0 ? 'Continuar' : 'Iniciar'}
              </button>
            ) : (
              <button onClick={pausarCronometro}>Pausar</button>
            )}
            <button
              onClick={salvarCronometro}
              disabled={cronometro === 0}
              style={{
                opacity: cronometro === 0 ? 0.5 : 1,
                background: cronometro > 0 ? '#22c55e' : undefined
              }}
              title="Salvar tempo no histórico"
            >
              Salvar
            </button>
            <button onClick={resetarCronometro}>Reset</button>
          </div>

          {/* ACORDEON DE HISTÓRICO */}
          <div style={{ width: '100%', marginTop: '15px', textAlign: 'left' }}>
            <div
              onClick={() => setAcordeonAberto(!acordeonAberto)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>
                Histórico <span style={{ color: 'var(--cor-primaria)' }}>({historicoCronometro.length})</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {acordeonAberto ? '▲' : '▼'}
              </span>
            </div>
            {acordeonAberto && (
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  marginTop: '6px',
                  border: '1px solid #f3f4f6',
                  borderRadius: '8px',
                  background: '#ffffff'
                }}
              >
                {historicoCronometro.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '12px' }}>
                    Nenhum tempo salvo ainda.
                  </p>
                ) : (
                  historicoCronometro.map((item) => (
                    <div
                      key={item.id_cron}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1f2937' }}>
                          {item.tempo_cronometro}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {item.nome_materia ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: item.cor_materia || '#9f042c'
                                }}
                              />
                              {item.nome_materia}
                            </span>
                          ) : (
                            <span>⏱ {item.descricao || 'Cronômetro'}</span>
                          )}
                          <span style={{ color: '#9ca3af' }}>• {item.created_at?.substring(5, 16)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => excluirRegistroHistorico(item.id_cron)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '4px 6px',
                          borderRadius: '4px'
                        }}
                        title="Excluir este registro"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: POMODORO */}
        <div className="relogio-card" id="cardPomodoro">
          <h3>
            <i
              className="bi bi-circle-fill"
              style={{
                color: modoPomodoro === 'foco' ? '#ef4444' : '#22c55e',
                fontSize: '0.8rem',
                marginRight: '6px'
              }}
            ></i>
            Pomodoro
          </h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0' }}>
            {formatarTempoCurto(pomodoroTempo)}
          </p>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: modoPomodoro === 'foco' ? '#ef4444' : '#22c55e'
            }}
          >
            {modoPomodoro === 'foco' ? '🎯 Ciclo de Foco' : '☕ Pausa / Descanso'}
          </div>
          <div style={{ width: '100%', marginBottom: '10px' }}>
            <select
              className="form-select form-select-sm"
              value={estudoIdPomodoro || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setEstudoIdPomodoro(val);
                estudoIdPomodoroRef.current = val;
              }}
              style={{ fontSize: '0.78rem', borderRadius: '8px' }}
              title="Escolha a matéria para somar no Tempo de Estudo"
            >
              <option value="">Matéria: Geral (ou selecione)</option>
              {materias.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>
                  📚 {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="relogio-botoes">
            {!pomodoroRodando ? (
              <button onClick={() => iniciarPomodoro(false)}>
                {pomodoroTempo < (modoPomodoro === 'foco' ? tempoFocoConfig : tempoPausaConfig) * 60 ? 'Continuar' : 'Iniciar'}
              </button>
            ) : (
              <button onClick={pausarPomodoro}>Pausar</button>
            )}
            <button
              onClick={salvarPomodoro}
              disabled={modoPomodoro !== 'foco' || pomodoroTempo >= tempoFocoConfig * 60}
              style={{
                opacity: modoPomodoro !== 'foco' || pomodoroTempo >= tempoFocoConfig * 60 ? 0.5 : 1,
                background: modoPomodoro === 'foco' && pomodoroTempo < tempoFocoConfig * 60 ? '#22c55e' : undefined
              }}
              title="Salvar tempo estudado até agora no histórico"
            >
              Salvar
            </button>
            <button onClick={resetarPomodoro}>Reset</button>
            <button
              onClick={abrirModalPomodoro}
              style={{ background: '#4b5563' }}
              title="Personalizar tempos e matéria"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* CARD 4: MODO FOCO */}
        <div className="relogio-card">
          <h3>
            <i className="bi bi-lightbulb"></i> Modo Foco
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '15px 0' }}>
            Foco total em tela cheia com matéria e temporizador imersivo.
          </p>
          <div className="relogio-botoes">
            <button onClick={abrirModalModoFoco} style={{ width: '100%', padding: '10px' }}>
              🧠 Iniciar Modo Foco
            </button>
          </div>
        </div>
      </div>

      {/* ==================== RELÓGIO INTELIGENTE + META ==================== */}
      <div
        className="relogio-duas-colunas"
        style={{ marginTop: '30px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}
      >
        {/* Relógio Inteligente */}
        <div className="relogio-info-card" style={{ flex: 1 }}>
          <div className="relogio-topo">
            <h2>{materiaAtualCronograma?.materia?.nome || 'Nenhuma matéria agora'}</h2>
            <p>
              {materiaAtualCronograma
                ? `${materiaAtualCronograma.inicio} - ${materiaAtualCronograma.fim}`
                : '--:-- - --:--'}
            </p>
          </div>
          <div className="relogio-meio" style={{ textAlign: 'center', margin: '20px 0' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cor-primaria)' }}>
              {estudoAtual
                ? `Sessão ativa: ${formatarTempo(segundosSessaoAtual)}`
                : 'Aguardando início...'}
            </p>
          </div>
          <div className="relogio-stats" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <div
              className="stat"
              style={{
                background: '#f8fafc',
                padding: '10px 20px',
                borderRadius: '12px',
                flex: 1,
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Hoje</span>
              <strong style={{ display: 'block', fontSize: '1.2rem' }}>
                {formatarTempo(calcularHorasEstudadas('diaria') * 3600)}
              </strong>
            </div>
          </div>
        </div>

        {/* Meta de Estudo */}
        <div
          className="meta-card-escuro"
          style={{
            flex: 1,
            background: 'white',
            padding: '20px',
            borderRadius: '24px',
            border: '1px solid #eef2ff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <div
            className="meta-header-escuro"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>Meta de Estudo</h3>
            <button
              onClick={abrirModalMeta}
              style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                color: 'var(--cor-primaria)',
                cursor: 'pointer'
              }}
              title="Editar metas"
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
          </div>

          <div
            className="meta-tipo-selector"
            style={{
              display: 'flex',
              gap: '5px',
              background: '#f1f5f9',
              borderRadius: '40px',
              padding: '4px',
              marginBottom: '20px'
            }}
          >
            {['diaria', 'semanal', 'mensal'].map((tipo) => (
              <button
                key={tipo}
                className={`meta-tipo-btn ${metaAtiva === tipo ? 'active' : ''}`}
                onClick={() => setMetaAtiva(tipo)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  borderRadius: '30px',
                  background: metaAtiva === tipo ? 'var(--cor-primaria)' : 'transparent',
                  color: metaAtiva === tipo ? 'white' : '#64748b',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>

          <p
            className="meta-texto-resumo"
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'var(--cor-primaria)',
              marginBottom: '10px'
            }}
          >
            {progresso >= 100
              ? `✅ Meta batida! ${formatarMeta(totalHoras)} de ${formatarMeta(metaValor)}`
              : progresso > 0
              ? `🚀 ${formatarMeta(totalHoras)} de ${formatarMeta(metaValor)}`
              : `📖 Nenhum estudo registrado. Meta: ${formatarMeta(metaValor)}`}
          </p>

          <div
            className="meta-progresso-escuro"
            style={{
              background: '#e5e7eb',
              borderRadius: '20px',
              height: '12px',
              overflow: 'hidden',
              margin: '15px 0'
            }}
          >
            <div
              style={{
                width: `${progresso}%`,
                height: '100%',
                background: progresso >= 100 ? '#22c55e' : progresso >= 50 ? '#f59e0b' : '#ef4444',
                borderRadius: '20px',
                transition: 'width 0.5s'
              }}
            ></div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
            {faltam <= 0 ? '✅ Concluído!' : `⏳ Faltam ${formatarMeta(faltam)}`}
          </p>
        </div>
      </div>

      {/* ==================== OVERLAY MODO FOCO (REACT NATIVO) ==================== */}
      {modoFocoAtivo && (
        <div className="modo-foco-overlay">
          <div className="modo-foco-card">
            <div
              className="modo-foco-icon"
              style={{ background: focoMateria?.cor || 'var(--cor-primaria)' }}
            >
              <i className="bi bi-brain"></i>
            </div>
            <h1 className="modo-foco-titulo">{focoMateria?.nome || 'Modo Foco'}</h1>
            <div className="modo-foco-timer">{formatarTempoCurto(focoTempoRestante)}</div>

            {/* Barra de progresso */}
            <div className="modo-foco-progresso-bg">
              <div
                className="modo-foco-progresso-bar"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, ((focoTempoTotal - focoTempoRestante) / (focoTempoTotal || 1)) * 100)
                  )}%`,
                  background: focoMateria?.cor || 'var(--cor-primaria)'
                }}
              />
            </div>

            {confirmandoSaidaFoco ? (
              <div
                className="modo-foco-confirmacao"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  borderRadius: '20px',
                  margin: '20px 0',
                  textAlign: 'center'
                }}
              >
                <p style={{ margin: '0 0 6px 0', fontWeight: '700', fontSize: '1.05rem', color: '#1f2937' }}>
                  Sair do Modo Foco?
                </p>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  Você focou por <strong>{formatarTempo(focoTempoTotal - focoTempoRestante)}</strong> em <strong>{focoMateria?.nome}</strong>.<br />
                  Deseja salvar esse tempo no histórico?
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#22c55e', color: '#fff', fontWeight: '600', padding: '8px 16px', borderRadius: '30px' }}
                    onClick={salvarESairModoFoco}
                  >
                    💾 Salvar e Sair
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    style={{ fontWeight: '600', padding: '8px 16px', borderRadius: '30px' }}
                    onClick={sairSemSalvarModoFoco}
                  >
                    Sair sem Salvar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ fontWeight: '600', padding: '8px 16px', borderRadius: '30px' }}
                    onClick={() => {
                      setConfirmandoSaidaFoco(false);
                      setFocoRodando(true);
                    }}
                  >
                    Continuar no Foco
                  </button>
                </div>
              </div>
            ) : (
              <div className="modo-foco-botoes">
                <button
                  type="button"
                  className="modo-foco-btn modo-foco-btn-pausar"
                  onClick={() => setFocoRodando((prev) => !prev)}
                >
                  {focoRodando ? '⏸ Pausar' : '▶ Continuar'}
                </button>
                <button
                  type="button"
                  className="modo-foco-btn modo-foco-btn-reset"
                  onClick={() => setFocoTempoRestante(focoTempoTotal)}
                >
                  🔄 Reiniciar
                </button>
                <button
                  type="button"
                  className="modo-foco-btn modo-foco-btn-sair"
                  onClick={sairModoFoco}
                >
                  ✕ Sair
                </button>
              </div>
            )}

            <p className="modo-foco-frase">"O foco determina a sua realidade. Mantenha a concentração!"</p>
          </div>
        </div>
      )}

      {/* ==================== MODAIS BOOTSTRAP ==================== */}
      {/* Modal Pomodoro Personalizado */}
      <div className="modal fade" id="modalPomodoro" ref={modalPomodoroRef} tabIndex="-1" data-bs-focus="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Personalizar Pomodoro</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label fw-bold" style={{ margin: 0 }}>
                    {criandoMateriaPomodoro ? 'Nova Matéria' : 'Matéria (Opcional)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCriandoMateriaPomodoro(!criandoMateriaPomodoro);
                      setNomeNovaMateria('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: criandoMateriaPomodoro ? '#6b7280' : 'var(--cor-primaria)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {criandoMateriaPomodoro ? '✕ Escolher da lista' : '+ Nova Matéria'}
                  </button>
                </div>

                {criandoMateriaPomodoro ? (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div className="mb-2">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                        Nome da matéria:
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ex: Matemática, Redação, Física"
                        value={nomeNovaMateria}
                        onChange={(e) => setNomeNovaMateria(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') salvarNovaMateria('pomodoro'); }}
                        autoFocus
                      />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                          Cor:
                        </label>
                        <input
                          type="color"
                          value={corNovaMateria}
                          onChange={(e) => setCorNovaMateria(e.target.value)}
                          style={{ width: '42px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '16px' }}>
                        Cor para gráficos e estatísticas
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={salvandoMateria}
                        onClick={() => salvarNovaMateria('pomodoro')}
                        style={{ background: 'var(--cor-primaria)', color: '#fff', fontWeight: '600' }}
                      >
                        {salvandoMateria ? 'Salvando...' : '✓ Salvar e Selecionar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setCriandoMateriaPomodoro(false);
                          setNomeNovaMateria('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <select id="pomodoroMateria" className="form-select">
                    <option value="">Nenhuma matéria (Geral)</option>
                    {materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Tempo de Estudo (minutos)</label>
                <input
                  type="number"
                  id="pomodoroTempoEstudo"
                  className="form-control"
                  defaultValue="25"
                  min="1"
                  max="120"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Tempo de Pausa (minutos)</label>
                <input
                  type="number"
                  id="pomodoroTempoPausa"
                  className="form-control"
                  defaultValue="5"
                  min="1"
                  max="60"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={iniciarPomodoroPersonalizado}
              >
                Iniciar Pomodoro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Modo Foco Personalizado */}
      <div className="modal fade" id="modalModoFoco" ref={modalFocoRef} tabIndex="-1" data-bs-focus="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">🧠 Iniciar Modo Foco</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label fw-bold" style={{ margin: 0 }}>
                    {criandoMateriaFoco ? 'Nova Matéria' : 'Matéria'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCriandoMateriaFoco(!criandoMateriaFoco);
                      setNomeNovaMateria('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: criandoMateriaFoco ? '#6b7280' : 'var(--cor-primaria)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {criandoMateriaFoco ? '✕ Escolher da lista' : '+ Nova Matéria'}
                  </button>
                </div>

                {criandoMateriaFoco ? (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div className="mb-2">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                        Nome da matéria:
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Ex: Biologia, História, Geografia"
                        value={nomeNovaMateria}
                        onChange={(e) => setNomeNovaMateria(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') salvarNovaMateria('foco'); }}
                        autoFocus
                      />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '4px' }}>
                          Cor:
                        </label>
                        <input
                          type="color"
                          value={corNovaMateria}
                          onChange={(e) => setCorNovaMateria(e.target.value)}
                          style={{ width: '42px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '16px' }}>
                        Cor para gráficos e foco
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={salvandoMateria}
                        onClick={() => salvarNovaMateria('foco')}
                        style={{ background: 'var(--cor-primaria)', color: '#fff', fontWeight: '600' }}
                      >
                        {salvandoMateria ? 'Salvando...' : '✓ Salvar e Selecionar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setCriandoMateriaFoco(false);
                          setNomeNovaMateria('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <select id="focoMateriaSelect" className="form-select">
                    <option value="">Selecione uma matéria</option>
                    {materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Tempo de Foco (minutos)</label>
                <input
                  type="number"
                  id="focoTempoPersonalizado"
                  className="form-control"
                  defaultValue="25"
                  min="1"
                  max="180"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={iniciarModoFocoPersonalizado}
              >
                Iniciar Foco
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Metas */}
      <div className="modal fade" id="modalMeta" ref={modalMetaRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Definir Metas de Estudo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Diária</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    id="metaDiariaHoras"
                    className="form-control"
                    defaultValue={Math.floor(metas.diaria)}
                    min="0"
                    max="24"
                  />
                  <input
                    type="number"
                    id="metaDiariaMinutos"
                    className="form-control"
                    defaultValue={Math.round((metas.diaria % 1) * 60)}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Semanal</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    id="metaSemanalHoras"
                    className="form-control"
                    defaultValue={Math.floor(metas.semanal)}
                    min="0"
                    max="168"
                  />
                  <input
                    type="number"
                    id="metaSemanalMinutos"
                    className="form-control"
                    defaultValue={Math.round((metas.semanal % 1) * 60)}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Meta Mensal</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    id="metaMensalHoras"
                    className="form-control"
                    defaultValue={Math.floor(metas.mensal)}
                    min="0"
                    max="720"
                  />
                  <input
                    type="number"
                    id="metaMensalMinutos"
                    className="form-control"
                    defaultValue={Math.round((metas.mensal % 1) * 60)}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={salvarMeta}>
                Salvar Metas
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}