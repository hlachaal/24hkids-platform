// app/admin/children/create/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Type pour les parents dans le dropdown
type ParentOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export default function AdminChildCreatePage() {
  const router = useRouter();

  // États du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNote, setMedicalNote] = useState('');

  // États pour la liste des parents
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);
  
  // États pour la soumission
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Charger la liste des parents
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoadingParents(true);
        const res = await fetch('/api/admin/parents');
        
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des parents');
        }
        
        const data = await res.json();
        setParents(data);
      } catch (err: any) {
        setError('Impossible de charger la liste des parents');
        console.error(err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParents();
  }, []);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) errors.lastName = 'Le nom est requis';
    if (!birthDate) errors.birthDate = 'La date de naissance est requise';
    if (!selectedParentId) errors.parentId = 'La sélection d\'un parent est requise';

    // Validation de la date (doit être dans le passé)
    if (birthDate) {
      const selectedDate = new Date(birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Pour ignorer l'heure
      
      if (selectedDate >= today) {
        errors.birthDate = 'La date de naissance doit être dans le passé';
      }
      
      // Validation âge minimum (1 an) - ajustez selon vos besoins
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

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/admin/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          birthDate,
          parentId: selectedParentId,
          allergies: allergies.trim() || null,
          medicalNote: medicalNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      // Redirection vers la liste
      router.push('/admin/children');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Calcul de l'âge pour l'aperçu
  const calculatePreviewAge = () => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Formater la date pour l'affichage
  const formatDatePreview = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Récupérer le nom du parent sélectionné
  const getSelectedParentName = () => {
    if (!selectedParentId) return '';
    const parent = parents.find(p => p.id === parseInt(selectedParentId));
    return parent ? `${parent.firstName} ${parent.lastName}` : '';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un enfant</h1>
          <Link 
            href="/admin/children" 
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
        </div>

        {/* Messages d'erreur généraux */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">Erreur :</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire (2/3 de la largeur) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              {/* Prénom et Nom sur la même ligne */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full md:w-64 px-3 py-2 border rounded-md ${
                      validationErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={saving}
                    max={new Date().toISOString().split('T')[0]} // Pas de dates futures
                  />
                  {birthDate && (
                    <span className="text-sm text-gray-600">
                      ({calculatePreviewAge()} ans)
                    </span>
                  )}
                </div>
                {validationErrors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.birthDate}</p>
                )}
              </div>

              {/* Sélection du parent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent <span className="text-red-500">*</span>
                </label>
                {loadingParents ? (
                  <div className="py-2 text-gray-500">Chargement des parents...</div>
                ) : parents.length === 0 ? (
                  <div className="py-2 text-red-500">
                    Aucun parent disponible. 
                    <Link href="/admin/parents/create" className="text-indigo-600 ml-2">
                      Créer un parent d'abord
                    </Link>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
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
                  </>
                )}
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies (optionnel)
                </label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  disabled={saving}
                  placeholder="Ex: Arachides, lactose, pollen..."
                />
              </div>

              {/* Note médicale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note médicale (optionnel)
                </label>
                <textarea
                  value={medicalNote}
                  onChange={(e) => setMedicalNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  disabled={saving}
                  placeholder="Ex: Asthme léger, traitement en cours..."
                />
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 flex justify-between border-t border-gray-200">
                <Link
                  href="/admin/children"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  onClick={(e) => {
                    if (saving) e.preventDefault();
                  }}
                >
                  Annuler
                </Link>

                <button
                  type="submit"
                  disabled={saving || loadingParents || parents.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Création en cours...' : 'Créer l\'enfant'}
                </button>
              </div>
            </form>
          </div>

          {/* Aperçu (1/3 de la largeur) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu</h3>
              
              <div className="space-y-3">
                {/* Nom complet */}
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : '—'}
                  </p>
                </div>

                {/* Date de naissance */}
                <div>
                  <p className="text-sm text-gray-500">Date de naissance</p>
                  <p className="font-medium">
                    {birthDate ? formatDatePreview(birthDate) : '—'}
                  </p>
                  {birthDate && (
                    <p className="text-sm text-gray-600">
                      Âge: {calculatePreviewAge()} ans
                    </p>
                  )}
                </div>

                {/* Parent */}
                <div>
                  <p className="text-sm text-gray-500">Parent</p>
                  <p className="font-medium">
                    {getSelectedParentName() || '—'}
                  </p>
                </div>

                {/* Allergies */}
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <p className={`font-medium ${!allergies ? 'text-gray-400' : ''}`}>
                    {allergies || 'Aucune'}
                  </p>
                </div>

                {/* Note médicale */}
                <div>
                  <p className="text-sm text-gray-500">Note médicale</p>
                  <p className={`font-medium ${!medicalNote ? 'text-gray-400' : ''}`}>
                    {medicalNote || 'Aucune'}
                  </p>
                </div>

                {/* Informations */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Informations</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>L'enfant pourra être inscrit aux ateliers</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Les allergies et notes médicales sont visibles par les administrateurs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>La date de naissance sert à vérifier l'éligibilité aux ateliers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}