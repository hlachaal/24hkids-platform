// app/admin/parents/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Parent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  children: { id: number }[];
};

export default function AdminParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/parents');

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Erreur lors du chargement des parents.');
      }

      const data = await res.json();
      setParents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce parent ?')) return;

    try {
      const res = await fetch(`/api/admin/parents/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      setParents(parents.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement des parents...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des parents</h1>

          <Link
            href="/admin/parents/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Ajouter un parent
          </Link>
              <Link
                href="/admin/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>

        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enfants
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {parents.map((parent) => (
                <tr key={parent.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parent.firstName} {parent.lastName}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {parent.email}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {parent.phone || '—'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {parent.children.length}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <Link
                      href={`/admin/parents/${parent.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Modifier
                    </Link>

                    <button
                      onClick={() => handleDelete(parent.id)}
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
      </div>
    </div>
  );
}
