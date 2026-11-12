/* Schindler Group site scripts: homepage photo slider */
document.querySelectorAll('.slider').forEach(function (slider) {
  var track = slider.querySelector('.slides');
  var slides = slider.querySelectorAll('.slide');
  var dotsBox = slider.querySelector('.dots');
  var index = 0;
  if (slides.length < 2) {
    slider.querySelectorAll('.slider-btn, .dots').forEach(function (el) { el.style.display = 'none'; });
    return;
  }
  var dots = [];
  slides.forEach(function (_, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Show photo ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dotsBox.appendChild(d);
    dots.push(d);
  });
  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-100 * index) + '%)';
    dots.forEach(function (d, j) { d.classList.toggle('on', j === index); });
  }
  slider.querySelector('.prev').addEventListener('click', function () { go(index - 1); });
  slider.querySelector('.next').addEventListener('click', function () { go(index + 1); });
  go(0);
});


/* ---------- Phone menu: ☰ button and tap-to-open dropdowns ---------- */
(function () {
  var header = document.querySelector("header.site");
  if (!header || header.querySelector(".nav-toggle")) return;
  var nav = header.querySelector("nav");
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-label", "Open menu");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = "<span></span><span></span><span></span>";
  header.querySelector(".wrap").appendChild(btn);

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  btn.addEventListener("click", function () { setOpen(!header.classList.contains("nav-open")); });

  // Arrow button next to each item that has a dropdown
  nav.querySelectorAll("li.has-sub").forEach(function (li) {
    var t = document.createElement("button");
    t.type = "button";
    t.className = "sub-toggle";
    t.setAttribute("aria-label", "Show " + li.querySelector("a").textContent.trim() + " pages");
    t.setAttribute("aria-expanded", "false");
    li.insertBefore(t, li.querySelector(".sub"));
    t.addEventListener("click", function () {
      var open = !li.classList.contains("sub-open");
      li.classList.toggle("sub-open", open);
      t.setAttribute("aria-expanded", String(open));
    });
  });

  // Close the menu after choosing a link, on Escape, or when tapping outside it
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  document.addEventListener("click", function (e) { if (!header.contains(e.target)) setOpen(false); });
})();
