'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Types pour les données
type Booking = {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  childAge: number;
  remainingCapacity: number;
  child: {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: string;
    parent: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  };
  workshop: {
    id: number;
    name: string;
    description: string | null;
    startTime: string;
    endTime: string;
    minAge: number;
    maxAge: number;
    capacity: number;
    location: string | null;
    status: string;
  };
};

// Type pour les props
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminReservationDetailPage({ params }: PageProps) {
  const router = useRouter();

  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const bookingId = Number(id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger la réservation
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/reservations/${bookingId}`);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Erreur lors du chargement de la réservation.');
        }

        const data = await res.json();
        setBooking(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(bookingId)) {
      fetchBooking();
    }
  }, [bookingId]);

  // Confirmer une réservation WAITLIST
  const handleConfirm = async () => {
    if (!booking) return;
    
    if (!confirm('Confirmer cette réservation en liste d\'attente ?')) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/reservations/${bookingId}/confirm`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la confirmation');
      }

      // Recharger les données
      const updatedRes = await fetch(`/api/admin/reservations/${bookingId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setBooking(updatedData);
      }

      setSuccess('Réservation confirmée avec succès.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Supprimer la réservation
  const handleDelete = async () => {
    if (!booking) return;
    
    if (!confirm('Voulez-vous vraiment supprimer cette réservation ?\n\nCette action est irréversible.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/admin/reservations/${bookingId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      router.push('/admin/reservations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Formater la date/heure
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater juste la date
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Badge de statut coloré
  const getStatusBadge = (status: string) => {
    const config = {
      CONFIRMED: { color: 'bg-green-100 text-green-800', label: 'Confirmé' },
      WAITLIST: { color: 'bg-yellow-100 text-yellow-800', label: 'Liste d\'attente' },
    };
    
    const { color, label } = config[status as keyof typeof config] || 
                            { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement de la réservation...</div>;
  }

  if (!booking) {
    return (
      <div className="p-6 text-red-600">
        Réservation introuvable.
        <br />
        <Link href="/admin/reservations" className="text-indigo-600">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Réservation #{booking.id}
              </h1>
              {getStatusBadge(booking.status)}
            </div>
            <p className="text-gray-600 mt-2">
              <span className="font-medium">{booking.child.firstName} {booking.child.lastName}</span> • 
              <span className="ml-2">{booking.workshop.name}</span>
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{booking.workshop.minAge}-{booking.workshop.maxAge} ans</span>
              <span>•</span>
              <span>{formatDateTime(booking.workshop.startTime)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/admin/reservations" className="text-sm text-indigo-600 hover:text-indigo-800">
              ← Retour à la liste
            </Link>
          </div>
        </div>

        {/* Messages d'erreur/success */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">Erreur :</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-medium">Succès :</p>
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales (2/3) */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Carte de statut */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Statut de la réservation</h2>
                    <p className="text-sm text-gray-600 mt-1">ID: {booking.id}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                
                {/* Actions rapides */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {/* Bouton Confirmer seulement pour WAITLIST avec places */}
                    {booking.status === 'WAITLIST' && booking.remainingCapacity > 0 && (
                      <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Confirmer cette réservation
                      </button>
                    )}
                    
                    {/* Bouton Supprimer pour tous les statuts */}
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                  
                  {/* Information sur les places */}
                  <div className="mt-4 text-sm text-gray-600">
                    {booking.status === 'WAITLIST' && booking.remainingCapacity > 0 ? (
                      <p className="text-green-600">
                        ✓ Places disponibles : cette réservation peut être confirmée
                      </p>
                    ) : booking.status === 'WAITLIST' ? (
                      <p className="text-yellow-600">
                        ⏳ En attente d'une place disponible
                      </p>
                    ) : (
                      <p className="text-green-600">
                        ✓ Réservation confirmée
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations enfant */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations enfant</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium text-gray-900">
                      {booking.child.firstName} {booking.child.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Âge au moment de l'atelier: <span className="font-semibold">{booking.childAge} ans</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Né le {formatDateOnly(booking.child.birthDate)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Parent</p>
                    <p className="font-medium text-gray-900">
                      {booking.child.parent.firstName} {booking.child.parent.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{booking.child.parent.email}</p>
                    <p className="text-sm text-gray-600">{booking.child.parent.phone || 'Téléphone non renseigné'}</p>
                    
                    <div className="mt-3 space-x-3">
                      <Link
                        href={`/admin/children/${booking.child.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Voir la fiche enfant →
                      </Link>
                      <Link
                        href={`/admin/parents/${booking.child.parent.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Voir le parent →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations atelier */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informations atelier</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Nom de l'atelier</p>
                    <p className="font-medium text-gray-900">{booking.workshop.name}</p>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Date et heure</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(booking.workshop.startTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        jusqu'à {new Date(booking.workshop.endTime).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Lieu</p>
                      <p className="font-medium text-gray-900">
                        {booking.workshop.location || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Tranche d'âge</p>
                        <p className="font-medium text-gray-900">
                          {booking.workshop.minAge}-{booking.workshop.maxAge} ans
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Âge enfant: {booking.childAge} ans
                          {booking.childAge >= booking.workshop.minAge && 
                           booking.childAge <= booking.workshop.maxAge ? (
                            <span className="ml-2 text-green-600">✓ Compatible</span>
                          ) : (
                            <span className="ml-2 text-red-600">✗ Non compatible</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Capacité</p>
                        <p className="font-medium text-gray-900">
                          {booking.workshop.capacity} places
                        </p>
                        <p className="text-sm text-gray-600">
                          Places restantes: {booking.remainingCapacity}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Statut atelier</p>
                        <p className="font-medium text-gray-900">
                          {booking.workshop.status === 'ACTIVE' ? 'Actif' : 
                           booking.workshop.status === 'FULL' ? 'Complet' : 
                           booking.workshop.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link
                        href={`/admin/workshops/${booking.workshop.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Voir la fiche atelier →
                      </Link>
                    </div>
                  </div>
                </div>
                
                {booking.workshop.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="mt-1 text-gray-900">{booking.workshop.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions et métadonnées (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actions */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Supprimer définitivement
                </button>
                
                {booking.status === 'WAITLIST' && booking.remainingCapacity > 0 && (
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirmer cette réservation
                  </button>
                )}
                
                <Link
                  href={`/admin/reservations/create?childId=${booking.child.id}`}
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Nouvelle réservation pour cet enfant
                </Link>
                
                <Link
                  href={`/admin/reservations?childId=${booking.child.id}`}
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Voir toutes ses réservations
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>La suppression est irréversible</span>
                  </li>
                  {booking.status === 'WAITLIST' && (
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Confirmer envoie un email au parent</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Les emails de notification sont envoyés automatiquement</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Métadonnées</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Créée le</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(booking.createdAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Dernière modification</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(booking.updatedAt)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ID Réservation</p>
                  <p className="font-medium text-gray-900">{booking.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ID Enfant</p>
                  <p className="font-medium text-gray-900">{booking.child.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ID Atelier</p>
                  <p className="font-medium text-gray-900">{booking.workshop.id}</p>
                </div>
              </div>
            </div>

            {/* Information capacité */}
            <div className={`p-4 rounded-lg ${
              booking.remainingCapacity === 0 
                ? 'bg-red-50 border border-red-200' 
                : booking.remainingCapacity <= 3
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <h4 className="font-medium text-gray-900 mb-2">État de l'atelier</h4>
              <p className="text-sm">
                Capacité: {booking.workshop.capacity} places
              </p>
              <p className="text-sm">
                Places restantes: {booking.remainingCapacity}
              </p>
              <p className={`text-sm font-medium mt-2 ${
                booking.remainingCapacity === 0 
                  ? 'text-red-700' 
                  : booking.remainingCapacity <= 3
                  ? 'text-yellow-700'
                  : 'text-green-700'
              }`}>
                {booking.remainingCapacity === 0 
                  ? 'Atelier complet'
                  : booking.remainingCapacity <= 3
                  ? 'Plus que quelques places'
                  : 'Places disponibles'
                }
              </p>
              {booking.status === 'WAITLIST' && (
                <p className="text-sm text-yellow-700 mt-2">
                  {booking.remainingCapacity > 0 
                    ? '✓ Cette réservation peut être confirmée'
                    : '⏳ En attente d\'une place'
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}