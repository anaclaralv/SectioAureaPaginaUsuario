


// Fallback local caso api.js não seja carregado
if (typeof apiFetch === 'undefined') {
  const API_BASE_URL = 'http://localhost:8080/pi_api/api';
  window.API_BASE_URL = API_BASE_URL;
  window.apiFetch = async function (endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
      ...options,
      headers,
    };
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    if (response.status === 401) {
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
      "Linguística": "linguistica",
      "linguistica": "linguistica",
      "Lógico-matemática": "logico",
      "Lógico-Matemática": "logico",
      "lógico-matemática": "logico",
      "lógico-matematica": "logico",
      "logico-matematica": "logico",
      "Musical": "musical",
      "musical": "musical",
      "Cinestésica": "corporal",
      "cinestésica": "corporal",
      "cinestesica": "corporal",
      "Corporal-Cinestésica": "corporal",
      "corporal-cinestésica": "corporal",
      "corporal-cinestesica": "corporal",
      "Espacial": "espacial",
      "espacial": "espacial",
      "Interpessoal": "interpessoal",
      "interpessoal": "interpessoal",
      "Intrapessoal": "intrapessoal",
      "intrapessoal": "intrapessoal"
    };
    return mapa[nomeDb] || mapa[nomeDb.trim()] || nomeDb.toLowerCase().trim();
  };
}

document.addEventListener("DOMContentLoaded", () => {

  function aplicarTemaSalvo() {
  const tema = localStorage.getItem("tema");
  const icon = document.getElementById("iconTheme");

  if (tema === "dark") {
    document.body.classList.add("dark");
    if (icon) icon.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    if (icon) icon.textContent = "🌙";
  }
}aplicarTemaSalvo();

  const navbar = document.getElementById("navbar");
  const sections = Array.from(document.querySelectorAll("section[data-color]"));
  const defaultColor = getComputedStyle(navbar).backgroundColor || "#f4f1eb";

  /* ================= NAVBAR DINÂMICA ================= */
  function updateNavbarColor() {

    const centerY = window.innerHeight / 2;
    let applied = false;

    const logo = document.getElementById("logoNavbar");
    const titulo = document.getElementById("tituloNavbar");

    for (let s of sections) {
      const rect = s.getBoundingClientRect();

      if (rect.top <= centerY && rect.bottom >= centerY) {

        navbar.style.backgroundColor = s.dataset.color;

        if (logo.getAttribute("src") !== "Icones/LogoBranca.png") {
          logo.setAttribute("src", "Icones/LogoBranca.png");
        }

        titulo.style.color = "white";

        applied = true;
        break;
      }
    }

    if (!applied) {

      navbar.style.backgroundColor = defaultColor;

      if (logo.getAttribute("src") !== "Icones/LogoPreta.png") {
        logo.setAttribute("src", "Icones/LogoPreta.png");
      }

      titulo.style.color = "black";
    }
  }

  updateNavbarColor();
  window.addEventListener("scroll", updateNavbarColor, { passive: true });
  window.addEventListener("resize", updateNavbarColor);

  /* ================= COR DOS CARDS ================= */
  sections.forEach(section => {
    const cor = section.dataset.color;
    const card = section.querySelector(".card-inteligencia");

    if (card) {
      card.style.backgroundColor = cor;
    }
  });

  /* ================= MODAL DINÂMICO ================= */
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

      // aplica a cor da inteligência 
      const modalContent = document.getElementById("modalContent");
      const modalHeader = document.getElementById("modalHeader");

      modalContent.style.borderColor = cor;
      modalHeader.style.borderColor = cor;

    });

  });

});










  /* ================= BAGULHO DO GOOGLE ================= */
function handleCredentialResponse(response) {
  console.log(response);

  const dados = JSON.parse(atob(response.credential.split('.')[1]));
  console.log("Nome:", dados.name);
  console.log("Email:", dados.email);
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "882150648839-9jlqshioa5loeae8drkfm9s4ggivjesr.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  renderGoogleButton();
  const isDark = document.body.classList.contains("dark");

google.accounts.id.renderButton(
  document.querySelector(".g_id_signin"),
  {
    theme: isDark ? "filled_black" : "outline",
    size: "large"
  });
};

function renderGoogleButton() {
  const isDark = document.body.classList.contains("dark");

  document.querySelectorAll(".g_id_signin").forEach(el => {
    el.innerHTML = ""; // limpa antes

    google.accounts.id.renderButton(el, {
      theme: isDark ? "filled_black" : "outline",
      size: "large",
      width: 250
    });
  });
}












/* ================= TOAST SUCESSO ================= */

