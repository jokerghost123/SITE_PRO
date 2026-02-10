const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 10000;
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://JOKER:JOKERGHOST04082002@cluster0.vgkacqh.mongodb.net/SITE_PRO?retryWrites=true&w=majority&appName=Cluster0";

// --- MIDDLEWARES (Indispensables pour lire le dossier public) ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- FONCTION NOTIFICATION ---
async function envoyerNotification(pseudo, texte) {
    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: "a8937c96-c30c-4896-b701-abb0e1daec26",
            included_segments: ["All"],
            headings: { "en": "FULL TECH - Nouveau Message" },
            contents: { "en": `${pseudo}: ${texte}` },
            url: "https://full-tech.onrender.com/admin.html"
        }, {
            headers: {
                "Authorization": "Basic os_v2_app_vcjxzfwdbrejnnybvoyodwxmezulcm7wkw5ut557nad7ymoeamt5mnunbfptybdqyomjk3oxvc4ole72n3wqn6bncpw7pjewwwgwf5y",
                "Content-Type": "application/json"
            }
        });
        console.log("🔔 Notification envoyée !");
    } catch (e) {
        console.log("❌ Erreur OneSignal :", e.response ? e.response.data : e.message);
    }
}

// --- CONNEXION MONGODB ---
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Connexion MongoDB réussie !"))
    .catch(err => console.log("❌ Erreur de connexion MongoDB :", err));

// --- MODÈLES ---
const UserAccount = mongoose.model('User', new mongoose.Schema({
    nom: String, gmail: String, mdp: String
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    pseudo: String, texte: String, date: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// Inscription
app.post('/save', async (req, res) => {
    try {
        const nouvelUtilisateur = new UserAccount(req.body);
        await nouvelUtilisateur.save();
        res.send("<h1 style='color:green;text-align:center;'>Inscription réussie ! <a href='/login.html'>Connectez-vous</a></h1>");
    } catch (e) { res.status(500).send("Erreur : " + e.message); }
});

// Connexion
app.post('/login', async (req, res) => {
    try {
        const user = await UserAccount.findOne({ gmail: req.body.gmail, mdp: req.body.mdp });
        if (user) {
            res.send(`<script>localStorage.setItem('userName', '${user.nom}'); window.location.href = '/index.html';</script>`);
        } else {
            res.send("<h1 style='color:red;text-align:center;'>Email ou mot de passe incorrect</h1>");
        }
    } catch (e) { res.status(500).send("Erreur : " + e.message); }
});

// --- NOUVEAU : ROUTE DE DÉCONNEXION ---
app.get('/logout', (req, res) => {
    res.send(`
        <script>
            localStorage.removeItem('userName'); 
            window.location.href = '/login.html';
        </script>
    `);
});

// Forum : Récupérer les messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: 1 });
        res.json(messages);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Forum : Envoyer un message + Notification
app.post('/api/messages', async (req, res) => {
    try {
        const nouveauMsg = new Message(req.body);
        await nouveauMsg.save();
        if (req.body.pseudo !== "Admin") {
            envoyerNotification(req.body.pseudo, req.body.texte);
        }
        res.json({ status: "OK" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lancement
app.listen(PORT, () => {
    console.log(`🚀 Serveur FULL TECH actif sur le port : ${PORT}`);
});
