/*
 * Blocco dello scorrimento della pagina mentre un <dialog> modale è aperto.
 * Contatore: foglio e menu possono sovrapporsi, il blocco cade solo quando se ne
 * va l'ultimo. `scrollbar-gutter: stable` (globals.css) evita il salto di layout.
 * Il contenuto scorrevole del dialog usa `overscroll-behavior: contain`.
 */
let count = 0
let previous = ""

export function lockScroll(): void {
  if (typeof document === "undefined") return
  if (count === 0) {
    previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
  }
  count += 1
}

export function unlockScroll(): void {
  if (typeof document === "undefined" || count === 0) return
  count -= 1
  if (count === 0) document.documentElement.style.overflow = previous
}
