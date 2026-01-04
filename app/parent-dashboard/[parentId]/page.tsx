// app/parent-dashboard/[parentId]/page.tsx
import { getSession } from '@/src/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface ParentDashboardPageProps {
  params: Promise<{ parentId: string }>;
}

export default async function ParentDashboardPage({ params }: ParentDashboardPageProps) {
  const { parentId } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Vérifier que le parent accède à son propre tableau de bord
  if (session.id !== parseInt(parentId, 10)) {
    redirect(`/parent-dashboard/${session.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 text-center bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6 font-serif">
            Tableau de bord de {session.firstName} {session.lastName}
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Bienvenue dans votre espace personnel. Gérez vos enfants et consultez vos réservations d'ateliers.
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
                <h2 className="text-2xl font-semibold mb-4 text-foreground group-hover:text-foreground">Mes réservations</h2>
                <p className="text-muted group-hover:text-foreground">Consultez et gérez toutes vos réservations d'ateliers.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}