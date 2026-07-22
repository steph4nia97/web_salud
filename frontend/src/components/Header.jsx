import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <a className="brand" href="#inicio">
        Dr. Fabiar Arce Tamblay
      </a>
      <nav className="nav-links" aria-label="Principal">
        <a className="nav-hide" href="#biografia">
          Biografía
        </a>
        <a className="nav-hide" href="#enfoque">
          Enfoque
        </a>
        <a className="btn btn-primary" href="#agendar">
          Agendar hora
        </a>
      </nav>
    </header>
  );
}
