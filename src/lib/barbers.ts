/**
 * Fonte única dos barbeiros/administradores no CLIENTE e nas rotas /api.
 *
 * IMPORTANTE: mantenha esta lista igual à função isMaster() do firestore.rules.
 * Alternativa mais limpa no futuro: custom claim "barber" (veja provider.tsx),
 * que dispensa lista fixa no código.
 */
export const BARBER_UIDS: readonly string[] = [
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1',
  'wWlt2ixyjwfLqDHDQFFNQgaYfCT2',
];

export function isBarberUid(uid: string | null | undefined): boolean {
  return !!uid && BARBER_UIDS.includes(uid);
}
