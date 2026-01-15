import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          Inizia oggi
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Porta ordine, sicurezza e intelligenza nei tuoi dati aziendali
        </h2>

        {/* Subheadline */}
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Scopri come Amaltia può trasformare il modo in cui la tua organizzazione
          gestisce e utilizza la conoscenza.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-lg"
          >
            Richiedi una demo personalizzata
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm"
          >
            <MessageSquare className="mr-2 w-5 h-5" />
            Parla con un esperto
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-blue-100 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Setup in pochi minuti
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Nessuna carta di credito
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Supporto dedicato
          </div>
        </div>
      </div>
    </section>
  );
}
