import About from "@/components/About";
import ScrollTimeline from "@/components/ScrollTimeline";
import SectionHandoff from "@/components/SectionHandoff";
import Closing from "@/components/Closing";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import ScriptureIntro from "@/components/ScriptureIntro";
import ScrollPacing from "@/components/ScrollPacing";
import Skills from "@/components/Skills";
import WorkSequence from "@/components/WorkSequence";

export default function Home() {
  return (
    <main>
      <ScriptureIntro />
      <ScrollTimeline />
      <Hero />
      <About />
      <WorkSequence />
      <Skills />
      <Contact />
      <Closing />
      <SectionHandoff from="#hero" to="#about" />
      <SectionHandoff from="#skills" to="#contact" />
      <ScrollPacing />
    </main>
  );
}
