/* Homepage "On LinkedIn": builds clean cards from data/linkedin-posts.js and runs the arrows. */
(function () {
  var track = document.getElementById("li-track");
  if (!track) return;
  var data = window.LINKEDIN || {};
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function monthYear(d) {
    var m = /^(\d{4})-(\d{1,2})/.exec(d || "");
    return m ? MONTHS[parseInt(m[2], 10) - 1] + " " + m[1] : esc(d);
  }
  var IN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';

  var posts = (data.posts || []).filter(function (p) { return p.link; })
    .sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });

  if (!posts.length) {
    track.innerHTML = '<p class="li-empty">Posts will appear here soon.</p>';
  } else {
    track.innerHTML = posts.map(function (p) {
      var top = p.image
        ? '<img class="li-thumb" src="' + esc(p.image) + '" alt="" loading="lazy">'
        : '<div class="li-thumb li-thumb-plain">' + IN + "</div>";
      return '<a class="li-card" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + top +
        '<div class="li-body">' +
          '<div class="li-meta"><span class="li-badge">' + IN + "</span>LinkedIn" +
            (p.date ? ' <span class="li-date">· ' + monthYear(p.date) + "</span>" : "") + "</div>" +
          '<p class="li-text">' + esc(p.text || "View this post on LinkedIn.") + "</p>" +
          '<span class="li-more">View post <span aria-hidden="true">&#8599;</span></span>' +
        "</div></a>";
    }).join("");
  }

  var follow = document.getElementById("li-follow");
  if (follow) {
    if (data.profile) follow.href = data.profile;
    else follow.parentNode.style.display = "none";
  }

  var box = track.parentNode;
  var prev = box.querySelector(".li-prev"), next = box.querySelector(".li-next");
  function step() {
    var card = track.querySelector(".li-card");
    if (!card) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }
  function update() {
    var max = track.scrollWidth - track.clientWidth - 2;
    var scrollable = max > 2;
    prev.hidden = next.hidden = !scrollable;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  }
  if (prev && next) {
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
