// app/parent-dashboard/page.tsx

import Link from 'next/link';
import { getSession } from '@/src/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';


export default async function ParentDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const parentId = session.id;
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <section className="py-12 px-4 text-center bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6 font-serif">
            Tableau de bord Parent
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Bienvenue sur votre espace parent. Gérez vos enfants et vos réservations d'ateliers ici.
          </p>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="py-12 px-4 bg-accent">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-xl mx-auto">
            <Link href={`/parent-dashboard/${parentId}/children`} className="block">
              <div className="bg-background border-2 border-foreground rounded-lg p-8 text-center transition-all duration-300 hover:bg-primary hover:border-primary group">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-background">
                  <span className="text-2xl">👶</span>
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground group-hover:text-foreground">Gérer mes enfants</h2>
                <p className="text-muted group-hover:text-foreground">Ajouter, modifier ou supprimer les profils de vos enfants.</p>
              </div>
            </Link>
            <Link href={`/parent-dashboard/${parentId}/bookings`} className="block">
              <div className="bg-background border-2 border-foreground rounded-lg p-8 text-center transition-all duration-300 hover:bg-primary hover:border-primary group">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-background">
                  <span className="text-2xl">📅</span>
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground group-hover:text-foreground">Voir mes réservations</h2>
                <p className="text-muted group-hover:text-foreground">Consulter et gérer les réservations de vos enfants.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-accent border-2 border-foreground rounded-lg p-6">
            <p className="text-muted text-sm">
              Connecté en tant que <strong className="text-foreground">{session.firstName} {session.lastName}</strong> (ID: {session.id})
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
