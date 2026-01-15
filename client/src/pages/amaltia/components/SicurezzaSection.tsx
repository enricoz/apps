import { Shield, Cloud, Lock, Eye, Server, CheckCircle } from 'lucide-react';

export function SicurezzaSection() {
  const features = [
    {
      icon: Cloud,
      title: 'Cloud privato dedicato',
      description: 'Infrastruttura isolata e dedicata alla tua organizzazione. Nessuna condivisione di risorse con altri clienti.',
    },
    {
      icon: Lock,
      title: 'Crittografia end-to-end',
      description: 'Tutti i dati sono crittografati in transito e a riposo con algoritmi di grado militare (AES-256).',
    },
    {
      icon: Eye,
      title: 'Dati sempre sotto controllo',
      description: 'Tu decidi dove risiedono i dati, chi può accedervi e per quanto tempo vengono conservati.',
    },
  ];

  const certifications = [
    'SOC 2 Type II',
    'ISO 27001',
    'GDPR Compliant',
    'AI Act Ready',
  ];

  return (
    <section id="sicurezza" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Section header */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Sicurezza
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Sicurezza a prova di audit
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Progettata per soddisfare i requisiti di sicurezza più stringenti.
              La tua AI enterprise con la tranquillità che meriti.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="mt-10 pt-8 border-t border-slate-700">
              <p className="text-sm text-slate-500 mb-4">Certificazioni e compliance</p>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full">
                  <pattern id="security-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="white" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#security-grid)" />
                </svg>
              </div>

              <div className="relative space-y-6">
                {/* Shield visual */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <Shield className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Infrastructure diagram */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Server className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Infrastruttura privata</p>
                      <p className="text-slate-500 text-sm">EU Region - GDPR Compliant</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Lock className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Crittografia AES-256</p>
                      <p className="text-slate-500 text-sm">In transito e a riposo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Eye className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Audit trail completo</p>
                      <p className="text-slate-500 text-sm">Ogni accesso tracciato</p>
                    </div>
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
