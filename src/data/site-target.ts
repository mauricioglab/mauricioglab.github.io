export const isCompanyBuild = process.env.SITE_TARGET === 'company';

export const PERSONAL_ORIGIN = 'https://mauricioglab.github.io';
export const COMPANY_ORIGIN = 'https://velocitylab.com.ar';

// Portada de cada dominio: Servicios en empresa, la home de clusters en personal.
export const homeHref = (lang: string = 'es') => (isCompanyBuild ? `/${lang}/servicios/` : '/');
