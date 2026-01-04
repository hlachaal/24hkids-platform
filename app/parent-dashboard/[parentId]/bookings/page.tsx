// app/parent-dashboard/[parentId]/bookings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { fetcher, sendRequest } from '@/src/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { differenceInYears } from 'date-fns';

interface Workshop {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    minAge: number;
    maxAge: number;
    capacity: number;
}

interface Child {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: string;
}

interface Booking {
    id: number;
    status: 'CONFIRMED' | 'CANCELLED' | 'WAITLIST';
    child: Child;
    workshop: Workshop;
}

interface ParentBookingsPageProps {
  params: Promise<{ parentId: string }>;
}

export default function ParentBookingsPage({ params }: ParentBookingsPageProps) {
  const { parentId } = React.use(params);
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  
  // États pour l'ajout de réservation
  const [showAddBooking, setShowAddBooking] = useState<{[childId: number]: boolean}>({});
  const [availableWorkshops, setAvailableWorkshops] = useState<{[childId: number]: any[]}>({});
  const [bookingLoading, setBookingLoading] = useState<{[childId: number]: boolean}>({});
  const [bookingError, setBookingError] = useState<{[childId: number]: string | null}>({});
  const [bookingSuccess, setBookingSuccess] = useState<{[childId: number]: string | null}>({});

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch children first
      const parentData = await fetcher<{ children: Child[] }>(`/api/parents/${parentId}`);
      setChildren(parentData.children);
      
      // Then fetch all their bookings
      const allChildrenBookings: Booking[] = [];

      for (const child of parentData.children) {
          const childDetails = await fetcher<any>(`/api/children/${child.id}`);
          allChildrenBookings.push(...childDetails.bookings.map((booking: any) => ({ ...booking, child })));
      }
      
      // Sort bookings by workshop start time
      allChildrenBookings.sort((a, b) => new Date(a.workshop.startTime).getTime() - new Date(b.workshop.startTime).getTime());
      
      setBookings(allChildrenBookings);
    } catch (e: any) {
      console.error('Failed to load bookings:', e);
      setError(e.data?.message || e.message || 'Une erreur est survenue lors du chargement des réservations.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBookingsTimeline = () => {
    if (!bookings || bookings.length === 0) {
      alert('Aucune réservation à télécharger.');
      return;
    }

    // Grouper les réservations par date/heure formatée
    const grouped = bookings.reduce((groups: Record<string, Booking[]>, booking) => {
      const key = formatDateTime(booking.workshop.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(booking);
      return groups;
    }, {} as Record<string, Booking[]>);

    const rows: string[] = [];
    rows.push('Date/Heure;Enfant;Atelier;Statut');

    Object.entries(grouped).forEach(([dateTime, group]) => {
      group.forEach((b) => {
        const childName = `${b.child.firstName} ${b.child.lastName}`;
        const line = `${dateTime};${childName};${b.workshop.name};${b.status}`;
        rows.push(line);
      });
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_parent_${parentId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadBookingsPDF = () => {
    if (!bookings || bookings.length === 0) {
      alert('Aucune réservation à télécharger.');
      return;
    }

    const grouped = bookings.reduce((groups: Record<string, Booking[]>, booking) => {
      const key = formatDateTime(booking.workshop.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(booking);
      return groups;
    }, {} as Record<string, Booking[]>);

    // Build printable HTML
    const rows: string[] = [];
    Object.entries(grouped).forEach(([dateTime, group]) => {
      group.forEach((b) => {
        const childName = `${b.child.firstName} ${b.child.lastName}`;
        rows.push(`<tr><td>${dateTime}</td><td>${childName}</td><td>${b.workshop.name}</td><td>${b.status}</td></tr>`);
      });
    });

    const html = `
      <html>
        <head>
          <title>Réservations</title>
          <style>
            body{font-family: Arial, Helvetica, sans-serif; padding:20px}
            h1{font-size:20px}
            table{width:100%; border-collapse:collapse; margin-top:10px}
            th,td{border:1px solid #ddd; padding:8px; text-align:left}
            th{background:#f6f6f6}
          </style>
        </head>
        <body>
          <h1>Mes réservations</h1>
          <table>
            <thead><tr><th>Date/Heure</th><th>Enfant</th><th>Atelier</th><th>Statut</th></tr></thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Impossible d' + "'" + 'ouvrir une nouvelle fenêtre pour l\'impression. Autorisez les pop-ups et réessayez.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give the window a moment to render before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  useEffect(() => {
    loadBookings();
  }, [parentId]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    setCancelSuccess(null);
    setCancelError(null);
    
    // Trouver la réservation à annuler pour récupérer les détails
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    
    try {
      // DELETE request to /api/reservations/[id] to remove the booking
      await sendRequest(`/api/reservations/${bookingId}`, 'DELETE');
      setCancelSuccess('Réservation annulée avec succès.');
      
      // Recharger les réservations après annulation
      await loadBookings();
      
      // Ajouter l'atelier annulé à la liste des ateliers disponibles pour cet enfant
      if (bookingToCancel) {
        const childId = bookingToCancel.child.id;
        const workshopId = bookingToCancel.workshop.id;
        
        // Vérifier si l'atelier n'est pas déjà dans la liste (au cas où il serait rechargé)
        setAvailableWorkshops(prev => {
          const currentWorkshops = prev[childId] || [];
          const workshopExists = currentWorkshops.some(w => w.id === workshopId);
          
          if (!workshopExists) {
            // Récupérer les détails de l'atelier depuis les réservations existantes
            return {
              ...prev,
              [childId]: [...currentWorkshops, bookingToCancel.workshop]
            };
          }
          return prev;
        });
      }
    } catch (e: any) {
      console.error('Failed to cancel booking:', e);
      setCancelError(e.data?.message || e.message || "Une erreur est survenue lors de l'annulation de la réservation.");
    }
  };

  const toggleAddBooking = async (childId: number) => {
    const newShowState = { ...showAddBooking, [childId]: !showAddBooking[childId] };
    setShowAddBooking(newShowState);
    
    // Si on ouvre la section, charger les ateliers disponibles
    if (newShowState[childId] && !availableWorkshops[childId]) {
      try {
        const allWorkshops = await fetcher<any[]>('/api/workshops');
        // Trouver l'enfant
        const child = children.find(c => c.id === childId);
        // Filtrer les ateliers déjà réservés par cet enfant et ceux incompatibles avec son âge
        const bookedWorkshopIds = bookings
          .filter(b => b.child.id === childId)
          .map(b => b.workshop.id);
        const available = allWorkshops.filter(w => {
          if (bookedWorkshopIds.includes(w.id)) return false;
          if (!child) return false;
          const ageAtWorkshop = differenceInYears(new Date(w.startTime), new Date(child.birthDate));

          // Debug: log age calculation to diagnose boundary issues
          try {
            // eslint-disable-next-line no-console
            console.debug(`[age-check] childId=${childId} childBirth=${child.birthDate} workshopId=${w.id} start=${w.startTime} ageAtWorkshop=${ageAtWorkshop} min=${w.minAge} max=${w.maxAge}`);
          } catch (e) {}

          console.log(`Child ID ${childId} age at workshop ID ${w.id}: ${ageAtWorkshop} (min: ${w.minAge}, max: ${w.maxAge})`);

          return ageAtWorkshop >= w.minAge && ageAtWorkshop <= w.maxAge;
        });
        setAvailableWorkshops(prev => ({ ...prev, [childId]: available }));
      } catch (e: any) {
        console.error('Failed to load workshops:', e);
        setBookingError(prev => ({ ...prev, [childId]: 'Erreur lors du chargement des ateliers.' }));
      }
    }
  };

  const handleAddBooking = async (childId: number, workshopId: number) => {
    setBookingLoading(prev => ({ ...prev, [childId]: true }));
    setBookingError(prev => ({ ...prev, [childId]: null }));
    setBookingSuccess(prev => ({ ...prev, [childId]: null }));

    try {
      const newBooking = await sendRequest(`/api/reservations`, 'POST', {
        childId,
        workshopId,
      });
      
      const successMessage = `Réservation ${newBooking.status === 'WAITLIST' ? "en liste d'attente" : "confirmée"} pour l'atelier.`;
      setBookingSuccess(prev => ({ ...prev, [childId]: successMessage }));
      
      // Recharger les réservations
      await loadBookings();
      
      // Retirer l'atelier réservé de la liste des ateliers disponibles
      setAvailableWorkshops(prev => ({
        ...prev,
        [childId]: prev[childId]?.filter(w => w.id !== workshopId) || []
      }));
      
    } catch (e: any) {
      console.error('Failed to create booking:', e);
      const errorMessage = e.message || 'Une erreur est survenue lors de la réservation.';
      setBookingError(prev => ({ ...prev, [childId]: errorMessage }));
    } finally {
      setBookingLoading(prev => ({ ...prev, [childId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-center text-primary text-lg">Chargement de vos réservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-lg text-center" role="alert">
            <strong className="font-bold">Erreur : </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="py-12 px-4 text-center bg-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6 font-serif">
            Mes Réservations
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4">
          <p className="text-xl text-muted mb-4 max-w-2xl mx-auto">
            Consultez et gérez toutes les réservations d'ateliers pour vos enfants
          </p>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => downloadBookingsTimeline()}
            className="bg-primary text-foreground px-4 py-2 rounded-full font-semibold hover:bg-primary-hover transition-colors"
          >
            Télécharger (CSV)
          </button>
          <button
            onClick={() => downloadBookingsPDF()}
            className="bg-foreground text-background px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-colors border"
          >
            Télécharger (PDF)
          </button>
        </div>
      </section>

      {/* Alerts Section */}
      {(cancelError || cancelSuccess) && (
        <section className="py-4 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            {cancelError && (
              <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-lg mb-4 text-center" role="alert">
                <strong className="font-bold">Erreur d'annulation : </strong>
                <span className="block sm:inline">{cancelError}</span>
              </div>
            )}
            {cancelSuccess && (
              <div className="bg-success/10 border-2 border-success text-success px-4 py-3 rounded-lg mb-4 text-center" role="alert">
                <strong className="font-bold">Succès : </strong>
                <span className="block sm:inline">{cancelSuccess}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add Booking Section */}
      <section className="py-8 px-4 bg-accent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-foreground font-serif">Ajouter une réservation</h2>
          <p className="text-sm text-muted mb-4">Remarque : Quand vous cliquez sur "Ajouter Réservation", les ateliers affichés pour chaque enfant s'adaptent avec son âge par rapport à leur date de début.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="bg-background border-2 border-foreground rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-foreground">{child.firstName} {child.lastName} ({differenceInYears(new Date(), new Date(child.birthDate))} ans)</h3>
                
                <button
                  onClick={() => toggleAddBooking(child.id)}
                  className="w-full bg-primary text-foreground px-4 py-2 rounded-full font-semibold hover:bg-primary-hover transition-colors mb-4"
                >
                  {showAddBooking[child.id] ? 'Annuler' : 'Ajouter Réservation'}
                </button>

                {bookingError[child.id] && (
                  <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-lg mb-4 text-sm">
                    {bookingError[child.id]}
                  </div>
                )}
                
                {bookingSuccess[child.id] && (
                  <div className="bg-success/10 border border-success text-success px-3 py-2 rounded-lg mb-4 text-sm">
                    {bookingSuccess[child.id]}
                  </div>
                )}

                {showAddBooking[child.id] && (
                  <div className="space-y-3">
                    {availableWorkshops[child.id] ? (
                      availableWorkshops[child.id].length > 0 ? (
                        availableWorkshops[child.id].map((workshop) => (
                          <div key={workshop.id} className="border-2 border-foreground rounded-lg p-3 bg-accent">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-foreground">{workshop.name}</h4>
                                <p className="text-xs text-muted mt-1">
                                  {formatDateTime(workshop.startTime)}
                                </p>
                                <p className="text-xs text-muted">
                                  Âge: {workshop.minAge}-{workshop.maxAge} ans • Places: {workshop.capacity}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddBooking(child.id, workshop.id)}
                                disabled={bookingLoading[child.id]}
                                className="bg-primary text-foreground text-xs font-bold py-1 px-3 rounded-full hover:bg-primary-hover transition-colors ml-2 disabled:opacity-50"
                              >
                                {bookingLoading[child.id] ? '...' : 'Réserver'}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted text-center py-4">Aucun atelier disponible.</p>
                      )
                    ) : (
                      <p className="text-sm text-muted text-center py-4">Chargement des ateliers...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Existing Bookings Section */}
      <section className="py-8 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {bookings.length === 0 ? (
            <div className="bg-accent border-2 border-foreground rounded-lg p-8 text-center">
              <p className="text-muted">Vous n'avez pas de réservations en cours.</p>
            </div>
          ) : (
            <div className="bg-accent rounded-lg border-2 border-foreground overflow-hidden">
              <h2 className="text-xl font-semibold p-6 bg-background border-b-2 border-foreground text-foreground font-serif">Réservations existantes</h2>
              <table className="min-w-full divide-y divide-foreground/20">
                <thead className="bg-background">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Date & Heure</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Enfant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Atelier</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Statut</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-accent divide-y divide-foreground/20">
                  {(() => {
                    // Grouper les réservations par date/heure
                    const groupedBookings = bookings.reduce((groups, booking) => {
                      const dateTimeKey = new Date(booking.workshop.startTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
                      const formattedDateTime = formatDateTime(booking.workshop.startTime);
                      if (!groups[formattedDateTime]) {
                        groups[formattedDateTime] = [];
                      }
                      groups[formattedDateTime].push(booking);
                      return groups;
                    }, {} as Record<string, Booking[]>);

                    // Rendre les lignes avec fusion des cellules date/heure
                    const rows: React.ReactElement[] = [];
                    Object.entries(groupedBookings).forEach(([dateTime, groupBookings]) => {
                      const rowspan = groupBookings.length;
                      
                      groupBookings.forEach((booking, index) => {
                        if (index === 0) {
                          // Première ligne du groupe : cellule fusionnée pour la date/heure
                          rows.push(
                            <tr key={booking.id}>
                              <td rowSpan={rowspan} className="px-6 py-4 whitespace-nowrap text-sm text-muted font-medium bg-background/50">
                                {dateTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.child.firstName} {booking.child.lastName} ({differenceInYears(new Date(), new Date(booking.child.birthDate))} ans)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.workshop.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.status === 'CONFIRMED' ? 'bg-success/20 text-success border border-success' :
                                  booking.status === 'CANCELLED' ? 'bg-destructive/20 text-destructive border border-destructive' :
                                  'bg-primary/20 text-primary border border-primary'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {booking.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                  >
                                    Annuler
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        } else {
                          // Lignes suivantes du groupe : sans la cellule date/heure
                          rows.push(
                            <tr key={booking.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.child.firstName} {booking.child.lastName} ({differenceInYears(new Date(), new Date(booking.child.birthDate))} ans)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{booking.workshop.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.status === 'CONFIRMED' ? 'bg-success/20 text-success border border-success' :
                                  booking.status === 'CANCELLED' ? 'bg-destructive/20 text-destructive border border-destructive' :
                                  'bg-primary/20 text-primary border border-primary'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {booking.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                  >
                                    Annuler
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      });
                    });
                    
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Fonction utilitaire pour formater la date et l'heure
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  const month = monthNames[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} - ${hours}:${minutes}`;
}
