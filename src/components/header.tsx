import samnang from "../assets/samnang.jpg";
import banner from "../assets/banner.jpg";
import khmer from "../assets/khmer.svg";
import telegram from "../assets/telegram.svg";
import { useEffect, useState } from "react";

export default function Header() {
  const [contact, setContact] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setContact(false);
    }, 5000);
    return () => clearInterval(interval);
  });

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
              Graphic Designer | Full-Stack Developer | IT Support
            </span>
            <span className="block">
              Passionate about computers and tinkering with technologies.
            </span>
          </p>
          {contact ? (
            <div className="flex flex-row gap-3 pt-4 items-center">
              <a href="tel:+87556030" className="flex flex-row gap-3">
                <img src={khmer} width={50} className="rounded-xs" />
                <p className="text-white font-bold text-lg">087 556 030</p>
              </a>
              <a
                href="https://t.me/ICBC_Samnang_Khath"
                className="flex flex-row gap-3"
              >
                <img src={telegram} width={30} />
                <p className="text-white font-bold text-lg">Khath Samnang</p>
              </a>
            </div>
          ) : (
            <button
              className="mt-4 bg-orange-500 w-38 h-12 rounded-sm text-center text-white font-bold text-xl"
              onClick={() => {
                setContact(true);
              }}
            >
              Contact Me
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
