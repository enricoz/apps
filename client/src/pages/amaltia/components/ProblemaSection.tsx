import { AlertTriangle, Clock, XCircle, Unplug } from 'lucide-react';

export function ProblemaSection() {
  const problems = [
    {
      icon: Unplug,
      title: 'Tool scollegati',
      description: 'Informazioni sparse tra Confluence, Jira, Git, PowerBI, Office, GSuite e decine di altri strumenti',
    },
    {
      icon: Clock,
      title: 'Tempo perso nella ricerca',
      description: 'Ore spese a cercare documenti, email e conversazioni invece di lavorare',
    },
    {
      icon: XCircle,
      title: 'Errori di requisito',
      description: 'Decisioni basate su dati incompleti o obsoleti che causano rework costosi',
    },
  ];

  const tools = [
    { name: 'Confluence', color: 'bg-blue-500' },
    { name: 'Jira', color: 'bg-blue-600' },
    { name: 'Git', color: 'bg-orange-500' },
    { name: 'PowerBI', color: 'bg-yellow-500' },
    { name: 'Office', color: 'bg-red-500' },
    { name: 'GSuite', color: 'bg-green-500' },
    { name: 'Magento', color: 'bg-orange-600' },
    { name: 'Shopify', color: 'bg-green-600' },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
            <AlertTriangle className="w-4 h-4" />
            Il problema
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            La conoscenza aziendale è frammentata
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Ogni giorno, i tuoi team perdono tempo prezioso cercando informazioni
            disperse tra decine di strumenti non connessi.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <problem.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {problem.title}
              </h3>
              <p className="text-slate-600">{problem.description}</p>
            </div>
          ))}
        </div>

        {/* Disconnected tools visual */}
        <div className="relative bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <p className="text-center text-slate-500 mb-6">
            I tuoi dati sono sparsi ovunque:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200"
              >
                <div className={`w-3 h-3 ${tool.color} rounded-full`} />
                <span className="text-sm text-slate-700">{tool.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
              <span className="text-sm text-slate-500">+ altri 20</span>
            </div>
          </div>

          {/* Disconnected lines visual */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <line x1="10%" y1="30%" x2="30%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="70%" y1="20%" x2="50%" y2="60%" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="90%" y1="40%" x2="60%" y2="70%" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
