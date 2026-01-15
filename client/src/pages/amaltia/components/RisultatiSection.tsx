import { TrendingDown, Award, Quote } from 'lucide-react';

export function RisultatiSection() {
  const kpis = [
    {
      value: '-50%',
      label: 'Tempo di ricerca',
      description: 'Informazioni trovate in secondi invece che ore',
      color: 'blue',
    },
    {
      value: '-40%',
      label: 'Tempo onboarding',
      description: 'Nuovi dipendenti operativi in metà tempo',
      color: 'indigo',
    },
    {
      value: '-7%',
      label: 'Errori critici di requisito',
      description: 'Decisioni basate su dati completi e aggiornati',
      color: 'green',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Risultati
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Risultati misurabili, non promesse
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            KPI reali misurati presso organizzazioni enterprise che hanno adottato Amaltia.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {kpis.map((kpi, index) => {
            const colors = colorClasses[kpi.color];
            return (
              <div
                key={index}
                className={`relative p-8 rounded-3xl ${colors.bg} border ${colors.border} overflow-hidden group hover:shadow-lg transition-all`}
              >
                {/* Background icon */}
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <TrendingDown className="w-32 h-32" />
                </div>

                <div className="relative">
                  <div className={`text-5xl md:text-6xl font-bold ${colors.text} mb-3`}>
                    {kpi.value}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {kpi.label}
                  </h3>
                  <p className="text-slate-600">
                    {kpi.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Case study teaser */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-slate-600 text-sm font-medium mb-4 shadow-sm">
                <Quote className="w-4 h-4" />
                Case Study
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Spazio per i tuoi case study
              </h3>
              <p className="text-slate-600 mb-6">
                Questa sezione è pronta per ospitare testimonianze e case study dettagliati
                dei tuoi clienti enterprise. Mostra risultati concreti e storie di successo.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-500 border border-slate-200">
                  Manufacturing
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-500 border border-slate-200">
                  Financial Services
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-slate-500 border border-slate-200">
                  Technology
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <blockquote className="text-slate-700 italic mb-3">
                    "Le quote e i case study dei tuoi clienti appariranno qui, mostrando
                    risultati concreti e testimonianze autentiche."
                  </blockquote>
                  <p className="text-sm text-slate-500">
                    — Nome Cliente, Ruolo @ Azienda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
