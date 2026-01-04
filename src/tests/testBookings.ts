// src/tests/testBookings.ts

// 1. Utilise les accolades avec le nom exact de la classe : BookingService
// 2. Utilise l'extension .js pour la compatibilité ESM de Node.js
import { BookingService } from '../services/bookingService';

// Exemple d'utilisation dans ton test :
async function runTest() {
    try {
        console.log("Début du test des réservations...");
        const result = await BookingService.listBookings();
        console.log("Résultat :", result);
    } catch (error) {
        console.error("Le test a échoué :", error);
    }
}

runTest();