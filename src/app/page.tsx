import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Stats from "../components/landing/Stats";


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