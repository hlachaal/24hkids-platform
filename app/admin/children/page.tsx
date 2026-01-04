// app/admin/children/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Type pour les enfants avec les données calculées
type ChildWithDetails = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  allergies?: string | null;
  medicalNote?: string | null;
  parentId: number;
  parent: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  bookings: Array<{ id: number; status: string }>;
  bookingCount: number;
  parentName: string; // Format: "Prénom Nom"
};

// Type pour les filtres
type Filters = {
  parentId?: string;
  search?: string;
};

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<ChildWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState<Filters>({});
  const [parents, setParents] = useState<Array<{ id: number; firstName: string; lastName: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Charger la liste des parents pour le dropdown
  const loadParents = async () => {
    try {
      const res = await fetch('/api/admin/parents');
      if (res.ok) {
        const data = await res.json();
        setParents(data);
      }
    } catch (err) {
      console.error('Erreur chargement parents:', err);
    }
  };

  // Charger les enfants avec filtres
  const loadChildren = async (filters: Filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Construction de l'URL avec query params
      const params = new URLSearchParams();
      if (filters.parentId) params.append('parentId', filters.parentId);
      if (filters.search) params.append('search', filters.search);

      const url = `/api/admin/children${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erreur lors du chargement des enfants.');
      }

      const data = await res.json();
      setChildren(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadParents();
    loadChildren();
  }, []);

  // Gérer les changements de filtre
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    loadChildren(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    loadChildren({});
  };

  const handleDelete = async (id: number, childName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'enfant "${childName}" ?\n\n⚠️ Cette action échouera si l'enfant a des réservations actives.`)) return;

    try {
      const res = await fetch(`/api/admin/children/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Recharger la liste
      loadChildren(filters);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Fonction pour formater la date de naissance
  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour le badge de statut des réservations
  const getBookingBadge = (count: number) => {
    if (count === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Aucune réservation</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{count} réservation(s)</span>;
  };

  if (loading && children.length === 0) {
    return <div className="p-6 text-gray-600">Chargement des enfants...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {/* En-tête avec boutons */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des enfants</h1>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>

            <Link
              href="/admin/children/create"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + Ajouter un enfant
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche par nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rechercher un enfant
                </label>
                <input
                  type="text"
                  placeholder="Nom ou prénom..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Filtre par parent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par parent
                </label>
                <select
                  value={filters.parentId || ''}
                  onChange={(e) => handleFilterChange('parentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tous les parents</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton reset */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Réinitialiser les filtres
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

        {/* Tableau */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enfant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge / Naissance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Informations santé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réservations
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {children.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Chargement...' : 'Aucun enfant trouvé'}
                  </td>
                </tr>
              ) : (
                children.map((child) => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    {/* Colonne Enfant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {child.firstName} {child.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {child.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Parent */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {child.parent.firstName} {child.parent.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {child.parent.email}
                      </div>
                    </td>

                    {/* Colonne Âge / Naissance */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">{child.age} ans</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Né(e) le {formatBirthDate(child.birthDate)}
                      </div>
                    </td>

                    {/* Colonne Informations santé */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {child.allergies ? (
                          <div className="mb-1">
                            <span className="font-medium">Allergies:</span> {child.allergies}
                          </div>
                        ) : null}
                        {child.medicalNote ? (
                          <div>
                            <span className="font-medium">Note médicale:</span> {child.medicalNote}
                          </div>
                        ) : null}
                        {!child.allergies && !child.medicalNote && (
                          <span className="text-gray-400">Aucune information</span>
                        )}
                      </div>
                    </td>

                    {/* Colonne Réservations */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {getBookingBadge(child.bookingCount)}
                        {child.bookingCount > 0 && (
                          <Link
                            href={`/admin/reservations?childId=${child.id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Voir les réservations →
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* Colonne Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <Link
                        href={`/admin/children/${child.id}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Modifier
                      </Link>

                      <button
                        onClick={() => handleDelete(child.id, `${child.firstName} ${child.lastName}`)}
                        className="text-red-600 hover:text-red-800"
                        disabled={child.bookingCount > 0}
                        title={child.bookingCount > 0 ? "Impossible de supprimer : réservations actives" : ""}
                      >
                        {child.bookingCount > 0 ? (
                          <span className="opacity-50 cursor-not-allowed">Supprimer</span>
                        ) : (
                          "Supprimer"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statistiques */}
        {children.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            {children.length} enfant(s) trouvé(s)
            {filters.parentId && ` pour le parent sélectionné`}
            {filters.search && ` correspondant à "${filters.search}"`}
          </div>
        )}
      </div>
    </div>
  );
}