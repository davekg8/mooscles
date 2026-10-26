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

## 🚀 Démarrage Rapide

```bash
# Lancer le serveur de développement
npm run dev

# Compiler pour la production (PWA)
npm run build
```

L'application est accessible localement sur `http://localhost:5173`.

---

## ☁️ Intégration Supabase (Cloud BDD)

L'application fonctionne immédiatement en mode **Local & Offline** (avec des données de démonstration pour les 7 amis et la semaine 1 de rattrapage).

Pour connecter ton projet Supabase :
1. Crée un projet sur [supabase.com](https://supabase.com).
2. Ouvre le **SQL Editor** dans Supabase et exécute le script complet situé dans :
   `supabase/schema.sql`
3. Crée un fichier `.env` à la racine :
   ```env
   VITE_SUPABASE_URL=https://ton-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=ta-cle-anon
   ```
4. Relance `npm run dev`. L'en-tête affichera automatiquement **« • Cloud »** au lieu de Local.

---

## 📱 Installation sur iPhone & Notifications 19h

Pour que les 6-7 amis reçoivent les rappels quotidiens à **19h00** sur iPhone (iOS ≥ 16.4) :
1. Ouvrir le lien dans **Safari**.
2. Appuyer sur l'icône de partage 📤 en bas.
3. Sélectionner **« Sur l'écran d'accueil »** 📲.
4. Ouvrir l'icône Mooscles 🐮 depuis l'écran d'accueil et autoriser les notifications.

---

## ✨ Fonctionnalités incluses

- **Coaching Facteur Limitant en temps réel** : Indique précisément combien de répétitions ou de secondes il te manque pour débloquer le palier supérieur et économiser 1 €.
- **Chronomètre de gainage interactif** avec bips réguliers et vibrations.
- **Saisie rapide** (+10, +25, +50) et **saisie libre** pour corriger n'importe quel jour (notamment la semaine 1 passée).
- **Sondage du lundi** : chacun valide son score en son âme et conscience ☁️.
- **Classement & Secouer un pote 🫨** : Suivi collectif en direct.
- **Comptabilité de la Cagnotte** : Gestion des amendes, tableau de qui a payé / qui doit encore, et boîte à idées avec votes pour la fête de fin de challenge.
