document.addEventListener("DOMContentLoaded", function () {
  mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" }
  });
});

// Re-render on instant navigation (Material's navigation.instant)
if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    mermaid.run();
  });
}
