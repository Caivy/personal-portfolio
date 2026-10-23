import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { ContactDock } from "./components/ContactDock";
import { Education } from "./components/Education";
import { Experience } from "./components/Experience";
import { Hero } from "./components/Hero";
import { SectionNav } from "./components/SectionNav";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";

export default function App() {
  return (
    <>
      <Hero />
      <main>
        <About />
        <Work />
        <Experience />
        <Skills />
        <Education />
        <Contact />
      </main>
      <SectionNav />
      <ContactDock />
    </>
  );
}
