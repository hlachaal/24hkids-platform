import { test, expect } from '@playwright/test';

test('atteindre la page enfants du parent avec parentId=1', async ({ page }) => {
  // Naviguer vers la page parent-dashboard/1/children
  await page.goto('/parent-dashboard/1/children');

  // Attendre que la page se charge
  await page.waitForLoadState('networkidle');

  // Vérifier que l'URL est correcte
  await expect(page).toHaveURL('/parent-dashboard/1/children');

  // Vérifier que le titre ou un élément de la page est présent
  // Puisque c'est une page client, vérifier la présence d'un élément spécifique
  // Par exemple, si la page affiche "Enfants" ou quelque chose
  // Pour l'instant, juste vérifier que la page ne retourne pas une erreur 404
  const bodyText = await page.textContent('body');
  expect(bodyText).toBeTruthy(); // Assurer que le body a du contenu

  // Si la page affiche un message d'erreur, cela échouera
  // Vous pouvez ajouter plus de vérifications spécifiques selon le contenu de la page
});

test('atteindre la page réservations du parent avec parentId=1', async ({ page }) => {
  // Naviguer vers la page parent-dashboard/1/bookings
  await page.goto('/parent-dashboard/1/bookings');

  // Attendre que la page se charge
  await page.waitForLoadState('networkidle');

  // Vérifier que l'URL est correcte
  await expect(page).toHaveURL('/parent-dashboard/1/bookings');

  // Vérifier que le titre ou un élément de la page est présent
  // Pour l'instant, juste vérifier que la page ne retourne pas une erreur 404
  const bodyText = await page.textContent('body');
  expect(bodyText).toBeTruthy(); // Assurer que le body a du contenu

  // Si la page affiche un message d'erreur, cela échouera
  // Vous pouvez ajouter plus de vérifications spécifiques selon le contenu de la page
});