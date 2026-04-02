import { featuredCards } from "@vaultlore/shared";

export const demoCollection = [
  {
    id: "72c459da-8ad7-4a41-9968-a33bb7553576",
    cardId: featuredCards[0].id,
    quantity: 1,
    condition: "graded",
    gradeCompany: "PSA",
    gradeValue: 8,
    purchasePrice: 4200,
    favorite: true,
    showcase: true
  },
  {
    id: "4b72a53f-b8bd-432b-b59e-10d2ff5df8c4",
    cardId: featuredCards[1].id,
    quantity: 2,
    condition: "raw",
    purchasePrice: 780,
    favorite: true,
    showcase: false
  }
] as const;

export const subjectProfiles = [
  {
    id: "5aa3f523-ee30-43be-b82c-320ca0eecdda",
    subjectName: "Michael Jordan",
    category: "basketball",
    summary: "Six-time NBA champion and the hobby benchmark for iconic basketball cards.",
    milestones: ["1984 Rookie Season", "6 NBA Championships", "Hall of Fame"],
    lore: [
      "Defined modern basketball card demand through rookie and insert grails.",
      "Championship-era cards continue to anchor blue-chip basketball portfolios."
    ]
  },
  {
    id: "5dd47866-a3e8-439a-81d8-b6936eb8140e",
    subjectName: "Charizard",
    category: "pokemon",
    summary: "A foundational chase character whose key cards define multiple eras of the Pokemon hobby.",
    milestones: ["Base Set dominance", "Modern alternate art demand", "Consistent grading upside"],
    lore: [
      "Charizard serves as a cross-generational anchor for collector nostalgia.",
      "High-grade Charizard cards frequently act as category-wide market signals."
    ]
  }
] as const;

export const categories = [
  { slug: "baseball", label: "Baseball", pulse: "Stable blue-chip market with vintage strength." },
  { slug: "basketball", label: "Basketball", pulse: "High volatility around modern stars and rookie parallels." },
  { slug: "football", label: "Football", pulse: "Quarterback market remains event-driven." },
  { slug: "pokemon", label: "Pokemon", pulse: "Demand is broad, nostalgia-led, and highly liquid." },
  { slug: "marvel", label: "Marvel", pulse: "Character-driven releases are widening collector interest." },
  { slug: "entertainment", label: "Entertainment", pulse: "Selective, franchise-led opportunities dominate." }
] as const;
