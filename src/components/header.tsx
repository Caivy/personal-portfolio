import samnang from "../assets/samnang.jpg";
import banner from "../assets/banner.jpg";

export default function Header() {
  return (
    <div className="lg:pt-2 flex flex-col gap-4">
      <img
        src={banner}
        height="200"
        className="max-w-full lg:h-80 rounded-b-xl lg:rounded-xl object-cover items-center"
      />
      <div className="flex flex-col lg:flex-row items-center lg:items-start lg:gap-8 -translate-y-8 lg:translate-y-0">
        <img
          src={samnang}
          className="rounded-full border-amber-600 border-4 items-center -translate-y-8 lg:-translate-y-10"
          width="200"
          height="200"
        />
        <div className="flex flex-col items-center lg:items-start ">
          <h1 className="text-white font-bold text-2xl">Khath Samnang</h1>
          <p className="pt-4 max-w-1xl text-center lg:text-start text-white font-normal text-lg">
            <span className="block">
              Graphic Designer / Full-Stack Developer / IT Support
            </span>
            <span className="block">
              Passionate about computers and tinkering with technologies.
            </span>
          </p>
          <button className="mt-4 bg-orange-500 w-38 h-12 rounded-sm text-center text-white font-bold text-xl">
            Contact Me
          </button>
        </div>
      </div>
    </div>
  );
}
