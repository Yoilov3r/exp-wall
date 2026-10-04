import { AnimatedText } from "./AnimatedText";
import { ContactButton } from "./ContactButton";
import { FadeIn } from "./FadeIn";

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative min-h-screen bg-transparent px-5 py-24 sm:px-8 sm:py-32 md:px-12 lg:px-16"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-12 sm:gap-14 md:gap-16">
        <FadeIn duration={0.9} y={24}>
          <h2 className="hero-heading text-center text-[clamp(3.6rem,10vw,9rem)] font-black uppercase leading-none">
            About me
          </h2>
        </FadeIn>

        <AnimatedText
          className="mx-auto max-w-[560px] text-center text-[clamp(1.55rem,4vw,3.25rem)] font-medium text-mist"
          text="这里放你的自我介绍啊喂"
        />

        <FadeIn delay={0.12} duration={0.8} y={18}>
          <ContactButton href="mailto:hello@hero-program.com" />
        </FadeIn>
      </div>
    </section>
  );
}
