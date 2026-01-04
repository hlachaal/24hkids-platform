'use client';

import React, { useState, useEffect } from 'react';
import { fetcher, sendRequest } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ChildFormData {
  firstName: string;
  lastName: string;
  birthDate: string; // Format YYYY-MM-DD
  allergies: string;
  medicalNote: string;
}

interface EditChildPageProps {
  params: Promise<{ parentId: string; childId: string }>;
}

export default function EditChildPage({ params }: EditChildPageProps) {
  const { parentId, childId } = React.use(params);
  const router = useRouter();

  const [formData, setFormData] = useState<ChildFormData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    allergies: '',
    medicalNote: '',
  });
  const [loading, setLoading] = useState<boolean>(true); // Initial loading for fetching child data
  const [submitting, setSubmitting] = useState<boolean>(false); // Loading for form submission
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchChild = async () => {
      setLoading(true);
      setError(null);
      try {
        const child = await fetcher<ChildFormData>(`/api/children/${childId}`);
        setFormData({
          firstName: child.firstName,
          lastName: child.lastName,
          birthDate: new Date(child.birthDate).toISOString().split('T')[0], // Formater la date pour l\'input type="date"
          allergies: child.allergies || '',
          medicalNote: child.medicalNote || '',
        });
      } catch (e: any) {
        console.error('Failed to fetch child:', e);
        setError(e.data?.message || e.message || 'Une erreur est survenue lors du chargement des informations de l\'enfant.');
      } finally {
        setLoading(false);
      }
    };
    fetchChild();
  }, [childId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await sendRequest(`/api/children/${childId}`, 'PUT', formData);
      setSuccess('Informations de l\'enfant mises à jour avec succès !');
      router.push(`/parent-dashboard/${parentId}/children`);
    } catch (e: any) {
      console.error('Failed to update child:', e);
      setError(e.data?.message || e.message || 'Une erreur est survenue lors de la mise à jour de l\'enfant.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center text-blue-600 text-lg">Chargement des informations de l\'enfant...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Erreur : </strong>
        <span className="block sm:inline">{error}</span>
        <Link href={`/parent-dashboard/${parentId}/children`} className="text-blue-600 hover:underline mt-4 block">
          Retour à la liste des enfants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold text-center mb-10">Modifier l\'Enfant</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Succès : </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Date de naissance</label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">Allergies (facultatif)</label>
          <textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          ></textarea>
        </div>
        <div>
          <label htmlFor="medicalNote" className="block text-sm font-medium text-gray-700">Notes médicales (facultatif)</label>
          <textarea
            id="medicalNote"
            name="medicalNote"
            value={formData.medicalNote}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Link href={`/parent-dashboard/${parentId}/children`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-200">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Mise à jour en cours...' : 'Mettre à jour l\'enfant'}
          </button>
        </div>
      </form>
    </div>
  );
}
