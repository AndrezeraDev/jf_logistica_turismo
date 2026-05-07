/** Hotéis usados ao longo das cenas — coords em pixels da tela. */
export interface MapHotel {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  /** quantidade final de hóspedes (0 = pin azul, sem atribuição) */
  guests: number;
}

export const HOTELS: MapHotel[] = [
  { id: 'a', name: 'Hotel Laghetto Stilo Borges', address: 'Av. Borges de Medeiros, 3658', x: 950, y: 530, guests: 4 },
  { id: 'b', name: 'Hotel Casa da Montanha', address: 'Av. Borges de Medeiros, 3023', x: 870, y: 470, guests: 0 },
  { id: 'c', name: 'Pousada Viena', address: 'Rua Augusto Zatti, 161', x: 1020, y: 460, guests: 2 },
  { id: 'd', name: 'Wood Hotel', address: 'Av. das Hortênsias, 2960', x: 920, y: 590, guests: 5 },
  { id: 'e', name: 'Stillo Gramado Prieto', address: 'Rua Madre Verônica, 145', x: 1060, y: 590, guests: 0 },
  { id: 'f', name: 'Hotel Fioreze Primo', address: 'Av. Borges de Medeiros, 3650', x: 760, y: 400, guests: 6 },
  { id: 'g', name: 'Hotel Laghetto Siena', address: 'Rua Bela Vista, 235', x: 1180, y: 540, guests: 0 },
  { id: 'h', name: 'Hotel Bertoluci', address: 'Rua das Flores, 880', x: 800, y: 660, guests: 0 },
  { id: 'i', name: 'Hotel Glamour da Serra', address: 'Av. Saldanha Marinho, 950', x: 1140, y: 400, guests: 3 },
  { id: 'j', name: 'Pousada Serra Valle', address: 'Rua Pedro Toledo, 412', x: 700, y: 540, guests: 0 },
  { id: 'k', name: 'Hotel Villa Bella', address: 'Rua Ipê, 88', x: 1040, y: 700, guests: 0 },
  { id: 'l', name: 'Hotel Sky Serra', address: 'Av. Hortênsias, 4200', x: 880, y: 720, guests: 0 },
  { id: 'm', name: 'Pousada Florença', address: 'Rua Quito, 510', x: 1220, y: 640, guests: 0 },
  { id: 'n', name: 'Hotel Triveneto', address: 'Rua das Acácias, 198', x: 740, y: 290, guests: 0 },
  { id: 'o', name: 'Hotel Aconchego da Serra', address: 'Rua Bromélias, 720', x: 700, y: 320, guests: 0 },
];

export const ME = { x: 950, y: 580 };

/** Hotéis com hóspedes na ordem em que serão atribuídos na cena de modais. */
export const ASSIGNMENT_ORDER = ['d', 'a', 'c', 'i', 'f'] as const;
