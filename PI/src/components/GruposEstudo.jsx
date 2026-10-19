import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../api';
import './GruposEstudo.css';

export default function GruposEstudo() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [abaInterna, setAbaInterna] = useState('membros'); // 'membros', 'temas', 'duvidas', 'notas', 'reunioes', 'flashcards'
  const [carregando, setCarregando] = useState(false);

  // Modais de Criação e Entrada
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalEntrarAberto, setModalEntrarAberto] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState({ nome: '', materia: '' });
  const [codigoEntrada, setCodigoEntrada] = useState('');

  // Modais de Itens Internos
  const [notasTexto, setNotasTexto] = useState('');

  // Flashcards Pessoais & Compartilhamento
  const [modalSubirCardsAberto, setModalSubirCardsAberto] = useState(false);
  const [meusCards, setMeusCards] = useState([]);
  const [minhasMaterias, setMinhasMaterias] = useState([]);
  const [cardsSelecionados, setCardsSelecionados] = useState(new Set());
  const [buscaCardsSubir, setBuscaCardsSubir] = useState('');
  const [filtroMateriaSubir, setFiltroMateriaSubir] = useState('todas');
  const [carregandoMeusCards, setCarregandoMeusCards] = useState(false);
  const [cardsImportados, setCardsImportados] = useState(new Set());

  // Dados do usuário atual
  const [usuarioAtual, setUsuarioAtual] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
      return { nome: u.nome || 'Estudante', email: u.email || '' };
    } catch (e) {
      return { nome: 'Estudante', email: '' };
    }
  });

  // Carregar grupos da API
  const carregarGrupos = useCallback(async () => {
    const salvos = localStorage.getItem('grupos_estudo_sistema');
    if (salvos) {
      try {
        const parsed = JSON.parse(salvos);
        if (Array.isArray(parsed)) setGrupos(parsed);
      } catch (e) {}
    }

    try {
      setCarregando(true);
      const res = await apiFetch('gruposestudo');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGrupos(data);
          localStorage.setItem('grupos_estudo_sistema', JSON.stringify(data));
          // Atualiza grupo selecionado se estiver aberto
          if (grupoSelecionado) {
            const atualizado = data.find(g => String(g.id) === String(grupoSelecionado.id));
            if (atualizado) {
              setGrupoSelecionado(atualizado);
              setNotasTexto(atualizado.notas || '');
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar grupos de estudo:', err);
    } finally {
      setCarregando(false);
    }
  }, [grupoSelecionado]);

  // Carregar matérias e flashcards do usuário logado
  const carregarMeusCardsEMaterias = useCallback(async () => {
    let mats = [];
    const matsSalvas = localStorage.getItem('materias');
    if (matsSalvas) {
      try {
        mats = JSON.parse(matsSalvas);
        if (Array.isArray(mats)) setMinhasMaterias(mats);
      } catch (e) {}
    }
    try {
      const resMat = await apiFetch('materias');
      if (resMat.ok) {
        const dataMat = await resMat.json();
        if (Array.isArray(dataMat)) {
          mats = dataMat;
          setMinhasMaterias(dataMat);
          localStorage.setItem('materias', JSON.stringify(dataMat));
        }
      }
    } catch (e) {}

    let cards = [];
    const cardsSalvos = localStorage.getItem('flashcards_sistema');
    if (cardsSalvos) {
      try {
        cards = JSON.parse(cardsSalvos);
        if (Array.isArray(cards)) setMeusCards(cards);
      } catch (e) {}
    }

    try {
      setCarregandoMeusCards(true);
      const resCards = await apiFetch('flashcards');
      if (resCards.ok) {
        const dataCards = await resCards.json();
        if (Array.isArray(dataCards)) {
          const formatados = dataCards.map(c => {
            let temaNome = c.tema || 'Geral';
            if (typeof c.tema === 'string' && c.tema.startsWith('{')) {
              try {
                const pj = JSON.parse(c.tema);
                temaNome = pj.tema || 'Geral';
              } catch (e) {}
            }
            const matObj = mats.find(m => String(m.id_materia || m.id) === String(c.id_materia));
            return {
              id: c.id_flash,
              id_flash: c.id_flash,
              id_materia: c.id_materia,
              materiaId: String(c.id_materia),
              materiaNome: c.nome_materia || (matObj ? matObj.nome : 'Geral'),
              materiaCor: c.cor_materia || (matObj ? matObj.cor : null),
              tema: temaNome,
              pergunta: c.pergunta,
              resposta: c.resposta
            };
          });
          setMeusCards(formatados);
          localStorage.setItem('flashcards_sistema', JSON.stringify(formatados));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar flashcards do usuário:', e);
    } finally {
      setCarregandoMeusCards(false);
    }
  }, []);

  useEffect(() => {
    carregarGrupos();
    carregarMeusCardsEMaterias();
  }, [carregarGrupos, carregarMeusCardsEMaterias]);

  // Salvar alterações de um grupo na API e localmente
  const atualizarGrupoNoBackend = async (grupoAtualizado, mensagemSucesso = null) => {
    const groupId = grupoAtualizado.id_grupo || grupoAtualizado.id;
    try {
      await apiFetch(`gruposestudo/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: grupoAtualizado.nome,
          materia: grupoAtualizado.materia,
          linkMeet: grupoAtualizado.link_meet || grupoAtualizado.linkMeet || '',
          membros: grupoAtualizado.membros,
          temas: grupoAtualizado.temas,
          duvidas: grupoAtualizado.duvidas,
          reunioes: grupoAtualizado.reunioes,
          notas: grupoAtualizado.notas,
          flashcardsCompartilhados: grupoAtualizado.flashcards_compartilhados || grupoAtualizado.flashcardsCompartilhados || []
        })
      });
    } catch (err) {
      console.error('Erro ao sincronizar grupo no servidor:', err);
    }

    setGrupos(prev => prev.map(g => (String(g.id) === String(groupId) ? grupoAtualizado : g)));
    setGrupoSelecionado(grupoAtualizado);
    localStorage.setItem('grupos_estudo_sistema', JSON.stringify(
      grupos.map(g => (String(g.id) === String(groupId) ? grupoAtualizado : g))
    ));

    if (mensagemSucesso) {
      Swal.fire({
        icon: 'success',
        title: mensagemSucesso,
        timer: 1200,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  // Gerar código único de 6 caracteres
  const gerarCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Copiar código do grupo
  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    Swal.fire({
      icon: 'success',
      title: 'Código copiado!',
      text: `Código ${codigo} copiado para a área de transferência.`,
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  // Criar Grupo
  const handleCriarGrupo = async () => {
    if (!novoGrupo.nome.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Digite o nome do grupo!' });
      return;
    }

    const codigoGerado = gerarCodigo();
    const payload = {
      nome: novoGrupo.nome.trim(),
      materia: novoGrupo.materia.trim() || 'Geral',
      codigo: codigoGerado,
      linkMeet: '',
      membros: [
        { nome: `${usuarioAtual.nome} (Você)`, email: usuarioAtual.email, papel: 'Líder' }
      ],
      temas: [],
      duvidas: [],
      reunioes: [],
      notas: '',
      flashcardsCompartilhados: []
    };

    try {
      const res = await apiFetch('gruposestudo', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const grupoCriado = {
          ...payload,
          id: data.id_grupo,
          id_grupo: data.id_grupo,
          flashcards_compartilhados: []
        };
        setGrupos(prev => [grupoCriado, ...prev]);
        setModalCriarAberto(false);
        setNovoGrupo({ nome: '', materia: '' });

        Swal.fire({
          icon: 'success',
          title: 'Grupo criado com sucesso!',
          html: `
            <p>O código do seu grupo é: <strong style="font-size: 1.5rem; letter-spacing: 2px; color: var(--cor-primaria);">${codigoGerado}</strong></p>
            <p>Envie este código para os seus colegas entrarem no grupo!</p>
          `,
          confirmButtonColor: 'var(--cor-primaria)'
        });
      }
    } catch (e) {
      Swal.fire('Erro', 'Não foi possível criar o grupo.', 'error');
    }
  };

  // Entrar com Código
  const handleEntrarComCodigo = async () => {
    const cod = codigoEntrada.trim().toUpperCase();
    if (!cod) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Digite o código de 6 dígitos!' });
      return;
    }

    try {
      const res = await apiFetch(`gruposestudo/${cod}`);
      if (!res.ok) {
        Swal.fire({ icon: 'error', title: 'Grupo não encontrado', text: 'Verifique o código informado e tente novamente.' });
        return;
      }

      const grupo = await res.json();
      const membrosAtuais = grupo.membros || [];
      const jaEhMembro = membrosAtuais.some(
        m => (m.email && m.email === usuarioAtual.email) || (m.nome && m.nome.includes(usuarioAtual.nome))
      );

      if (jaEhMembro) {
        Swal.fire({ icon: 'info', title: 'Você já faz parte deste grupo!', confirmButtonColor: 'var(--cor-primaria)' });
        setModalEntrarAberto(false);
        setCodigoEntrada('');
        setGrupoSelecionado(grupo);
        return;
      }

      const novosMembros = [...membrosAtuais, { nome: usuarioAtual.nome, email: usuarioAtual.email, papel: 'Membro' }];
      const grupoAtualizado = { ...grupo, membros: novosMembros };

      await atualizarGrupoNoBackend(grupoAtualizado);
      setModalEntrarAberto(false);
      setCodigoEntrada('');
      setGrupoSelecionado(grupoAtualizado);

      Swal.fire({
        icon: 'success',
        title: `Bem-vindo ao grupo ${grupo.nome}!`,
        timer: 1800,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire('Erro', 'Erro ao tentar entrar no grupo.', 'error');
    }
  };

  // Abrir Detalhe do Grupo
  const abrirGrupo = (grupo) => {
    setGrupoSelecionado(grupo);
    setNotasTexto(grupo.notas || '');
    setAbaInterna('membros');
  };

  // Voltar para Lista
  const voltarParaLista = () => {
    setGrupoSelecionado(null);
  };

  // Iniciar Chamada de Vídeo (Meet)
  const iniciarChamadaVideo = () => {
    if (!grupoSelecionado) return;
    const linkCustom = grupoSelecionado.link_meet || grupoSelecionado.linkMeet;
    const url = linkCustom && linkCustom.startsWith('http')
      ? linkCustom
      : `https://meet.jit.si/SectioAurea_Grupo_${grupoSelecionado.codigo}`;

    window.open(url, '_blank');
  };

  // ==================== AÇÕES DE MEMBROS ====================
  const adicionarMembroManual = () => {
    Swal.fire({
      title: 'Adicionar Membro',
      html: `
        <input id="swalNomeMembro" class="swal2-input" placeholder="Nome do participante">
        <input id="swalEmailMembro" class="swal2-input" placeholder="E-mail (opcional)">
      `,
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--cor-primaria)',
      preConfirm: () => {
        const nome = document.getElementById('swalNomeMembro').value.trim();
        const email = document.getElementById('swalEmailMembro').value.trim();
        if (!nome) {
          Swal.showValidationMessage('Digite o nome do participante!');
          return false;
        }
        return { nome, email, papel: 'Membro' };
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const novosMembros = [...(grupoSelecionado.membros || []), res.value];
        atualizarGrupoNoBackend({ ...grupoSelecionado, membros: novosMembros }, 'Membro adicionado!');
      }
    });
  };

  const removerMembro = (index) => {
    Swal.fire({
      title: 'Remover participante?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    }).then(res => {
      if (res.isConfirmed) {
        const novosMembros = grupoSelecionado.membros.filter((_, i) => i !== index);
        atualizarGrupoNoBackend({ ...grupoSelecionado, membros: novosMembros }, 'Membro removido.');
      }
    });
  };

  // ==================== AÇÕES DE TEMAS ====================
  const adicionarTema = () => {
    const opcoesMembros = (grupoSelecionado.membros || [])
      .map(m => `<option value="${m.nome}">${m.nome}</option>`)
      .join('');

    Swal.fire({
      title: 'Dividir Novo Tema',
      html: `
        <input id="swalTemaTitulo" class="swal2-input" placeholder="Título do tema ou capítulo">
        <select id="swalTemaResp" class="swal2-input" style="display: block; width: 100%; box-sizing: border-box;">
          <option value="">Selecione o responsável</option>
          ${opcoesMembros}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar Tema',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--cor-primaria)',
      preConfirm: () => {
        const titulo = document.getElementById('swalTemaTitulo').value.trim();
        const responsavel = document.getElementById('swalTemaResp').value;
        if (!titulo) {
          Swal.showValidationMessage('Digite o título do tema!');
          return false;
        }
        return { titulo, responsavel: responsavel || 'A definir', status: 'Em andamento' };
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const novosTemas = [...(grupoSelecionado.temas || []), res.value];
        atualizarGrupoNoBackend({ ...grupoSelecionado, temas: novosTemas }, 'Tema registrado!');
      }
    });
  };

  const removerTema = (index) => {
    const novosTemas = grupoSelecionado.temas.filter((_, i) => i !== index);
    atualizarGrupoNoBackend({ ...grupoSelecionado, temas: novosTemas });
  };

  // ==================== AÇÕES DE DÚVIDAS ====================
  const adicionarDuvida = () => {
    Swal.fire({
      title: 'Postar Nova Dúvida',
      input: 'textarea',
      inputPlaceholder: 'Escreva sua pergunta ou dúvida para o grupo...',
      showCancelButton: true,
      confirmButtonText: 'Postar Pergunta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      inputValidator: v => (!v || !v.trim() ? 'Digite sua dúvida!' : null)
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const novaDuvidaObj = {
          pergunta: res.value.trim(),
          autor: usuarioAtual.nome,
          resposta: null,
          data: new Date().toLocaleDateString('pt-BR')
        };
        const novasDuvidas = [...(grupoSelecionado.duvidas || []), novaDuvidaObj];
        atualizarGrupoNoBackend({ ...grupoSelecionado, duvidas: novasDuvidas }, 'Dúvida enviada ao grupo!');
      }
    });
  };

  const responderDuvida = (index) => {
    const d = grupoSelecionado.duvidas[index];
    Swal.fire({
      title: 'Responder Dúvida',
      text: d.pergunta,
      input: 'textarea',
      inputPlaceholder: 'Digite a resposta ou explicação para o colega...',
      inputValue: d.resposta || '',
      showCancelButton: true,
      confirmButtonText: 'Salvar Resposta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      inputValidator: v => (!v || !v.trim() ? 'Digite uma resposta!' : null)
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const novasDuvidas = grupoSelecionado.duvidas.map((item, i) =>
          i === index ? { ...item, resposta: res.value.trim(), respondidoPor: usuarioAtual.nome } : item
        );
        atualizarGrupoNoBackend({ ...grupoSelecionado, duvidas: novasDuvidas }, 'Resposta compartilhada!');
      }
    });
  };

  const removerDuvida = (index) => {
    const novasDuvidas = grupoSelecionado.duvidas.filter((_, i) => i !== index);
    atualizarGrupoNoBackend({ ...grupoSelecionado, duvidas: novasDuvidas });
  };

  // ==================== AÇÕES DE NOTAS ====================
  const salvarNotas = () => {
    atualizarGrupoNoBackend({ ...grupoSelecionado, notas: notasTexto }, 'Notas salvas com sucesso!');
  };

  // ==================== AÇÕES DE REUNIÕES ====================
  const agendarReuniao = () => {
    Swal.fire({
      title: 'Agendar Sessão de Estudo',
      html: `
        <input id="swalReuniaoTitulo" class="swal2-input" placeholder="Assunto da reunião (Ex: Revisão Prova 1)">
        <input id="swalReuniaoData" type="date" class="swal2-input">
        <input id="swalReuniaoHora" type="time" class="swal2-input">
      `,
      showCancelButton: true,
      confirmButtonText: 'Agendar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--cor-primaria)',
      preConfirm: () => {
        const titulo = document.getElementById('swalReuniaoTitulo').value.trim();
        const data = document.getElementById('swalReuniaoData').value;
        const hora = document.getElementById('swalReuniaoHora').value;
        if (!titulo || !data) {
          Swal.showValidationMessage('Preencha o título e a data!');
          return false;
        }
        return { titulo, data, hora: hora || '14:00' };
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const novasReunioes = [...(grupoSelecionado.reunioes || []), res.value];
        atualizarGrupoNoBackend({ ...grupoSelecionado, reunioes: novasReunioes }, 'Reunião agendada!');
      }
    });
  };

  const removerReuniao = (index) => {
    const novasReunioes = grupoSelecionado.reunioes.filter((_, i) => i !== index);
    atualizarGrupoNoBackend({ ...grupoSelecionado, reunioes: novasReunioes });
  };

  // ==================== AÇÕES DE FLASHCARDS ====================
  // Verifica se o flashcard já existe no grupo atual
  const isCardJaNoGrupo = useCallback((card) => {
    if (!grupoSelecionado || !card) return false;
    const cardsGrupo = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
    const pTrim = (card.pergunta || '').trim().toLowerCase();
    const rTrim = (card.resposta || '').trim().toLowerCase();
    return cardsGrupo.some(gc =>
      (gc.pergunta || '').trim().toLowerCase() === pTrim &&
      (gc.resposta || '').trim().toLowerCase() === rTrim
    );
  }, [grupoSelecionado]);

  // Verifica se o flashcard já foi importado para a coleção do usuário
  const isCardJaImportado = useCallback((card) => {
    if (!card) return false;
    const cardIdKey = card.id || `${card.pergunta}_${card.resposta}`;
    if (cardsImportados.has(cardIdKey)) return true;
    const pTrim = (card.pergunta || '').trim().toLowerCase();
    const rTrim = (card.resposta || '').trim().toLowerCase();
    return meusCards.some(mc =>
      (mc.pergunta || '').trim().toLowerCase() === pTrim &&
      (mc.resposta || '').trim().toLowerCase() === rTrim
    );
  }, [cardsImportados, meusCards]);

  // Abrir modal de upload de cards pessoais
  const abrirModalSubirCards = () => {
    carregarMeusCardsEMaterias();
    setCardsSelecionados(new Set());
    setBuscaCardsSubir('');
    setFiltroMateriaSubir('todas');
    setModalSubirCardsAberto(true);
  };

  // Toggle de seleção de card individual
  const toggleSelecionarCard = (cardId) => {
    setCardsSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Toggle de seleção de todos os cards visíveis
  const toggleSelecionarTodos = (cardsFiltrados) => {
    const idsValidos = cardsFiltrados
      .filter(c => !isCardJaNoGrupo(c))
      .map(c => c.id || c.id_flash);

    setCardsSelecionados(prev => {
      const todosJaMarcados = idsValidos.length > 0 && idsValidos.every(id => prev.has(id));
      if (todosJaMarcados) {
        const next = new Set(prev);
        idsValidos.forEach(id => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        idsValidos.forEach(id => next.add(id));
        return next;
      }
    });
  };

  // Confirmar upload de cards selecionados para o grupo
  const confirmarSubirCardsParaGrupo = () => {
    if (cardsSelecionados.size === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Nenhum flashcard selecionado',
        text: 'Marque ao menos um flashcard para compartilhar no grupo.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    const cardsEscolhidos = meusCards.filter(c => cardsSelecionados.has(c.id || c.id_flash));
    const novosCardsGrupo = cardsEscolhidos.map(c => ({
      id: 'grp_card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      pergunta: c.pergunta,
      resposta: c.resposta,
      tema: c.tema || 'Geral',
      materiaNome: c.materiaNome || c.nome_materia || grupoSelecionado.materia || 'Geral',
      compartilhadoPor: usuarioAtual.nome,
      data: new Date().toLocaleDateString('pt-BR')
    }));

    const cardsAtuais = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
    const listaFinal = [...cardsAtuais, ...novosCardsGrupo];

    atualizarGrupoNoBackend(
      { ...grupoSelecionado, flashcards_compartilhados: listaFinal, flashcardsCompartilhados: listaFinal },
      `${novosCardsGrupo.length} flashcard(s) adicionados ao grupo com sucesso!`
    );

    setModalSubirCardsAberto(false);
    setCardsSelecionados(new Set());
  };

  // Importar um único flashcard compartilhado para a coleção do usuário
  const importarCardParaMim = async (card) => {
    try {
      let materiasList = minhasMaterias;
      if (!materiasList || materiasList.length === 0) {
        const resMat = await apiFetch('materias');
        if (resMat.ok) {
          materiasList = await resMat.json();
          setMinhasMaterias(materiasList);
        }
      }

      const nomeDesejado = (card.materiaNome || grupoSelecionado?.materia || 'Geral').trim().toLowerCase();
      let matMatch = (materiasList || []).find(m => m.nome && m.nome.trim().toLowerCase() === nomeDesejado);
      let idMateriaTarget = null;
      let nomeMateriaFinal = card.materiaNome || grupoSelecionado?.materia || 'Geral';

      if (matMatch) {
        idMateriaTarget = matMatch.id_materia || matMatch.id;
        nomeMateriaFinal = matMatch.nome;
      } else if (materiasList && materiasList.length > 0) {
        idMateriaTarget = materiasList[0].id_materia || materiasList[0].id;
        nomeMateriaFinal = materiasList[0].nome;
      } else {
        try {
          const resCriarMat = await apiFetch('materias', {
            method: 'POST',
            body: JSON.stringify({
              nome: nomeMateriaFinal,
              cor: '#9f042c'
            })
          });
          if (resCriarMat.ok) {
            const dataCriar = await resCriarMat.json();
            idMateriaTarget = dataCriar.id_materia || dataCriar.id;
            const novaMat = { id_materia: idMateriaTarget, id: idMateriaTarget, nome: nomeMateriaFinal, cor: '#9f042c' };
            setMinhasMaterias(prev => [...prev, novaMat]);
          }
        } catch (e) {
          console.error('Erro ao criar matéria automática:', e);
        }
      }

      if (!idMateriaTarget) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível definir uma matéria para este flashcard.' });
        return;
      }

      const res = await apiFetch('flashcards', {
        method: 'POST',
        body: JSON.stringify({
          id_materia: Number(idMateriaTarget),
          tema: card.tema || 'Geral',
          pergunta: card.pergunta,
          resposta: card.resposta
        })
      });

      if (res.ok) {
        const data = await res.json();
        const novoId = data.id_flash || Date.now();
        const novoCard = {
          id: novoId,
          id_flash: novoId,
          materiaId: String(idMateriaTarget),
          id_materia: Number(idMateriaTarget),
          materiaNome: nomeMateriaFinal,
          tema: card.tema || 'Geral',
          pergunta: card.pergunta,
          resposta: card.resposta,
          nivel: 0,
          dataProxima: new Date().toISOString().split('T')[0],
          dataUltimaRevisao: null,
          acertos: 0,
          erros: 0
        };

        const locais = JSON.parse(localStorage.getItem('flashcards_sistema') || '[]');
        locais.push(novoCard);
        localStorage.setItem('flashcards_sistema', JSON.stringify(locais));

        setMeusCards(prev => [...prev, novoCard]);
        setCardsImportados(prev => new Set([...prev, card.id || `${card.pergunta}_${card.resposta}`]));

        Swal.fire({
          icon: 'success',
          title: 'Flashcard importado!',
          text: `Adicionado à sua coleção na matéria "${nomeMateriaFinal}".`,
          timer: 1600,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível salvar o flashcard no servidor.' });
      }
    } catch (err) {
      console.error('Erro ao importar flashcard:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Ocorreu um erro ao importar o flashcard.' });
    }
  };

  // Importar todos os cards de colegas disponíveis para a coleção pessoal
  const importarTodosCardsParaMim = async () => {
    const cardsGrupo = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
    const cardsParaImportar = cardsGrupo.filter(c => {
      const ehMeu = c.compartilhadoPor === usuarioAtual.nome;
      const jaImportado = isCardJaImportado(c);
      return !ehMeu && !jaImportado;
    });

    if (cardsParaImportar.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tudo importado!',
        text: 'Todos os flashcards compartilhados já estão na sua coleção de estudos.',
        confirmButtonColor: 'var(--cor-primaria)'
      });
      return;
    }

    const confirmacao = await Swal.fire({
      title: 'Importar Flashcards?',
      text: `Deseja importar ${cardsParaImportar.length} flashcard(s) deste grupo para seus baralhos e repetição espaçada?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sim, importar ${cardsParaImportar.length}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--cor-primaria)'
    });

    if (!confirmacao.isConfirmed) return;

    Swal.fire({
      title: 'Importando flashcards...',
      text: 'Salvando cartões na sua coleção...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let importadosComSucesso = 0;
    const locais = JSON.parse(localStorage.getItem('flashcards_sistema') || '[]');

    for (const card of cardsParaImportar) {
      try {
        let materiasList = minhasMaterias;
        const nomeDesejado = (card.materiaNome || grupoSelecionado?.materia || 'Geral').trim().toLowerCase();
        let matMatch = (materiasList || []).find(m => m.nome && m.nome.trim().toLowerCase() === nomeDesejado);
        let idMateriaTarget = matMatch ? (matMatch.id_materia || matMatch.id) : (materiasList[0]?.id_materia || materiasList[0]?.id || 1);

        const res = await apiFetch('flashcards', {
          method: 'POST',
          body: JSON.stringify({
            id_materia: Number(idMateriaTarget),
            tema: card.tema || 'Geral',
            pergunta: card.pergunta,
            resposta: card.resposta
          })
        });

        if (res.ok) {
          const data = await res.json();
          const novoId = data.id_flash || Date.now();
          const novoCard = {
            id: novoId,
            id_flash: novoId,
            materiaId: String(idMateriaTarget),
            id_materia: Number(idMateriaTarget),
            materiaNome: card.materiaNome || grupoSelecionado?.materia || 'Geral',
            tema: card.tema || 'Geral',
            pergunta: card.pergunta,
            resposta: card.resposta,
            nivel: 0,
            dataProxima: new Date().toISOString().split('T')[0],
            dataUltimaRevisao: null,
            acertos: 0,
            erros: 0
          };
          locais.push(novoCard);
          setMeusCards(prev => [...prev, novoCard]);
          setCardsImportados(prev => new Set([...prev, card.id || `${card.pergunta}_${card.resposta}`]));
          importadosComSucesso++;
        }
      } catch (e) {
        console.error('Erro ao importar card em lote:', e);
      }
    }

    localStorage.setItem('flashcards_sistema', JSON.stringify(locais));

    Swal.fire({
      icon: 'success',
      title: 'Importação Concluída!',
      text: `${importadosComSucesso} flashcards foram importados para a sua coleção com sucesso!`,
      confirmButtonColor: 'var(--cor-primaria)'
    });
  };

  // Contagem de cards importáveis
  const cardsImportaveisCount = useMemo(() => {
    if (!grupoSelecionado) return 0;
    const cardsGrupo = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
    return cardsGrupo.filter(c => {
      const ehMeu = c.compartilhadoPor === usuarioAtual.nome;
      const jaImportado = isCardJaImportado(c);
      return !ehMeu && !jaImportado;
    }).length;
  }, [grupoSelecionado, usuarioAtual, isCardJaImportado]);

  // Filtro de cards pessoais para o modal de upload
  const cardsFiltradosParaSubir = useMemo(() => {
    return meusCards.filter(c => {
      const matchMateria = filtroMateriaSubir === 'todas' || String(c.id_materia || c.materiaId) === String(filtroMateriaSubir);
      const termo = buscaCardsSubir.trim().toLowerCase();
      const matchBusca = !termo ||
        (c.pergunta && c.pergunta.toLowerCase().includes(termo)) ||
        (c.resposta && c.resposta.toLowerCase().includes(termo)) ||
        (c.tema && c.tema.toLowerCase().includes(termo));
      return matchMateria && matchBusca;
    });
  }, [meusCards, filtroMateriaSubir, buscaCardsSubir]);

  const adicionarFlashcardGrupo = () => {
    Swal.fire({
      title: 'Compartilhar Novo Flashcard',
      html: `
        <input id="swalCardPergunta" class="swal2-input" placeholder="Pergunta ou Conceito">
        <textarea id="swalCardResposta" class="swal2-textarea" placeholder="Resposta ou Explicação"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Compartilhar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--cor-primaria)',
      preConfirm: () => {
        const pergunta = document.getElementById('swalCardPergunta').value.trim();
        const resposta = document.getElementById('swalCardResposta').value.trim();
        if (!pergunta || !resposta) {
          Swal.showValidationMessage('Preencha a pergunta e a resposta!');
          return false;
        }
        return {
          id: 'grp_card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          pergunta,
          resposta,
          tema: 'Geral',
          compartilhadoPor: usuarioAtual.nome,
          materiaNome: grupoSelecionado.materia || 'Geral',
          data: new Date().toLocaleDateString('pt-BR')
        };
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const cardsAtuais = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
        const novosCards = [...cardsAtuais, res.value];
        atualizarGrupoNoBackend(
          { ...grupoSelecionado, flashcards_compartilhados: novosCards, flashcardsCompartilhados: novosCards },
          'Flashcard compartilhado com o grupo!'
        );
      }
    });
  };

  const removerFlashcardGrupo = (index) => {
    const cardsAtuais = grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || [];
    const novosCards = cardsAtuais.filter((_, i) => i !== index);
    atualizarGrupoNoBackend({
      ...grupoSelecionado,
      flashcards_compartilhados: novosCards,
      flashcardsCompartilhados: novosCards
    });
  };

  // Métricas para a tela inicial
  const totalDuvidasAbertas = useMemo(() => {
    return grupos.reduce((acc, g) => acc + ((g.duvidas || []).filter(d => !d.resposta).length), 0);
  }, [grupos]);

  const totalCardsCompartilhados = useMemo(() => {
    return grupos.reduce((acc, g) => acc + ((g.flashcards_compartilhados || g.flashcardsCompartilhados || []).length), 0);
  }, [grupos]);

  const totalReunioes = useMemo(() => {
    return grupos.reduce((acc, g) => acc + ((g.reunioes || []).length), 0);
  }, [grupos]);

  return (
    <section id="gruposSection">
      <div className="grupos-container">
        
        {/* ====================================================================
            VISTA 1: LISTA DE GRUPOS
            ==================================================================== */}
        {!grupoSelecionado && (
          <>
            {/* Header */}
            <div className="grupos-header-bar">
              <div className="grupos-header-titles">
                <h1><i className="bi bi-people-fill"></i> Grupos de Estudo</h1>
                <p className="grupos-subtitle">Colabore com seus colegas: tire dúvidas, divida temas e compartilhe conhecimentos</p>
              </div>

              <div className="grupos-header-actions">
                <button className="btn-grupo-secondary" onClick={() => setModalEntrarAberto(true)}>
                  <i className="bi bi-key-fill"></i> Entrar com Código
                </button>
                <button className="btn-grupo-primary" onClick={() => setModalCriarAberto(true)}>
                  <i className="bi bi-plus-lg"></i> Criar Grupo
                </button>
              </div>
            </div>

            {/* Painel de Métricas */}
            <div className="grupos-metricas-grid">
              <div className="grupo-metric-card">
                <div className="grupo-metric-icon grupos">
                  <i className="bi bi-diagram-3-fill"></i>
                </div>
                <div className="grupo-metric-info">
                  <span className="grupo-metric-num">{grupos.length}</span>
                  <span className="grupo-metric-label">Meus Grupos</span>
                </div>
              </div>

              <div className="grupo-metric-card">
                <div className="grupo-metric-icon duvidas">
                  <i className="bi bi-question-circle-fill"></i>
                </div>
                <div className="grupo-metric-info">
                  <span className="grupo-metric-num">{totalDuvidasAbertas}</span>
                  <span className="grupo-metric-label">Dúvidas Pendentes</span>
                </div>
              </div>

              <div className="grupo-metric-card">
                <div className="grupo-metric-icon reunioes">
                  <i className="bi bi-camera-video-fill"></i>
                </div>
                <div className="grupo-metric-info">
                  <span className="grupo-metric-num">{totalReunioes}</span>
                  <span className="grupo-metric-label">Sessões Agendadas</span>
                </div>
              </div>

              <div className="grupo-metric-card">
                <div className="grupo-metric-icon flashcards">
                  <i className="bi bi-collection-fill"></i>
                </div>
                <div className="grupo-metric-info">
                  <span className="grupo-metric-num">{totalCardsCompartilhados}</span>
                  <span className="grupo-metric-label">Cards Compartilhados</span>
                </div>
              </div>
            </div>

            {/* Lista / Grid de Grupos */}
            {grupos.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#ffffff',
                borderRadius: '20px',
                border: '2px dashed #cbd5e1'
              }}>
                <i className="bi bi-people" style={{ fontSize: '3.5rem', color: '#94a3b8' }}></i>
                <h3 style={{ margin: '15px 0 8px', color: '#1e293b' }}>Nenhum grupo de estudo ainda</h3>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Crie o seu próprio grupo ou insira o código de 6 caracteres fornecido por um colega.</p>
                <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn-grupo-primary" onClick={() => setModalCriarAberto(true)}>
                    <i className="bi bi-plus-lg"></i> Criar Primeiro Grupo
                  </button>
                  <button className="btn-grupo-secondary" onClick={() => setModalEntrarAberto(true)}>
                    <i className="bi bi-key-fill"></i> Entrar com Código
                  </button>
                </div>
              </div>
            ) : (
              <div className="grupos-cards-grid">
                {grupos.map(g => {
                  const membros = g.membros || [];
                  const duvidas = g.duvidas || [];
                  const cards = g.flashcards_compartilhados || g.flashcardsCompartilhados || [];

                  return (
                    <div key={g.id || g.id_grupo} className="grupo-card" onClick={() => abrirGrupo(g)}>
                      <div>
                        <div className="grupo-card-header">
                          <div>
                            <h3 className="grupo-card-title">{g.nome}</h3>
                            <span className="grupo-badge-materia">
                              <i className="bi bi-book"></i> {g.materia || 'Geral'}
                            </span>
                          </div>
                          <span
                            className="grupo-codigo-pill"
                            title="Clique para copiar o código"
                            onClick={(e) => {
                              e.stopPropagation();
                              copiarCodigo(g.codigo);
                            }}
                          >
                            <i className="bi bi-clipboard"></i> {g.codigo}
                          </span>
                        </div>
                      </div>

                      <div className="grupo-card-stats">
                        <div className="grupo-stat-item">
                          <strong>{membros.length}</strong>
                          <span>Membros</span>
                        </div>
                        <div className="grupo-stat-item">
                          <strong>{duvidas.length}</strong>
                          <span>Dúvidas</span>
                        </div>
                        <div className="grupo-stat-item">
                          <strong>{cards.length}</strong>
                          <span>Cards</span>
                        </div>
                      </div>

                      <div className="grupo-card-footer">
                        <div className="grupo-card-membros-preview">
                          {membros.slice(0, 3).map((m, idx) => (
                            <div key={idx} className="grupo-avatar-circle" title={m.nome}>
                              {m.nome ? m.nome.charAt(0).toUpperCase() : 'M'}
                            </div>
                          ))}
                          {membros.length > 3 && (
                            <div className="grupo-avatar-circle" style={{ background: '#64748b' }}>
                              +{membros.length - 3}
                            </div>
                          )}
                        </div>
                        <button className="btn-entrar-grupo-card">
                          Acessar <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            VISTA 2: DETALHES DO GRUPO SELECIONADO
            ==================================================================== */}
        {grupoSelecionado && (
          <div className="grupo-detalhe-wrapper">
            {/* Topo do Detalhe */}
            <div className="grupo-detalhe-header">
              <div>
                <button className="btn-voltar-grupos" onClick={voltarParaLista}>
                  <i className="bi bi-arrow-left"></i> Voltar para Meus Grupos
                </button>
                <h2 className="grupo-detalhe-title">{grupoSelecionado.nome}</h2>
                <div className="grupo-detalhe-meta">
                  <span className="grupo-badge-materia">
                    <i className="bi bi-book"></i> {grupoSelecionado.materia || 'Geral'}
                  </span>
                  <span
                    className="grupo-codigo-pill"
                    style={{ cursor: 'pointer' }}
                    onClick={() => copiarCodigo(grupoSelecionado.codigo)}
                    title="Clique para copiar"
                  >
                    <i className="bi bi-clipboard"></i> Código: <strong>{grupoSelecionado.codigo}</strong>
                  </span>
                </div>
              </div>

              <div className="grupo-detalhe-actions">
                <button className="btn-meet-video" onClick={iniciarChamadaVideo}>
                  <i className="bi bi-camera-video-fill"></i> Chamada de Vídeo (Meet)
                </button>
                <button className="btn-copiar-codigo" onClick={() => copiarCodigo(grupoSelecionado.codigo)}>
                  <i className="bi bi-share-fill"></i> Convidar Colega
                </button>
              </div>
            </div>

            {/* Abas Internas */}
            <div className="grupo-abas-nav">
              <button
                className={`btn-grupo-aba ${abaInterna === 'membros' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('membros')}
              >
                <i className="bi bi-people-fill"></i> Membros ({(grupoSelecionado.membros || []).length})
              </button>
              <button
                className={`btn-grupo-aba ${abaInterna === 'temas' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('temas')}
              >
                <i className="bi bi-journal-bookmark-fill"></i> Divisão de Temas ({(grupoSelecionado.temas || []).length})
              </button>
              <button
                className={`btn-grupo-aba ${abaInterna === 'duvidas' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('duvidas')}
              >
                <i className="bi bi-question-circle-fill"></i> Dúvidas ({(grupoSelecionado.duvidas || []).length})
              </button>
              <button
                className={`btn-grupo-aba ${abaInterna === 'notas' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('notas')}
              >
                <i className="bi bi-journal-text"></i> Anotações Coletivas
              </button>
              <button
                className={`btn-grupo-aba ${abaInterna === 'reunioes' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('reunioes')}
              >
                <i className="bi bi-calendar-event-fill"></i> Reuniões ({(grupoSelecionado.reunioes || []).length})
              </button>
              <button
                className={`btn-grupo-aba ${abaInterna === 'flashcards' ? 'ativo' : ''}`}
                onClick={() => setAbaInterna('flashcards')}
              >
                <i className="bi bi-collection-fill"></i> Flashcards ({((grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados || []).length)})
              </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="grupo-aba-conteudo">
              
              {/* ABA 1: MEMBROS */}
              {abaInterna === 'membros' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Participantes do Grupo</h3>
                    <button className="btn-grupo-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={adicionarMembroManual}>
                      <i className="bi bi-person-plus-fill"></i> Adicionar Membro
                    </button>
                  </div>

                  <div className="membros-list">
                    {(grupoSelecionado.membros || []).map((m, idx) => (
                      <div key={idx} className="membro-item">
                        <div className="membro-info-block">
                          <div className="grupo-avatar-circle" style={{ width: 42, height: 42, fontSize: '1rem', background: idx === 0 ? 'var(--cor-primaria)' : '#3b82f6' }}>
                            {m.nome ? m.nome.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.98rem', color: '#1e293b' }}>{m.nome}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.email || 'E-mail não informado'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`membro-badge-role ${m.papel === 'Líder' ? 'lider' : 'membro'}`}>
                            {m.papel || 'Membro'}
                          </span>
                          {idx !== 0 && (
                            <button
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                              title="Remover participante"
                              onClick={() => removerMembro(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 2: TEMAS */}
              {abaInterna === 'temas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Divisão e Responsáveis por Temas</h3>
                    <button className="btn-grupo-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={adicionarTema}>
                      <i className="bi bi-plus-lg"></i> Novo Tema
                    </button>
                  </div>

                  {(!grupoSelecionado.temas || grupoSelecionado.temas.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <i className="bi bi-journal-bookmark" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                      <p style={{ marginTop: '10px' }}>Nenhum tema foi dividido no grupo ainda. Clique em "Novo Tema" para designar tópicos aos membros!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {grupoSelecionado.temas.map((t, idx) => (
                        <div key={idx} className="membro-item">
                          <div>
                            <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{t.titulo}</strong>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                              <i className="bi bi-person-circle"></i> Responsável: <strong>{t.responsavel}</strong>
                            </div>
                          </div>
                          <button
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                            title="Remover tema"
                            onClick={() => removerTema(idx)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: DÚVIDAS */}
              {abaInterna === 'duvidas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Quadro de Dúvidas & Perguntas</h3>
                    <button className="btn-grupo-primary" style={{ padding: '8px 18px', fontSize: '0.88rem', background: '#f59e0b' }} onClick={adicionarDuvida}>
                      <i className="bi bi-chat-left-dots-fill"></i> Postar Dúvida
                    </button>
                  </div>

                  {(!grupoSelecionado.duvidas || grupoSelecionado.duvidas.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <i className="bi bi-chat-quote" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                      <p style={{ marginTop: '10px' }}>Nenhuma dúvida registrada. Seja o primeiro a perguntar algo para os colegas!</p>
                    </div>
                  ) : (
                    <div className="duvidas-wall">
                      {grupoSelecionado.duvidas.map((d, idx) => (
                        <div key={idx} className={`duvida-card ${d.resposta ? 'respondida' : ''}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="duvida-pergunta">{d.pergunta}</div>
                            <button
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title="Remover dúvida"
                              onClick={() => removerDuvida(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                            Postado por: <strong>{d.autor || 'Membro'}</strong> {d.data ? `em ${d.data}` : ''}
                          </div>

                          {d.resposta ? (
                            <div className="duvida-resposta-box">
                              <strong><i className="bi bi-check2-circle"></i> Resposta {d.respondidoPor ? `(por ${d.respondidoPor})` : ''}:</strong>
                              <p style={{ margin: '4px 0 0 0' }}>{d.resposta}</p>
                            </div>
                          ) : (
                            <button
                              className="btn-grupo-primary"
                              style={{ background: '#10b981', padding: '6px 16px', fontSize: '0.82rem', marginTop: '6px' }}
                              onClick={() => responderDuvida(idx)}
                            >
                              <i className="bi bi-reply-fill"></i> Responder Dúvida
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: NOTAS COLETIVAS */}
              {abaInterna === 'notas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Anotações Compartilhadas</h3>
                      <small style={{ color: '#64748b' }}>Escreva resumos, combinados e notas que todos do grupo podem visualizar</small>
                    </div>
                    <button className="btn-grupo-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }} onClick={salvarNotas}>
                      <i className="bi bi-check-lg"></i> Salvar Anotações
                    </button>
                  </div>

                  <textarea
                    className="textarea-notas-grupo"
                    value={notasTexto}
                    placeholder="Digite resumos das reuniões, tópicos importantes ou acordos de estudo..."
                    onChange={e => setNotasTexto(e.target.value)}
                  />
                </div>
              )}

              {/* ABA 5: REUNIÕES */}
              {abaInterna === 'reunioes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Próximas Sessões de Estudo</h3>
                    <button className="btn-grupo-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={agendarReuniao}>
                      <i className="bi bi-calendar-plus-fill"></i> Agendar Reunião
                    </button>
                  </div>

                  {(!grupoSelecionado.reunioes || grupoSelecionado.reunioes.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <i className="bi bi-calendar-event" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                      <p style={{ marginTop: '10px' }}>Nenhuma sessão agendada. Marque uma data para estudar online com o grupo!</p>
                    </div>
                  ) : (
                    <div className="reunioes-grid">
                      {grupoSelecionado.reunioes.map((r, idx) => (
                        <div key={idx} className="reuniao-item">
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{r.titulo}</strong>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                              <i className="bi bi-clock-fill text-primary"></i> Data: <strong>{r.data ? r.data.split('-').reverse().join('/') : ''}</strong> às <strong>{r.hora || '14:00'}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button className="btn-meet-video" style={{ padding: '6px 16px', fontSize: '0.82rem' }} onClick={iniciarChamadaVideo}>
                              <i className="bi bi-camera-video-fill"></i> Entrar
                            </button>
                            <button
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                              title="Remover reunião"
                              onClick={() => removerReuniao(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 6: FLASHCARDS */}
              {abaInterna === 'flashcards' && (
                <div>
                  <div className="grupo-flashcards-header-bar">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Flashcards do Grupo</h3>
                      <small style={{ color: '#64748b' }}>Compartilhe seus cartões e importe decks compartilhados por outros membros</small>
                    </div>

                    <div className="grupo-flashcards-header-actions">
                      <button className="btn-grupo-primary" onClick={abrirModalSubirCards}>
                        <i className="bi bi-cloud-arrow-up-fill"></i> Subir Meus Flashcards
                      </button>
                      {cardsImportaveisCount > 0 && (
                        <button className="btn-importar-todos-banner" onClick={importarTodosCardsParaMim}>
                          <i className="bi bi-box-arrow-in-down"></i> Importar Todos ({cardsImportaveisCount})
                        </button>
                      )}
                      <button className="btn-grupo-secondary" onClick={adicionarFlashcardGrupo}>
                        <i className="bi bi-plus-lg"></i> Criar Manualmente
                      </button>
                    </div>
                  </div>

                  {(!grupoSelecionado.flashcards_compartilhados && !grupoSelecionado.flashcardsCompartilhados) ||
                  ((grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados).length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', background: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                      <i className="bi bi-collection" style={{ fontSize: '3rem', color: '#94a3b8' }}></i>
                      <h4 style={{ margin: '14px 0 6px', color: '#1e293b' }}>Nenhum flashcard compartilhado ainda</h4>
                      <p style={{ margin: '0 0 20px 0' }}>Compartilhe cartões da sua coleção pessoal para treinar com os colegas deste grupo!</p>
                      <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="btn-grupo-primary" onClick={abrirModalSubirCards}>
                          <i className="bi bi-cloud-arrow-up-fill"></i> Subir Meus Flashcards
                        </button>
                        <button className="btn-grupo-secondary" onClick={adicionarFlashcardGrupo}>
                          <i className="bi bi-plus-lg"></i> Criar Manualmente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grupo-flashcards-grid">
                      {(grupoSelecionado.flashcards_compartilhados || grupoSelecionado.flashcardsCompartilhados).map((c, idx) => {
                        const ehMeu = c.compartilhadoPor === usuarioAtual.nome;
                        const jaImportado = isCardJaImportado(c);
                        const podeExcluir = ehMeu || (grupoSelecionado.membros && grupoSelecionado.membros[0]?.nome?.includes(usuarioAtual.nome));

                        return (
                          <div key={idx} className="grupo-flashcard-card">
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span className="grupo-card-num-badge">
                                    #{idx + 1}
                                  </span>
                                  <span className="grupo-badge-materia" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                    <i className="bi bi-book"></i> {c.materiaNome || grupoSelecionado.materia || 'Geral'}
                                  </span>
                                  {c.tema && c.tema !== 'Geral' && (
                                    <span className="grupo-badge-tema-pill">
                                      {c.tema}
                                    </span>
                                  )}
                                </div>
                                {podeExcluir && (
                                  <button
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px' }}
                                    title="Remover card do grupo"
                                    onClick={() => removerFlashcardGrupo(idx)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                )}
                              </div>

                              <div className="grupo-flashcard-pergunta">
                                ❓ {c.pergunta}
                              </div>
                              <div className="grupo-flashcard-resposta">
                                💡 <strong>Resposta:</strong> {c.resposta}
                              </div>
                            </div>

                            <div className="grupo-flashcard-footer-action">
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                <i className="bi bi-person"></i> {ehMeu ? <strong>Você</strong> : (c.compartilhadoPor || c.autor || 'Colega')}
                                {c.data ? ` • ${c.data}` : ''}
                              </div>

                              <div>
                                {ehMeu ? (
                                  <span className="badge-card-proprio">
                                    <i className="bi bi-check-all"></i> Seu Card
                                  </span>
                                ) : jaImportado ? (
                                  <span className="badge-card-importado" title="Este flashcard já está na sua coleção pessoal">
                                    <i className="bi bi-check-circle-fill"></i> Na sua coleção
                                  </span>
                                ) : (
                                  <button
                                    className="btn-importar-card-item"
                                    title="Salvar este flashcard na sua coleção pessoal"
                                    onClick={() => importarCardParaMim(c)}
                                  >
                                    <i className="bi bi-box-arrow-in-down"></i> Importar para Mim
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Modal: Criar Grupo */}
        {modalCriarAberto && (
          <div className="grupo-modal-backdrop" onClick={() => setModalCriarAberto(false)}>
            <div className="grupo-modal-card" onClick={e => e.stopPropagation()}>
              <div className="grupo-modal-header">
                <h3><i className="bi bi-plus-circle-fill text-danger"></i> Criar Grupo de Estudo</h3>
                <button className="btn-grupo-modal-close" onClick={() => setModalCriarAberto(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="grupo-modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Nome do Grupo *
                  </label>
                  <input
                    type="text"
                    className="cal-form-input"
                    style={{ width: '100%' }}
                    placeholder="Ex: Grupo de Anatomia, Estudos ENEM 2026..."
                    value={novoGrupo.nome}
                    autoFocus
                    onChange={e => setNovoGrupo({ ...novoGrupo, nome: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Matéria Principal (opcional)
                  </label>
                  <input
                    type="text"
                    className="cal-form-input"
                    style={{ width: '100%' }}
                    placeholder="Ex: Biologia, Matemática, História..."
                    value={novoGrupo.materia}
                    onChange={e => setNovoGrupo({ ...novoGrupo, materia: e.target.value })}
                  />
                </div>
              </div>

              <div className="grupo-modal-footer">
                <button className="btn-cal-cancel" onClick={() => setModalCriarAberto(false)}>Cancelar</button>
                <button className="btn-cal-save" onClick={handleCriarGrupo}>
                  <i className="bi bi-check-lg"></i> Criar Grupo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Entrar com Código */}
        {modalEntrarAberto && (
          <div className="grupo-modal-backdrop" onClick={() => setModalEntrarAberto(false)}>
            <div className="grupo-modal-card" onClick={e => e.stopPropagation()}>
              <div className="grupo-modal-header">
                <h3><i className="bi bi-key-fill text-primary"></i> Entrar no Grupo com Código</h3>
                <button className="btn-grupo-modal-close" onClick={() => setModalEntrarAberto(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="grupo-modal-body">
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Insira o código de 6 caracteres compartilhado pelo criador do grupo.
                </p>
                <div>
                  <input
                    type="text"
                    className="cal-form-input"
                    style={{ width: '100%', textTransform: 'uppercase', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }}
                    placeholder="Ex: O5K8JU"
                    maxLength={6}
                    value={codigoEntrada}
                    autoFocus
                    onChange={e => setCodigoEntrada(e.target.value)}
                  />
                </div>
              </div>

              <div className="grupo-modal-footer">
                <button className="btn-cal-cancel" onClick={() => setModalEntrarAberto(false)}>Cancelar</button>
                <button className="btn-cal-save" style={{ background: '#3b82f6' }} onClick={handleEntrarComCodigo}>
                  <i className="bi bi-box-arrow-in-right"></i> Entrar no Grupo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Subir Meus Flashcards para o Grupo */}
        {modalSubirCardsAberto && (
          <div className="grupo-modal-backdrop" onClick={() => setModalSubirCardsAberto(false)}>
            <div className="grupo-modal-card modal-subir-cards" onClick={e => e.stopPropagation()}>
              <div className="grupo-modal-header">
                <h3><i className="bi bi-cloud-arrow-up-fill text-danger"></i> Compartilhar Meus Flashcards no Grupo</h3>
                <button className="btn-grupo-modal-close" onClick={() => setModalSubirCardsAberto(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="grupo-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Selecione os flashcards da sua coleção pessoal para compartilhar com os membros do grupo <strong>{grupoSelecionado?.nome}</strong>.
                </p>

                {/* Filtros */}
                <div className="modal-subir-filtros-row">
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div className="modal-subir-search-box">
                      <i className="bi bi-search"></i>
                      <input
                        type="text"
                        placeholder="Buscar pergunta, resposta ou tema..."
                        value={buscaCardsSubir}
                        onChange={e => setBuscaCardsSubir(e.target.value)}
                      />
                      {buscaCardsSubir && (
                        <button type="button" onClick={() => setBuscaCardsSubir('')}>
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ width: '180px' }}>
                    <select
                      className="cal-form-input"
                      style={{ width: '100%', height: '38px', fontSize: '0.85rem' }}
                      value={filtroMateriaSubir}
                      onChange={e => setFiltroMateriaSubir(e.target.value)}
                    >
                      <option value="todas">Todas as Matérias</option>
                      {minhasMaterias.map(m => (
                        <option key={m.id_materia || m.id} value={m.id_materia || m.id}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Barra de Seleção Rápida */}
                <div className="modal-subir-toolbar">
                  <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                    Exibindo {cardsFiltradosParaSubir.length} {cardsFiltradosParaSubir.length === 1 ? 'card' : 'cards'} • <strong>{cardsSelecionados.size} selecionado(s)</strong>
                  </span>

                  {cardsFiltradosParaSubir.length > 0 && (
                    <button
                      type="button"
                      className="btn-modal-selecionar-todos"
                      onClick={() => toggleSelecionarTodos(cardsFiltradosParaSubir)}
                    >
                      {cardsFiltradosParaSubir.filter(c => !isCardJaNoGrupo(c)).every(c => cardsSelecionados.has(c.id || c.id_flash)) && cardsSelecionados.size > 0
                        ? 'Desmarcar Todos'
                        : 'Selecionar Todos'}
                    </button>
                  )}
                </div>

                {/* Lista de Flashcards */}
                {carregandoMeusCards ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span style={{ marginLeft: '10px' }}>Carregando seus flashcards...</span>
                  </div>
                ) : meusCards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <i className="bi bi-journal-x" style={{ fontSize: '2.5rem', color: '#94a3b8' }}></i>
                    <p style={{ margin: '10px 0 6px', fontWeight: 600, color: '#1e293b' }}>Você ainda não possui flashcards criados</p>
                    <small style={{ color: '#64748b' }}>Crie novos cards na seção "Revisão" ou utilize o botão "Criar Manualmente" no grupo.</small>
                  </div>
                ) : cardsFiltradosParaSubir.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 15px', color: '#64748b' }}>
                    Nenhum flashcard encontrado com os filtros selecionados.
                  </div>
                ) : (
                  <div className="modal-subir-cards-lista">
                    {cardsFiltradosParaSubir.map(c => {
                      const cid = c.id || c.id_flash;
                      const jaNoGrupo = isCardJaNoGrupo(c);
                      const marcado = cardsSelecionados.has(cid);

                      return (
                        <div
                          key={cid}
                          className={`modal-subir-card-item ${marcado ? 'marcado' : ''} ${jaNoGrupo ? 'desabilitado' : ''}`}
                          onClick={() => {
                            if (!jaNoGrupo) toggleSelecionarCard(cid);
                          }}
                        >
                          <div className="modal-subir-card-checkbox">
                            <input
                              type="checkbox"
                              checked={marcado || jaNoGrupo}
                              disabled={jaNoGrupo}
                              onChange={() => {
                                if (!jaNoGrupo) toggleSelecionarCard(cid);
                              }}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>

                          <div className="modal-subir-card-content">
                            <div className="modal-subir-card-meta">
                              <span className="grupo-badge-materia" style={{ fontSize: '0.72rem', padding: '1px 7px' }}>
                                {c.materiaNome}
                              </span>
                              {c.tema && c.tema !== 'Geral' && (
                                <span className="grupo-badge-tema-pill" style={{ fontSize: '0.7rem' }}>
                                  {c.tema}
                                </span>
                              )}
                              {jaNoGrupo && (
                                <span className="badge-ja-no-grupo">
                                  <i className="bi bi-check-circle"></i> Já compartilhado no grupo
                                </span>
                              )}
                            </div>

                            <div className="modal-subir-card-pergunta">
                              ❓ {c.pergunta}
                            </div>
                            <div className="modal-subir-card-resposta">
                              💡 {c.resposta}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grupo-modal-footer">
                <button className="btn-cal-cancel" onClick={() => setModalSubirCardsAberto(false)}>Cancelar</button>
                <button
                  className="btn-cal-save"
                  disabled={cardsSelecionados.size === 0}
                  style={{ opacity: cardsSelecionados.size === 0 ? 0.6 : 1 }}
                  onClick={confirmarSubirCardsParaGrupo}
                >
                  <i className="bi bi-cloud-arrow-up-fill"></i> Subir {cardsSelecionados.size} {cardsSelecionados.size === 1 ? 'Card' : 'Cards'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
