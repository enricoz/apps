import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProblemaSection } from './components/ProblemaSection';
import { SoluzioneSection } from './components/SoluzioneSection';
import { ComeFunzionaSection } from './components/ComeFunzionaSection';
import { BeneficiSection } from './components/BeneficiSection';
import { SicurezzaSection } from './components/SicurezzaSection';
import { TargetSection } from './components/TargetSection';
import { RisultatiSection } from './components/RisultatiSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';

export function AmaltiaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <ProblemaSection />
        <SoluzioneSection />
        <ComeFunzionaSection />
        <BeneficiSection />
        <SicurezzaSection />
        <TargetSection />
        <RisultatiSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
