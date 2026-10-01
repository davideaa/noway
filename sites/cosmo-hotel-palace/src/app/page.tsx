/*
 * Home (UX 4, MOTION 2.3). Otto scene in un'unica pila; l'ordine di base è «Per piacere» e cambia
 * solo dopo il clic su «Per lavoro» (SceneStack). Le scene sono Server Component dove possibile
 * (Perché sceglierci); le altre sono Client Component perché pilotano il 3D o lo stato.
 * Sticky totali (solo desktop ≥ 1024 con movimento normale): hero 150 svh + Cosmo Grill 140 svh +
 * Centro Congressi 150 svh = 440 svh (UX 4.1 e DECISIONI 6: massimo ~500).
 */
import { Closing } from "@/components/home/Closing";
import { CongressTeaser } from "@/components/home/CongressTeaser";
import { GrillScene } from "@/components/home/GrillScene";
import { Hero } from "@/components/home/Hero";
import { RoomsTeaser } from "@/components/home/RoomsTeaser";
import { RouteScene } from "@/components/home/RouteScene";
import { SceneStack } from "@/components/home/SceneStack";
import { WellnessTeaser } from "@/components/home/WellnessTeaser";
import { WhyUs } from "@/components/home/WhyUs";

export default function Home() {
  return (
    <SceneStack
      scene={{
        hero: <Hero />,
        perche: <WhyUs />,
        camere: <RoomsTeaser />,
        milano: <RouteScene />,
        grill: <GrillScene />,
        wellness: <WellnessTeaser />,
        congressi: <CongressTeaser />,
        prenota: <Closing />,
      }}
    />
  );
}
