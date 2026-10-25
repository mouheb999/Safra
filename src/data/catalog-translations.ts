// French/Arabic versions of the starting catalog (seed + local fallback). Later edits live in the
// database (`translations` column), made from /admin/catalog. Have a native speaker review.

import type { Translations } from "./translations";

export interface DestinationText {
  country: string;
  title: string;
  description: string;
  highlights: string[];
  duration: string;
  teaserDuration: string;
  heroAlt: string;
  cardAlt: string;
}

export interface SafariText {
  name: string;
  description: string;
  duration: string;
  highlights: string[];
  imageAlt: string;
}

export interface VisaText {
  name: string;
  country: string;
  description: string;
  includes: string[];
  documents: string[];
}

export const destinationTranslations: Record<string, Translations<DestinationText>> = {
  thailand: {
    fr: {
      country: "Thaïlande",
      title: "Krabi et la côte d’Andaman",
      description: "Une escapade tropicale tout en douceur : falaises calcaires spectaculaires, brise marine légère et sauts d’île en île en toute simplicité.",
      highlights: ["Côte turquoise", "Ambiance des îles", "Saveurs tropicales"],
      duration: "7 à 9 jours",
      teaserDuration: "7 à 9 jours",
      heroAlt: "Falaises de la côte de Krabi",
      cardAlt: "Falaises de la côte de Krabi",
    },
    ar: {
      country: "تايلاند",
      title: "كرابي وساحل أندامان",
      description: "رحلة استوائية دافئة بين سواحل كلسية خلابة ونسائم بحرية لطيفة وتنقّل سهل بين الجزر.",
      highlights: ["ساحل فيروزي", "أجواء الجزر", "نكهات استوائية"],
      duration: "من 7 إلى 9 أيام",
      teaserDuration: "من 7 إلى 9 أيام",
      heroAlt: "منحدرات ساحل كرابي",
      cardAlt: "منحدرات ساحل كرابي",
    },
  },
  egypt: {
    fr: {
      country: "Égypte",
      title: "Le Caire et le Nil",
      description: "Un mélange vibrant d’atmosphère intemporelle et de rythme urbain, où les tons dorés et une histoire millénaire façonnent le voyage.",
      highlights: ["Paysages désertiques", "Patrimoine riche", "Soirées chaleureuses"],
      duration: "6 jours",
      teaserDuration: "6 jours",
      heroAlt: "Désert et pyramides d’Égypte",
      cardAlt: "Pyramides au coucher du soleil",
    },
    ar: {
      country: "مصر",
      title: "القاهرة والنيل",
      description: "مزيج نابض بين أجواء خالدة وإيقاع المدينة، حيث ترسم الألوان الذهبية والتاريخ العريق ملامح الرحلة.",
      highlights: ["مناظر صحراوية", "تراث غني", "أمسيات دافئة"],
      duration: "6 أيام",
      teaserDuration: "6 أيام",
      heroAlt: "الصحراء والأهرامات في مصر",
      cardAlt: "الأهرامات عند الغروب",
    },
  },
  turkiye: {
    fr: {
      country: "Turquie",
      title: "La Cappadoce et Istanbul",
      description: "Un mélange expressif de paysages spectaculaires et d’énergie urbaine, où une culture riche et des saveurs intenses se rencontrent chaque jour.",
      highlights: ["Paysages spectaculaires", "Culture aux mille facettes", "Gastronomie vibrante"],
      duration: "5 jours",
      teaserDuration: "5 jours",
      heroAlt: "Montgolfières au-dessus de la Cappadoce",
      cardAlt: "Montgolfières au-dessus de la Cappadoce",
    },
    ar: {
      country: "تركيا",
      title: "كبادوكيا وإسطنبول",
      description: "مزيج معبّر بين مناظر طبيعية مذهلة ونبض المدينة، حيث تلتقي الثقافة الغنية والنكهات الجريئة كل يوم.",
      highlights: ["مناظر مذهلة", "ثقافة متعددة الطبقات", "مأكولات نابضة"],
      duration: "5 أيام",
      teaserDuration: "5 أيام",
      heroAlt: "مناطيد فوق كبادوكيا",
      cardAlt: "مناطيد فوق كبادوكيا",
    },
  },
};

