// Scoped typographic refinement applied ONLY on the designer root container
// (never app-wide — no global font swap). Tabular numerals keep the many
// numeric inspector fields aligned; tighter tracking + antialiasing give the
// tool a more refined feel without changing the body font.
export const designerRootClass = "antialiased tracking-tight [font-feature-settings:'tnum']"
