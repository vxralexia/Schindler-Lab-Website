/* Gallery popup: click a photo to open it large, then use the arrows,
   the keyboard (left/right, Esc) or swipe to see the other photos. */
(function () {
  var galleries = document.querySelectorAll(".gallery");
  if (!galleries.length) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photo viewer");
  box.hidden = true;
  box.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
    '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
    '<button class="lb-next" type="button" aria-label="Next photo">&#8250;</button>' +
    '<div class="lb-count"></div>';
  document.body.appendChild(box);

  var img = box.querySelector(".lb-img");
  var cap = box.querySelector(".lb-caption");
  var count = box.querySelector(".lb-count");
  var prevBtn = box.querySelector(".lb-prev");
  var nextBtn = box.querySelector(".lb-next");
  var items = [], index = 0, opener = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var a = items[index], thumb = a.querySelector("img");
    img.src = a.getAttribute("href");
    img.alt = thumb ? thumb.alt : "";
    cap.textContent = img.alt;
    count.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";
    // Load the neighbours so arrowing through is instant
    [index + 1, index - 1].forEach(function (j) {
      var n = items[(j + items.length) % items.length];
      if (n) new Image().src = n.getAttribute("href");
    });
  }
  function open(list, i, from) {
    items = list; opener = from;
    var many = items.length > 1;
    prevBtn.hidden = nextBtn.hidden = !many;
    show(i);
    box.hidden = false;
    document.documentElement.classList.add("lb-open");
    box.querySelector(".lb-close").focus();
  }
  function close() {
    box.hidden = true;
    img.removeAttribute("src");
    document.documentElement.classList.remove("lb-open");
    if (opener) opener.focus();
  }

  galleries.forEach(function (g) {
    var links = Array.prototype.slice.call(g.querySelectorAll("a.gal-item"));
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(links, i, a);
      });
    });
  });

  prevBtn.addEventListener("click", function () { show(index - 1); });
  nextBtn.addEventListener("click", function () { show(index + 1); });
  box.querySelector(".lb-close").addEventListener("click", close);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.classList.contains("lb-figure")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });

  // Swipe on phones
  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50 && items.length > 1) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
