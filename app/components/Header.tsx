'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';

interface Session {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store', // ⬅️ IMPORTANT
        });

        if (response.ok) {
          const sessionData = await response.json();
          setSession(sessionData);
        } else {
          // ⬅️ 401 = pas connecté → session NULL explicite
          setSession(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <header className="bg-background border-b border-border">
        <nav className="container mx-auto flex justify-between items-center py-4 px-4">
          <Link href="/" className="text-2xl font-bold text-foreground">
            24hKids & Co
          </Link>
          <span className="text-muted">Chargement...</span>
        </nav>
      </header>
    );
  }

  // =========================
  // HEADER CONNECTÉ
  // =========================
  if (session) {
    return (
      <header className="bg-primary text-primary-foreground py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold hover:text-primary-foreground/80 transition-colors"
          >
            24hKids & Co
          </Link> 
          <Link
            href="/admin/dashboard"
            className="text-2xl font-bold hover:text-primary-foreground/80 transition-colors"
          >
            Admin
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-primary-foreground/80">
              Accueil
            </Link>
            <Link href="/workshops" className="hover:text-primary-foreground/80">
              Ateliers
            </Link>
            <Link
              href={`/parent-dashboard/${session.id}/children`}
              className="hover:text-primary-foreground/80"
            >
              Mes enfants
            </Link>
            <Link
              href={`/parent-dashboard/${session.id}/bookings`}
              className="hover:text-primary-foreground/80"
            >
              Mes réservations
            </Link>

            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-primary-foreground/20">
              <span className="text-sm">
                Bonjour, {session.firstName} {session.lastName}
              </span>
              <LogoutButton onLogout={() => setSession(null)} />
            </div>
          </nav>
        </div>
      </header>
    );
  }

  // =========================
  // HEADER PUBLIC
  // =========================
  return (
    <header className="bg-background border-b border-border">
      <nav className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link href="/" className="text-2xl font-bold text-foreground">
          24hKids & Co
        </Link>

        <div className="flex gap-4">
          <Link href="/" className="hover:text-primary">
            Accueil
          </Link>
          <Link href="/workshops" className="hover:text-primary">
            Ateliers
          </Link>
          <Link href="/parent-dashboard" className="hover:text-primary">
            Tableau de bord Parent
          </Link>
        </div>
      </nav>
    </header>
  );
}
