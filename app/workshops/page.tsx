'use client';

import { useState, useEffect } from 'react';
import { fetcher } from '@/src/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Définir les types pour les données de l'atelier
interface Workshop {
  id: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  minAge: number;
  maxAge: number;
  capacity: number;
  location: string;
  status: string; // Ex: ACTIVE, CANCELLED, FULL
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [filterDate, setFilterDate] = useState<string>(''); // Format YYYY-MM-DD
  const [filterMinAge, setFilterMinAge] = useState<string>('');
  const [filterMaxAge, setFilterMaxAge] = useState<string>('');
  const [filterTheme, setFilterTheme] = useState<string>('');

  // État pour les dates disponibles
  const [availableDates, setAvailableDates] = useState<{value: string, label: string}[]>([]);
  const [datesLoading, setDatesLoading] = useState<boolean>(true);

  const router = useRouter();

  // Récupérer les dates disponibles au chargement
  useEffect(() => {
    const fetchAvailableDates = async () => {
      setDatesLoading(true);
      try {
        const dates = await fetcher<{value: string, label: string}[]>('/api/workshops/dates');
        setAvailableDates(dates);
      } catch (e: any) {
        console.error('Failed to fetch available dates:', e);
        // Ne pas afficher d'erreur pour les dates, juste continuer sans filtre de date
      } finally {
        setDatesLoading(false);
      }
    };

    fetchAvailableDates();
  }, []);

  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (filterDate) queryParams.append('date', filterDate);
        if (filterMinAge) queryParams.append('minAge', filterMinAge);
        if (filterMaxAge) queryParams.append('maxAge', filterMaxAge);
        if (filterTheme) queryParams.append('theme', filterTheme);

        const url = `/api/workshops?${queryParams.toString()}`;
        const fetchedWorkshops = await fetcher<Workshop[]>(url);
        setWorkshops(fetchedWorkshops);
      } catch (e: any) {
        console.error('Failed to fetch workshops:', e);
        setError(e.data?.message || e.message || 'Une erreur est survenue lors du chargement des ateliers.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, [filterDate, filterMinAge, filterMaxAge, filterTheme]); // Re-fetch quand les filtres changent

  const resetFilters = () => {
    setFilterDate('');
    setFilterMinAge('');
    setFilterMaxAge('');
    setFilterTheme('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="py-12 px-4 text-center bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6 font-serif">
            Catalogue des Ateliers
          </h1>
          <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Découvrez tous les ateliers disponibles pour vos enfants dans le cadre de l'événement 24hKids
          </p>
        </div>
      </section>

      {/* Zone de filtres */}
      <section className="py-8 px-4 bg-accent">
        <div className="max-w-6xl mx-auto">
          <div className="bg-background p-6 rounded-lg border-2 border-foreground">
            <h2 className="text-2xl font-semibold mb-4 text-foreground font-serif">Filtrer les ateliers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="filterDate" className="block text-sm font-medium text-foreground mb-2">Date</label>
                <select
                  id="filterDate"
                  className="w-full border-2 border-foreground rounded-full px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  disabled={datesLoading}
                >
                  <option value="">Toutes les dates</option>
                  {availableDates.map((date) => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filterMinAge" className="block text-sm font-medium text-foreground mb-2">Âge Min.</label>
                <input
                  type="number"
                  id="filterMinAge"
                  className="w-full border-2 border-foreground rounded-full px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filterMinAge}
                  onChange={(e) => setFilterMinAge(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="filterMaxAge" className="block text-sm font-medium text-foreground mb-2">Âge Max.</label>
                <input
                  type="number"
                  id="filterMaxAge"
                  className="w-full border-2 border-foreground rounded-full px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filterMaxAge}
                  onChange={(e) => setFilterMaxAge(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="filterTheme" className="block text-sm font-medium text-foreground mb-2">Thème</label>
                <input
                  type="text"
                  id="filterTheme"
                  className="w-full border-2 border-foreground rounded-full px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  placeholder="Ex: Programmation, Robotique"
                />
              </div>
            </div>
            <button
              onClick={resetFilters}
              className="bg-background text-foreground px-6 py-2 rounded-full font-semibold hover:bg-accent transition-colors border-2 border-foreground"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-lg mb-8 text-center" role="alert">
              <strong className="font-bold">Erreur : </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <p className="text-center text-primary text-lg">Chargement des ateliers...</p>
          ) : workshops.length === 0 ? (
            <p className="text-center text-muted">Aucun atelier trouvé avec les filtres appliqués.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((workshop) => (
                <div key={workshop.id} className="bg-accent rounded-lg border-2 border-foreground overflow-hidden flex flex-col">
                  <div className="p-6 flex-grow">
                    <h2 className="text-2xl font-semibold text-foreground mb-2">{workshop.name}</h2>
                    <p className="text-muted text-sm mb-4">{workshop.description}</p>
                    <div className="space-y-1 text-foreground text-sm">
                      <p><span className="font-medium">Quand :</span> {new Date(workshop.startTime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                      <p><span className="font-medium">Durée :</span> {Math.round((new Date(workshop.endTime).getTime() - new Date(workshop.startTime).getTime()) / (1000 * 60))} min</p>
                      <p><span className="font-medium">Âge :</span> {workshop.minAge} - {workshop.maxAge} ans</p>
                      <p><span className="font-medium">Places :</span> {workshop.capacity} ({workshop.status})</p>
                      <p><span className="font-medium">Lieu :</span> {workshop.location || 'Non spécifié'}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-background border-t-2 border-foreground flex justify-start">
                    <Link
                      href={`/workshops/${workshop.id}`}
                      className="bg-primary text-foreground px-6 py-2 rounded-full font-semibold hover:bg-primary-hover transition-colors"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
