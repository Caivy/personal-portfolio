import work from "./data/work.json";

export const profile = {
  name: ["Khath", "Samnang"],
  role: "Graphic designer & IT specialist",
  lede: "Print, posters and promotional design, from Phnom Penh. I also keep the computers running.",
  phone: "+855 87 556 030",
  tel: "+85587556030",
  telegram: "https://t.me/ICBC_Samnang_Khath",
  email: "samnangkhath5@gmail.com",
  address: "9th St, Borey 100 Knong, Phnom Penh 12102",
  cvUrl: "/Khath_Samnang_CV.pdf",
};

export const about =
  "I’m 21 , and I like problems that have a clear answer and a clean finish. I got hooked on computers early, and that curiosity turned into design and technical work I can be trusted with.";

export type Job = {
  title: string;
  org: string;
  period: string;
  summary?: string;
  points?: string[];
};
export const experience: Job[] = [
  {
    title: "Graphic designer, video editor & IT support",
    org: "iCareBenefits Cambodia",
    period: "Dec 2024 – Present",
    points: [
      "Design social media posts for the company’s Facebook pages.",
      "Design catalogs, banners and stickers for promotion campaigns and events.",
      "Record and edit video for the company’s social pages and events.",
      "Support employees with IT technical issues.",
      "Develop the company’s internal system and product website.",
    ],
  },
  {
    title: "IT support",
    org: "National Skill Competition, Phnom Penh",
    period: "24–28 Oct 2024",
    summary:
      "Kept software and hardware running for the Graphic Design Competition, fixed issues on the spot and helped organizers set up.",
  },
  {
    title: "Intern",
    org: "PSL Printing Company, Phnom Penh",
    period: "1–31 Nov 2024",
    summary:
      "Worked on calendars, invoices and promotional materials. Folded, packaged and prepared barcodes and other printed products for distribution.",
  },
];

export const skills = [
  {
    group: "Graphic design",
    items: [
      ["Photoshop", 92],
      ["Illustrator", 92],
      ["Premiere Pro", 78],
      ["After Effects", 72],
    ],
  },
  {
    group: "Office",
    items: [
      ["Word", 80],
      ["Excel", 90],
      ["PowerPoint", 72],
    ],
  },
  {
    group: "Technical",
    items: [
      ["Windows troubleshooting", 90],
      ["Software installation", 90],
      ["Computer repair", 84],
    ],
  },
] as const;

export const education = [
  { name: "NTTI", detail: "Graphic design short course, 2024" },
  { name: "Sovannaphumi School", detail: "GEP graduated, English, 2014–2023" },
  { name: "Chaktomuk Middle School", detail: "Diploma, 2017–2020" },
];
export const languages = [
  { name: "Khmer", detail: "Native" },
  { name: "English", detail: "Fluent, writing and speaking" },
];

export const facts = ["Phnom Penh", "Khmer · English", "Design + IT"];

export type Poster = {
  title: string;
  image?: string; // 4:5 works best (1080×1350). Leave out to show a placeholder.
  client?: string;
};

export type Print = {
  title: string;
  image: string; // a flat scan or mockup of the finished piece
  type: string; // "Flyer", "Brochure", "Banner", "Name card"...
  size?: string; // "A4", "85×55 mm"
  ratio?: "portrait" | "landscape" | "square"; // defaults to portrait
};

export type Video = {
  title: string;
  thumbnail: string; // 16:9 (1280×720)
  duration?: string; // "0:45"
  meta?: string; // "Reel · Facebook"
  // Use ONE of these:
  src?: string; // an .mp4 in /public — plays in a popup
  href?: string; // YouTube / Facebook / TikTok link — opens in a new tab
};

export type Project = {
  title: string;
  description: string;
  image: string; // screenshot, 1600×1000 (16:10), .webp. Cropped from the top.
  domain: string; // shown in the fake address bar
  url?: string; // "Visit site" link
  duration: string; // "3 weeks"
  role: string; // "Design & development"
  year: string;
  stack: string[];
};

// The work lists live in src/data/work.json, which the dev-only admin (/admin/) rewrites.
export const posters = work.posters as Poster[];
export const prints = work.prints as Print[];
export const videos = work.videos as Video[];
export const projects = work.projects as Project[];
