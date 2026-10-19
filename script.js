// Fallback local caso api.js não seja carregado
if (typeof apiFetch === 'undefined') {
  const API_BASE_URL = 'http://localhost/api_sectio_aurea';
  
  window.API_BASE_URL = API_BASE_URL;
  window.apiFetch = async function (endpoint, options = {}) {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const config = { ...options, headers };
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    if (response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'ProjetoIntegrador.html';
    }
    return response;
  };
}

if (typeof normalizarInteligencia === 'undefined') {
  window.normalizarInteligencia = function(nomeDb) {
    if (!nomeDb || typeof nomeDb !== 'string') return "";
    const mapa = {
      "Linguística": "linguistica", "linguistica": "linguistica",
      "Lógico-matemática": "logico", "Lógico-Matemática": "logico", "lógico-matemática": "logico", "lógico-matematica": "logico", "logico-matematica": "logico",
      "Musical": "musical", "musical": "musical",
      "Cinestésica": "corporal", "cinestésica": "corporal", "cinestesica": "corporal", "Corporal-Cinestésica": "corporal", "corporal-cinestésica": "corporal", "corporal-cinestesica": "corporal",
      "Espacial": "espacial", "espacial": "espacial",
      "Interpessoal": "interpessoal", "interpessoal": "interpessoal",
      "Intrapessoal": "intrapessoal", "intrapessoal": "intrapessoal"
    };
    return mapa[nomeDb] || mapa[nomeDb.trim()] || nomeDb.toLowerCase().trim();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  function aplicarTemaSalvo() {
    const tema = localStorage.getItem("tema");
    const icon = document.getElementById("iconTheme");
    if (tema === "dark") { document.body.classList.add("dark"); if (icon) icon.textContent = "☀️"; }
    else { document.body.classList.remove("dark"); if (icon) icon.textContent = "🌙"; }
  }
  aplicarTemaSalvo();

  const navbar = document.getElementById("navbar");
  const sections = Array.from(document.querySelectorAll("section[data-color]"));

  function updateNavbarColor() {
    if (!navbar) return;
    const isDark = document.body.classList.contains("dark");
    const centerY = window.innerHeight / 2;
    let applied = false;
    const logo = document.getElementById("logoNavbar");
    const titulo = document.getElementById("tituloNavbar");

    for (let s of sections) {
      const rect = s.getBoundingClientRect();
      if (rect.top <= centerY && rect.bottom >= centerY) {
        navbar.style.setProperty("background-color", s.dataset.color, "important");
        if (logo && logo.getAttribute("src") !== "Icones/logoBranca.png") logo.setAttribute("src", "Icones/logoBranca.png");
        if (titulo) titulo.style.setProperty("color", "white", "important");
        applied = true; break;
      }
    }

    if (!applied) {
      if (isDark) {
        navbar.style.setProperty("background-color", "#1e1e1e", "important");
        if (logo && logo.getAttribute("src") !== "Icones/logoBranca.png") logo.setAttribute("src", "Icones/logoBranca.png");
        if (titulo) titulo.style.setProperty("color", "white", "important");
      } else {
        navbar.style.setProperty("background-color", "#f4f1eb", "important");
        if (logo && logo.getAttribute("src") !== "Icones/LogoPreta.png") logo.setAttribute("src", "Icones/LogoPreta.png");
        if (titulo) titulo.style.setProperty("color", "black", "important");
      }
    }
  }
  window.updateNavbarColor = updateNavbarColor;
  updateNavbarColor();
  window.addEventListener("scroll", updateNavbarColor, { passive: true });
  window.addEventListener("resize", updateNavbarColor);

  sections.forEach(section => {
    const cor = section.dataset.color;
    const card = section.querySelector(".card-inteligencia");
    if (card) card.style.backgroundColor = cor;
  });

  document.querySelectorAll(".abrir-modal").forEach(botao => {
    botao.addEventListener("click", function () {
      const nome = this.dataset.nome;
      const cor = this.dataset.cor;
      const pontos = this.dataset.pontos;
      const areas = this.dataset.areas.split(",");
      document.getElementById("modalTitulo").textContent = nome;
      document.getElementById("modalPontos").textContent = pontos;
      const listaAreas = document.getElementById("modalAreas");
      listaAreas.innerHTML = "";
      areas.forEach(area => {
        const li = document.createElement("li");
        li.textContent = area.trim();
        listaAreas.appendChild(li);
      });
      document.getElementById("modalContent").style.borderColor = cor;
      document.getElementById("modalHeader").style.borderColor = cor;
    });
  });
});

