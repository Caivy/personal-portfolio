export default function Experience() {
  return (
    <div className="flex flex-col gap-4 items-start">
      <h1 className="text-white font-bold text-xl">Experience</h1>
      <div className="flex flex-row gap-4">
        <div className="h-80 w-1 self-stretch bg-yellow-600 rounded-sm" />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1 text-white ">
            <h1 className="font-bold text-lg">
              Information Technology Technical Support at NTTI School
            </h1>
            <p className="text-gray-400">October 2024 - December 2024</p>
            <p className="text-wrap">
              Help with Window Issues, Software Installation, Setup Computer for
              Student, Printer Issues etc.
            </p>
          </div>
          <div className="flex flex-col gap-1 text-white">
            <h1 className="font-bold text-lg">
              Internship Trainee at PSL Printing House
            </h1>
            <p className="text-gray-400">September 2024 - October 2024</p>
            <p>Help with brochure, pvc banner, sticker laser inkjet sticker.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
