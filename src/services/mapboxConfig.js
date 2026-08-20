/**
 * Mapbox access token.
 *
 * Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local with a free public token from
 * https://account.mapbox.com/access-tokens/ — see the "3D Biblical Atlas"
 * section of the README.
 *
 * This is a Vite app, so vite.config.js declares NEXT_PUBLIC_ as an accepted
 * env prefix alongside VITE_. Both names are read here; whichever is set wins.
 * Only ever put a *public* token (pk.…) here — everything with a client-side
 * prefix is compiled into the bundle and is visible to anyone using the app.
 */
export const MAPBOX_TOKEN =
  import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "";

export const HAS_MAPBOX_TOKEN = Boolean(MAPBOX_TOKEN);
