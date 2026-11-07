(function () {
  const prefixes = ['bis_', '__processed_'];
  document.querySelectorAll('*').forEach((el) => {
    for (let i = el.attributes.length - 1; i >= 0; i--) {
      const attr = el.attributes[i];
      if (prefixes.some((p) => attr.name.startsWith(p))) {
        el.removeAttribute(attr.name);
      }
    }
  });
})();
