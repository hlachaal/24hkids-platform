// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Optionnel: ajouter des options spécifiques pour notre API
  // Par exemple, pour forcer un re-validation ou gérer des tokens d'auth
}

// Fonction utilitaire pour fetcher des données de l'API
export async function fetcher<T = any>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = response.statusText || 'An unexpected error occurred';
    
    try {
      const errorData = await response.text();
      if (errorData) {
        // Essayer de parser comme JSON
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || parsed.error || errorData;
        } catch {
          // Si ce n'est pas du JSON, utiliser le texte brut
          errorMessage = errorData;
        }
      }
    } catch {
      // En cas d'erreur lors de la lecture du corps, garder le statusText
    }
    
    const error: any = new Error(errorMessage);
    error.response = response;
    error.data = errorMessage;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Fonction utilitaire pour envoyer des données (POST, PUT, DELETE)
export async function sendRequest<T = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  data?: any,
  options?: FetchOptions
): Promise<T> {
  return fetcher<T>(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}
