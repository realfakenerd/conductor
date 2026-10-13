# Feature Discovery HTML Report Format

The feature exploration report is rendered as a standalone HTML file in the OS temp directory (`<tmpdir>/feature-discovery-<timestamp>.html`). Tailwind CSS and Mermaid are imported via CDNs. It presents the **Value-Effort Quadrant**, candidate cards, workflow/architectural impact diagrams, and execution handoffs.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Feature Discovery: {{repo_name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .quadrant-bg { background: radial-gradient(circle at 50% 50%, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 100%); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans antialiased">
    <main class="max-w-6xl mx-auto px-6 py-12 space-y-12">
      <!-- Header -->
      <header class="border-b border-stone-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span class="text-xs font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Conductor Feature Discovery
          </span>
          <h1 class="text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">{{repo_name}}</h1>
          <p class="text-stone-500 text-sm mt-1">Exploration run at {{timestamp}} &middot; {{total_candidates}} candidate proposals formulated</p>
        </div>
      </header>

      <!-- Value-Effort Matrix Section -->
      <section id="matrix" class="space-y-4">
        <h2 class="text-xl font-bold text-stone-900">Value vs. Effort Matrix</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Quick Wins (High Value, Low Effort) -->
          <div class="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-emerald-200/60">
              <span class="font-bold text-emerald-800 text-sm uppercase tracking-wide">Quick Wins</span>
              <span class="text-xs text-emerald-600 font-medium">High Value &middot; Low Effort</span>
            </div>
            <ul class="space-y-2 text-sm text-stone-700">
              <!-- Item repeat -->
              <li class="font-medium flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{{candidate_title}}</span>
              </li>
            </ul>
          </div>

          <!-- Strategic Bets (High Value, High Effort) -->
          <div class="p-5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-blue-200/60">
              <span class="font-bold text-blue-800 text-sm uppercase tracking-wide">Strategic Bets</span>
              <span class="text-xs text-blue-600 font-medium">High Value &middot; High Effort</span>
            </div>
            <ul class="space-y-2 text-sm text-stone-700">
              <!-- Item repeat -->
              <li class="font-medium flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{{candidate_title}}</span>
              </li>
            </ul>
          </div>

          <!-- Tactical Fill-ins (Low Value, Low Effort) -->
          <div class="p-5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-amber-200/60">
              <span class="font-bold text-amber-800 text-sm uppercase tracking-wide">Tactical Fill-ins</span>
              <span class="text-xs text-amber-600 font-medium">Moderate Value &middot; Low Effort</span>
            </div>
            <ul class="space-y-2 text-sm text-stone-700">
              <!-- Item repeat -->
              <li class="font-medium flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{{candidate_title}}</span>
              </li>
            </ul>
          </div>

          <!-- De-prioritized (Low Value, High Effort) -->
          <div class="p-5 rounded-xl border border-stone-200 bg-stone-100/60 shadow-sm">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-stone-300">
              <span class="font-bold text-stone-600 text-sm uppercase tracking-wide">De-prioritized</span>
              <span class="text-xs text-stone-500 font-medium">Low Value &middot; High Effort</span>
            </div>
            <p class="text-xs text-stone-500 italic">No candidates parked here.</p>
          </div>
        </div>
      </section>

      <!-- Candidate Proposals -->
      <section id="candidates" class="space-y-8">
        <h2 class="text-xl font-bold text-stone-900">Feature Proposals</h2>

        <!-- Candidate Card -->
        <article class="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Top Recommendation</span>
                <span class="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700">Quick Win</span>
              </div>
              <h3 class="text-2xl font-bold text-stone-900 mt-2">{{candidate_title}}</h3>
            </div>
            <div class="text-sm text-stone-500">
              <span>Seams: </span><code class="font-mono text-xs bg-stone-100 px-2 py-1 rounded">{{seams}}</code>
            </div>
          </div>

          <!-- Problem & Solution Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div class="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span class="font-semibold text-stone-900 block mb-1">Opportunity / Problem</span>
              <p class="text-stone-600 leading-relaxed">{{opportunity_description}}</p>
            </div>
            <div class="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span class="font-semibold text-stone-900 block mb-1">Proposed Capability</span>
              <p class="text-stone-600 leading-relaxed">{{capability_description}}</p>
            </div>
          </div>

          <!-- Mermaid Architecture / Workflow Visual -->
          <div class="space-y-2">
            <span class="font-semibold text-stone-900 text-sm">Interaction / Architecture Flow</span>
            <div class="p-4 bg-stone-50 rounded-xl border border-stone-100 flex justify-center">
              <pre class="mermaid">
flowchart LR
    A["Existing Seam"] --> B["New Capability"]
    B --> C["User / Agent Value"]
              </pre>
            </div>
          </div>

          <!-- Expected Wins -->
          <div class="pt-2">
            <span class="font-semibold text-stone-900 text-sm block mb-2">Key Value Wins</span>
            <ul class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <li class="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-stone-700 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{{win_1}}</span>
              </li>
              <li class="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-stone-700 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{{win_2}}</span>
              </li>
              <li class="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-stone-700 font-medium flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{{win_3}}</span>
              </li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  </body>
</html>
```
