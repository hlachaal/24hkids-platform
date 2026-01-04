// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/background.jpg"
          alt="Ateliers enfants 24hKids"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay pour lisibilité */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 font-serif">
            24h Kids & Co
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Plateforme de gestion des ateliers numériques pour enfants, familles et adultes
            dans le cadre de l'événement <strong>24hKids</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/workshops"
              className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors border-2 border-primary"
            >
              Découvrir les ateliers
            </Link>
            <Link
              href="/parent-dashboard"
              className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-accent transition-colors border-2 border-white"
            >
              Espace Parent
            </Link>
          </div>
        </div>
      </section>

      {/* Event Information */}
      <section className="py-16 px-4 bg-accent text-foreground">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-serif">
            L'événement 24hKids
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📅', title: 'Une journée unique', text: 'Ateliers gratuits répartis sur une journée complète' },
              { icon: '⏰', title: 'Horaires', text: 'Matin: 10h00 – 12h00\nAprès-midi: 13h30 – 17h30' },
              { icon: '👨‍👩‍👧‍👦', title: 'Pour tous', text: 'Enfants, familles et adultes' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-foreground">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted whitespace-pre-line">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="py-16 px-4 bg-background text-foreground">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-serif">
            Nos ateliers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: '👶 Enfants (5–13 ans)',
                items: ['Programmation (Scratch, Ozobot, Lego WeDo)', 'Robotique pédagogique', 'Activités débranchées', 'Sensibilisation au numérique'],
              },
              {
                title: '👨‍👩‍👧 Familles (à partir de 7 ans)',
                items: ['Parentalité numérique', 'Usages des écrans', "Impact environnemental du numérique", 'Quiz et ateliers intergénérationnels'],
              },
              {
                title: '👨‍💻 Ados & adultes',
                items: ['Programmation avancée (IA, Machine Learning)', 'Arduino, drones', 'Conférences et sensibilisation', 'Découverte des métiers du numérique'],
              },
            ].map((workshop, idx) => (
              <div key={idx} className="bg-accent p-6 rounded-lg border-2 border-foreground">
                <h3 className="text-xl font-semibold mb-4">{workshop.title}</h3>
                <ul className="text-muted space-y-2">
                  {workshop.items.map((item, idy) => <li key={idy}>• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Durations */}
      <section className="py-16 px-4 bg-accent text-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 font-serif">
            Durée des ateliers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Ateliers courts', duration: '~30 min' },
              { title: 'Ateliers moyens', duration: '35–40 min' },
              { title: 'Ateliers longs', duration: '45–50 min' },
            ].map((d, idx) => (
              <div key={idx} className="bg-background p-6 rounded-lg border-2 border-foreground">
                <h3 className="text-lg font-semibold mb-2">{d.title}</h3>
                <p className="text-2xl font-bold">{d.duration}</p>
              </div>
            ))}
          </div>
          <p className="text-muted mt-6">
            Chaque atelier correspond à une session unique, réservable indépendamment.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 font-serif">
            Prêt à réserver ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Créez votre compte parent et réservez les ateliers pour vos enfants.
            Réservation enfant par enfant, expérience fluide garantie !
          </p>
          <Link
            href="/parent-dashboard"
            className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-accent transition-colors inline-block border-2 border-white"
          >
            Commencer maintenant
          </Link>
        </div>
      </section>
    </div>
  );
}
