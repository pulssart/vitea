import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vitea - Analyse Santé Personnalisée',
  description: 'Analysez vos résultats de prises de sang avec l\'IA',
  icons: {
    // Icône principale (favicon / onglet navigateur)
    icon: '/favicon.ico',
    // Icônes optionnelles - commentées jusqu'à ce que les fichiers soient créés
    // icon: [
    //   { url: '/icons/vitea-32.png', sizes: '32x32', type: 'image/png' },
    //   { url: '/icons/vitea-192.png', sizes: '192x192', type: 'image/png' },
    //   { url: '/icons/vitea-512.png', sizes: '512x512', type: 'image/png' },
    // ],
    // Icône iOS quand l'utilisateur ajoute le site à son écran d'accueil
    // apple: [
    //   { url: '/icons/vitea-ios-180.png', sizes: '180x180', type: 'image/png' },
    // ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}

