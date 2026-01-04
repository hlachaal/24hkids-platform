'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type WorkshopStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

type Workshop = {
  id: number;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  minAge: number | null;
  maxAge: number | null;
  capacity: number;
  location: string | null;
  status: WorkshopStatus;
};

// Convertit une date ISO UTC en valeur locale pour <input type="datetime-local">
function toLocalInputValue(dateString: string) {
  const date = new Date(dateString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - tzOffset).toISOString();
  return localISO.slice(0, 16); // yyyy-MM-ddTHH:mm
}

export default function AdminWorkshopEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const workshopId = Number(params.id);

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkshop = async () => {
      try {
        const res = await fetch(`/api/admin/workshops/${workshopId}`);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Erreur lors du chargement de l’atelier.');
        }

        const data = await res.json();
        setWorkshop(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkshop();
  }, [workshopId]);

  const handleChange = (field: keyof Workshop, value: any) => {
    if (!workshop) return;
    setWorkshop({ ...workshop, [field]: value });
  };

  const handleSave = async () => {
    if (!workshop) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/workshops/${workshopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workshop,
          startTime: workshop.startTime,
          endTime: workshop.endTime,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      setSuccess('Modifications enregistrées avec succès.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cet atelier ?')) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/admin/workshops/${workshopId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      router.push('/admin/workshops');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement de l’atelier...</div>;
  }

  if (!workshop) {
    return (
      <div className="p-6 text-red-600">
        Atelier introuvable.
        <br />
        <Link href="/admin/workshops" className="text-indigo-600">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier l’atelier : {workshop.name}
          </h1>
          <Link href="/admin/workshops" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Retour
          </Link>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={workshop.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={workshop.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Début</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(workshop.startTime)}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fin</label>
              <input
                type="datetime-local"
                value={toLocalInputValue(workshop.endTime)}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Âge min.</label>
              <input
                type="number"
                value={workshop.minAge ?? ''}
                onChange={(e) =>
                  handleChange('minAge', e.target.value === '' ? null : Number(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Âge max.</label>
              <input
                type="number"
                value={workshop.maxAge ?? ''}
                onChange={(e) =>
                  handleChange('maxAge', e.target.value === '' ? null : Number(e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Capacité</label>
              <input
                type="number"
                value={workshop.capacity}
                onChange={(e) => handleChange('capacity', Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lieu</label>
            <input
              type="text"
              value={workshop.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Statut</label>
            <select
              value={workshop.status}
              onChange={(e) => handleChange('status', e.target.value as WorkshopStatus)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
            >
              Supprimer
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
