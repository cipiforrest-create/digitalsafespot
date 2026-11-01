// Goal ids and labels without the zod schemas, so the homepage bundle can use them without loading the validators.
export const goalIds = ['customers', 'visibility', 'website', 'response'] as const;
export const goalLabels: Record<typeof goalIds[number], string> = { customers: 'Želim više klijenata', visibility: 'AI ne preporučuje moju firmu', website: 'Web stranici treba novi izgled', response: 'Presporo odgovaramo na upite' };
