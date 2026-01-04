'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type WorkshopStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export default function AdminWorkshopCreatePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<WorkshopStatus>('DRAFT');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startTime || !endTime || !capacity) {
      setError('Veuillez remplir au minimum le nom, les dates et la capacité.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startTime,
          endTime,
          minAge: minAge === '' ? null : Number(minAge),
          maxAge: maxAge === '' ? null : Number(maxAge),
          capacity: Number(capacity),
          location,
          status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      router.push('/admin/workshops');
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'atelier.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un atelier</h1>
          <Link
            href="/admin/workshops"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Retour
          </Link>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow sm:rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Début</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fin</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Âge min.</label>
              <input
                type="number"
                min={0}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Âge max.</label>
              <input
                type="number"
                min={0}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Capacité</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lieu</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkshopStatus)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {saving ? 'Enregistrement...' : 'Créer l’atelier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