export const safariTranslations: Record<string, Translations<SafariText>> = {
  kenya: {
    fr: {
      name: "Kenya",
      description: "Savanes dorées, faune extraordinaire et soirées tranquilles sous un ciel immense. Ajoutez un séjour à Nairobi pour un peu d’énergie urbaine.",
      duration: "6 à 8 jours",
      highlights: ["Safari dans le Masai Mara", "Les Big Five", "Séjour à Nairobi en option"],
      imageAlt: "Safari au Kenya",
    },
    ar: {
      name: "كينيا",
      description: "سافانا ذهبية وحياة برية استثنائية وأمسيات هادئة تحت سماء واسعة. أضف إقامة في نيروبي إن أردت بعض حيوية المدينة.",
      duration: "من 6 إلى 8 أيام",
      highlights: ["سفاري في ماساي مارا", "تجربة الخمسة الكبار", "إقامة اختيارية في نيروبي"],
      imageAlt: "سفاري في كينيا",
    },
  },
  tanzania: {
    fr: {
      name: "Tanzanie",
      description: "Suivez le rythme de la vie sauvage à travers le Serengeti et dans les paysages spectaculaires du Ngorongoro. Une extension à Zanzibar en option pour finir en douceur.",
      duration: "7 à 10 jours",
      highlights: ["Safari dans le Serengeti", "Cratère du Ngorongoro", "Les Big Five"],
      imageAlt: "Safari en Tanzanie",
    },
    ar: {
      name: "تنزانيا",
      description: "تابع إيقاع البرية عبر سيرينغيتي وصولًا إلى مناظر نغورونغورو المذهلة. وامتداد اختياري إلى زنجبار لختام أهدأ.",
      duration: "من 7 إلى 10 أيام",
      highlights: ["سفاري في سيرينغيتي", "فوهة نغورونغورو", "تجربة الخمسة الكبار"],
      imageAlt: "سفاري في تنزانيا",
    },
  },
  "south-africa": {
    fr: {
      name: "Afrique du Sud",
      description: "Des journées riches en faune et un vrai sentiment de liberté à Kruger. Prolongez l’aventure au Cap pour des paysages côtiers et un tout autre rythme.",
      duration: "7 à 10 jours",
      highlights: ["Parc national Kruger", "Safari en immersion", "Extension au Cap en option"],
      imageAlt: "Safari en Afrique du Sud",
    },
    ar: {
      name: "جنوب أفريقيا",
      description: "أيام مليئة بالحياة البرية وإحساس جديد بالحرية في كروغر. مدّد مغامرتك إلى كيب تاون لمناظر ساحلية وإيقاع مختلف تمامًا.",
      duration: "من 7 إلى 10 أيام",
      highlights: ["حديقة كروغر الوطنية", "تجربة سفاري غامرة", "امتداد اختياري إلى كيب تاون"],
      imageAlt: "سفاري في جنوب أفريقيا",
    },
  },
  "kenya-zanzibar": {
    fr: {
      name: "Kenya + Zanzibar",
      description: "Un peu sauvage, un peu pieds nus. Associez la faune inoubliable du Kenya à des journées eaux turquoise sur les plages tropicales de Zanzibar.",
      duration: "10 à 14 jours",
      highlights: ["Safari + plage tropicale", "Expérience Masai Mara", "Détente à Zanzibar"],
      imageAlt: "Safari Kenya + Zanzibar",
    },
    ar: {
      name: "كينيا + زنجبار",
      description: "قليل من البرية وقليل من الحفاء. اجمع بين الحياة البرية التي لا تُنسى في كينيا وأيام المياه الفيروزية على شواطئ زنجبار الاستوائية.",
      duration: "من 10 إلى 14 يومًا",
      highlights: ["سفاري + شاطئ استوائي", "تجربة ماساي مارا", "استرخاء في زنجبار"],
      imageAlt: "سفاري كينيا + زنجبار",
    },
  },
  "tanzania-zanzibar": {
    fr: {
      name: "Tanzanie + Zanzibar",
      description: "Des vastes horizons du Serengeti aux brises chaudes de l’océan Indien. Votre aventure sauvage, terminée par du temps pour déconnecter au bord de la mer.",
      duration: "10 à 14 jours",
      highlights: ["Safari dans le Serengeti", "Expérience de la vie sauvage", "Extension plage à Zanzibar"],
      imageAlt: "Safari Tanzanie + Zanzibar",
    },
    ar: {
      name: "تنزانيا + زنجبار",
      description: "من آفاق سيرينغيتي الواسعة إلى نسائم المحيط الهندي الدافئة. مغامرتك البرية تُختتم بوقت للاسترخاء على شاطئ البحر.",
      duration: "من 10 إلى 14 يومًا",
      highlights: ["سفاري في سيرينغيتي", "تجربة الحياة البرية", "امتداد شاطئي في زنجبار"],
      imageAlt: "سفاري تنزانيا + زنجبار",
    },
  },
};

export const visaTranslations: Record<string, Translations<VisaText>> = {
  "thailand-visa": {
    fr: {
      name: "Assistance visa Thaïlande",
      country: "Thaïlande",
      includes: ["Liste des documents", "Vérification des documents", "Préparation / accompagnement de la demande", "Suivi SAFRA"],
      documents: [
        "Copie du passeport",
        "Photo d’identité",
        "Détails du vol / du voyage",
        "Détails de l’hébergement",
        "Relevé bancaire / justificatif financier",
        "Documents professionnels si nécessaire",
      ],
    },
    ar: {
      name: "المساعدة في تأشيرة تايلاند",
      country: "تايلاند",
      includes: ["قائمة الوثائق", "مراجعة الوثائق", "تحضير الطلب / الإرشاد", "متابعة سفرة"],
      documents: [
        "نسخة من جواز السفر",
        "صورة شخصية",
        "تفاصيل الطيران / الرحلة",
        "تفاصيل الإقامة",
        "كشف حساب بنكي / إثبات مالي",
        "وثائق العمل أو النشاط عند الحاجة",
      ],
    },
  },
};
