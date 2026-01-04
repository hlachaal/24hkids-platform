// app/admin/audit-logs/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AuditLog = {
  id: number;
  action: string;
  performedByEmail: string;
  performedByType: string;
  targetId?: number | null;
  targetType?: string | null;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    action: '',
    email: '',
    dateFrom: '',
    dateTo: '',
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.email) params.append('email', filters.email);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Erreur lors du chargement des logs');
      }

      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('fr-FR');

  const getActionColor = (action: string) => {
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800';
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Logs d’audit</h1>
          <Link href="/admin/dashboard" className="text-sm text-indigo-600">
            ← Retour dashboard
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={filters.action}
                onChange={e =>
                  setFilters({ ...filters, action: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Toutes</option>
                <option value="RESERVATION_CREATED">Réservation créée</option>
                <option value="RESERVATION_DELETED">Réservation supprimée</option>
                <option value="WORKSHOP_CREATED">Atelier créé</option>
                <option value="USER_LOGIN">Connexion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email utilisateur
              </label>
              <input
                value={filters.email}
                onChange={e =>
                  setFilters({ ...filters, email: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Du</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Au</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mt-4 text-right">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Appliquer
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          {loading && (
            <div className="p-8 text-center text-gray-500">
              Chargement des logs…
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-600">{error}</div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucun log trouvé
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Cible</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {log.performedByEmail}
                      <div className="text-xs text-gray-500">
                        {log.performedByType}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {log.targetType
                        ? `${log.targetType} #${log.targetId}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">{log.ipAddress}</td>
                    <td className="px-4 py-2 text-xs">
                      <pre className="bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
