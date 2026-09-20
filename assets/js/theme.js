(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme !== "dark" && theme !== "light")
      theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "light";
  }
})();
