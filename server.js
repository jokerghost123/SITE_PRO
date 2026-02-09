const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
// Ton lien MongoDB avec ton mot de passe intégré
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://JOKER:JOKERGHOST04082002@cluster0.vgkacqh.mongodb.net/?appName=Cluster0";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- CONNEXION MONGODB ---
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Connexion MongoDB réussie !"))
    .catch(err => console.log("❌ Erreur de connexion MongoDB :", err));

// --- MODÈLES ---
const User = mongoose.Schema({
    nom: String,
    gmail: String,
    mdp: String
});
const UserAccount = mongoose.model('User', User);

const Message = mongoose.model('Message', new mongoose.Schema({
    pseudo: String,
    texte: String,
    date: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// Inscription
app.post('/save', async (req, res) => {
    try {
        const nouvelUtilisateur = new UserAccount(req.body);
        await nouvelUtilisateur.save();
        res.send("<h1 style='color:green;text-align:center;'>Inscription réussie ! <a href='/login.html'>Connectez-vous</a></h1>");
    } catch (e) {
        res.status(500).send("Erreur : " + e.message);
    }
});

// Connexion (Modifiée pour envoyer le nom au navigateur)
app.post('/login', async (req, res) => {
    try {
        const user = await UserAccount.findOne({ gmail: req.body.gmail, mdp: req.body.mdp });
        if (user) {
            // On renvoie une petite page qui enregistre le nom dans le navigateur avant d'aller à l'index
            res.send(`
                <script>
                    localStorage.setItem('userName', '${user.nom}');
                    window.location.href = '/index.html';
                </script>
            `);
        } else {
            res.send("<h1 style='color:red;text-align:center;'>Email ou mot de passe incorrect.</h1>");
        }
    } catch (e) {
        res.status(500).send("Erreur : " + e.message);
    }
});

// Forum : Récupérer les messages
app.get('/api/messages', async (req, res) => {
    const messages = await Message.find().sort({ date: 1 });
    res.json(messages);
});

// Forum : Envoyer un message
app.post('/api/messages', async (req, res) => {
    try {
        const nouveauMsg = new Message(req.body);
        await nouveauMsg.save();
        res.json({ status: "OK" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Lancement
app.listen(PORT, () => {
    console.log(`🚀 Serveur FULL TECH actif sur le port : ${PORT}`);
});
