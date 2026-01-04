'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Workshop {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
  _count?: {
    bookings: number;
  };
}

export default function AdminExports() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState<number | 'all'>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/admin/workshops');
      if (!response.ok) {
        throw new Error('Failed to fetch workshops');
      }
      const data = await response.json();
      setWorkshops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = selectedWorkshop === 'all'
        ? '/api/admin/exports'
        : `/api/admin/exports?workshopId=${selectedWorkshop}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const filename = selectedWorkshop === 'all'
        ? `all-bookings-${new Date().toISOString().split('T')[0]}.csv`
        : `workshop-${selectedWorkshop}-bookings-${new Date().toISOString().split('T')[0]}.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setExporting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Data Exports</h1>
            <Link
              href="/admin/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Booking Data</h2>
            <p className="text-gray-600 mb-6">
              Download booking data in CSV format. You can export all bookings or filter by specific workshop.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Workshop
                </label>
                <select
                  value={selectedWorkshop}
                  onChange={(e) => setSelectedWorkshop(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="all">All Workshops</option>
                  {workshops.map((workshop) => (
                    <option key={workshop.id} value={workshop.id}>
                      {workshop.name} - {formatDateTime(workshop.startTime)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h3>
                <p className="text-sm text-gray-600">
                  {selectedWorkshop === 'all' ? (
                    `Exporting all bookings from ${workshops.length} workshops`
                  ) : (
                    (() => {
                      const workshop = workshops.find(w => w.id === selectedWorkshop);
                      return workshop ? `Exporting bookings for "${workshop.name}"` : 'Select a workshop';
                    })()
                  )}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Columns</h3>
                <p className="text-sm text-blue-700">
                  Workshop Name, Workshop Date, Workshop Time, Workshop Location, Child First Name, Child Last Name,
                  Child Birth Date, Parent First Name, Parent Last Name, Parent Email, Parent Phone, Booking Status,
                  Booking Created, Child Allergies, Child Medical Note
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  exporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {exporting ? 'Exporting...' : 'Download CSV'}
              </button>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Workshops</h2>
            <div className="space-y-2">
              {workshops.map((workshop) => (
                <div key={workshop.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <h3 className="font-medium text-gray-900">{workshop.name}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(workshop.startTime)} - Capacity: {workshop.capacity}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    workshop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    workshop.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    workshop.status === 'FULL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {workshop.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}