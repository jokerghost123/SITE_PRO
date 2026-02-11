const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URL = "mongodb+srv://JOKER:JOKERGHOST04082002@cluster0.vgkacqh.mongodb.net/SITE_PRO?retryWrites=true&w=majority&appName=Cluster0";

// --- MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- NOTIFICATIONS ---
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
    } catch (e) { console.log("Erreur Notif"); }
}

// --- CONNEXION DB ---
mongoose.connect(MONGO_URL).then(() => console.log("DB OK"));

// --- MODÈLES ---
const Message = mongoose.model('Message', new mongoose.Schema({
    pseudo: String, texte: String, date: { type: Date, default: Date.now }
}));
const UserAccount = mongoose.model('User', new mongoose.Schema({
    nom: String, gmail: String, mdp: String
}));

// --- ROUTES ---

// 1. INSCRIPTION (Enregistre et connecte direct)
app.post('/save', async (req, res) => {
    try {
        const nouvelUtilisateur = new UserAccount(req.body);
        await nouvelUtilisateur.save();
        res.send(`
            <script>
                localStorage.setItem('userName', '${nouvelUtilisateur.nom}');
                alert('Compte créé avec succès !');
                window.location.href = '/index.html';
            </script>
        `);
    } catch (e) {
        res.status(500).send("Erreur lors de l'inscription.");
    }
});

// 2. CONNEXION (Vérifie les infos)
app.post('/login', async (req, res) => {
    try {
        const user = await UserAccount.findOne({ gmail: req.body.gmail, mdp: req.body.mdp });
        if (user) {
            res.send(`
                <script>
                    localStorage.setItem('userName', '${user.nom}');
                    window.location.href = '/index.html';
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert('Email ou mot de passe incorrect');
                    window.location.href = '/login.html';
                </script>
            `);
        }
    } catch (e) {
        res.status(500).send("Erreur de connexion.");
    }
});

app.get('/api/messages', async (req, res) => {
    const messages = await Message.find().sort({ date: 1 });
    res.json(messages);
});

app.post('/api/messages', async (req, res) => {
    const nouveauMsg = new Message(req.body);
    await nouveauMsg.save();
    if (req.body.pseudo !== "Admin") { envoyerNotification(req.body.pseudo, req.body.texte); }
    res.json({ status: "OK" });
});

app.get('/logout', (req, res) => {
    res.send("<script>localStorage.removeItem('userName'); window.location.href='/login.html';</script>");
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => console.log("Serveur OK"));

