# Vitea - Application de santé personnalisée

Application Next.js pour l'analyse de santé et la génération de plans personnalisés.

## 🚀 Déploiement sur Netlify

### Configuration automatique

Le projet est déjà configuré pour Netlify avec :
- `netlify.toml` : Configuration de build et déploiement
- Plugin `@netlify/plugin-nextjs` : Support natif de Next.js sur Netlify

### Étapes de déploiement

1. **Connecter le dépôt GitHub à Netlify**
   - Allez sur [Netlify](https://app.netlify.com)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Connectez votre compte GitHub
   - Sélectionnez le dépôt `pulssart/vitea`

2. **Configuration automatique**
   - Netlify détectera automatiquement la configuration depuis `netlify.toml`
   - Build command : `npm run build`
   - Publish directory : `.next`
   - Le plugin Next.js sera installé automatiquement

3. **Variables d'environnement**
   - Si nécessaire, ajoutez vos variables d'environnement dans les paramètres du site Netlify
   - Settings > Environment variables

4. **Déploiement**
   - Netlify déploiera automatiquement à chaque push sur la branche `main`
   - Les déploiements de prévisualisation seront créés pour chaque Pull Request

## 📦 Installation locale

```bash
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🛠️ Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm run start` : Lance le serveur de production
- `npm run lint` : Vérifie le code avec ESLint

## 📝 Technologies utilisées

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Recharts (graphiques)
- Framer Motion (animations)

