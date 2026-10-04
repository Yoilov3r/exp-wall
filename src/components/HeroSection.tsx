import { motion } from "framer-motion";
import { ContactButton } from "./ContactButton";
import { FadeIn, smoothEase } from "./FadeIn";
import { heroPortrait } from "../data/images";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "mailto:hello@hero-program.com" },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative h-screen min-h-[680px] overflow-x-clip bg-transparent"
    >
      <FadeIn
        className="relative z-30 px-5 pt-6 sm:px-8 md:px-12 lg:px-16"
        delay={0}
        duration={0.8}
      >
        <nav
          aria-label="Primary navigation"
          className="flex items-center justify-end gap-5 sm:gap-8 md:gap-12"
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              className="text-[11px] uppercase tracking-wider text-mist transition-opacity duration-200 hover:opacity-70 sm:text-xs md:text-sm"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </FadeIn>

      <div className="pointer-events-none absolute inset-x-0 top-[19vh] z-0 flex justify-center sm:top-[18vh]">
        <FadeIn delay={0.6} duration={1} y={30}>
          <motion.img
            alt="Hero portrait"
            className="hero-portrait h-[56vh] max-h-[720px] min-h-[390px] w-auto object-contain object-bottom"
            initial={{ scale: 1.02 }}
            animate={{ scale: [1.02, 1.04, 1.02] }}
            transition={{
              duration: 8,
              ease: smoothEase,
              repeat: Infinity,
            }}
            src={heroPortrait}
          />
        </FadeIn>
      </div>

      <FadeIn
        className="relative z-20 mt-[11vh] overflow-hidden px-3 sm:px-4 md:px-6"
        delay={0.15}
        duration={0.9}
        y={40}
      >
        <h1 className="hero-heading whitespace-nowrap text-center text-[14vw] font-black uppercase leading-[0.78] tracking-normal sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]">
          英雄之家
        </h1>
      </FadeIn>

      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-6 px-5 pb-6 sm:px-8 sm:pb-8 md:px-12 md:pb-10 lg:px-16">
        <FadeIn delay={0.35} duration={0.8} y={20}>
          <p className="max-w-[210px] text-[10px] font-light uppercase leading-relaxed tracking-[0.16em] text-mist sm:max-w-none sm:text-xs md:text-sm">
            Creative development / visual experiences
          </p>
        </FadeIn>

        <FadeIn delay={0.5} duration={0.8} y={20}>
          <ContactButton href="mailto:hello@hero-program.com" />
        </FadeIn>
      </div>
    </section>
  );
}
