"use strict";

(() => {

  /* ---------- 1. ATALHOS ---------- */
  const pegar = (id) => document.getElementById(id);
  const pegarTodos = (seletor) => [...document.querySelectorAll(seletor)];

  // Todo texto que vem de dados é escapado antes de entrar no HTML
  const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const classesStatus = {
    "Pendente": "status-pendente",
    "Em Análise": "status-analise",
    "Concluído": "status-concluido"
  };

  const seloStatus = (status) =>
    `<span class="selo ${classesStatus[status] || ""}">${escapar(status)}</span>`;

  const seloIdentificacao = (mensagem) => mensagem.nome
    ? `<span class="selo selo-identificado">🪪 ${escapar(mensagem.nome)}</span>`
    : `<span class="selo selo-anonimo">🛡️ Anônimo</span>`;

  // Datas guardadas como AAAA-MM-DD (ordenam bem) e mostradas como DD/MM/AAAA
  const formatarData = (iso) => iso.split("-").reverse().join("/");

  const hojeISO = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  };


  /* ---------- 2. DADOS DE EXEMPLO ---------- */
  // Na versão final, estes dados vêm do back-end (Node.js + banco de dados).
  // Existe uma única conta de administrador, criada na instalação.
  const administrador = {
    email: "admin@integra.com",
    senha: "1234567"
  };

  const categorias = [
    "Sugestão de Melhoria",
    "Problema ou Ocorrência",
    "Reclamação ou Outros"
  ];

  // "numero" é o número interno da mensagem (#1, #2...), sem relação com tokens
  const mensagens = [
    {
      numero: 1, categoria: "Sugestão de Melhoria", titulo: "Mais ventiladores no galpão",
      descricao: "No período da tarde o calor atrapalha a produção. Sugiro instalar ventiladores extras no galpão principal.",
      nome: null, data: "2026-11-10", status: "Em Análise", nota: "Cotando equipamentos.",
      historico: ["10/11 · Criada", "12/11 · Pendente → Em Análise"]
    },
    {
      numero: 2, categoria: "Problema ou Ocorrência", titulo: "Lâmpada queimada no corredor",
      descricao: "A lâmpada do corredor do setor C está queimada há uma semana e o local fica escuro.",
      nome: "Carlos · Manutenção", data: "2026-11-12", status: "Pendente", nota: "",
      historico: ["12/11 · Criada"]
    },
    {
      numero: 3, categoria: "Reclamação ou Outros", titulo: "Troca de turno desorganizada",
      descricao: "A troca de turno acontece sem aviso prévio, o que gera confusão entre as equipes.",
      nome: null, data: "2026-11-13", status: "Concluído", nota: "Aviso com 48h de antecedência implantado.",
      historico: ["13/11 · Criada", "14/11 · Em Análise → Concluído"]
    },
    {
      numero: 4, categoria: "Sugestão de Melhoria", titulo: "Ponto de coleta seletiva",
      descricao: "Seria ótimo ter lixeiras de coleta seletiva perto do refeitório.",
      nome: "Ana · Administrativo", data: "2026-11-14", status: "Pendente", nota: "",
      historico: ["14/11 · Criada"]
    },
    {
      numero: 5, categoria: "Problema ou Ocorrência", titulo: "Bebedouro do setor B sem gelo",
      descricao: "O bebedouro do setor B não está gelando desde segunda-feira.",
      nome: null, data: "2026-11-15", status: "Em Análise", nota: "",
      historico: ["15/11 · Criada"]
    },
    {
      numero: 6, categoria: "Reclamação ou Outros", titulo: "Estacionamento sem sinalização",
      descricao: "As vagas do estacionamento não têm sinalização e isso gera conflito.",
      nome: null, data: "2026-11-15", status: "Pendente", nota: "",
      historico: ["15/11 · Criada"]
    }
  ];

  // Mais nova primeiro (empate na data: o número maior vem antes)
  const maisNovaPrimeiro = (a, b) => b.data.localeCompare(a.data) || b.numero - a.numero;

/* ---------- 3. LOGIN E NAVEGAÇÃO ---------- */
  const login = pegar("login");
  const aplicacao = pegar("aplicacao");

  pegar("formulario-login").addEventListener("submit", (evento) => {
    evento.preventDefault();

    const email = pegar("login-email").value.trim();
    const senha = pegar("login-senha").value;

    if (email === administrador.email && senha === administrador.senha) {
      pegar("erro-login").textContent = "";
      evento.target.reset();
      login.hidden = true;
      aplicacao.hidden = false;
      iniciarPainel();
      avisar("Bem-vindo(a) ao painel.");
    } else {
      pegar("erro-login").textContent = "E-mail ou senha incorretos.";
    }
  });

  pegar("botao-sair").addEventListener("click", () => {
    fecharDetalhes();
    aplicacao.hidden = true;
    login.hidden = false;
    pegar("login-email").focus();
  });

  const textosDasVisoes = {
    painel:        ["Painel", "Visão geral das mensagens recebidas."],
    mensagens:     ["Mensagens", "Consulte, filtre e acompanhe cada mensagem."],
    configuracoes: ["Configurações", "Categorias e conta do administrador."]
  };

  function mostrarVisao(visao) {
    pegarTodos(".menu-item[data-visao]").forEach((botao) => {
      const ativo = botao.dataset.visao === visao;
      botao.classList.toggle("ativo", ativo);
      if (ativo) botao.setAttribute("aria-current", "page");
      else botao.removeAttribute("aria-current");
    });

    pegar("titulo-visao").textContent = textosDasVisoes[visao][0];
    pegar("subtitulo-visao").textContent = textosDasVisoes[visao][1];

    // Painel: cartões + resumo · Mensagens: só a tabela · Configurações: só os ajustes
    pegar("cartoes").hidden = visao !== "painel";
    pegar("secao-resumo").hidden = visao !== "painel";
    pegar("secao-tabela").hidden = visao !== "mensagens";
    pegar("secao-configuracoes").hidden = visao !== "configuracoes";
  }

  pegarTodos(".menu-item[data-visao]").forEach((botao) => {
    botao.addEventListener("click", () => mostrarVisao(botao.dataset.visao));
  });

  function iniciarPainel() {
    mostrarVisao("painel");
    desenharCartoes();
    desenharResumo();
    desenharFiltroCategorias();
    desenharTabela();
    desenharConfiguracoes();
  }


  /* ---------- 4. DASHBOARD (CARTÕES) ---------- */
  // Os números são recalculados toda vez que um status muda
  function desenharCartoes() {
    const contar = (status) => mensagens.filter((m) => m.status === status).length;

    const cartoes = [
      ["📨", "Total de mensagens", mensagens.length],
      ["⏳", "Pendentes", contar("Pendente")],
      ["🔎", "Em análise", contar("Em Análise")],
      ["✅", "Concluídas", contar("Concluído")]
    ];

    pegar("cartoes").innerHTML = cartoes.map(([icone, nome, valor]) => `
      <div class="vidro cartao">
        <span class="cartao-icone" aria-hidden="true">${icone}</span>
        <b>${valor}</b>
        <span>${nome}</span>
      </div>`).join("");
  }

  // Resumo do Painel: as 5 mensagens mais recentes e as barras por categoria
  function desenharResumo() {
    const recentes = [...mensagens].sort(maisNovaPrimeiro).slice(0, 5);

    pegar("lista-recentes").innerHTML = recentes.map((m) => `
      <button class="resumo-item" type="button" data-numero="${m.numero}">
        <span><b>${escapar(m.titulo)}</b><small>#${m.numero} · ${formatarData(m.data)}</small></span>
        ${seloStatus(m.status)}
      </button>`).join("");

    pegar("grafico-categorias").innerHTML = categorias.map((categoria) => {
      const total = mensagens.filter((m) => m.categoria === categoria).length;
      const percentual = mensagens.length ? (total / mensagens.length) * 100 : 0;

      return `
        <div class="barra-linha">
          <div class="barra-topo"><span>${escapar(categoria)}</span><b>${total}</b></div>
          <div class="barra-fundo"><div class="barra-valor" style="width: ${percentual}%"></div></div>
        </div>`;
    }).join("");
  }

  // Clicar numa mensagem recente abre os detalhes; o botão leva à lista completa
  pegar("lista-recentes").addEventListener("click", (evento) => {
    const item = evento.target.closest("[data-numero]");
    if (item) abrirDetalhes(Number(item.dataset.numero));
  });

  pegar("botao-ver-todas").addEventListener("click", () => mostrarVisao("mensagens"));


  /* ---------- 5. TABELA, BUSCA, FILTROS E ORDEM ---------- */
  let ordem = "desc"; // "desc": mais nova primeiro · "asc": mais antiga primeiro

  function desenharFiltroCategorias() {
    const atual = pegar("filtro-categoria").value;

    pegar("filtro-categoria").innerHTML =
      `<option value="">Todas as categorias</option>` +
      categorias.map((c) => `<option value="${escapar(c)}">${escapar(c)}</option>`).join("");

    pegar("filtro-categoria").value = categorias.includes(atual) ? atual : "";
  }

  function desenharTabela() {
    const busca = pegar("busca").value.trim().toLowerCase();
    const status = pegar("filtro-status").value;
    const categoria = pegar("filtro-categoria").value;

    // "3" ou "#3" procura pelo número da mensagem; qualquer outro texto, pelo título
    const numeroBuscado = /^#?\d+$/.test(busca) ? Number(busca.replace("#", "")) : null;

    const filtradas = mensagens.filter((m) =>
      (!busca || m.titulo.toLowerCase().includes(busca) || m.numero === numeroBuscado) &&
      (!status || m.status === status) &&
      (!categoria || m.categoria === categoria)
    ).sort(maisNovaPrimeiro);

    if (ordem === "asc") filtradas.reverse();

    pegar("corpo-tabela").innerHTML = filtradas.map((m) => `
      <tr data-numero="${m.numero}">
        <td data-rotulo="Nº"><b>#${m.numero}</b></td>
        <td data-rotulo="Categoria">${escapar(m.categoria)}</td>
        <td data-rotulo="Título"><button class="link-linha" type="button" data-numero="${m.numero}">${escapar(m.titulo)}</button></td>
        <td data-rotulo="Identificação">${seloIdentificacao(m)}</td>
        <td data-rotulo="Data">${formatarData(m.data)}</td>
        <td data-rotulo="Status">${seloStatus(m.status)}</td>
      </tr>`).join("");

    pegar("sem-resultado").hidden = filtradas.length > 0;

    pegar("ordenacao").value = ordem;
    pegar("botao-ordenar").textContent = "Data " + (ordem === "desc" ? "▼" : "▲");
    pegar("th-data").setAttribute("aria-sort", ordem === "desc" ? "descending" : "ascending");
  }

  ["busca", "filtro-status", "filtro-categoria"].forEach((id) => {
    pegar(id).addEventListener("input", desenharTabela);
  });

  pegar("ordenacao").addEventListener("change", (evento) => {
    ordem = evento.target.value;
    desenharTabela();
  });

  pegar("botao-ordenar").addEventListener("click", () => {
    ordem = ordem === "desc" ? "asc" : "desc";
    desenharTabela();
  });

  pegar("botao-limpar").addEventListener("click", () => {
    pegar("busca").value = "";
    pegar("filtro-status").value = "";
    pegar("filtro-categoria").value = "";
    ordem = "desc";
    desenharTabela();
  });

  // Clicar em qualquer ponto da linha (ou usar o botão do título) abre os detalhes
  pegar("corpo-tabela").addEventListener("click", (evento) => {
    const linha = evento.target.closest("tr");
    if (linha) abrirDetalhes(Number(linha.dataset.numero));
  });


  /* ---------- 6. JANELA DE DETALHES ---------- */
  const fundoModal = pegar("fundo-modal");
  const modal = pegar("modal");
  let numeroAberto = null;

  function abrirDetalhes(numero) {
    const m = mensagens.find((item) => item.numero === numero);
    if (!m) return;

    numeroAberto = numero;

    modal.innerHTML = `
      ${seloIdentificacao(m)}
      <h3 id="modal-titulo">#${m.numero} · ${escapar(m.titulo)}</h3>
      <p class="modal-info">${escapar(m.categoria)} · ${formatarData(m.data)}</p>

      <div class="texto-mensagem">${escapar(m.descricao)}</div>

      <label for="modal-status">Status</label>
      <select id="modal-status">
        ${["Pendente", "Em Análise", "Concluído"].map((s) =>
          `<option ${s === m.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>

      <label for="modal-nota">Nota interna</label>
      <textarea id="modal-nota" maxlength="500">${escapar(m.nota)}</textarea>
      <p class="ajuda">Visível só para a administração. Não é enviada a quem escreveu a mensagem.</p>

      <ul class="historico">${m.historico.map((h) => `<li>${escapar(h)}</li>`).join("")}</ul>

      <div class="linha-botoes">
        <button class="botao contorno" type="button" id="modal-cancelar">Cancelar</button>
        <button class="botao" type="button" id="modal-salvar">Salvar</button>
      </div>`;

    pegar("modal-cancelar").addEventListener("click", fecharDetalhes);
    pegar("modal-salvar").addEventListener("click", () => salvarDetalhes(m));

    fundoModal.hidden = false;
    pegar("modal-status").focus();
  }

  function fecharDetalhes() {
    if (fundoModal.hidden) return;

    fundoModal.hidden = true;

    // Devolve o foco ao botão que abriu a janela (se ele ainda estiver visível)
    const volta = pegarTodos(`button[data-numero="${numeroAberto}"]`).find((el) => el.offsetParent !== null);
    if (volta) volta.focus();

    numeroAberto = null;
  }

  function salvarDetalhes(mensagem) {
    const novoStatus = pegar("modal-status").value;

    // Registra a mudança no histórico (dia/mês, estado anterior e novo)
    if (novoStatus !== mensagem.status) {
      mensagem.historico.push(`${formatarData(hojeISO()).slice(0, 5)} · ${mensagem.status} → ${novoStatus}`);
    }

    mensagem.status = novoStatus;
    mensagem.nota = pegar("modal-nota").value.trim();

    desenharCartoes();
    desenharResumo();
    desenharTabela();
    fecharDetalhes();
    avisar("Mensagem atualizada.");
  }

  // Fecha ao clicar fora da janela ou apertar Esc; o Tab fica preso dentro da janela
  fundoModal.addEventListener("click", (evento) => {
    if (evento.target === fundoModal) fecharDetalhes();
  });

  document.addEventListener("keydown", (evento) => {
    if (fundoModal.hidden) return;

    if (evento.key === "Escape") {
      fecharDetalhes();
      return;
    }

    if (evento.key !== "Tab") return;

    const focaveis = [...modal.querySelectorAll("select, textarea, button")];
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  });


  /* ---------- 7. CONFIGURAÇÕES ---------- */
  function desenharConfiguracoes() {
    pegar("lista-categorias").innerHTML = categorias.map((categoria, posicao) => `
      <span class="chip">${escapar(categoria)}
        <button type="button" aria-label="Remover ${escapar(categoria)}" data-posicao="${posicao}">×</button>
      </span>`).join("");

    pegar("conta-email").textContent = "👤 " + administrador.email;
  }

  function atualizarCategorias() {
    desenharConfiguracoes();
    desenharFiltroCategorias();
    desenharResumo();
    desenharTabela();
  }

  // Sem duplicadas: ignora maiúsculas, minúsculas e espaços repetidos
  function adicionarCategoria() {
    const campo = pegar("nova-categoria");
    const nome = campo.value.trim().replace(/\s+/g, " ");
    if (!nome) return;

    const jaExiste = categorias.some((c) => c.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"));

    if (jaExiste) {
      avisar("Essa categoria já existe.");
      return;
    }

    categorias.push(nome);
    campo.value = "";
    atualizarCategorias();
    avisar("Categoria adicionada.");
  }

  pegar("botao-categoria").addEventListener("click", adicionarCategoria);

  pegar("nova-categoria").addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") adicionarCategoria();
  });

  // Remover pede confirmação e é bloqueado se houver mensagens nessa categoria
  pegar("lista-categorias").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-posicao]");
    if (!botao) return;

    const posicao = Number(botao.dataset.posicao);
    const nome = categorias[posicao];
    const emUso = mensagens.filter((m) => m.categoria === nome).length;

    if (emUso > 0) {
      avisar(`Não é possível remover "${nome}": ${emUso} mensagem(ns) usam esta categoria.`);
      return;
    }

    if (!confirm(`Remover a categoria "${nome}"?`)) return;

    categorias.splice(posicao, 1);
    atualizarCategorias();
    avisar("Categoria removida.");
  });

  // Alterar a senha da única conta de administrador
  pegar("formulario-senha").addEventListener("submit", (evento) => {
    evento.preventDefault();

    const atual = pegar("senha-atual").value;
    const nova = pegar("senha-nova").value;
    const confirmar = pegar("senha-confirmar").value;
    const erro = pegar("erro-senha");

    if (atual !== administrador.senha) {
      erro.textContent = "A senha atual está incorreta.";
      return;
    }

    if (nova.length < 6) {
      erro.textContent = "A nova senha precisa ter pelo menos 6 caracteres.";
      return;
    }

    if (nova !== confirmar) {
      erro.textContent = "A confirmação não é igual à nova senha.";
      return;
    }

    administrador.senha = nova;
    erro.textContent = "";
    evento.target.reset();
    avisar("Senha alterada com sucesso.");
  });


  /* ---------- 8. AVISOS E EXPORTAÇÃO ---------- */
  const aviso = pegar("aviso");
  let relogioAviso;

  function avisar(texto) {
    aviso.textContent = texto;
    aviso.hidden = false;

    clearTimeout(relogioAviso);
    relogioAviso = setTimeout(() => { aviso.hidden = true; }, 3200);
  }

  pegar("botao-exportar").addEventListener("click", () => {
    avisar("Na versão final, o back-end gera o arquivo CSV com as mensagens.");
  });

})();
