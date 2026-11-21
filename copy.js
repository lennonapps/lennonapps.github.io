// The Copy buttons beside each fingerprint.
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('button[data-copy]');
  if (!b || !navigator.clipboard) return;
  navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
    var was = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = was; }, 1400);
  });
});
