"use strict";

(() => {
  console.log("Java script funcionando")
  /* ---------- 1. ATALHOS ---------- */
  const pegar = (seletor) => document.querySelector(seletor);
  const pegarTodos = (seletor) => [...document.querySelectorAll(seletor)];


  /* ---------- 2. TÍTULO ANIMADO ---------- */
  // Divide a palavra em letras para cada uma subir no seu tempo
  function animarLetras(elemento, texto) {
    elemento.textContent = "";

    [...texto].forEach((letra, posicao) => {
      const span = document.createElement("span");
      span.className = "letra";
      span.style.setProperty("--i", posicao);
      span.setAttribute("aria-hidden", "true");
      span.textContent = letra;
      elemento.appendChild(span);
    });
  }

  animarLetras(pegar(".titulo"), "INTEGRA");
  animarLetras(pegar("#portal-titulo"), "INTEGRA");


  /* ---------- 3. PORTAL (ESCOLHA DO PERFIL) ---------- */
  // O botão "administrador" é um link para administrador.html
  const portal = pegar("#portal");
  const partesDoSite = [pegar("#barra-progresso"), pegar(".cabecalho"), pegar("main")];

  // Com o portal aberto, o resto da página fica "inerte": o Tab não alcança nada atrás dele
  function definirPortal(aberto) {
    portal.classList.toggle("saindo", !aberto);
    document.body.classList.toggle("travado", aberto);
    partesDoSite.forEach((parte) => { parte.inert = aberto; });
  }

  function fecharPortal() {
    definirPortal(false);
    window.scrollTo(0, 0);
    pegar("#inicio").focus({ preventScroll: true });
  }

  function abrirPortal() {
    definirPortal(true);
    pegar("#entrar-colaborador").focus();
  }

  definirPortal(true);
  pegar("#entrar-colaborador").focus();

  pegar("#entrar-colaborador").addEventListener("click", fecharPortal);

  pegar("#trocar-perfil").addEventListener("click", () => {
    alternarMenu(false);
    abrirPortal();
  });


  /* ---------- 4. MENU ---------- */
  const botaoMenu = pegar(".botao-menu");
  const menu = pegar("#menu");

  function alternarMenu(abrir) {
    menu.classList.toggle("aberto", abrir);
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    botaoMenu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  }

  botaoMenu.addEventListener("click", () => alternarMenu(!menu.classList.contains("aberto")));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => alternarMenu(false));
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") alternarMenu(false);
  });


  /* ---------- 5. BARRA DE PROGRESSO E LINK ATIVO ---------- */
  const barra = pegar("#barra-progresso");

  window.addEventListener("scroll", () => {
    const pagina = document.documentElement;
    const total = pagina.scrollHeight - pagina.clientHeight || 1;
    barra.style.width = (pagina.scrollTop / total) * 100 + "%";
  }, { passive: true });

  // Destaca no menu o bloco que está no meio da tela
  const linksMenu = pegarTodos("#menu a");

  const observadorMenu = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;

      linksMenu.forEach((link) => {
        link.classList.toggle("ativo", link.getAttribute("href") === "#" + entrada.target.id);
      });
    });
  }, { rootMargin: "-45% 0px -45% 0px" });

  linksMenu.forEach((link) => {
    const bloco = pegar(link.getAttribute("href"));
    if (bloco) observadorMenu.observe(bloco);
  });


  /* ---------- 6. ELEMENTOS QUE SOBEM E NÚMEROS QUE CONTAM ---------- */
  function contarAte(elemento) {
    const alvo = Number(elemento.dataset.numero);
    let atual = 0;

    const relogio = setInterval(() => {
      atual += Math.max(1, Math.ceil(alvo / 30));

      if (atual >= alvo) {
        atual = alvo;
        clearInterval(relogio);
      }

      elemento.textContent = atual;
    }, 40);
  }

  const observadorRevelar = new IntersectionObserver((entradas, observador) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;

      const item = entrada.target;
      item.classList.add("visivel");

      // Quando a animação de entrada termina, o cartão passa a responder ao mouse sem atraso
      const atraso = parseFloat(getComputedStyle(item).transitionDelay) * 1000 || 0;
      setTimeout(() => item.classList.add("pronto"), 850 + atraso);

      entrada.target.querySelectorAll("[data-numero]").forEach(contarAte);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.15 });

  pegarTodos(".revelar").forEach((item) => observadorRevelar.observe(item));


  /* ---------- 7. FRASES QUE ALTERNAM NO INÍCIO ---------- */
  const frases = [
    "Toda grande melhoria começou com uma ideia.",
    "Aqui, a sua opinião é ouvida com respeito.",
    "Um relato hoje pode melhorar o dia de todos.",
    "Escrever leva um minuto. O efeito pode durar anos."
  ];

  const frase = pegar("#frase-giratoria");
  let posicaoFrase = 0;

  frase.textContent = frases[0];

  setInterval(() => {
    frase.classList.add("some");

    setTimeout(() => {
      posicaoFrase = (posicaoFrase + 1) % frases.length;
      frase.textContent = frases[posicaoFrase];
      frase.classList.remove("some");
    }, 500);
  }, 4500);


  /* ---------- 8. EFEITOS DE MOUSE ---------- */
  // As luzes do início acompanham o mouse
  pegar("#inicio").addEventListener("mousemove", (evento) => {
    const x = evento.clientX / window.innerWidth - 0.5;
    const y = evento.clientY / window.innerHeight - 0.5;

    pegarTodos(".luz").forEach((luz, i) => {
      const forca = 30 + i * 25;
      luz.style.transform = `translate(${x * forca}px, ${y * forca}px)`;
    });
  });

  // Os cartões .inclinar giram de leve conforme o mouse
  pegarTodos(".inclinar").forEach((cartao) => {
    cartao.addEventListener("mousemove", (evento) => {
      const caixa = cartao.getBoundingClientRect();
      const x = (evento.clientX - caixa.left) / caixa.width - 0.5;
      const y = (evento.clientY - caixa.top) / caixa.height - 0.5;

      cartao.style.transform =
        `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-3px)`;
    });

    cartao.addEventListener("mouseleave", () => {
      cartao.style.transform = "";
    });
  });


  /* ---------- 9. DÚVIDAS FREQUENTES ---------- */
  // Abre uma resposta por vez (a animação está no CSS)
  const perguntas = pegarTodos(".faq-pergunta");

  perguntas.forEach((pergunta) => {
    pergunta.addEventListener("click", () => {
      const abrir = pergunta.getAttribute("aria-expanded") !== "true";

      perguntas.forEach((outra) => outra.setAttribute("aria-expanded", "false"));
      pergunta.setAttribute("aria-expanded", String(abrir));
    });
  });


  /* ---------- 10. FORMULÁRIO EM ETAPAS ---------- */
  // 1 tipo · 2 título e descrição · 3 anônimo ou nome · 4 confirmação
  //
  // DEMONSTRAÇÃO: ainda não existe back-end. Ao enviar, nada é guardado nem
  // transmitido; apenas se mostra a confirmação. Quando houver API, o envio
  // real entra no ponto marcado com "TODO" dentro do evento "submit".
  const formulario = pegar("#formulario");
  const etapas = pegarTodos(".etapa");
  const bolinhas = pegarTodos("#indicador i");
  const campoTitulo = pegar("#titulo-mensagem");
  const campoDescricao = pegar("#descricao-mensagem");
  const campoNome = pegar("#nome");
  const campoSetor = pegar("#setor");
  const contador = pegar("#contador-caracteres");
  const mensagemErro = pegar("#mensagem-erro");
  const caixaAnonimo = pegar("#caixa-anonimo");

  let etapaAtual = 1;
  let tipoEscolhido = "";

  // Mostra a etapa e leva o foco ao primeiro campo dela
  function mostrarEtapa(numero, comFoco = true) {
    etapaAtual = numero;

    etapas.forEach((etapa) => {
      etapa.hidden = Number(etapa.dataset.etapa) !== numero;
    });

    bolinhas.forEach((bolinha, posicao) => {
      bolinha.classList.toggle("feita", posicao < numero);
      bolinha.classList.toggle("atual", posicao === numero - 1);
    });

    pegar("#indicador").hidden = numero === 4;

    if (!comFoco) return;

    const primeiroCampo = {
      1: pegar(".categoria"),
      2: campoTitulo,
      3: caixaAnonimo,
      4: pegar(".sucesso-titulo")
    }[numero];

    primeiroCampo.focus({ preventScroll: true });
  }

  // Escolher o tipo já avança para a etapa 2
  pegarTodos(".categoria").forEach((botao) => {
    botao.addEventListener("click", () => {
      tipoEscolhido = botao.dataset.tipo;
      pegar("#tipo-escolhido").textContent = tipoEscolhido;
      mostrarEtapa(2);
    });
  });

  // Contador de caracteres da descrição
  campoDescricao.addEventListener("input", () => {
    contador.textContent = campoDescricao.value.length + " / 1000";
  });

  // "Anônimo" bloqueia e limpa nome e setor (começa marcado)
  function sincronizarAnonimato() {
    pegarTodos("#identificacao input").forEach((campo) => {
      campo.disabled = caixaAnonimo.checked;
      if (caixaAnonimo.checked) campo.value = "";
    });
  }

  caixaAnonimo.addEventListener("change", sincronizarAnonimato);

  // Confere título e descrição; devolve true se estiver tudo preenchido
  function validarMensagem() {
    if (!campoTitulo.value.trim()) {
      mensagemErro.textContent = "Informe um título para sua mensagem.";
      campoTitulo.focus();
      return false;
    }

    if (!campoDescricao.value.trim()) {
      mensagemErro.textContent = "Escreva uma descrição para sua mensagem.";
      campoDescricao.focus();
      return false;
    }

    mensagemErro.textContent = "";
    return true;
  }

  function tentarAvancar() {
    if (validarMensagem()) mostrarEtapa(3);
  }

  // Botões Voltar, Continuar e Enviar outra mensagem
  formulario.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-acao]");
    if (!botao) return;

    const acao = botao.dataset.acao;

    if (acao === "voltar") mostrarEtapa(etapaAtual - 1);
    if (acao === "avancar") tentarAvancar();

    if (acao === "novo") {
      formulario.reset();
      tipoEscolhido = "";
      mensagemErro.textContent = "";
      contador.textContent = "0 / 1000";
      sincronizarAnonimato();
      mostrarEtapa(1);
    }
  });

  // Confete colorido (só para sugestões de melhoria)
  function soltarConfete() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cores = ["#f3cfd6", "#9bb7ff", "#c8bdea", "#ffffff", "#ffaabe"];

    for (let i = 0; i < 46; i++) {
      const pedaco = document.createElement("i");
      pedaco.className = "confete";
      pedaco.style.left = Math.random() * 100 + "vw";
      pedaco.style.background = cores[i % cores.length];
      pedaco.style.borderRadius = i % 2 ? "50%" : "2px";
      pedaco.style.animationDelay = Math.random() * 0.6 + "s";

      document.body.appendChild(pedaco);
      setTimeout(() => pedaco.remove(), 3200);
    }
  }

  // O Enter também dispara "submit": só envia na etapa 3; na etapa 2 apenas avança
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (etapaAtual === 2) {
      tentarAvancar();
      return;
    }

    if (etapaAtual !== 3) return;

    // Segurança extra: nunca envia mensagem sem tipo, título ou descrição
    if (!tipoEscolhido) {
      mostrarEtapa(1);
      return;
    }

    if (!validarMensagem()) {
      mostrarEtapa(2, false);
      validarMensagem();
      return;
    }

    const mensagem = {
      tipo: tipoEscolhido,
      titulo: campoTitulo.value.trim(),
      descricao: campoDescricao.value.trim(),
      anonimo: caixaAnonimo.checked,
      nome: caixaAnonimo.checked ? null : campoNome.value.trim(),
      setor: caixaAnonimo.checked ? null : campoSetor.value.trim()
    };

    // TODO (back-end): enviar "mensagem" para a API. Por enquanto não é guardada.
    void mensagem;

    mostrarEtapa(4);
    if (tipoEscolhido === "Sugestão de Melhoria") soltarConfete();
  });

  sincronizarAnonimato();
  mostrarEtapa(1, false);

})();
