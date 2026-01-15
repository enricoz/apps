import { Brain, Network, ShieldCheck, Lock } from 'lucide-react';

export function SoluzioneSection() {
  const pillars = [
    {
      icon: Brain,
      title: 'AI generativa contestuale',
      description: 'Risposte accurate basate sul contesto specifico della tua azienda',
      color: 'blue',
    },
    {
      icon: Network,
      title: 'Knowledge graph proprietario',
      description: 'Mappa semantica che collega tutte le informazioni aziendali',
      color: 'indigo',
    },
    {
      icon: ShieldCheck,
      title: 'Governance e privacy native',
      description: 'Controllo granulare su chi accede a cosa, sempre',
      color: 'green',
    },
    {
      icon: Lock,
      title: 'AI Act compliance',
      description: 'Progettato per rispettare le normative europee sull\'AI',
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            La soluzione
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Un'unica piattaforma AI per tutto il sapere aziendale
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Amaltia collega in pochi minuti documenti, database e tool di progetto
            creando una base di conoscenza interrogabile e governata.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => {
            const colors = colorClasses[pillar.color];
            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm`}>
                  <pillar.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-600">{pillar.description}</p>
              </div>
            );
          })}
        </div>

        {/* Visual representation */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full">
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Dall'informazione frammentata alla conoscenza unificata
                </h3>
                <p className="text-blue-100 mb-6">
                  Amaltia non è solo un chatbot. È un sistema intelligente che comprende
                  il contesto della tua organizzazione e fornisce risposte accurate,
                  tracciabili e sempre aggiornate.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Integrazione in pochi minuti</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Nessuna modifica ai tuoi sistemi</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Dati sempre sotto il tuo controllo</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  {/* Central hub */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                      <Network className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>
                  {/* Orbiting elements */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-lg">📁</span>
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-lg">🔗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
