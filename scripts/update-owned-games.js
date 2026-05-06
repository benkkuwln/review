// scripts/update-owned-games.js
import fs from 'fs/promises';
const key = process.env.STEAM_API_KEY;
const sid = process.env.MY_STEAMID64;
if (!key || !sid) {
  console.error('Missing STEAM_API_KEY or MY_STEAMID64');
  process.exit(1);
}

const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(sid)}&include_played_free_games=true&include_appinfo=false`;

async function run(){
  const res = await fetch(url);
  if (!res.ok) { console.error('ownedgames fetch failed', res.status); process.exit(1); }
  const data = await res.json();
  const games = (data?.response?.games || []).filter(g => g.playtime_forever && g.playtime_forever > 0).map(g => String(g.appid));
  // read existing tracked-appids
  let existing = [];
  try {
    const txt = await fs.readFile('tracked-appids.txt', 'utf8');
    existing = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  } catch(e){ /* ignore */ }
  const union = Array.from(new Set([...existing, ...games]));
  // write back if changed
  const out = union.join('\n') + '\n';
  if (out !== (existing.join('\n') + (existing.length ? '\n' : ''))) {
    await fs.writeFile('tracked-appids.txt', out, 'utf8');
    console.log('Updated tracked-appids.txt with', union.length, 'appids');
  } else {
    console.log('No change to tracked-appids.txt');
  }
}
run().catch(e=>{ console.error(e); process.exit(1); });