'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Types pour les réservations
type BookingWithDetails = {
  id: number;
  status: string;
  createdAt: string;
  child: {
    id: number;
    firstName: string;
    lastName: string;
    parent: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  workshop: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    location: string | null;
    capacity: number;
    remainingCapacity: number;
  };
};

// Types pour les filtres
type Filters = {
  childId?: string;
  parentId?: string;
  workshopId?: string;
  status?: string;
  date?: string;
  search?: string;
};

// Types pour les dropdowns
type ChildOption = { id: number; firstName: string; lastName: string; parentId: number };
type ParentOption = { id: number; firstName: string; lastName: string };
type WorkshopOption = { id: number; name: string; startTime: string };

// Type pour les groupes de réservations
type BookingGroup = {
  dateTimeKey: string;
  startTime: string;
  endTime: string;
  formattedDateTime: string;
  formattedEndTime: string;
  bookings: BookingWithDetails[];
};

export default function AdminReservationsPage() {
  const searchParams = useSearchParams();
  const childIdFromUrl = searchParams.get('childId');
  
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<BookingWithDetails[]>([]);
  const [waitlistBookings, setWaitlistBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Synchroniser filters avec childIdFromUrl
  useEffect(() => {
    if (childIdFromUrl && childIdFromUrl !== filters.childId) {
      setFilters(prev => ({ ...prev, childId: childIdFromUrl }));
    } else if (!childIdFromUrl && filters.childId) {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters.childId;
        return newFilters;
      });
    }
  }, [childIdFromUrl]);

  // Charger les réservations quand filters change
  useEffect(() => {
    if (!loadingDropdowns) {
      loadBookings(filters);
    }
  }, [filters, loadingDropdowns]);

  // Charger les données pour les dropdowns
  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      
      const childrenRes = await fetch('/api/admin/children');
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(childrenData.map((c: any) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          parentId: c.parentId,
        })));
      }
      
      const parentsRes = await fetch('/api/admin/parents');
      if (parentsRes.ok) {
        const parentsData = await parentsRes.json();
        setParents(parentsData);
      }
      
      const workshopsRes = await fetch('/api/admin/workshops');
      if (workshopsRes.ok) {
        const workshopsData = await workshopsRes.json();
        setWorkshops(workshopsData);
      }
    } catch (err) {
      console.error('Erreur chargement dropdowns:', err);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Charger les réservations avec filtres
  const loadBookings = async (filtersToApply: Filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtersToApply.childId) params.append('childId', filtersToApply.childId);
      if (filtersToApply.parentId) params.append('parentId', filtersToApply.parentId);
      if (filtersToApply.workshopId) params.append('workshopId', filtersToApply.workshopId);
      if (filtersToApply.status) params.append('status', filtersToApply.status);
      if (filtersToApply.date) params.append('date', filtersToApply.date);
      if (filtersToApply.search) params.append('search', filtersToApply.search);

      const url = `/api/admin/reservations${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erreur lors du chargement des réservations.');
      }

      const data = await res.json();
      
      const sortedData = sortBookings(data);
      setBookings(sortedData);
      
      // Séparer CONFIRMED et WAITLIST
      setConfirmedBookings(sortedData.filter(b => b.status === 'CONFIRMED'));
      setWaitlistBookings(sortedData.filter(b => b.status === 'WAITLIST'));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirmer une réservation WAITLIST
  const handleConfirm = async (bookingId: number) => {
    if (!confirm('Confirmer cette réservation en liste d\'attente ?')) return;

    try {
      setError(null);
      
      const res = await fetch(`/api/admin/reservations/${bookingId}/confirm`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la confirmation');
      }

      // Recharger les données
      await loadBookings(filters);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Supprimer une réservation
  const handleDelete = async (bookingId: number) => {
    if (!confirm('Supprimer définitivement cette réservation ?\n\nCette action est irréversible.')) {
      return;
    }

    try {
      setError(null);
      
      const res = await fetch(`/api/admin/reservations/${bookingId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Recharger les données
      await loadBookings(filters);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fonction de tri
  const sortBookings = (bookings: BookingWithDetails[]): BookingWithDetails[] => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.workshop.startTime).getTime();
      const dateB = new Date(b.workshop.startTime).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      const workshopNameA = a.workshop.name.toLowerCase();
      const workshopNameB = b.workshop.name.toLowerCase();
      if (workshopNameA !== workshopNameB) {
        return workshopNameA.localeCompare(workshopNameB);
      }
      
      const parentNameA = a.child.parent.lastName.toLowerCase();
      const parentNameB = b.child.parent.lastName.toLowerCase();
      if (parentNameA !== parentNameB) {
        return parentNameA.localeCompare(parentNameB);
      }
      
      const parentFirstNameA = a.child.parent.firstName.toLowerCase();
      const parentFirstNameB = b.child.parent.firstName.toLowerCase();
      if (parentFirstNameA !== parentFirstNameB) {
        return parentFirstNameA.localeCompare(parentFirstNameB);
      }
      
      const childNameA = a.child.lastName.toLowerCase();
      const childNameB = b.child.lastName.toLowerCase();
      if (childNameA !== childNameB) {
        return childNameA.localeCompare(childNameB);
      }
      
      const childFirstNameA = a.child.firstName.toLowerCase();
      const childFirstNameB = b.child.firstName.toLowerCase();
      return childFirstNameA.localeCompare(childFirstNameB);
    });
  };

  // Formater la date/heure
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formater juste la date
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Gérer les changements de filtre
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  // Initial load
  useEffect(() => {
    loadDropdownData();
  }, []);

  if (loading && bookings.length === 0) {
    return <div className="p-6 text-gray-600">Chargement des réservations...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réservations</h1>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>

            <Link
              href="/admin/reservations/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + Nouvelle réservation
            </Link>
            
            <Link
              href="/admin/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Retour Dashboard
            </Link>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre par enfant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enfant
                </label>
                <select
                  value={filters.childId || ''}
                  onChange={(e) => handleFilterChange('childId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loadingDropdowns}
                >
                  <option value="">Tous les enfants</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id.toString()}>
                      {child.firstName} {child.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tous les statuts</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="WAITLIST">Liste d'attente</option>
                </select>
              </div>

              {/* Filtre par date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date || ''}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Recherche GLOBALE */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recherche globale
                </label>
                <input
                  type="text"
                  placeholder="Rechercher dans: enfant, parent, atelier, email, lieu..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Bouton reset */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Section Réservations Confirmées */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Réservations confirmées ({confirmedBookings.length})
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {confirmedBookings.filter(b => 
                b.workshop.remainingCapacity > 0
              ).length} atelier(s) avec places disponibles
            </span>
          </div>

          {confirmedBookings.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg shadow">
              <p className="text-gray-500">Aucune réservation confirmée</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Heure
                    </th>                
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atelier
                    </th>                
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enfant & Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Places restantes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {confirmedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(booking.workshop.startTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          jusqu'à {new Date(booking.workshop.endTime).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.workshop.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.workshop.location || 'Lieu non spécifié'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.child.firstName} {booking.child.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.child.parent.firstName} {booking.child.parent.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.child.parent.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          booking.workshop.remainingCapacity === 0 
                            ? 'bg-red-100 text-red-800'
                            : booking.workshop.remainingCapacity <= 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {booking.workshop.remainingCapacity} place(s)
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <Link
                          href={`/admin/reservations/${booking.id}`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Détails
                        </Link>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Liste d'Attente */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Liste d'attente ({waitlistBookings.length})
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Priorité: Premier arrivé, premier servi
              </span>
              {waitlistBookings.filter(b => 
                b.workshop.remainingCapacity > 0
              ).length > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {waitlistBookings.filter(b => 
                    b.workshop.remainingCapacity > 0
                  ).length} peuvent être confirmées
                </span>
              )}
            </div>
          </div>

          {waitlistBookings.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-lg shadow">
              <p className="text-gray-500">Aucune réservation en liste d'attente</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-yellow-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Date inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Enfant & Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Atelier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Places disponibles
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-yellow-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {waitlistBookings.map((booking, index) => (
                    <tr key={booking.id} className="hover:bg-yellow-50">
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                            {index + 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.child.firstName} {booking.child.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.child.parent.firstName} {booking.child.parent.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.child.parent.email}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.workshop.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(booking.workshop.startTime)}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          booking.workshop.remainingCapacity === 0 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {booking.workshop.remainingCapacity} place(s)
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        {booking.workshop.remainingCapacity > 0 ? (
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Confirmer
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            En attente de place
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="px-3 py-1 text-red-600 hover:text-red-800"
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}