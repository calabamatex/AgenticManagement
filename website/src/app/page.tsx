import Hero from '@/components/landing/Hero';
import ValueProps from '@/components/landing/ValueProps';
import TerminalAnimation from '@/components/landing/TerminalAnimation';
import SocialProof from '@/components/landing/SocialProof';

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Hero />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SocialProof />
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <TerminalAnimation />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <ValueProps />
      </section>
    </>
  );
}
