import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Biografia from "./components/Biografia";
import Enfoque from "./components/Enfoque";
import Agendar from "./components/Agendar";
import Footer from "./components/Footer";
import Admin from "./components/Admin";

function rutaActual() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash || "home";
}

export default function App() {
  const [ruta, setRuta] = useState(rutaActual);

  useEffect(() => {
    const onHash = () => setRuta(rutaActual());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (ruta === "admin") {
    return <Admin />;
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Biografia />
        <Enfoque />
        <Agendar />
      </main>
      <Footer />
    </>
  );
}
