/*
 * /camere/{slug}/ — una delle tre pagine camera (UX 5.2): h1 unico, sottotitolo e corpo (COPY 3.3-3.5),
 * l'elenco «Punti della camera» e la scheda tecnica. Il diorama (tab, riquadro, controlli) lo mette il
 * layout di /camere/: qui si rendono solo i pezzi che dipendono dalla camera, come elementi della griglia
 * del layout. Statico: `generateStaticParams` + `dynamicParams = false`.
 *
 * Next 16: `params` è una Promise (anche in `generateMetadata`).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HotspotList } from "@/components/rooms/HotspotList";
import { SpecSheet } from "@/components/rooms/SpecSheet";
import { roomBySlug, rooms } from "@/content/rooms";
import { JsonLdBreadcrumb, JsonLdHotelRoom } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import s from "@/components/rooms/rooms.module.css";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = roomBySlug(slug);
  return room ? pageMetadata(room.id) : {};
}

export default async function CameraPage({ params }: Props) {
  const { slug } = await params;
  const room = roomBySlug(slug);
  if (!room) notFound();

  return (
    <>
      <JsonLdBreadcrumb chiave={room.id} />
      <JsonLdHotelRoom id={room.id} />

      <header className={s.testa}>
        <h1>{room.nome}</h1>
        <p className={`t-lead ${s.testaLead}`}>{room.sottotitolo}</p>
        <p className={s.testaCorpo}>{room.corpo}</p>
      </header>

      <HotspotList tipo={room.id} className={s.areaPunti} />
      <SpecSheet tipo={room.id} className={s.areaSpec} />
    </>
  );
}
