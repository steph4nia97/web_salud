import Reveal from "./Reveal";

const PILARES = [
  {
    titulo: "Evaluación precisa",
    texto:
      "Reviso tu historia, síntomas y movilidad para entender la lesión antes de proponer estudios o tratamiento.",
  },
  {
    titulo: "Plan de recuperación",
    texto:
      "Saldrás con pasos claros: qué hacer, qué evitar y cuándo controlar tu evolución.",
  },
  {
    titulo: "Seguimiento real",
    texto:
      "Acompañamos el proceso hasta que recuperes función y confianza en el movimiento.",
  },
];

export default function Enfoque() {
  return (
    <section className="section enfoque" id="enfoque">
      <div className="section-inner">
        <Reveal>
          <p className="section-label">Enfoque</p>
          <h2 className="section-title">Cómo trabajo contigo</h2>
          <p className="section-lead">
            Tres principios que guían cada cita, desde la primera evaluación
            hasta el seguimiento.
          </p>
        </Reveal>

        <Reveal>
          <ul className="enfoque-list">
            {PILARES.map((item) => (
              <li key={item.titulo}>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
