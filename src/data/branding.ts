// Shared branding constants supporting relative paths on GitHub Pages and custom domains
export const BRAND_NAME = 'GASTRO inox BAU';
export const BRAND_TAGLINE = 'Fabryka Zabudów Przyczep Gastronomicznych • Made in Poland';

// Automatically prepends Vite BASE_URL (e.g. './' or '/subfolder/') so images never 404 on GitHub Pages
const baseUrl = import.meta.env.BASE_URL || '/';
const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const LOGO_URL = `${cleanBase}assets/aistudio/images__2__6454eab5.jpeg`;
