import { About } from "./components/About";
import { ContactDock } from "./components/ContactDock";
import { Experience } from "./components/Experience";
import { Hero } from "./components/Hero";
import { Resume } from "./components/Resume";
import { Sidebar } from "./components/Sidebar";
import { Skills } from "./components/Skills";
import { Work } from "./components/Work";

export default function App() {
  return (
    <div className="pb-[84px] lg:pb-0">
      <Hero />
      <div className="lg:mx-auto lg:grid lg:max-w-[1080px] lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14 lg:px-8">
        <main className="px-[22px] md:px-8 lg:px-0">
          {/* The timeline spine: a thin line the section pills and dots sit on */}
          <div className="relative mt-10 pl-[30px] before:absolute before:bottom-0 before:left-[5px] before:top-1.5 before:w-0.5 before:bg-line">
            <About />
            <Work />
            <Experience />
            <Skills />
            <Resume />
          </div>
        </main>
        <Sidebar />
      </div>
      <ContactDock />
    </div>
  );
}
