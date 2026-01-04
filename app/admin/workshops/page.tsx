// app/admin/workshops/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Workshop {
  id: number;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  minAge: number;
  maxAge: number;
  capacity: number;
  location: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'FULL' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);

  // ✅ Fonction pour valeurs par défaut
  function getDefaultDateTimes() {
    const now = new Date();
    const startTime = new Date(now);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);

    const format = (date: Date) => date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    return {
      startTime: format(startTime),
      endTime: format(endTime),
    };
  }

  const { startTime: defaultStartTime, endTime: defaultEndTime } = getDefaultDateTimes();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    minAge: '0',
    maxAge: '',
    capacity: '10',
    location: '',
    status: 'ACTIVE' as 'ACTIVE' | 'CANCELLED' | 'FULL' | 'DISABLED',
  });

  const router = useRouter();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/admin/workshops');
      if (!response.ok) throw new Error('Failed to fetch workshops');
      const data = await response.json();
      setWorkshops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) return setError('Name is required');
    if (!formData.startTime) return setError('Start time is required');
    if (!formData.endTime) return setError('End time is required');
    if (!formData.minAge || isNaN(parseInt(formData.minAge))) return setError('Valid minimum age is required');
    if (!formData.maxAge || isNaN(parseInt(formData.maxAge))) return setError('Valid maximum age is required');
    if (!formData.capacity || isNaN(parseInt(formData.capacity))) return setError('Valid capacity is required');

    const minAge = parseInt(formData.minAge);
    const maxAge = parseInt(formData.maxAge);
    const capacity = parseInt(formData.capacity);

    if (minAge >= maxAge) return setError('Minimum age must be less than maximum age');
    if (capacity <= 0) return setError('Capacity must be greater than 0');

    try {
      const response = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          startTime: formData.startTime,
          endTime: formData.endTime,
          minAge,
          maxAge,
          capacity,
          location: formData.location.trim() || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workshop');
      }

      setShowCreateModal(false);
      resetForm();
      fetchWorkshops();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkshop) return;
    setError('');

    // Validation
    if (!formData.name.trim()) return setError('Name is required');
    if (!formData.startTime) return setError('Start time is required');
    if (!formData.endTime) return setError('End time is required');
    if (!formData.minAge || isNaN(parseInt(formData.minAge))) return setError('Valid minimum age is required');
    if (!formData.maxAge || isNaN(parseInt(formData.maxAge))) return setError('Valid maximum age is required');
    if (!formData.capacity || isNaN(parseInt(formData.capacity))) return setError('Valid capacity is required');

    const minAge = parseInt(formData.minAge);
    const maxAge = parseInt(formData.maxAge);
    const capacity = parseInt(formData.capacity);

    if (minAge >= maxAge) return setError('Minimum age must be less than maximum age');
    if (capacity <= 0) return setError('Capacity must be greater than 0');

    try {
      const response = await fetch(`/api/admin/workshops/${editingWorkshop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          startTime: formData.startTime,
          endTime: formData.endTime,
          minAge,
          maxAge,
          capacity,
          location: formData.location.trim() || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workshop');
      }

      setShowEditModal(false);
      setEditingWorkshop(null);
      resetForm();
      fetchWorkshops();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    const workshop = workshops.find(w => w.id === id);
    if (!workshop) return;

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer l'atelier "${workshop.name}" ?\n\n` +
      `Date: ${formatDateTime(workshop.startTime)}\n` +
      `Capacité: ${workshop.capacity}\n\n` +
      `Cette action est irréversible et supprimera également toutes les réservations associées.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete workshop');
      fetchWorkshops();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  function toLocalDateTimeInput(dateString: string) {
    const d = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
           'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  const openEditModal = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      name: workshop.name,
      description: workshop.description || '',
      startTime: toLocalDateTimeInput(workshop.startTime),
      endTime: toLocalDateTimeInput(workshop.endTime),
      minAge: workshop.minAge.toString(),
      maxAge: workshop.maxAge.toString(),
      capacity: workshop.capacity.toString(),
      location: workshop.location || '',
      status: workshop.status,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    const { startTime, endTime } = getDefaultDateTimes();
    setFormData({
      name: '',
      description: '',
      startTime,
      endTime,
      minAge: '0',
      maxAge: '',
      capacity: '10',
      location: '',
      status: 'ACTIVE',
    });
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('fr-FR');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Workshops Management</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Workshop
              </button>
              <Link
                href="/admin/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {workshops.map((workshop) => (
                <li key={workshop.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{workshop.name}</h3>
                      <p className="text-sm text-gray-500">{workshop.description}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>{formatDateTime(workshop.startTime)} - {formatDateTime(workshop.endTime)}</span>
                        <span className="ml-4">Age: {workshop.minAge}-{workshop.maxAge}</span>
                        <span className="ml-4">Capacity: {workshop.capacity}</span>
                        <span className="ml-4">Location: {workshop.location || 'N/A'}</span>
                        <span className={`ml-4 px-2 py-1 rounded-full text-xs ${
                          workshop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          workshop.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          workshop.status === 'FULL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {workshop.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(workshop)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(workshop.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Workshop</h3>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Age</label>
                    <input
                      type="number"
                      value={formData.minAge}
                      onChange={(e) => setFormData({...formData, minAge: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Age</label>
                    <input
                      type="number"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({...formData, maxAge: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="FULL">Full</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingWorkshop && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Workshop</h3>
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Age</label>
                    <input
                      type="number"
                      value={formData.minAge}
                      onChange={(e) => setFormData({...formData, minAge: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Age</label>
                    <input
                      type="number"
                      value={formData.maxAge}
                      onChange={(e) => setFormData({...formData, maxAge: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="FULL">Full</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingWorkshop(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}