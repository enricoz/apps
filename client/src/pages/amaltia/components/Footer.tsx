import { Shield, Lock, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    prodotto: [
      { label: 'Come funziona', href: '#come-funziona' },
      { label: 'Benefici', href: '#benefici' },
      { label: 'Sicurezza', href: '#sicurezza' },
      { label: 'Pricing', href: '#' },
    ],
    risorse: [
      { label: 'Documentazione', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Case Studies', href: '#' },
    ],
    azienda: [
      { label: 'Chi siamo', href: '#' },
      { label: 'Carriere', href: '#' },
      { label: 'Partner', href: '#' },
      { label: 'Contatti', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Termini di Servizio', href: '#' },
      { label: 'Security', href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-400">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-semibold text-white">Amaltia</span>
            </div>

            {/* Claim */}
            <p className="text-slate-400 mb-6 max-w-xs">
              Trasforma i dati aziendali in conoscenza operativa.
            </p>

            {/* Trust badges */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-4 h-4" />
                GDPR
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="w-4 h-4" />
                ISO 27001
              </div>
            </div>

            {/* Part of Impresoft */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Parte di{' '}
                <span className="text-slate-400 font-medium">Impresoft Group</span>
              </p>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h3 className="text-white font-semibold mb-4">Prodotto</h3>
            <ul className="space-y-3">
              {links.prodotto.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Risorse</h3>
            <ul className="space-y-3">
              {links.risorse.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Azienda</h3>
            <ul className="space-y-3">
              {links.azienda.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-6 justify-center md:justify-start text-sm">
            <a href="mailto:info@amaltia.ai" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              info@amaltia.ai
            </a>
            <a href="tel:+390123456789" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-4 h-4" />
              +39 012 345 6789
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Milano, Italia
            </span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>
              © {currentYear} Amaltia. Tutti i diritti riservati.
            </p>
            <p>
              Un prodotto{' '}
              <a href="https://www.impresoft.it" className="text-slate-400 hover:text-white transition-colors">
                Impresoft
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