function handleCredentialResponse(response) {
  const dados = JSON.parse(atob(response.credential.split('.')[1]));
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "882150648839-9jlqshioa5loeae8drkfm9s4ggivjesr.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  renderGoogleButton();
};

function renderGoogleButton() {
  const isDark = document.body.classList.contains("dark");
  document.querySelectorAll(".g_id_signin").forEach(el => {
    el.innerHTML = "";
    google.accounts.id.renderButton(el, { theme: isDark ? "filled_black" : "outline", size: "large", width: 250 });
  });
}

function mostrarSucesso(mensagem) {
  const toastEl = document.getElementById("toastSucesso");
  const toastMsg = document.getElementById("toastMensagem");
  toastMsg.textContent = mensagem;
  if (!toastEl) return;
  const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
  toast.show();
}

const cadastroForm = document.getElementById("cadastroForm");
const loginForm = document.getElementById("loginForm");

function abrirModalTeste() {
  const modalTesteEl = document.getElementById("modalConhecerTeste");
  if (!modalTesteEl) return;
  const modalTeste = bootstrap.Modal.getOrCreateInstance(modalTesteEl);
  modalTeste.show();
}

if (cadastroForm) {
  cadastroForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;

    try {
      const response = await apiFetch("cadastro", { method: "POST", body: JSON.stringify({ nome, email, senha }) });
      const data = await response.json();

      if (response.ok) {
        mostrarSucesso("Conta criada com sucesso!");
        const loginResp = await apiFetch("login", { method: "POST", body: JSON.stringify({ email, senha }) });
        
        if (loginResp.ok) {
          const loginData = await loginResp.json();
          sessionStorage.setItem("token", loginData.token);
          sessionStorage.setItem("user", JSON.stringify(loginData.user));
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify(loginData.user));
          sessionStorage.setItem("planoUsuario", (loginData.user?.plano || "gratuito").toLowerCase());
          
          const modalCadastroEl = document.getElementById("cadastro");
          bootstrap.Modal.getInstance(modalCadastroEl).hide();
          modalCadastroEl.addEventListener("hidden.bs.modal", function () { abrirModalTeste(); }, { once: true });
        } else {
          document.getElementById("cadastro").style.display = 'none';
          setTimeout(() => { new bootstrap.Modal(document.getElementById("loginModal")).show(); }, 500);
        }
      } else {
        Swal.fire({ icon: "error", title: "Erro no cadastro", text: data.message || "Erro desconhecido", confirmButtonColor: "#000" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro de conexão", text: "Não foi possível conectar.", confirmButtonColor: "#000" });
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    try {
      const response = await apiFetch("login", { method: "POST", body: JSON.stringify({ email, senha }) });
      const data = await response.json();

      if (response.ok) {
        mostrarSucesso("Login realizado com sucesso!");
        
        // 🔥 LIMPA TUDO PRIMEIRO
        sessionStorage.clear();
        localStorage.clear();

        // 🔥 SALVA O TOKEN NA FORÇA
        const tokenRecebido = data.token;
        localStorage.setItem("token", tokenRecebido);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("planoUsuario", (data.user?.plano || "gratuito").toLowerCase());

        if (data.user && data.user.tipo_dom) {
          const tipoSlug = normalizarInteligencia(data.user.tipo_dom);
          localStorage.setItem("inteligenciaUsuario", tipoSlug);
          if (data.user.cor_dominante) {
            localStorage.setItem("corPrimaria", data.user.cor_dominante);
          }
        }

        const modalLoginEl = document.getElementById("loginModal");
        if (modalLoginEl) {
          const modalLogin = bootstrap.Modal.getInstance(modalLoginEl);
          if (modalLogin) modalLogin.hide();
        }

        setTimeout(() => {
          // 👇 PEGA O TOKEN DO LOCALSTORAGE
          const tokenParaURL = localStorage.getItem("token"); 

          if (data.user && data.user.tipo_dom) {
            const tipoSlug = normalizarInteligencia(data.user.tipo_dom);
            const cor = data.user.cor_dominante || '#6c757d';
            
            // 👇 MANDA PRA URL COM O TOKEN
            window.location.href = `http://localhost:5173/?tipo=${tipoSlug}&cor=${encodeURIComponent(cor)}&token=${tokenParaURL}`;
          } else {
            window.location.href = "TesteInteligencia.html";
          }
        }, 500);

      } else {
        // 👇 AVISA SE A SENHA TÁ ERRADA
        Swal.fire({
          icon: "error",
          title: "Erro no login",
          text: data.message || "E-mail ou senha incorretos.",
          confirmButtonColor: "#000"
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro de conexão", text: "Não foi possível conectar.", confirmButtonColor: "#000" });
    }
  });
}

const recuperarSenhaForm = document.getElementById("recuperarSenhaForm");
if (recuperarSenhaForm) {
  recuperarSenhaForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("recuperarEmail")?.value.trim();
    if (!email) return Swal.fire({ icon: "warning", title: "Atenção", text: "Preencha o e-mail.", confirmButtonColor: "#000" });
    try {
      await apiFetch("recuperar-senha", { method: "POST", body: JSON.stringify({ email }) });
      bootstrap.Modal.getInstance(document.getElementById("recuperarSenhaModal"))?.hide();
      recuperarSenhaForm.reset();
      Swal.fire({ icon: "success", title: "Instruções enviadas!", text: `Se o e-mail (${email}) estiver cadastrado, enviamos as instruções.`, confirmButtonColor: "#000" }).then(() => {
        new bootstrap.Modal(document.getElementById("loginModal")).show();
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível processar.", confirmButtonColor: "#000" });
    }
  });
}

function liberarMenuTeste() {
  const menu = document.getElementById("menuTeste");
  if (menu) menu.classList.remove("d-none");
}

const formReclame = document.getElementById("formReclame");
if(formReclame){
  formReclame.addEventListener("submit", function(e){
    e.preventDefault();
    const dados = {
      nome: formReclame.querySelector('input[type="text"]').value,
      email: formReclame.querySelector('input[type="email"]').value,
      tipo: formReclame.querySelector('select').value.replace(/[^\w\sÀ-ÿ]/g, "").trim(),
      mensagem: formReclame.querySelector('textarea').value
    };
    apiFetch('adm/duvidas', { method: 'POST', body: JSON.stringify(dados) })
    .then(response => {
      if (response.ok) {
        mostrarSucesso("Mensagem enviada com sucesso!");
        bootstrap.Modal.getInstance(document.getElementById("modalReclame"))?.hide();
        formReclame.reset();
      } else alert("Erro ao enviar.");
    }).catch(() => alert("Erro de conexão."));
  });
}

function toggleDark() {
  document.body.classList.toggle("dark");
  const icon = document.getElementById("iconTheme");
  if (document.body.classList.contains("dark")) { icon.textContent = "☀️"; localStorage.setItem("tema", "dark"); }
  else { icon.textContent = "🌙"; localStorage.setItem("tema", "light"); }
  if (typeof window.updateNavbarColor === 'function') window.updateNavbarColor();
  renderGoogleButton(); 
}

function salvarTema() {
  localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
}