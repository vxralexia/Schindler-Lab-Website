/* Homepage "Latest News": builds the cards from data/news.js and runs the arrows. */
(function () {
  var track = document.getElementById("news-track");
  if (!track) return;
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

  var items = (window.NEWS || []).slice().sort(function (a, b) {
    return (b.date || "").localeCompare(a.date || "");
  });
  track.innerHTML = items.map(function (n) {
    var thumb = n.image
      ? '<img class="thumb" src="' + esc(n.image) + '" alt="" loading="lazy">'
      : '<div class="thumb">Photo</div>';
    var more = n.link ? '<p><a href="' + esc(n.link) + '" target="_blank" rel="noopener">Read more &#8599;</a></p>' : "";
    return '<article class="card news-card">' + thumb + '<div class="body">' +
      '<div class="meta">' + esc(n.type || "News") + ' <span class="news-date">· ' + monthYear(n.date) + "</span></div>" +
      "<h3>" + esc(n.title) + "</h3>" + more + "</div></article>";
  }).join("");

  var box = track.parentNode;
  var prev = box.querySelector(".news-prev");
  var next = box.querySelector(".news-next");
  function step() {
    var card = track.querySelector(".news-card");
    if (!card) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }
  function update() {
    var max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
    box.classList.toggle("news-static", track.scrollWidth <= track.clientWidth + 2);
  }
  prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
