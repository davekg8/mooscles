# 🐮💪 Mooscles — Challenge Sportif PWA

Application Progressive Web App pour groupe d'amis (6-7 personnes) engagés dans un challenge sportif du **19 Octobre au 17 Décembre 2026** (9 semaines).

---

## 🎯 Les Règles du Challenge

### 1. Objectifs hebdomadaires (du lundi au dimanche)
- **250 Pompes**
- **250 Squats**
- **10 min de Gainage** (600 secondes)
- Répartition libre sur la semaine !
- Semaine 9 (du 14 au 17 déc) maintenue en **mode FULL**.

### 2. Règle du Palier et Facteur Limitant
Le score est noté sur **5** et **l'exercice le plus faible fait foi** :
- **1/5** = 50 pompes, 50 squats, 2 min de gainage
- **2/5** = 100 pompes, 100 squats, 4 min de gainage
- **3/5** = 150 pompes, 150 squats, 6 min de gainage
- **4/5** = 200 pompes, 200 squats, 8 min de gainage
- **5/5** = 250 pompes, 250 squats, 10 min de gainage

$$\text{Amende} = (5 - \text{Score}) \text{ €}$$

*(Exemple : 200 squats, 200 pompes, mais seulement 2 min de gainage = Score de 1/5 ➔ 4 € d'amende).*

---

## 🌍 En ligne

**https://mooscles-lh7q.netlify.app**

1. Chacun crée son compte (email + mot de passe) dans l'app.
2. Puis rejoint le groupe avec le **code d'invitation** (demande-le à l'organisateur).
3. Le tout premier inscrit devient **trésorier** : lui seul peut marquer les amendes comme payées.

Changer le code d'invitation (SQL Editor Supabase) :
```sql
update private.app_config set value = 'NOUVEAU-CODE' where key = 'invite_code';
```

---

## 🧱 Architecture

- **Front** : React + Vite + Tailwind, PWA (vite-plugin-pwa), hébergé sur Netlify (`netlify.toml`).
- **Back** : Supabase — Auth email/mot de passe, Postgres avec RLS stricte (seuls les membres lisent, chacun n'écrit que ses données), temps réel pour le classement.
- **Rappels 19h** : `pg_cron` appelle à 17h et 18h UTC la fonction Edge `push` (`supabase/functions/push`), qui n'envoie que quand il est 19h à Paris :
  - rappel si rien saisi dans la journée (avec ce qu'il manque pour le palier suivant),
  - le lundi : bilan de la semaine à voter, puis rappel de ce qui est dû à la cagnotte.
- **Secrets** (clé privée VAPID, secret du cron, code d'invitation) : table `private.app_config`, jamais exposée par l'API ni versionnée.

## 🛠️ Dev local

```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run dev
```

Variables Netlify nécessaires : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.

Les migrations (`supabase/migrations`) sont poussées automatiquement par GitHub Actions sur `main` (secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`).

---

## 📱 Installation sur iPhone & Notifications 19h

Pour recevoir les rappels quotidiens à **19h00** sur iPhone (iOS ≥ 16.4) :
1. Ouvrir le lien dans **Safari**.
2. Appuyer sur l'icône de partage 📤 en bas.
3. Sélectionner **« Sur l'écran d'accueil »** 📲.
4. Ouvrir Mooscles 🐮 depuis l'écran d'accueil, se connecter, puis 🔔 → **Activer les rappels de 19h**.

---

## ✨ Fonctionnalités incluses

- **Coaching Facteur Limitant en temps réel** : Indique précisément combien de répétitions ou de secondes il te manque pour débloquer le palier supérieur et économiser 1 €.
- **Chronomètre de gainage interactif** avec bips réguliers et vibrations.
- **Saisie rapide** (+10, +25, +50) et **saisie libre** pour corriger n'importe quel jour (notamment la semaine 1 passée).
- **Sondage du lundi** : chacun valide son score en son âme et conscience ☁️.
- **Classement & Secouer un pote 🫨** : Suivi collectif en direct, et la relance envoie une vraie notification au pote.
- **Comptabilité de la Cagnotte** : Qui a payé / qui doit encore (le trésorier valide les paiements), et boîte à idées avec votes pour la fin du challenge.
