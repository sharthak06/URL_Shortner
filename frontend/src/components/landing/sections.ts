/** Landing sections the navbar links to, in page order. */
export const LANDING_SECTIONS = [
  { id: "product", label: "Product" },
  { id: "how-it-works", label: "How it works" },
  { id: "stack", label: "Stack" },
  { id: "faq", label: "FAQ" },
] as const;

export type LandingSectionId = (typeof LANDING_SECTIONS)[number]["id"];
