import type { APIRoute } from 'astro';
import { renderSiteCard } from '../../lib/og';

export const GET: APIRoute = async () => {
  const body = await renderSiteCard();
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/jpeg' } });
};
