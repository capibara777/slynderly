// Función para cargar los productos
async function cargarProductos() {
  const res = await fetch("/datos");
  const posts = await res.json();
  const container = document.getElementById("productosContainer");
  if (!container) return;

  container.innerHTML = "";

  if (posts && posts.length > 0) {
    posts.reverse().forEach((post) => {
      const div = document.createElement("div");
      div.className = "producto";

      let fechaTexto = "Fecha desconocida";
      if (post.fecha && !isNaN(post.fecha)) {
        const fecha = new Date(Number(post.fecha));
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const año = fecha.getFullYear();
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        fechaTexto = `${dia}/${mes}/${año} a las ${horas}:${minutos}`;
      }

      div.innerHTML = `
        ${post.imagen ? `<img src="${post.imagen}" alt="Item" style="max-width:100%;height:auto;border-radius:10px;" />` : ""}
        <h3>${post.item}</h3>
        <p>Precio: $${post.precio}</p>
        <p>Jugador: ${post.nombre_juego || "Anónimo"}</p>
        <p><strong>Publicado el:</strong> ${fechaTexto}</p>
        <a href="https://wa.me/${post.numero}" target="_blank">Contactar por WhatsApp</a>
      `;

      container.appendChild(div);
    });
  } else {
    container.innerHTML = "<p>No hay publicaciones disponibles.</p>";
  }
}

// Mostrar el mensaje temporal
function mostrarMensaje(texto, tipo) {
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.className = tipo === "success" ? "mensaje-exito" : "mensaje-error";

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}

// Mostrar formulario para publicar
const publicarBtn = document.getElementById("publicarBtn");
if (publicarBtn) {
  publicarBtn.addEventListener("click", () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      document.getElementById("advertencia").classList.remove("hidden");
      return;
    }
    document.getElementById("formularioContainer").classList.remove("hidden");
  });
}

// Cerrar formulario
const cerrarForm = document.getElementById("cerrarForm");
if (cerrarForm) {
  cerrarForm.addEventListener("click", () => {
    document.getElementById("formularioContainer").classList.add("hidden");
  });
}

// Enviar el formulario para publicar un producto
const formulario = document.getElementById("formulario");
if (formulario) {
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(formulario);

    try {
      const res = await fetch("/publicar", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        formulario.reset();
        document.getElementById("formularioContainer").classList.add("hidden");
        alert("Publicación exitosa"); // Muestra el mensaje de éxito
        cargarProductos();
      } else {
        mostrarMensaje("Error al publicar", "error"); // Muestra el mensaje de error si falla
      }
    } catch (err) {
      console.error("Error al publicar:", err);
      mostrarMensaje("Ocurrió un error", "error"); // Muestra el mensaje de error si ocurre una excepción
    }
  });
}

// Cargar los productos al cargar la página
window.addEventListener("load", cargarProductos);