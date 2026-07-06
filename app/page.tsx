import About from "@/components/About";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import RolePills from "@/components/RolePills";
import ScriptureIntro from "@/components/ScriptureIntro";
import WorkShowcase from "@/components/WorkShowcase";

export default function Home() {
  return (
    <main>
      <ScriptureIntro />
      <Hero />
      <About />
      <RolePills />
      <WorkShowcase />
      <Contact />
    </main>
  );
}
