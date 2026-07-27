import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";


export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">


      <Navbar />

      <Hero />

      <Features />

      <Stats />


    </main>
  );
}