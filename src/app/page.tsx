import { CoachingConcept } from "@/components/landing/CoachingConcept";
import { CtaSection } from "@/components/landing/CtaSection";
import { Disclaimer } from "@/components/landing/Disclaimer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MobilePreview } from "@/components/landing/MobilePreview";
import { PatternExample } from "@/components/landing/PatternExample";
import { Playbook } from "@/components/landing/Playbook";
import { Problem } from "@/components/landing/Problem";

export default function Home() {
  return (
    <div id="top" className="flex w-full flex-1 flex-col">
      <Header />
      <main>
        <Hero />
        <Problem />
        <CoachingConcept />
        <HowItWorks />
        <MobilePreview />
        <PatternExample />
        <Playbook />
        <Disclaimer />
        <CtaSection />
      </main>
    </div>
  );
}
