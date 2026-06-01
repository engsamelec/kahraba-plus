/**
 * Single source of truth for brand contact + social details, so the footer,
 * invoice, about page, and structured data never drift apart.
 */
export const BRAND = {
  email: "info@kahrabaplus.com",
  phone: "+963 900 000 000",
  // tel: href form (no spaces)
  phoneHref: "+963900000000",
  whatsapp: "963900000000",
  address: "Damascus, Syria",
  social: {
    facebook: "https://facebook.com/kahrabaplus",
    instagram: "https://instagram.com/kahrabaplus",
    whatsapp: "https://wa.me/963900000000",
  },
} as const;
