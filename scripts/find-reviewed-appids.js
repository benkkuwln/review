// scripts/find-reviewed-appids.js
import { getAppIds, fetchReviewsForApp } from './fetch-my-reviews.js';

const MY_STEAMID = process.env.MY_STEAMID64;
if (!MY_STEAMID) {
  console.error('Missing MY_STEAMID64');
  process.exit(1);
}

async function run() {
  const appids = await getAppIds();
  if (appids.length === 0) {
    console.error('No app IDs found in tracked-appids.txt or APPIDS');
    process.exit(1);
  }

  const summary = [];
  let totalMatches = 0;

  for (const appid of appids) {
    try {
      const matches = await fetchReviewsForApp(appid);
      if (matches.length > 0) {
        totalMatches += matches.length;
        summary.push({ appid, count: matches.length, first: matches[0].review.slice(0, 120).replace(/\s+/g, ' ') });
      }
    } catch (error) {
      console.error(`Error fetching reviews for ${appid}:`, error.message || error);
    }
  }

  summary.sort((a, b) => b.count - a.count || a.appid.localeCompare(b.appid));

  console.log(`Checked ${appids.length} app IDs.`);
  console.log(`Found ${totalMatches} matching review(s) across ${summary.length} app IDs.`);
  console.log('');

  if (summary.length === 0) {
    console.log('No matching reviews found for your Steam ID in the tracked app IDs.');
    return;
  }

  console.log('App IDs with matching reviews:');
  for (const item of summary) {
    console.log(`- ${item.appid}: ${item.count} review(s)`);
  }

  console.log('');
  console.log('If this list is shorter than your total review count, add the missing reviewed app IDs to tracked-appids.txt or APPIDS.');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});