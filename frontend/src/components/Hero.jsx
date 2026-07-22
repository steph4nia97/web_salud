import HERO_IMG from "../assets/arce.jpeg";

export default function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-media" aria-hidden="true">
        <img
          src={HERO_IMG}
          alt=""
          width={2000}
          height={1333}
          fetchPriority="high"
        />
      </div>
      <div className="hero-content">
        <h1 className="hero-brand">Dr. Fabiar Arce Tamblay</h1>
        <p className="hero-headline">Traumatología con atención cercana</p>
        <p className="hero-lead">
          Evaluación de lesiones, seguimiento y un plan claro para tu
          recuperación. Agenda tu consulta en unos minutos.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#agendar">
            Agendar hora
          </a>
          <a className="btn btn-ghost" href="#biografia" style={{ color: "#f5f9f8", borderColor: "rgba(245,249,248,0.35)" }}>
            Conocer más
          </a>
        </div>
      </div>
    </section>
  );
}
