'use client';

import { useState, useEffect } from 'react';
import { fetcher, sendRequest } from '@/src/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

const SIMULATED_PARENT_ID = 1; // ID du parent simulé

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
  status: string;
}

interface Child {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: string;
}

interface Booking {
    id: number;
    childId: number;
    workshopId: number;
    status: string;
    child: Child;
}

interface ChildWithBooking extends Child {
  booking?: Booking | null;
  age: number;
}

interface WorkshopDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkshopDetailPage({ params }: WorkshopDetailPageProps) {
  const { id } = React.use(params);
  const router = useRouter();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loadingWorkshop, setLoadingWorkshop] = useState<boolean>(true);
  const [workshopError, setWorkshopError] = useState<string | null>(null);

  const [childrenWithBookings, setChildrenWithBookings] = useState<ChildWithBooking[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<boolean>(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [bookingLoading, setBookingLoading] = useState<Record<number, boolean>>({});
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const [parentSession, setParentSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      // Vérifier la session du parent
      setLoadingSession(true);
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setParentSession(sessionData);
        } else {
          setParentSession(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
        setParentSession(null);
      } finally {
        setLoadingSession(false);
      }

      // Fetch workshop details
      setLoadingWorkshop(true);
      setWorkshopError(null);
      try {
        const fetchedWorkshop = await fetcher<Workshop>(`/api/workshops/${id}`);
        setWorkshop(fetchedWorkshop);
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          router.push('/404'); // Redirect to 404 if workshop not found
          return;
        }
        console.error(`Failed to fetch workshop ${id}:`, e);
        setWorkshopError(e.data?.message || e.message || `Une erreur est survenue lors du chargement de l'atelier ${id}.`);
      } finally {
        setLoadingWorkshop(false);
      }

      // Les données des enfants sont maintenant chargées dans un useEffect séparé
    };
    fetchData();
  }, [id, router]);

  // Effet séparé pour charger les données des enfants quand la session change
  useEffect(() => {
    const loadChildrenData = async () => {
      if (!parentSession) {
        // Si pas de session, vider les données des enfants
        setChildrenWithBookings([]);
        setLoadingChildren(false);
        return;
      }

      // Charger les données des enfants seulement si parent connecté
      setLoadingChildren(true);
      setChildrenError(null);
      try {
        // Récupérer les enfants du parent
        const parentData = await fetcher<{ children: Child[] }>(`/api/parents/${parentSession.id}`);

        // Récupérer les réservations pour cet atelier
        const bookingsData = await fetcher<Booking[]>(`/api/reservations?workshopId=${id}`);

        // Combiner les enfants avec leurs réservations
        const childrenWithBookingsData: ChildWithBooking[] = parentData.children.map(child => {
          const booking = bookingsData.find(b => b.childId === child.id) || null;
          const age = differenceInYears(new Date(), new Date(child.birthDate));
          return {
            ...child,
            booking,
            age
          };
        });

        setChildrenWithBookings(childrenWithBookingsData);
      } catch (e: any) {
        console.error('Failed to load children and bookings:', e);
        setChildrenError(e.data?.message || e.message || 'Une erreur est survenue lors du chargement de vos enfants.');
      } finally {
        setLoadingChildren(false);
      }
    };

    loadChildrenData();
  }, [parentSession, id]);

  const handleBooking = async (childId: number) => {
    if (!workshop) return;

    setBookingLoading(prev => ({ ...prev, [childId]: true }));
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const newBooking = await sendRequest<Booking>(`/api/reservations`, 'POST', {
        childId: childId,
        workshopId: workshop.id,
      });

      // Mettre à jour l'état local
      setChildrenWithBookings(prev =>
        prev.map(child =>
          child.id === childId
            ? { ...child, booking: newBooking }
            : child
        )
      );

      setBookingSuccess(`Réservation ${newBooking.status === 'WAITLIST' ? "en liste d'attente" : "confirmée"} pour ${newBooking.status === 'WAITLIST' ? "votre enfant a été placé en liste d'attente." : "votre enfant !"}`);
    } catch (e: any) {
      console.error('Failed to create booking:', e);
      console.log('Error details:', e);
      console.log('Error data:', e.data);
      console.log('Error message:', e.message);

      const errorMessage = e.message || 'Une erreur est survenue lors de la réservation.';
      setBookingError(errorMessage);
    } finally {
      setBookingLoading(prev => ({ ...prev, [childId]: false }));
    }
  };

  const handleCancelBooking = async (bookingId: number, childId: number) => {
    setBookingLoading(prev => ({ ...prev, [childId]: true }));
    setBookingError(null);
    setBookingSuccess(null);

    try {
      await sendRequest(`/api/reservations/${bookingId}`, 'DELETE');

      // Mettre à jour l'état local
      setChildrenWithBookings(prev =>
        prev.map(child =>
          child.id === childId
            ? { ...child, booking: null }
            : child
        )
      );

      setBookingSuccess('Réservation annulée avec succès.');
    } catch (e: any) {
      console.error('Failed to cancel booking:', e);
      const errorMessage = e.message || "Une erreur est survenue lors de l'annulation.";
      setBookingError(errorMessage);
    } finally {
      setBookingLoading(prev => ({ ...prev, [childId]: false }));
    }
  };

  if (loadingWorkshop) {
    return <p className="text-center text-blue-600 text-lg">Chargement de l'atelier...</p>;
  }

  if (workshopError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
        <p className="text-gray-700">{workshopError}</p>
        <Link href="/workshops" className="text-blue-600 hover:underline mt-4 block">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Atelier introuvable</h1>
        <p className="text-gray-700">L'atelier que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/workshops" className="text-blue-600 hover:underline mt-4 block">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{workshop.name}</h1>
        <p className="text-gray-600 text-lg mb-6">{workshop.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-700"><span className="font-semibold">Date et Heure :</span></p>
            <p className="text-gray-900">{new Date(workshop.startTime).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
            <p className="text-gray-900">Durée : {Math.round((new Date(workshop.endTime).getTime() - new Date(workshop.startTime).getTime()) / (1000 * 60))} minutes</p>
          </div>
          <div>
            <p className="text-gray-700"><span className="font-semibold">Tranche d'âge :</span></p>
            <p className="text-gray-900">{workshop.minAge} - {workshop.maxAge} ans</p>
          </div>
          <div>
            <p className="text-gray-700"><span className="font-semibold">Capacité :</span></p>
            <p className="text-gray-900">{workshop.capacity} places</p>
          </div>
          <div>
            <p className="text-gray-700"><span className="font-semibold">Lieu :</span></p>
            <p className="text-gray-900">{workshop.location || 'Non spécifié'}</p>
          </div>
          <div>
            <p className="text-gray-700"><span className="font-semibold">Statut :</span></p>
            <p className="text-gray-900">{workshop.status}</p>
          </div>
        </div>

        {/* Section de réservation - affichée seulement si un parent est connecté */}
        {parentSession ? (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">Réservations</h2>
            
            {bookingError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Erreur : </strong>
                <span className="block sm:inline">{bookingError}</span>
              </div>
            )}
            {bookingSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Succès : </strong>
                <span className="block sm:inline">{bookingSuccess}</span>
              </div>
            )}

            {loadingChildren ? (
              <p className="text-blue-600">Chargement de vos enfants...</p>
            ) : childrenError ? (
              <p className="text-red-600">Erreur lors du chargement des enfants: {childrenError}</p>
            ) : childrenWithBookings.length === 0 ? (
              <p className="text-gray-600">Vous n'avez pas encore d'enfants enregistrés. <Link href={`/parent-dashboard/${parentSession.id}/children/add`} className="text-blue-600 hover:underline">Ajoutez-en un</Link> pour pouvoir réserver.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 mb-4">Inscrivez ou annulez l'inscription de vos enfants à cet atelier :</p>

                {childrenWithBookings.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {child.firstName} {child.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {child.age} ans • Né(e) le {new Date(child.birthDate).toLocaleDateString('fr-FR')}
                      </div>
                      {child.booking && (
                        <div className="text-sm mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            child.booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : child.booking.status === 'WAITLIST'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {child.booking.status === 'CONFIRMED' ? 'Confirmé' :
                             child.booking.status === 'WAITLIST' ? "En liste d'attente" :
                             'Annulé'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {child.booking ? (
                        <button
                          onClick={() => handleCancelBooking(child.booking!.id, child.id)}
                          disabled={bookingLoading[child.id]}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bookingLoading[child.id] ? 'Annulation...' : 'Annuler'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBooking(child.id)}
                          disabled={bookingLoading[child.id]}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bookingLoading[child.id] ? 'Réservation...' : 'Inscrire'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/workshops" className="ml-4 text-blue-600 hover:underline mt-4 block md:inline-block">
              &larr; Retour au catalogue
            </Link>
          </div>
        ) : (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              Connectez-vous pour inscrire vos enfants à cet atelier.
            </p>
            <Link
              href="/login"
              className="button inline-block  py-2 px-4 rounded transition-colors"
            >
              Se connecter
            </Link>
            <Link href="/workshops" className="ml-4 text-blue-600 hover:underline block md:inline-block mt-4 md:mt-0">
              &larr; Retour au catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for age calculation, similar to date-fns' differenceInYears
// Provided directly here to avoid extra dependency or ensure it's available in client component
function differenceInYears(dateLeft: Date | string, dateRight: Date | string): number {
    const d1 = new Date(dateLeft);
    const d2 = new Date(dateRight);
    let years = d1.getFullYear() - d2.getFullYear();
    if (d1.getMonth() < d2.getMonth() || (d1.getMonth() === d2.getMonth() && d1.getDate() < d2.getDate())) {
        years--;
    }
    return years;
}
