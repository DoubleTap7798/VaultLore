import { featuredCards } from "@vaultlore/shared";

import { LiveDashboard } from "../components/live-dashboard";

const pillars = [
  "Scan and identify",
  "Card intelligence",
  "Subject profiles",
  "Digital vault",
  "Lore and moments",
  "Market pulse",
  "Grade smarter",
  "Alerts and watchlists"
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">Dark luxury collector intelligence</div>
          <h1>Where every card has value, rarity, history, and story.</h1>
        </div>
        <p>
          VaultLore is a mobile-first collector operating system for sports cards, Pokemon, TCG,
          Marvel, entertainment, and future categories. It combines scan intelligence, premium
          collection management, market tracking, grading insight, and a differentiated lore layer.
        </p>
        <div className="ctaRow">
          <a className="primaryButton" href="#roadmap">
            View build roadmap
          </a>
          <a className="secondaryButton" href="#pillars">
            Explore product pillars
          </a>
        </div>
      </section>

      <section className="grid stats" style={{ marginTop: 18 }}>
        <article className="card">
          <h2>Day-one breadth</h2>
          <p>Sports, Pokemon, Magic, Yu-Gi-Oh!, One Piece, Disney Lorcana, Marvel, Star Wars, and entertainment sets.</p>
        </article>
        <article className="card">
          <h2>Premium motion</h2>
          <p>Built around cinematic reveal moments, framed card art, and polished market dashboards.</p>
        </article>
        <article className="card">
          <h2>Scalable architecture</h2>
          <p>Expo mobile, Next web, Fastify API, Drizzle/Postgres, and BullMQ worker architecture in one monorepo.</p>
        </article>
      </section>

      <section id="pillars" className="grid pillars" style={{ marginTop: 18 }}>
        {pillars.map((pillar) => (
          <article className="card" key={pillar}>
            <h3>{pillar}</h3>
            <p>Designed as a first-class part of the collector experience, not an afterthought.</p>
          </article>
        ))}
      </section>

      <section className="grid stats" style={{ marginTop: 18 }}>
        {featuredCards.map((card) => (
          <article className="card" key={card.id}>
            <div className="eyebrow">{card.category}</div>
            <h3>{card.title}</h3>
            <p>{card.subjectName} • {card.setName} • {card.collectorTier}</p>
            <div>
              <span className="label">Lore-ready</span>
              <span className="label">Market tracked</span>
              <span className="label">Collection-ready</span>
            </div>
          </article>
        ))}
      </section>

      <section id="roadmap" className="card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Execution priorities</div>
        <h2>Monorepo foundation first, premium collector workflows next.</h2>
        <p>
          This repo starts with shared contracts, a flexible schema, all required API surfaces, an
          Expo Router mobile shell, a polished web presence, and a worker foundation for card-scan,
          comp refresh, valuation refresh, and alert jobs.
        </p>
      </section>

      <LiveDashboard />
    </main>
  );
}
