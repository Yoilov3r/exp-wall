import { AboutSection } from "./components/AboutSection";
import { HeroSection } from "./components/HeroSection";
import { MarqueeSection } from "./components/MarqueeSection";
import { ProjectsSection } from "./components/ProjectsSection";

function App() {
  return (
    <main className="app-shell min-h-screen overflow-x-clip bg-ink font-kanit text-white">
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ProjectsSection />
    </main>
  );
}

export default App;
