import { Link2, Brain, MessageSquare, Shield, ArrowRight } from 'lucide-react';

export function ComeFunzionaSection() {
  const steps = [
    {
      number: '01',
      icon: Link2,
      title: 'Connetti',
      description: 'Integrazione con tool e repository esistenti. Confluence, Jira, Git, SharePoint, database e API aziendali.',
      color: 'blue',
    },
    {
      number: '02',
      icon: Brain,
      title: 'Comprendi',
      description: 'Creazione del knowledge graph semantico. Amaltia analizza, indicizza e mappa le relazioni tra i dati.',
      color: 'indigo',
    },
    {
      number: '03',
      icon: MessageSquare,
      title: 'Interroga & Automatizza',
      description: 'Insight, risposte e contenuti generati. Fai domande in linguaggio naturale, ottieni risposte contestuali.',
      color: 'purple',
    },
    {
      number: '04',
      icon: Shield,
      title: 'Governa',
      description: 'Accessi, versioning, audit trail. Controllo completo su chi vede cosa, con tracciabilità totale.',
      color: 'green',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200' },
    green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200' },
  };

  return (
    <section id="come-funziona" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
            Come funziona
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Da dati sparsi a conoscenza operativa in 4 step
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Un processo semplice e trasparente per trasformare il caos informativo
            in un asset aziendale governato.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-blue-200 via-indigo-200 via-purple-200 to-green-200 rounded-full" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const colors = colorClasses[step.color];
              return (
                <div key={index} className="relative">
                  {/* Step card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all h-full">
                    {/* Step number */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center text-white relative z-10`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-bold ${colors.text}`}>
                        STEP {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow - mobile/tablet */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center my-4">
                      <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 sm:rotate-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual diagram */}
        <div className="mt-16 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-blue-700">Tool</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-200">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              <span className="text-indigo-700">Graph</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-purple-700">Insight</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-700">Policy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
