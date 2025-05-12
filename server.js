const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = "data.json";
const uri = "mongodb+srv://slynderly:ortizuwu20@rucoy.2ysmrn5.mongodb.net/?retryWrites=true&w=majority&appName=rucoy";

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    const nombre = Date.now() + "-" + Math.floor(Math.random() * 1000) + path.extname(file.originalname);
    cb(null, nombre);
  }
});
const upload = multer({ storage });
const uploadReplace = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "slynderly@gmail.com",
    pass: "ljsavwwrxczveyme"
  }
});

let users;
const client = new MongoClient(uri);
client.connect().then(() => {
  const db = client.db("rucoy");
  users = db.collection("users");

  // ======= RUTAS USUARIO =======

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.get("/verify/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const user = await users.findOne({ token });
      if (!user) return res.send("Token inválido o expirado.");

      await users.updateOne({ _id: user._id }, {
        $set: { verified: true },
        $unset: { token: "" }
      });

      res.redirect("/verificado.html");
    } catch (e) {
      console.error("Error en verificación:", e);
      res.send("Hubo un error.");
    }
  });

  app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const exists = await users.findOne({ email });
    if (exists) return res.status(400).send("El correo ya está registrado.");

    const hash = await bcrypt.hash(password, 10);
    const token = uuidv4();

    await users.insertOne({
      username,
      email,
      password: hash,
      verified: false,
      token,
      coins: 0
    });

  const link = `https://quiver-safe-paneer.glitch.me/verify/${token}`;

// Crear el contenido HTML con un diseño más atractivo y profesional
const htmlContent = `
  <div style="font-family: 'Arial', sans-serif; color: #333; padding: 20px; background-color: #f4f7fa; border-radius: 8px; width: 100%; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 30px;">
      <h2 style="color: #1a73e8; font-size: 24px; text-align: center;">¡Hola ${username}!</h2>
      <p style="font-size: 16px; line-height: 1.5; text-align: center;">Gracias por registrarte en nuestro sitio. Para completar tu registro, por favor haz clic en el enlace de abajo para verificar tu cuenta:</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${link}" style="display: inline-block; padding: 12px 25px; background-color: #1a73e8; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 5px;">Verificar mi cuenta</a>
      </div>
      <p style="font-size: 14px; color: #777; text-align: center; margin-top: 25px;">Si no solicitaste esta verificación, por favor ignora este mensaje.</p>
    </div>
  </div>
`;

try {
  await transporter.sendMail({
    from: "slynderly@gmail.com",
    to: email,
    subject: "Verifica tu cuenta",
    html: htmlContent
  });
} catch (error) {
  console.error("Error al enviar el correo:", error);
}
    res.send("Registro exitoso. Verifica tu correo.");
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await users.findOne({ email });
    if (!user) return res.json({ success: false, message: "Correo no registrado." });
    if (!user.verified) return res.json({ success: false, message: "Cuenta no verificada." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: "Contraseña incorrecta." });

    res.json({
      success: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        verified: user.verified,
        coins: user.coins
      }
    });
  });

  app.get("/getUserData/:userId", async (req, res) => {
    try {
      const user = await users.findOne({ _id: new ObjectId(req.params.userId) });
      if (!user) return res.status(404).send("Usuario no encontrado");

      const { password, token, ...safeUser } = user;
      res.json(safeUser);
    } catch (e) {
      console.error("Error al buscar usuario:", e);
      res.status(500).send("Error interno del servidor");
    }
  });

  app.post("/edit", async (req, res) => {
    const { email, newUsername } = req.body;
    const result = await users.updateOne({ email }, { $set: { username: newUsername } });
    res.send(result.modifiedCount > 0 ? "Actualizado." : "Error al actualizar.");
  });

  app.post("/updateCoins", async (req, res) => {
    const { userId, amount } = req.body;
    try {
      const result = await users.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $inc: { coins: amount } },
        { returnDocument: "after" }
      );
      if (!result.value) return res.status(404).send("Usuario no encontrado.");
      res.json({ success: true, coins: result.value.coins });
    } catch (err) {
      console.error("Error al actualizar coins:", err);
      res.status(500).send("Error interno.");
    }
  });

  // ======= RUTAS DE IMAGENES / DATOS =======

  app.get("/datos", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      res.json(data);
    } catch {
      res.status(500).json({ error: "No se pudo leer el archivo de datos" });
    }
  });

  app.post("/publicar", upload.single("imagen"), (req, res) => {
    try {
      const { item, precio, numero, nombre_juego } = req.body;
      if (!item || !precio || !numero) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const data = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, "utf8")) : [];
      const nuevo = {
        item,
        precio,
        numero,
        nombre_juego: nombre_juego || "",
        imagen: req.file ? "/uploads/" + req.file.filename : "",
        fecha: Date.now().toString()
      };
      data.push(nuevo);
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
      res.status(200).send("Publicado correctamente");
    } catch (err) {
      res.status(500).json({ error: "Error al publicar" });
    }
  });

  app.post("/editar-datos", (req, res) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(req.body, null, 2));
    res.status(200).send("Datos actualizados");
  });

  app.get("/listar-imagenes", (req, res) => {
    const dir = path.join(__dirname, "public/uploads");
    fs.readdir(dir, (err, files) => {
      if (err) return res.status(500).json({ error: "No se pudo leer la carpeta" });
      const imagenes = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
      res.json(imagenes);
    });
  });

  app.post("/eliminar-imagen", (req, res) => {
    const ruta = path.join(__dirname, "public/uploads", req.body.nombre);
    fs.unlink(ruta, err => {
      if (err) return res.status(500).json({ error: "No se pudo eliminar la imagen" });
      res.json({ success: true });
    });
  });

  app.post("/reemplazar-imagen", uploadReplace.single("imagen"), (req, res) => {
    const { nombre } = req.body;
    const ruta = path.join(__dirname, "public/uploads", nombre);
    fs.writeFile(ruta, req.file.buffer, err => {
      if (err) return res.status(500).json({ error: "No se pudo reemplazar la imagen" });
      res.json({ success: true });
    });
  });
app.post("/delete", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send("Falta el ID de usuario");

  try {
    const result = await users.deleteOne({ _id: new ObjectId(userId) });
    if (result.deletedCount === 0) {
      return res.status(404).send("Usuario no encontrado");
    }
    res.send("Cuenta eliminada exitosamente");
  } catch (err) {
    console.error("Error al eliminar cuenta:", err);
    res.status(500).send("Error al eliminar cuenta");
  }
});
  app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
});