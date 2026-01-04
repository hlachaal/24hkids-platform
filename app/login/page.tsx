// app/login/page.tsx
// This file defines the login page for parents.
// It uses React client‑side rendering ("use client") and Next.js navigation utilities.

'use client';

// React hook for managing component state and Next.js router for navigation.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * LoginPage – functional React component.
 * Renders a login form, handles submission, and redirects on success.
 */
export default function LoginPage() {
  // Form fields state
  const [email, setEmail] = useState(''); // user email input
  const [password, setPassword] = useState(''); // user password input
  const [error, setError] = useState(''); // error message to display
  const [loading, setLoading] = useState(false); // loading indicator for submit button

  // Next.js router – could be used for client‑side navigation (currently unused).
  const router = useRouter();

  /**
   * Handles form submission.
   * Sends credentials to the backend, processes the response, and redirects.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default form POST
    setLoading(true); // show loading state
    setError(''); // clear previous errors

    try {
      // Call the login API endpoint with JSON payload
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Successful login – redirect to the parent dashboard.
        // Using window.location.href forces a full page reload.
        // Alternative: router.push('/parent-dashboard') for client‑side navigation.
        //router.push('/parent-dashboard');
        window.location.href = '/parent-dashboard';
      } else {
        // Login failed – extract error message from response body.
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      // Network or unexpected error.
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false); // stop loading indicator
    }
  };

  // Render the login form UI.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion Parent
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre tableau de bord
          </p>
        </div>
        {/* Login form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email input */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Password input */}
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Display error message if any */}
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}