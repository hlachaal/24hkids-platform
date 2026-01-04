// app/admin/reservations/create/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Types pour les données
type ChildOption = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  parent?: {
    id: number;
    firstName: string;
    lastName: string;
  };
};

type WorkshopOption = {
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

type ParentOption = {
  id: number;
  firstName: string;
  lastName: string;
  children: ChildOption[];
};

export default function AdminReservationCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // États du formulaire
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  
  // États pour les données
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<ChildOption[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la soumission
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // États pour les informations de prévisualisation
  const [selectedChild, setSelectedChild] = useState<ChildOption | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopOption | null>(null);
  const [childAgeAtWorkshop, setChildAgeAtWorkshop] = useState<number | null>(null);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les parents avec leurs enfants
        const parentsRes = await fetch('/api/admin/parents');
        if (parentsRes.ok) {
          const parentsData = await parentsRes.json();
          setParents(parentsData);
        }
        
        // Charger les ateliers actifs
        const workshopsRes = await fetch('/api/admin/workshops');
        if (workshopsRes.ok) {
          const workshopsData = await workshopsRes.json();
          setWorkshops(workshopsData.filter((w: WorkshopOption) => 
            w.status === 'ACTIVE' || w.status === 'FULL'
          ));
        }
        
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Pré-remplir avec childId si présent dans l'URL
  useEffect(() => {
    const childId = searchParams.get('childId');
    if (childId && parents.length > 0) {
      // Trouver l'enfant dans tous les parents
      let foundChild: ChildOption | null = null;
      for (const parent of parents) {
        const child = parent.children?.find(c => c.id === parseInt(childId));
        if (child) {
          foundChild = {
            ...child,
            parent: {
              id: parent.id,
              firstName: parent.firstName,
              lastName: parent.lastName,
            }
          };
          setSelectedChildId(childId);
          setSelectedChild(foundChild);
          
          // Filtrer les enfants de ce parent
          const children = parent.children?.map(c => ({
            ...c,
            parent: {
              id: parent.id,
              firstName: parent.firstName,
              lastName: parent.lastName,
            }
          })) || [];
          setFilteredChildren(children);
          break;
        }
      }
    }
  }, [parents, searchParams]);

  // Gérer la sélection d'un parent
  const handleParentChange = (parentId: string) => {
    const parent = parents.find(p => p.id === parseInt(parentId));
    if (parent) {
      const children = parent.children?.map(c => ({
        ...c,
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        }
      })) || [];
      setFilteredChildren(children);
      setSelectedChildId('');
      setSelectedChild(null);
    } else {
      setFilteredChildren([]);
      setSelectedChildId('');
      setSelectedChild(null);
    }
  };

  // Gérer la sélection d'un enfant
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    const child = filteredChildren.find(c => c.id === parseInt(childId)) || null;
    setSelectedChild(child);
    
    // Calculer l'âge pour l'atelier sélectionné si les deux sont choisis
    if (child && selectedWorkshop) {
      calculateChildAge(child, selectedWorkshop);
    }
  };

  // Gérer la sélection d'un atelier
  const handleWorkshopChange = (workshopId: string) => {
    setSelectedWorkshopId(workshopId);
    const workshop = workshops.find(w => w.id === parseInt(workshopId)) || null;
    setSelectedWorkshop(workshop);
    
    // Calculer l'âge pour l'enfant sélectionné si les deux sont choisis
    if (workshop && selectedChild) {
      calculateChildAge(selectedChild, workshop);
    }
  };

  // Calculer l'âge de l'enfant au moment de l'atelier
  const calculateChildAge = (child: ChildOption, workshop: WorkshopOption) => {
    if (!child?.birthDate || !workshop?.startTime) {
      setChildAgeAtWorkshop(null);
      return;
    }
    
    const workshopDate = new Date(workshop.startTime);
    const birthDate = new Date(child.birthDate);
    let age = workshopDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = workshopDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && workshopDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setChildAgeAtWorkshop(age);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedChildId) errors.childId = 'La sélection d\'un enfant est requise';
    if (!selectedWorkshopId) errors.workshopId = 'La sélection d\'un atelier est requise';

    // Vérifier l'âge si les deux sont sélectionnés
    if (selectedChild && selectedWorkshop && childAgeAtWorkshop !== null) {
      if (childAgeAtWorkshop < selectedWorkshop.minAge || childAgeAtWorkshop > selectedWorkshop.maxAge) {
        errors.age = `L'enfant aura ${childAgeAtWorkshop} ans, mais l'atelier est pour ${selectedWorkshop.minAge}-${selectedWorkshop.maxAge} ans`;
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

      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          workshopId: selectedWorkshopId,
          status: status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      // Redirection vers la liste
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculer les places restantes pour un atelier
  const getRemainingCapacity = (workshop: WorkshopOption) => {
    return workshop.status === 'FULL' ? 0 : 'Places disponibles';
  };

  // Calculer la durée de l'atelier
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));
    return durationHours;
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement des données...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle réservation</h1>
          <Link 
            href="/admin/reservations" 
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour à la liste
          </Link>
        </div>

        {/* Messages d'erreur */}
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
              {/* Sélection du parent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent <span className="text-red-500">*</span>
                </label>
                <select
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={saving || loading}
                >
                  <option value="">Sélectionnez un parent...</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName} ({parent.children?.length || 0} enfant(s))
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection de l'enfant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enfant <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    validationErrors.childId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={saving || loading || filteredChildren.length === 0}
                >
                  <option value="">Sélectionnez un enfant...</option>
                  {filteredChildren.map((child) => {
                    // Calculer l'âge pour l'affichage
                    let ageDisplay = '';
                    if (selectedWorkshop) {
                      // Calculer l'âge au moment de l'atelier
                      const workshopDate = new Date(selectedWorkshop.startTime);
                      const birthDate = new Date(child.birthDate);
                      let age = workshopDate.getFullYear() - birthDate.getFullYear();
                      const monthDiff = workshopDate.getMonth() - birthDate.getMonth();
                      
                      if (monthDiff < 0 || (monthDiff === 0 && workshopDate.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      ageDisplay = `${age} ans à l'atelier`;
                    } else {
                      // Calculer l'âge actuel
                      const today = new Date();
                      const birthDate = new Date(child.birthDate);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      ageDisplay = `${age} ans actuellement`;
                    }
                    
                    return (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} 
                        {` (${ageDisplay}, né le ${new Date(child.birthDate).toLocaleDateString('fr-FR')})`}
                      </option>
                    );
                  })}
                </select>
                {validationErrors.childId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.childId}</p>
                )}
                {filteredChildren.length === 0 && parents.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Sélectionnez d'abord un parent pour voir ses enfants
                  </p>
                )}
              </div>

              {/* Sélection de l'atelier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atelier <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWorkshopId}
                  onChange={(e) => handleWorkshopChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    validationErrors.workshopId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={saving || loading}
                >
                  <option value="">Sélectionnez un atelier...</option>
                  {workshops.map((workshop) => (
                    <option key={workshop.id} value={workshop.id}>
                      {workshop.name} - {formatDateTime(workshop.startTime)}
                      {workshop.status === 'FULL' && ' (COMPLET)'}
                      {` - ${workshop.minAge}-${workshop.maxAge} ans`} {/* ← ICI */}
                    </option>
                  ))}
                </select>
                {validationErrors.workshopId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.workshopId}</p>
                )}
                {validationErrors.age && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.age}</p>
                )}
              </div>

              {/* Statut (optionnel pour admin) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut initial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={saving}
                >
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="WAITLIST">Liste d'attente</option>
                  
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Normalement automatique, mais vous pouvez forcer un statut.
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="pt-6 flex justify-between border-t border-gray-200">
                <Link
                  href="/admin/reservations"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  onClick={(e) => {
                    if (saving) e.preventDefault();
                  }}
                >
                  Annuler
                </Link>

                <button
                  type="submit"
                  disabled={saving || !selectedChildId || !selectedWorkshopId}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Création en cours...' : 'Créer la réservation'}
                </button>
              </div>
            </form>
          </div>

          {/* Aperçu (1/3 de la largeur) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
              {/* Aperçu Enfant */}
              {selectedChild && selectedChild.parent && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Enfant</h3>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedChild.firstName} {selectedChild.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Né le {new Date(selectedChild.birthDate).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Parent: {selectedChild.parent.firstName} {selectedChild.parent.lastName}
                    </p>
                  </div>
                </div>
              )}

              {/* Aperçu Atelier */}
              {selectedWorkshop && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Atelier</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{selectedWorkshop.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(selectedWorkshop.startTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Durée: {calculateDuration(selectedWorkshop.startTime, selectedWorkshop.endTime)}h
                    </p>
                    <p className="text-sm text-gray-600">
                      Lieu: {selectedWorkshop.location || 'Non spécifié'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Âge: {selectedWorkshop.minAge}-{selectedWorkshop.maxAge} ans
                    </p>
                    <p className="text-sm text-gray-600">
                      Capacité: {selectedWorkshop.capacity} places
                    </p>
                    <p className="text-sm">
                      Statut: 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedWorkshop.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedWorkshop.status === 'ACTIVE' ? 'Actif' : 'Complet'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Vérification Âge */}
              {selectedChild && selectedWorkshop && childAgeAtWorkshop !== null && (
                <div className={`p-3 rounded-lg ${
                  childAgeAtWorkshop >= selectedWorkshop.minAge && 
                  childAgeAtWorkshop <= selectedWorkshop.maxAge
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-1">Vérification d'âge</h4>
                  <p className="text-sm">
                    L'enfant aura <span className="font-semibold">{childAgeAtWorkshop} ans</span> 
                    au moment de l'atelier.
                  </p>
                  <p className="text-sm">
                    Atelier pour {selectedWorkshop.minAge}-{selectedWorkshop.maxAge} ans.
                  </p>
                  {childAgeAtWorkshop >= selectedWorkshop.minAge && 
                   childAgeAtWorkshop <= selectedWorkshop.maxAge ? (
                    <p className="text-sm text-green-700 font-medium mt-1">
                      ✓ Âge compatible
                    </p>
                  ) : (
                    <p className="text-sm text-red-700 font-medium mt-1">
                      ✗ Âge non compatible
                    </p>
                  )}
                </div>
              )}

              {/* Informations */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informations</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>La réservation sera soumise aux règles de validation (capacité, chevauchement)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Le statut sera automatiquement ajusté selon la capacité</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Vous pouvez annuler ou modifier le statut ultérieurement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}