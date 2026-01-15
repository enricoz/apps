import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">Amaltia</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#come-funziona" className="text-sm text-slate-600 hover:text-slate-900">
              Come funziona
            </a>
            <a href="#benefici" className="text-sm text-slate-600 hover:text-slate-900">
              Benefici
            </a>
            <a href="#sicurezza" className="text-sm text-slate-600 hover:text-slate-900">
              Sicurezza
            </a>
            <a href="#chi-siamo" className="text-sm text-slate-600 hover:text-slate-900">
              A chi si rivolge
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex text-slate-600">
              Accedi
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Richiedi demo
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
