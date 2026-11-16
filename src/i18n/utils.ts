import { ui, routes, defaultLang, showDefaultLang } from "./ui";

const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Prefix a root-relative path with the site's base path (needed for GitHub Pages project sites). */
export function withBase(path: string) {
  return base + (path.startsWith("/") ? path : "/" + path);
}

/** Pathname of the URL with the base path removed. */
function stripBase(pathname: string) {
  return base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
}

export type Lang = keyof typeof ui;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = stripBase(url.pathname).split("/");
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  const localizedUI: Record<string, string> = ui[lang];
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return key in localizedUI ? localizedUI[key] : ui[defaultLang][key];
  };
}

/**
 * Build a localized URL from a canonical path (e.g. "/work/" or "/work/slug").
 * The first segment is translated via `routes` and the language prefix is added.
 */
export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, l: Lang = lang) {
    const [first, ...rest] = path.replace(/^\//, "").split("/");
    const localized = (routes[l] as Record<string, string>)[first] ?? first;
    const localizedPath = "/" + [localized, ...rest].join("/");
    return withBase(
      !showDefaultLang && l === defaultLang
        ? localizedPath
        : `/${l}${localizedPath}`,
    );
  };
}

/** Get the canonical (language-independent) path of the current URL. */
export function getCanonicalPath(url: URL): string {
  const lang = getLangFromUrl(url);
  const pathname = stripBase(url.pathname);
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === lang) segments.shift();
  const reverse = Object.fromEntries(
    Object.entries(routes[lang]).map(([key, value]) => [value, key]),
  );
  if (segments[0] && segments[0] in reverse) segments[0] = reverse[segments[0]];
  const trailing =
    pathname.endsWith("/") || segments.length === 0 ? "/" : "";
  return "/" + segments.join("/") + (segments.length ? trailing : "");
}
