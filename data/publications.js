/* Publications page: topic menu, year filter, search, grouped by year.
   The papers themselves live in data/publications.js. */
(function () {
  var TOPICS = [
    ["all", "All"],
    ["com", "Carbonyl-Olefin Metathesis (COM)"],
    ["total-synthesis", "Total Synthesis and Natural Products"],
    ["photochemistry", "Photochemistry and Heterocycles"],
    ["electrochemistry", "Electrochemistry and Technology Development"],
    ["desulfurization", "Desulfurization"],
    ["bc-cancer", "BC Cancer Research"]
  ];
  // Newest first: year, then exact publication date (when known), then the old list number.
  function sortKey(p) {
    var y = String(p.year || 0);
    var d = p.date && p.date.indexOf(y) === 0 ? p.date.slice(0, 10) : "";
    var s = ("000000" + (p.seq || 0)).slice(-6);
    return y + "|" + d + "|" + s;
  }
  var pubs = (window.PUBLICATIONS || []).filter(function (p) { return !p.hidden; }).sort(function (a, b) {
    var ka = sortKey(a), kb = sortKey(b);
    return ka < kb ? 1 : ka > kb ? -1 : 0;
  });
  var state = { topic: "all", year: "all", q: "" };

  var tabsEl = document.getElementById("pub-topics");
  var yearsEl = document.getElementById("pub-years");
  var searchEl = document.getElementById("pub-search");
  var headEl = document.getElementById("pub-heading");
  var countEl = document.getElementById("pub-count");
  var listEl = document.getElementById("pub-list");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function topicName(id) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][0] === id) return TOPICS[i][1];
    return id;
  }
  function inTopic(p) {
    return state.topic === "all" || (p.topics || []).indexOf(state.topic) !== -1;
  }
  function matchesSearch(p) {
    if (!state.q) return true;
    var hay = (p.title + " " + p.authors + " " + p.journal + " " + p.year).toLowerCase();
    return state.q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  // Topic menu
  TOPICS.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = t[1];
    b.dataset.topic = t[0];
    b.addEventListener("click", function () {
      state.topic = t[0];
      state.year = "all";
      try { history.replaceState(null, "", t[0] === "all" ? location.pathname : "#" + t[0]); } catch (e) {}
      render();
    });
    tabsEl.appendChild(b);
  });

  searchEl.addEventListener("input", function () {
    state.q = searchEl.value.trim().toLowerCase();
    render();
  });

  function renderYears(papers) {
    var years = [];
    papers.forEach(function (p) { if (years.indexOf(p.year) === -1) years.push(p.year); });
    years.sort(function (a, b) { return b - a; });
    yearsEl.innerHTML = "";
    ["all"].concat(years).forEach(function (y) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = y === "all" ? "All years" : y;
      if (String(state.year) === String(y)) b.className = "on";
      b.addEventListener("click", function () { state.year = y; render(); });
      yearsEl.appendChild(b);
    });
  }

  function citation(p) {
    var bits = [];
    if (p.journal) bits.push("<em>" + esc(p.journal) + "</em>");
    var vy = [p.year, p.volume, p.pages].filter(function (x) { return x; }).map(esc).join(", ");
    if (vy) bits.push(vy);
    return bits.join(" ");
  }

  function render() {
    Array.prototype.forEach.call(tabsEl.children, function (b) {
      b.classList.toggle("on", b.dataset.topic === state.topic);
      b.setAttribute("aria-pressed", b.dataset.topic === state.topic);
    });
    var topicPapers = pubs.filter(inTopic);
    renderYears(topicPapers);
    var shown = topicPapers.filter(function (p) {
      return (state.year === "all" || String(p.year) === String(state.year)) && matchesSearch(p);
    });
    headEl.textContent = state.topic === "all" ? "All Publications" : topicName(state.topic);
    countEl.textContent = shown.length + (shown.length === 1 ? " paper" : " papers");

    if (!shown.length) {
      listEl.innerHTML = '<p class="pub-empty">No papers found' +
        (state.q ? " for “" + esc(state.q) + "”" : " in this category yet") + ".</p>";
      return;
    }
    var byYear = {};
    shown.forEach(function (p) { (byYear[p.year] = byYear[p.year] || []).push(p); });
    var html = "";
    Object.keys(byYear).sort(function (a, b) { return b - a; }).forEach(function (y) {
      html += '<section class="pub-year"><h3>' + esc(y) + '</h3><ul>';
      byYear[y].forEach(function (p) {
        var tags = (p.topics || []).map(function (t) {
          return '<span class="pub-tag">' + esc(topicName(t)) + "</span>";
        }).join("");
        var link = p.doi ? '<a href="https://doi.org/' + esc(p.doi) + '" target="_blank" rel="noopener">View paper (DOI: ' + esc(p.doi) + ") &#8599;</a>" : "";
        html += '<li class="pub"><button type="button" class="pub-toggle" aria-expanded="false">' +
          '<span class="chev" aria-hidden="true"></span><span class="pub-title">' + esc(p.title) + "</span></button>" +
          '<p class="pub-meta">' + esc(p.authors) + (citation(p) ? (/\.\s*$/.test(p.authors) ? " " : ". ") + citation(p) : "") + "</p>" +
          '<div class="pub-more">' + (link ? "<p>" + link + "</p>" : "") + (tags ? '<p class="pub-tags">' + tags + "</p>" : "") + "</div></li>";
      });
      html += "</ul></section>";
    });
    listEl.innerHTML = html;
  }

  // Expand / collapse a paper
  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".pub-toggle");
    if (!btn) return;
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    btn.parentNode.classList.toggle("open", !open);
  });

  // Open a topic straight from a link like publications.html#com
  function fromHash() {
    var h = location.hash.replace("#", "");
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][0] === h) state.topic = h;
  }
  window.addEventListener("hashchange", function () { fromHash(); state.year = "all"; render(); });
  fromHash();
  render();
})();
