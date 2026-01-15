import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Network, Shield, Lock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI Generativa Enterprise
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Trasforma i dati aziendali in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                conoscenza operativa
              </span>
              , in totale sicurezza
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
              Amaltia: AI generativa Enterprise che collega documenti, database e tool aziendali
              per decisioni più rapide e affidabili.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              >
                Richiedi una demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-300 text-slate-700 px-8 py-6 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Scopri come funziona
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4 text-green-600" />
                AI Act Compliant
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Lock className="w-4 h-4 text-green-600" />
                GDPR Ready
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Network className="w-4 h-4 text-green-600" />
                On-premise disponibile
              </div>
            </div>
          </div>

          {/* Right visual - Knowledge Graph abstraction */}
          <div className="relative lg:h-[500px] hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Central node */}
              <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 w-40 h-40 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping opacity-20" />
                  <div className="absolute inset-4 rounded-full border-2 border-indigo-200 animate-ping opacity-30 animation-delay-200" />
                </div>

                {/* Main visual */}
                <div className="relative w-80 h-80 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-200 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Network className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Knowledge Graph</p>
                    <p className="text-blue-100 text-sm mt-2">Semantico & Governato</p>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-8 -left-8 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <span className="text-xs text-slate-500">Docs</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-12 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🗄️</div>
                    <span className="text-xs text-slate-500">Database</span>
                  </div>
                </div>
                <div className="absolute -bottom-8 -left-12 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔧</div>
                    <span className="text-xs text-slate-500">Tools</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-8 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">💬</div>
                    <span className="text-xs text-slate-500">Chat</span>
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
