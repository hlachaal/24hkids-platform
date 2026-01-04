// app/admin/children/[id]/page.tsx

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Type pour les données de l'enfant
type Child = {
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
    phone: string | null;
  };
  bookings: Array<{
    id: number;
    status: string;
    workshop: {
      id: number;
      name: string;
      startTime: string;
      endTime: string;
    };
  }>;
};

// Type pour les parents dans le dropdown
type ParentOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

// Type pour les props (avec params comme Promise)
interface PageProps {
  params: Promise<{ id: string }>;
}

// Type pour les champs éditables
type ChildEditableFields = 'firstName' | 'lastName' | 'birthDate' | 'parentId' | 'allergies' | 'medicalNote';

export default function AdminChildDetailPage({ params }: PageProps) {
  const router = useRouter();

  // ⬅️ IMPORTANT : Déstructurer après avoir utilisé use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const childId = Number(id);

  // États pour les données
  const [child, setChild] = useState<Child | null>(null);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Charger l'enfant et la liste des parents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger l'enfant
        const childRes = await fetch(`/api/admin/children/${childId}`);
        if (!childRes.ok) {
          const text = await childRes.text();
          throw new Error(text || 'Erreur lors du chargement de l\'enfant.');
        }
        const childData = await childRes.json();
        setChild(childData);

        // Charger la liste des parents
        const parentsRes = await fetch('/api/admin/parents');
        if (parentsRes.ok) {
          const parentsData = await parentsRes.json();
          setParents(parentsData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(childId)) {
      fetchData();
    }
  }, [childId]);

  // Gérer les changements dans le formulaire
  const handleChange = (field: ChildEditableFields, value: string | number) => {
    if (!child) return;
    
    // Pour parentId, on convertit en number
    const newValue = field === 'parentId' ? parseInt(value as string) : value;
    
    setChild({
      ...child,
      [field]: newValue,
    });
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!child) return false;
    
    const errors: Record<string, string> = {};

    if (!child.firstName.trim()) errors.firstName = 'Le prénom est requis';
    if (!child.lastName.trim()) errors.lastName = 'Le nom est requis';
    if (!child.birthDate) errors.birthDate = 'La date de naissance est requise';
    if (!child.parentId) errors.parentId = 'La sélection d\'un parent est requise';

    // Validation de la date
    if (child.birthDate) {
      const selectedDate = new Date(child.birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate >= today) {
        errors.birthDate = 'La date de naissance doit être dans le passé';
      }
      
      const age = today.getFullYear() - selectedDate.getFullYear();
      const monthDiff = today.getMonth() - selectedDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 1) {
        errors.birthDate = 'L\'enfant doit avoir au moins 1 an';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!child) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/children/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: child.firstName,
          lastName: child.lastName,
          birthDate: child.birthDate,
          parentId: child.parentId,
          allergies: child.allergies || null,
          medicalNote: child.medicalNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess('Modifications enregistrées avec succès.');
      
      // Recharger les données
      const updatedRes = await fetch(`/api/admin/children/${childId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setChild(updatedData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Supprimer l'enfant
  const handleDelete = async () => {
    if (!child) return;
    
    const childName = `${child.firstName} ${child.lastName}`;
    const hasBookings = child.bookings && child.bookings.length > 0;
    
    let message = `Voulez-vous vraiment supprimer l'enfant "${childName}" ?`;
    
    if (hasBookings) {
      message += `\n\n⚠️ ATTENTION : Cet enfant a ${child.bookings.length} réservation(s) active(s).\nLa suppression échouera si des réservations sont actives.`;
    }
    
    if (!confirm(message)) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/admin/children/${childId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      router.push('/admin/children');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formater la date/heure pour les ateliers
  const formatWorkshopDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer l'âge à partir de la date de naissance
  const calculateAgeFromDate = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement de l'enfant...</div>;
  }

  if (!child) {
    return (
      <div className="p-6 text-red-600">
        Enfant introuvable.
        <br />
        <Link href="/admin/children" className="text-indigo-600">
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
            <h1 className="text-2xl font-bold text-gray-900">
              {child.firstName} {child.lastName}
            </h1>
            <p className="text-gray-600">ID: {child.id} • Âge: {child.age} ans</p>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/admin/children" className="text-sm text-indigo-600 hover:text-indigo-800">
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
          {/* Formulaire d'édition (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations de l'enfant</h2>

              {/* Prénom et Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={child.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={saving}
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={child.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={saving}
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={child.birthDate.split('T')[0]} // Garder seulement la partie date
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className={`w-full md:w-64 px-3 py-2 border rounded-md ${
                      validationErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={saving}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <span className="text-sm text-gray-600">
                    ({calculateAgeFromDate(child.birthDate)} ans)
                  </span>
                </div>
                {validationErrors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.birthDate}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Né(e) le {formatDate(child.birthDate)}
                </p>
              </div>

              {/* Parent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent <span className="text-red-500">*</span>
                </label>
                <select
                  value={child.parentId}
                  onChange={(e) => handleChange('parentId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    validationErrors.parentId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={saving}
                >
                  <option value="">Sélectionnez un parent...</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName} ({parent.email})
                    </option>
                  ))}
                </select>
                {validationErrors.parentId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.parentId}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Actuel : {child.parent.firstName} {child.parent.lastName} ({child.parent.email})
                </p>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  value={child.allergies || ''}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  disabled={saving}
                  placeholder="Ex: Arachides, lactose, pollen..."
                />
              </div>

              {/* Note médicale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note médicale
                </label>
                <textarea
                  value={child.medicalNote || ''}
                  onChange={(e) => handleChange('medicalNote', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  disabled={saving}
                  placeholder="Ex: Asthme léger, traitement en cours..."
                />
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 flex justify-between border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Supprimer
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>

          {/* Informations et réservations (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Informations du parent */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Parent</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium">
                    {child.parent.firstName} {child.parent.lastName}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {child.parent.email}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">
                    {child.parent.phone || 'Non renseigné'}
                  </p>
                </div>
                
                <div className="pt-3">
                  <Link
                    href={`/admin/parents/${child.parent.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Voir la fiche du parent →
                  </Link>
                </div>
              </div>
            </div>

            {/* Réservations */}
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Réservations ({child.bookings.length})
              </h3>
              
              {child.bookings.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune réservation pour cet enfant.</p>
              ) : (
                <div className="space-y-4">
                  {child.bookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{booking.workshop.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatWorkshopDateTime(booking.workshop.startTime)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          booking.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status === 'CONFIRMED' ? 'Confirmé' : 
                           booking.status === 'CANCELLED' ? 'Annulé' : 'Liste d\'attente'}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <Link
                          href={`/admin/reservations/${booking.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Voir la réservation →
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <Link
                      href={`/admin/reservations?childId=${child.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Voir toutes les réservations →
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Bouton pour créer une réservation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/admin/reservations/create?childId=${child.id}`}
                  className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  + Créer une réservation pour cet enfant
                </Link>
              </div>
            </div>

            {/* Informations système */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Informations système</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>ID: {child.id}</p>
                <p>Date de création: {formatDate(child.createdAt)}</p>
                <p>Dernière modification: {formatDate(child.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}