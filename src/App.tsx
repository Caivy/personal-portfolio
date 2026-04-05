function App() {
  return (
    <main className="min-h-screen bg-black">
      <div className="flex flex-col container mx-auto max-w-6xl">
        <div className="flex flex-col gap-4">
          <img
            src="https://placehold.co/1200x60"
            width="1200"
            height="60"
            className="h-60 object-cover items-center"
          />
          <div className="flex flex-row gap-8 items-start">
            <img
              src="https://elouwerse.nl/placecircle/200"
              className="rounded-full border-amber-600 border-4"
            />
            <div className="flex flex-col item-start">
              <h1 className="text-white font-bold text-2xl">Khath Samnang</h1>
              <p className="pt-4 text-white font-normal text-xl whitespace-break-spaces">
                Graphic Designer / Full-Stack Developer / IT Support
                <br />
                Has always been Passionate about computers and tinkering with
                technologies.
              </p>
              <button className="mt-4 bg-orange-500 w-38 h-12 rounded-sm text-center text-white font-bold text-xl">
                Contact Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
