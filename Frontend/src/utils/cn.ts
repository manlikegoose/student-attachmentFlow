import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Conditional class composition with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  const flat: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value && value !== 0) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    flat.push(String(value));
  };
  inputs.forEach(walk);
  return twMerge(flat.join(' '));
}