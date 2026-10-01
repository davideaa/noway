"use client";

/*
 * «Cerca la {camera}» (UX 5.3): preimposta la camera e gli ospiti nel foglio/barra di
 * prenotazione con `chooseRoom`. È un VERO link a /prenota/: senza JavaScript, o con Ctrl/Cmd/clic
 * centrale, porta alla pagina Prenota. Il motore non ha un parametro per il tipo di camera
 * (UX 6.6): la scelta preimposta solo gli ospiti, e il foglio lo dice con la sua riga.
 */
import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useBookingOptional } from "@/components/booking/BookingProvider";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { RoomId } from "@/content/types";

type Props = Pick<ButtonProps, "variant" | "size" | "full" | "className"> & {
  tipo: RoomId;
  children: ReactNode;
  "aria-label"?: string;
};

export function ChooseRoomButton({ tipo, children, variant = "brand", size = "md", ...rest }: Props) {
  const booking = useBookingOptional();
  const onClick = (e: MouseEvent<HTMLElement>) => {
    if (!booking) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    booking.chooseRoom(tipo);
  };
  return (
    <Button asChild variant={variant} size={size} onClick={onClick} {...rest}>
      <Link href="/prenota/">{children}</Link>
    </Button>
  );
}