function mostrarSucesso(mensagem) {

  const toastEl = document.getElementById("toastSucesso");
  const toastMsg = document.getElementById("toastMensagem");

  toastMsg.textContent = mensagem;

  if (!toastEl) return;

  const toast = new bootstrap.Toast(toastEl, {
    delay: 2000
  });

  toast.show();
}

/* ================= LOGIN / CADASTRO ================= */

const cadastroForm = document.getElementById("cadastroForm");
const loginForm = document.getElementById("loginForm");


/* ================= ABRIR MODAL TESTE ================= */

function abrirModalTeste() {

  const modalTesteEl = document.getElementById("modalConhecerTeste");

  if (!modalTesteEl) return;

  const modalTeste = bootstrap.Modal.getOrCreateInstance(modalTesteEl);
  modalTeste.show();

}


/* ================= CADASTRO ================= */

if (cadastroForm) {
  cadastroForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;

    try {
      const response = await apiFetch("cadastro", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha })
      });
      const data = await response.json();

      if (response.ok) {
        mostrarSucesso("Conta criada com sucesso!");
        // Faz login automático para melhorar a experiência
        const loginResp = await apiFetch("login", {
          method: "POST",
          body: JSON.stringify({ email, senha })
        });
        if (loginResp.ok) {
          const loginData = await loginResp.json();
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify(loginData.user));
          
          const modalCadastroEl = document.getElementById("cadastro");
          const modalCadastro = bootstrap.Modal.getInstance(modalCadastroEl);
          modalCadastro.hide();

          modalCadastroEl.addEventListener("hidden.bs.modal", function () {
            abrirModalTeste();
          }, { once: true });
        } else {
          const modalCadastroEl = document.getElementById("cadastro");
          const modalCadastro = bootstrap.Modal.getInstance(modalCadastroEl);
          modalCadastro.hide();
          
          setTimeout(() => {
            const modalLoginEl = document.getElementById("loginModal");
            const modalLogin = new bootstrap.Modal(modalLoginEl);
            modalLogin.show();
          }, 500);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no cadastro",
          text: data.message || "Erro desconhecido",
          confirmButtonColor: "#000"
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erro de conexão",
        text: "Não foi possível conectar ao servidor backend.",
        confirmButtonColor: "#000"
      });
    }
  });
}


/* ================= LOGIN ================= */

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    try {
      const response = await apiFetch("login", {
        method: "POST",
        body: JSON.stringify({ email, senha })
      });
      const data = await response.json();

      if (response.ok) {
        mostrarSucesso("Login realizado com sucesso!");
        localStorage.removeItem("userFoto");
        localStorage.removeItem("inteligenciaUsuario");
        localStorage.removeItem("corPrimaria");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        const modalLoginEl = document.getElementById("loginModal");
        const modalLogin = bootstrap.Modal.getInstance(modalLoginEl);
        modalLogin.hide();

        modalLoginEl.addEventListener("hidden.bs.modal", function () {
          if (data.user.tipo_dom) {
            const tipoSlug = normalizarInteligencia(data.user.tipo_dom);
            localStorage.setItem("inteligenciaUsuario", tipoSlug);
            if (data.user.cor_dominante) {
              localStorage.setItem("corPrimaria", data.user.cor_dominante);
            }
            window.location.href = "PaginaUsuario.html";
          } else {
            abrirModalTeste();
          }
        }, { once: true });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no login",
          text: data.message || "E-mail ou senha incorretos.",
          confirmButtonColor: "#000"
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erro de conexão",
        text: "Não foi possível conectar ao servidor backend.",
        confirmButtonColor: "#000"
      });
    }
  });
}





function liberarMenuTeste() {

  const menu = document.getElementById("menuTeste");

  if (menu) {
    menu.classList.remove("d-none");
  }

}



const formReclame = document.getElementById("formReclame");

if(formReclame){

formReclame.addEventListener("submit", function(e){

e.preventDefault();

mostrarSucesso("Mensagem enviada com sucesso!");

const modal = bootstrap.Modal.getInstance(document.getElementById("modalReclame"));
modal.hide();

});

}



function toggleDark() {
  document.body.classList.toggle("dark");

  const icon = document.getElementById("iconTheme");

  if (document.body.classList.contains("dark")) {
    icon.textContent = "☀️";
    localStorage.setItem("tema", "dark");
  } else {
    icon.textContent = "🌙";
    localStorage.setItem("tema", "light");
  }

  renderGoogleButton(); 
}

function salvarTema() {
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("tema", "dark");
  } else {
    localStorage.setItem("tema", "light");
  }
}