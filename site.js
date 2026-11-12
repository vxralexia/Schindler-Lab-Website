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
