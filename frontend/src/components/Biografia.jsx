import Reveal from "./Reveal";

import PORTRAIT from "../assets/arce.jpeg"

export default function Biografia() {
  return (
    <section className="section" id="biografia">
      <div className="section-inner">
        <Reveal>
          <p className="section-label">Biografía</p>
          <h2 className="section-title">Cuidado ortopédico pensado en ti</h2>

        </Reveal>

        <div className="bio-grid">
          <Reveal className="bio-copy">
            <p>
              Soy el Dr. Fabiar Arce Tamblay, médico cirujano de la Universidad de Tarapacá y especialista en Traumatología y Ortopedia de la Universidad de Valparaíso. Me dedico a
              diagnosticar y tratar lesiones del aparato locomotor: huesos,
              articulaciones, músculos y tendones, con un enfoque claro y
              cercano.
            </p>
            <p>
              Atiendo de forma privada en diferentes clínicas de Antofagasta, priorizando una evaluación ordenada, una atención personalizada y un
              plan de recuperación concreto. Mi objetivo es que salgas de la
              consulta entendiendo tu lesión y los pasos siguientes.
            </p>
            <ul className="bio-meta">
              <li>
                <strong>Especialidad</strong>
                <span>Traumatología y Ortopedia</span>
              </li>
              <li>
                <strong>Enfoque</strong>
                <span>Lesiones musculoesqueléticas · Seguimiento clínico</span>
              </li>
              <li>
                <strong>Idiomas</strong>
                <span>Español</span>
              </li>
              <li>
                <strong>Atención</strong>
                <span>Lunes a viernes · 17:30 a 20:00</span>
              </li>
            </ul>
          </Reveal>

          <Reveal className="bio-portrait">
            <img
              src={PORTRAIT}
              alt="Dr. Fabiar Arce Tamblay en consulta"
              width={1200}
              height={1500}
              loading="lazy"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
