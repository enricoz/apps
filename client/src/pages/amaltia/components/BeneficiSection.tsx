import { Layers, Eye, Zap, Clock, Search, FileText } from 'lucide-react';

export function BeneficiSection() {
  const benefits = [
    {
      icon: Layers,
      title: 'Stop alla frammentazione',
      subtitle: 'Tutto il sapere in un\'unica soluzione',
      color: 'blue',
      metrics: [
        { icon: Search, label: 'Risposte in pochi secondi' },
        { icon: Clock, label: 'Tempi di ricerca dimezzati' },
      ],
      highlights: [
        'Tutto il sapere in un\'unica soluzione',
        'Risposte in pochi secondi',
        'Tempi di ricerca dimezzati',
      ],
    },
    {
      icon: Eye,
      title: 'Governance continua',
      subtitle: 'Tracciabilità e controllo totale',
      color: 'indigo',
      metrics: [
        { icon: FileText, label: 'Tracciabilità e versioning' },
        { icon: Eye, label: 'Policy di accesso granulari' },
      ],
      highlights: [
        'Tracciabilità e versioning',
        'Policy di accesso granulari',
        'Errori di requisito ridotti (16% → 9%)',
      ],
    },
    {
      icon: Zap,
      title: 'Efficienza operativa',
      subtitle: 'Più valore, meno lavoro ripetitivo',
      color: 'green',
      metrics: [
        { icon: Clock, label: 'Onboarding quasi dimezzato' },
        { icon: FileText, label: 'Documentazione automatica' },
      ],
      highlights: [
        'Onboarding quasi dimezzato',
        'Documentazione generata automaticamente',
        'Meno lavoro ripetitivo, più valore',
      ],
    },
  ];

  const colorClasses: Record<string, { bg: string; light: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    green: { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };

  return (
    <section id="benefici" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
            Benefici
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Impatto concreto e misurabile
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Non solo promesse: risultati tangibili che trasformano il modo di lavorare
            della tua organizzazione.
          </p>
        </div>

        {/* Benefits cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const colors = colorClasses[benefit.color];
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Header */}
                <div className={`${colors.bg} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{benefit.title}</h3>
                      <p className="text-white/80 text-sm">{benefit.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <ul className="space-y-4">
                    {benefit.highlights.map((highlight, hIndex) => (
                      <li key={hIndex} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full ${colors.light} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <svg className={`w-3 h-3 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key metrics banner */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              I numeri parlano chiaro
            </h3>
            <p className="text-slate-400">
              Metriche misurate presso i nostri clienti enterprise
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
                -50%
              </div>
              <p className="text-slate-300">Tempo di ricerca</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-indigo-400 mb-2">
                -40%
              </div>
              <p className="text-slate-300">Tempo onboarding</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">
                -7%
              </div>
              <p className="text-slate-300">Errori critici di requisito</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
