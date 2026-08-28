/**
 * Branding is centralised so the working name can be changed in one place.
 * In the deployed product these values come from environment variables
 * (VITE_BRAND_NAME, VITE_BRAND_INSTITUTION) with these as the defaults.
 */
export const BRAND = {
  name: 'AttachHub',
  shortName: 'AH',
  tagline: 'University industrial attachment management',
  institution: 'Global University',
  supportEmail: 'attachments@university.edu'
} as const;