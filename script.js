


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

  cadastroForm.addEventListener("submit", function (e) {

    e.preventDefault();

    mostrarSucesso("Conta criada com sucesso!");

    const modalCadastroEl = document.getElementById("cadastro");
    const modalCadastro = bootstrap.Modal.getInstance(modalCadastroEl);

    modalCadastro.hide();

    modalCadastroEl.addEventListener("hidden.bs.modal", function () {
      abrirModalTeste();
    }, { once: true });

  });

}


/* ================= LOGIN ================= */

if (loginForm) {

  loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    mostrarSucesso("Login realizado com sucesso!");

    const modalLoginEl = document.getElementById("loginModal");
    const modalLogin = bootstrap.Modal.getInstance(modalLoginEl);

    modalLogin.hide();

    modalLoginEl.addEventListener("hidden.bs.modal", function () {
      abrirModalTeste();
    }, { once: true });

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