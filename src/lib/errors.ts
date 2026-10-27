import { toast } from 'sonner';
import { ApiError } from '@/api/client';

/** API error codes are stable; the texts the user reads live here. */
const MESSAGES: Record<string, string> = {
  'auth.invalid_credentials': 'Neteisingas el. paštas arba slaptažodis.',
  'auth.locked_out': 'Per daug nesėkmingų bandymų. Pabandykite po 15 minučių.',
  'auth.forbidden': 'Neturite teisės atlikti šio veiksmo.',
  'concurrency.conflict': 'Duomenys ką tik buvo pakeisti kitur. Perkraukite puslapį ir bandykite dar kartą.',
  'conflict.duplicate': 'Toks įrašas jau yra.',
  'invoice.not_editable': 'Išrašytos sąskaitos keisti ar trinti negalima – tai galima tik su juodraščiais.',
  'invoice.invalid_transition': 'Šis veiksmas negalimas esant dabartinei sąskaitos būsenai.',
  'invoice.zero_total': 'Negalima išrašyti sąskaitos su nuline suma.',
  'invoice.due_before_issue': 'Apmokėjimo terminas negali būti ankstesnis už išrašymo datą.',
  'profile.archived': 'Profilis suarchyvuotas – su juo nebegalima išrašyti sąskaitų.',
  'profile.invalid_series': 'Serija turi būti iš didžiųjų raidžių ar skaitmenų, pvz. AM.',
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    if (error.status === 429) return 'Per daug bandymų. Palaukite minutę.';
    if (error.status === 404) return 'Įrašas nerastas.';
    const firstFieldError = error.errors && Object.values(error.errors)[0]?.[0];
    return firstFieldError ?? error.message;
  }
  if (error instanceof TypeError) return 'Nepavyko susisiekti su serveriu.';
  return 'Įvyko nenumatyta klaida.';
}

export function toastError(error: unknown): void {
  toast.error(errorMessage(error));
}
