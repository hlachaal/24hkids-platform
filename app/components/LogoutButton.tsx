// app/components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  onLogout?: () => void;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // 1️⃣ Met à jour le Header immédiatement
      onLogout?.();

      // 2️⃣ Redirige vers la page login existante
      router.push('/parent-dashboard');

      // 3️⃣ Force le rafraîchissement des données (important)
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="button-primary hover:button px-4 py-2 rounded-md text-sm font-medium border border-primary-foreground/20"
    >
      Se déconnecter
    </button>
  );
}
