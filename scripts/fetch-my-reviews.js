// scripts/fetch-my-reviews.js
import fs from 'fs/promises';
const MY_STEAMID = process.env.MY_STEAMID64;
const APPIDS_SECRET = (process.env.APPIDS || '').split(',').map(s=>s.trim()).filter(Boolean);

if (!MY_STEAMID) {
  console.error('Missing MY_STEAMID64');
  process.exit(1);
}

async function readTracked(){
  try {
    const txt = await fs.readFile('tracked-appids.txt', 'utf8');
    return txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  } catch(e){
    return [];
  }
}

async function fetchReviewsForApp(appid){
  const perPage = 100;
  let cursor = '*';
  const found = [];
  for (let page=0; page<10; page++){
    const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&filter=recent&num_per_page=${perPage}&cursor=${encodeURIComponent(cursor)}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!data || !data.reviews) break;
    for (const r of data.reviews){
      if (r.author && String(r.author.steamid) === String(MY_STEAMID)) {
        found.push({ appid, ...r });
      }
    }
    if (!data.cursor || data.reviews.length === 0) break;
    if (data.cursor === cursor) break;
    cursor = data.cursor;
  }
  return found;
}

(async ()=>{
  const tracked = await readTracked();
  const appids = Array.from(new Set([...APPIDS_SECRET, ...tracked]));
  if (appids.length === 0) {
    console.error('Missing APPIDS and tracked-appids.txt is empty');
    process.exit(1);
  }
  const out = { generated_at: Date.now(), mySteamId: MY_STEAMID, reviews: [] };
  for (const appid of appids){
    try {
      const arr = await fetchReviewsForApp(appid);
      if (arr.length) out.reviews.push(...arr);
    } catch(e){
      console.error('Error fetching', appid, e);
    }
  }
  await fs.mkdir('public/data', { recursive: true });
  await fs.writeFile('public/data/my-reviews.json', JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote public/data/my-reviews.json with', out.reviews.length, 'reviews');
})();