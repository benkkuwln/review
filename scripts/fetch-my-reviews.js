import fs from 'fs/promises';

const MY_STEAMID = process.env.MY_STEAMID64;
const APPIDS = (process.env.APPIDS || '').split(',').map(s=>s.trim()).filter(Boolean);
if (!MY_STEAMID || APPIDS.length===0) {
  console.error('Missing MY_STEAMID64 or APPIDS');
  process.exit(1);
}

async function fetchReviewsForApp(appid) {
  const perPage = 100;
  let cursor = '*';
  const found = [];
  for (let page = 0; page < 10; page++) { // safety limit
    const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&filter=recent&num_per_page=${perPage}&cursor=${encodeURIComponent(cursor)}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!data || !data.reviews) break;
    for (const r of data.reviews) {
      if (r.author && String(r.author.steamid) === String(MY_STEAMID)) found.push({ appid, ...r });
    }
    if (!data.cursor || data.reviews.length === 0) break;
    if (data.cursor === cursor) break;
    cursor = data.cursor;
  }
  return found;
}

(async () => {
  try {
    const out = { generated_at: Date.now(), mySteamId: MY_STEAMID, reviews: [] };
    for (const appid of APPIDS) {
      try {
        const arr = await fetchReviewsForApp(appid);
        out.reviews.push(...arr);
      } catch (e) {
        console.error('error fetching', appid, e);
      }
    }
    // ensure public/data exists
    await fs.mkdir('public/data', { recursive: true });
    const path = 'public/data/my-reviews.json';
    const existing = await fs.readFile(path, 'utf8').catch(()=>null);
    const newJson = JSON.stringify(out, null, 2);
    if (existing !== newJson) {
      await fs.writeFile(path, newJson, 'utf8');
      console.log('Wrote', path);
    } else {
      console.log('No changes');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();