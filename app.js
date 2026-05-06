async function load() {
  try {
    const res = await fetch('public/data/my-reviews.json', { cache: 'no-store' });
    if (!res.ok) { throw new Error(res.statusText); }
    const data = await res.json();
    const container = document.getElementById('reviews');
    const lu = document.getElementById('last-updated');
    lu.textContent = data && data.generated_at ? 'Last fetched: ' + new Date(data.generated_at).toLocaleString() : '';
    container.innerHTML = '';
    if (!data || !data.reviews || data.reviews.length === 0) {
      container.innerHTML = '<p>No reviews found.</p>';
      return;
    }
    for (const r of data.reviews) {
      const d = document.createElement('div');
      d.className = 'review';
      d.innerHTML = `
        <div class="meta">
          <strong>${r.voted_up ? 'Recommended' : 'Not recommended'}</strong>
          <span class="appid">AppID: ${r.appid}</span>
          <span class="date">${new Date((r.timestamp_updated||r.timestamp_created)*1000).toLocaleString()}</span>
        </div>
        <div class="play">Playtime: ${Math.round((r.author && r.author.playtime_forever || 0)/60)}h</div>
        <div class="text">${escapeHtml(r.review)}</div>
      `;
      container.appendChild(d);
    }
  } catch (e) {
    document.getElementById('reviews').innerHTML = '<p>Error loading reviews.</p>';
    console.error(e);
  }
}
function escapeHtml(s){ return s ? s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])) : ''; }
load();
// optional refresh UI every 5 minutes
setInterval(load, 5*60*1000);