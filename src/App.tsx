import Experience from "./components/experience";
import Header from "./components/header";

function App() {
  return (
    <main className="min-h-screen bg-black">
      <div className="flex flex-col mx-auto max-w-6xl">
        <Header />
        <Experience />
      </div>
    </main>
  );
}

export default App;
