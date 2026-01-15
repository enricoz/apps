import { useState } from 'react';
import { Briefcase, Code, Settings, Users, ChevronRight } from 'lucide-react';

export function TargetSection() {
  const [activeTab, setActiveTab] = useState(0);

  const targets = [
    {
      id: 'business',
      icon: Briefcase,
      label: 'Business',
      title: 'Business & Management',
      description: 'Decisioni più rapide e basate su dati affidabili',
      benefits: [
        'Accesso immediato a insight strategici',
        'Report automatici e sempre aggiornati',
        'Riduzione del tempo decisionale',
        'Visione completa del business',
      ],
      quote: '"Finalmente posso prendere decisioni basate su dati completi, non su intuizioni."',
      role: 'CEO, Azienda Manufacturing',
    },
    {
      id: 'it',
      icon: Code,
      label: 'IT',
      title: 'IT & Engineering',
      description: 'Requisiti chiari, meno re-work, codice e documentazione allineati',
      benefits: [
        'Documentazione tecnica sempre sincronizzata',
        'Ricerca codice e knowledge base unificata',
        'Meno context switching tra tool',
        'Onboarding sviluppatori accelerato',
      ],
      quote: '"Il tempo speso a cercare documentazione è crollato. Ora posso concentrarmi sul codice."',
      role: 'Tech Lead, Software House',
    },
    {
      id: 'ops',
      icon: Settings,
      label: 'Operations',
      title: 'Operations',
      description: 'Processi più fluidi e informazioni sempre aggiornate',
      benefits: [
        'Procedure operative centralizzate',
        'Aggiornamenti in tempo reale',
        'Meno errori di comunicazione',
        'Tracciabilità completa dei processi',
      ],
      quote: '"Le informazioni arrivano a tutti nello stesso momento. Niente più disallineamenti."',
      role: 'Operations Manager, Retail',
    },
    {
      id: 'hr',
      icon: Users,
      label: 'HR',
      title: 'HR & People',
      description: 'Onboarding veloce e conoscenza condivisa',
      benefits: [
        'Onboarding nuovi assunti dimezzato',
        'Knowledge base accessibile a tutti',
        'Riduzione del knowledge gap',
        'Cultura della documentazione',
      ],
      quote: '"I nuovi arrivati diventano produttivi in metà del tempo."',
      role: 'HR Director, Tech Company',
    },
  ];

  return (
    <section id="chi-siamo" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            A chi si rivolge
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Pensata per tutti i reparti aziendali
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Amaltia parla la lingua di ogni stakeholder, offrendo valore specifico
            per ogni ruolo nell'organizzazione.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tab buttons */}
          <div className="flex flex-wrap border-b border-slate-200">
            {targets.map((target, index) => (
              <button
                key={target.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors flex-1 justify-center min-w-[140px]
                  ${activeTab === index
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <target.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{target.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-8">
            {targets.map((target, index) => (
              <div
                key={target.id}
                className={`${activeTab === index ? 'block' : 'hidden'}`}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left - Info */}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {target.title}
                    </h3>
                    <p className="text-lg text-slate-600 mb-6">
                      {target.description}
                    </p>

                    <ul className="space-y-3">
                      {target.benefits.map((benefit, bIndex) => (
                        <li key={bIndex} className="flex items-start gap-3">
                          <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right - Quote */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 flex flex-col justify-center">
                    <blockquote className="text-lg text-slate-700 italic mb-4">
                      {target.quote}
                    </blockquote>
                    <p className="text-sm text-slate-500">
                      — {target.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
