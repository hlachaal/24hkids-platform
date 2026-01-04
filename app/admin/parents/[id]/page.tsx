// app/admin/parents/%5Bid%5D/page.tsx

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Parent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  children: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
};

// Définir le type pour params
interface PageProps {
  params: Promise<{ id: string }>; // Important : params est une Promise
}

export default function AdminParentDetailPage({ params }: PageProps) {
  const router = useRouter();

  // ⬅️ IMPORTANT : Déstructurer après avoir utilisé use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const parentId = Number(id);

  // ... reste du code inchangé ...
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const res = await fetch(`/api/admin/parents/${parentId}`);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Erreur lors du chargement du parent.');
        }

        const data = await res.json();
        setParent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(parentId)) {
      fetchParent();
    }
  }, [parentId]);

  const handleChange = (field: ParentEditableFields, value: string) => {
    if (!parent) return;
    setParent({ ...parent, [field]: value });
  };

  const handleSave = async () => {
    if (!parent) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/parents/${parentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
          password: parent.password || null
        })
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
    if (!confirm('Voulez-vous vraiment supprimer ce parent ?')) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/admin/parents/${parentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      router.push('/admin/parents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement du parent...</div>;
  }

  if (!parent) {
    return (
      <div className="p-6 text-red-600">
        Parent introuvable.
        <br />
        <Link href="/admin/parents" className="text-indigo-600">
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
            Modifier le parent : {parent.firstName} {parent.lastName}
          </h1>
          <Link href="/admin/parents" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Retour
          </Link>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              value={parent.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={parent.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={parent.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="text"
              value={parent.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe (optionnel)</label>
            <input
              type="password"
              value={parent.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
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
