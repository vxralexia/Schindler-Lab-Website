/* Homepage "On LinkedIn" row: turns the posts in data/linkedin-posts.js into embedded posts */
(function () {
  var row = document.getElementById("li-posts");
  if (!row) return;
  var data = window.LINKEDIN || {};

  // Accepts the "Embed this post" code, an embed link, or a normal post link.
  function embedUrl(raw) {
    raw = String(raw || "").trim();
    if (!raw) return "";
    var src = raw.match(/src="([^"]+)"/);
    if (src) raw = src[1];
    if (/linkedin\.com\/embed\/feed\/update\//.test(raw)) return raw.split("?")[0];
    var urn = raw.match(/urn(?::|%3A)li(?::|%3A)(activity|share|ugcPost)(?::|%3A)(\d{10,})/i);
    if (urn) return "https://www.linkedin.com/embed/feed/update/urn:li:" + urn[1] + ":" + urn[2];
    var act = raw.match(/(activity|share|ugcPost)[-:](\d{10,})/i);
    if (act) return "https://www.linkedin.com/embed/feed/update/urn:li:" + act[1] + ":" + act[2];
    return "";
  }

  var posts = (data.posts || []).map(function (p) { return embedUrl(p.post); }).filter(Boolean);
  if (!posts.length) {
    row.innerHTML = '<p class="li-empty">Posts will appear here soon.</p>';
  } else {
    row.innerHTML = posts.map(function (u) {
      return '<div class="li-card"><iframe src="' + u + '" title="LinkedIn post" loading="lazy" allowfullscreen></iframe></div>';
    }).join("");
  }

  var follow = document.getElementById("li-follow");
  if (follow) {
    if (data.profile) follow.href = data.profile;
    else follow.parentNode.style.display = "none";
  }

  var prev = document.querySelector(".li-prev"), next = document.querySelector(".li-next");
  function step(dir) {
    var card = row.querySelector(".li-card");
    var w = card ? card.getBoundingClientRect().width + 20 : 340;
    row.scrollBy({ left: dir * w, behavior: "smooth" });
  }
  function update() {
    var scrollable = row.scrollWidth > row.clientWidth + 4;
    prev.hidden = next.hidden = !scrollable;
    prev.disabled = row.scrollLeft < 8;
    next.disabled = row.scrollLeft + row.clientWidth > row.scrollWidth - 8;
  }
  if (prev && next) {
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
