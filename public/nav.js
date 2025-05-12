document.addEventListener("DOMContentLoaded", () => {
  const publicarBtn = document.getElementById("publicarBtn");
  const cerrarFormBtn = document.getElementById("cerrarForm");
  const perfilBtn = document.getElementById("perfilBtn");
  const publicacionesBtn = document.getElementById("publicacionesBtn");

  const productosContainer = document.getElementById("productosContainer");
  const formularioContainer = document.getElementById("formularioContainer");
  const userData = document.getElementById("userData");
  const advertencia = document.getElementById("advertencia");

  function ocultarTodo() {
    productosContainer.classList.add("hidden");
    formularioContainer.classList.add("hidden");
    userData.classList.add("hidden");
    advertencia.classList.add("hidden");
  }

  function mostrarPublicaciones() {
    ocultarTodo();
    productosContainer.classList.remove("hidden");
  }

  function mostrarFormulario() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      ocultarTodo();
      advertencia.classList.remove("hidden");
    } else {
      ocultarTodo();
      formularioContainer.classList.remove("hidden");
    }
  }

  function mostrarPerfil() {
    ocultarTodo();
    userData.classList.remove("hidden");
  }

  publicarBtn.addEventListener("click", mostrarFormulario);
  cerrarFormBtn.addEventListener("click", mostrarPublicaciones);
  perfilBtn.addEventListener("click", mostrarPerfil);
  publicacionesBtn.addEventListener("click", mostrarPublicaciones);

  mostrarPublicaciones();
});