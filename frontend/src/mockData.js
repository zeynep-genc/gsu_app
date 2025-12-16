import { DEFAULT_MAP_URL } from "./constants.js";

export const MOCK_EVENTS = [
  {
    id: 1,
    title: "Yapay Zeka Atölyesi",
    club: {
      id: 1,
      name: "Bilgisayar Mühendisliği Kulübü",
      university: "Galatasaray Üniversitesi",
      city: "İstanbul",
      description:
        "GSÜ Bilgisayar Mühendisliği Kulübü yazılım ve yapay zeka etkinlikleri düzenler.",
    },
    university: "Galatasaray Üniversitesi",
    city: "İstanbul",
    date: "2025-03-12",
    category: "Teknoloji",
    tags: ["yapay zeka", "atölye"],
    capacity: 60,
    participants_count: 60,
    waiting_list_count: 4,
    map_url: DEFAULT_MAP_URL,
  },
  {
    id: 2,
    title: "Girişimcilik Sohbetleri",
    club: {
      id: 2,
      name: "Girişimcilik Kulübü",
      university: "Boğaziçi Üniversitesi",
      city: "İstanbul",
      description:
        "Boğaziçi Girişimcilik Kulübü, girişimcilik kültürünü yaygınlaştırmayı hedefler.",
    },
    university: "Boğaziçi Üniversitesi",
    city: "İstanbul",
    date: "2025-03-18",
    category: "Kariyer",
    tags: ["girişimcilik", "start-up"],
    capacity: 80,
    participants_count: 80,
    waiting_list_count: 9,
    map_url: DEFAULT_MAP_URL,
  },
  {
    id: 3,
    title: "Sosyal Sorumluluk Projesi Tanıtımı",
    club: {
      id: 3,
      name: "Sosyal Sorumluluk Topluluğu",
      university: "Ege Üniversitesi",
      city: "İzmir",
      description:
        "Ege Üniversitesi Sosyal Sorumluluk Topluluğu gönüllülük projeleri yürütür.",
    },
    university: "Ege Üniversitesi",
    city: "İzmir",
    date: "2025-03-20",
    category: "Sosyal",
    tags: ["gönüllülük"],
    capacity: 40,
    participants_count: 22,
    waiting_list_count: 0,
    map_url:
      "https://www.openstreetmap.org/export/embed.html?bbox=27.126,38.414,27.142,38.426&layer=mapnik&marker=38.420,27.135",
  },
];
