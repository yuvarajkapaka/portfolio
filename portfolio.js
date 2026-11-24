/* YUVARAJ KAPAKA — Issue 04. Behaviour for the magazine layout. */
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePtr = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Cover: split the masthead into letters for the rise. ---------- */
  $$(".mh").forEach(mh => {
    const text = mh.textContent; mh.textContent = "";
    [...text].forEach((ch, i) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.style.setProperty("--i", i); mh.append(s); });
  });

  /* ---------- Barcodes (decorative), from a fixed seed so they never change. ---------- */
  $$(".barcode").forEach((svg, n) => {
    let seed = 7 + n * 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let x = 0, i = 0; const NS = "http://www.w3.org/2000/svg";
    while (x < 116) {
      const w = [1, 1, 2, 3][Math.floor(rnd() * 4)];
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x); r.setAttribute("y", 0); r.setAttribute("width", w); r.setAttribute("height", i % 9 === 0 ? 44 : 38);
      r.style.setProperty("--i", i++); svg.append(r);
      x += w + [1, 2, 2, 3][Math.floor(rnd() * 4)];
    }
  });

  /* ---------- Running header: paper style off the cover, live page number. ---------- */
  const runner = $("#runner"), cover = $("#top"), pageNo = $("#pageNo");
  const pages = $$("[data-page]");
  const navLinks = $$(".runner-nav a");
  const onScroll = () => {
    runner.classList.toggle("on-paper", cover.getBoundingClientRect().bottom <= runner.offsetHeight);
    // Current page = the last section whose top has passed 40% of the viewport.
    const mark = innerHeight * .4;
    let cur = pages[0];
    for (const p of pages) if (p.getBoundingClientRect().top <= mark) cur = p;
    if (pageNo && pageNo.textContent !== cur.dataset.page) pageNo.textContent = cur.dataset.page;
    const id = cur.closest("#features") ? "features" : cur.id;
    navLinks.forEach(a => a.toggleAttribute("aria-current", a.hash === "#" + id));
  };
  let tick = 0;
  addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; onScroll(); }); }, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  requestAnimationFrame(onScroll);

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn"), menu = $("#mobileMenu");
  if (menuBtn && menu) {
    const set = open => {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "Close" : "Menu";
      menu.hidden = !open; document.body.classList.toggle("menu-open", open);
      if (open) menu.querySelector("a")?.focus({ preventScroll: true });
    };
    menuBtn.addEventListener("click", () => set(menuBtn.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { set(false); menuBtn.focus(); } });
    matchMedia("(min-width: 901px)").addEventListener("change", e => { if (e.matches) set(false); });
  }

  /* ---------- Reveals (titles, figures, pull quotes, contents) ---------- */
  $$(".toc li").forEach((li, i) => li.style.setProperty("--i", i));
  const revealEls = $$(".reveal-title, .f-fig, .pull, .toc");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries, obs) => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in"); obs.unobserve(e.target);
      // After the first reveal, switching screenshots re-pins callouts without the long delay.
      if (e.target.matches(".f-fig")) setTimeout(() => e.target.classList.add("is-revealed"), 1600);
    }), { rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add("is-in"));

  /* ---------- Screenshot galleries ---------- */
  $$(".shot-gallery").forEach(g => {
    const imgs = $$("img[data-shot]", g), notes = $$(".callouts[data-shot]", g);
    g.querySelector(".shot-tabs")?.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $$(".shot-tabs button", g).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      imgs.forEach(img => { img.hidden = img.dataset.shot !== b.dataset.shot; if (!img.hidden && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; } });
      notes.forEach(ol => { ol.hidden = ol.dataset.shot !== b.dataset.shot; });
    });
  });

  /* ---------- "Open live" cursor over screenshots with a live site ---------- */
  const vc = $(".view-cursor");
  if (vc && finePtr) {
    $$(".f-fig[data-href]").forEach(fig => {
      const stage = $(".shot-stage", fig); if (!stage) return;
      stage.addEventListener("pointermove", e => { vc.classList.add("is-on"); vc.style.setProperty("--cx", e.clientX + "px"); vc.style.setProperty("--cy", e.clientY + "px"); });
      stage.addEventListener("pointerleave", () => vc.classList.remove("is-on"));
      stage.addEventListener("click", () => window.open(fig.dataset.href, "_blank", "noopener"));
    });
  }

  /* ---------- Dubbing diagram: bars, play while visible, step highlight ---------- */
  const dub = $("#dubDemo");
  if (dub) {
    $$(".dub-bars", dub).forEach((bars, row) => {
      let seed = 3 + row * 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const n = 64;
      for (let i = 0; i < n; i++) {
        const t = i / n, env = Math.max(...[.12, .3, .48, .66, .84].map(c => Math.exp(-(((t - c) / .07) ** 2))));
        const b = document.createElement("i");
        b.style.setProperty("--h", (8 + env * (40 + rnd() * 50)).toFixed(0) + "%");
        b.style.setProperty("--i", i); bars.append(b);
      }
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => dub.classList.toggle("is-playing", e.isIntersecting), { threshold: .3 }).observe(dub);
    $$(".dub-steps li", dub).forEach(li => {
      li.addEventListener("pointerenter", () => { dub.classList.add("has-hl"); $$(`.dub-row[data-part="${li.dataset.step}"]`, dub).forEach(r => r.classList.add("is-hl")); });
      li.addEventListener("pointerleave", () => { dub.classList.remove("has-hl"); $$(".dub-row.is-hl", dub).forEach(r => r.classList.remove("is-hl")); });
    });
  }

  /* ---------- Index: every tool, with the feature pages that used it ----------
     index.html ships this pre-rendered (tools/build-index.mjs), so nothing shifts
     on load; this only fills it if the markup is missing. Edit `terms` here,
     then run `node tools/build-index.mjs`. */
  const idx = $("#skillIndex");
  if (idx && !idx.firstElementChild) {
    // Page numbers: 3 DukaanShoot, 4 Campus Connect, 5 Telugu Dub Studio, 6 FINOVA, 9 Colophon.
    const P = { "3": "#f1", "4": "#f2", "5": "#f3", "6": "#f4", "9": "#colophon" };
    const terms = {
      "C": [], "CSS": ["3", "4", "5", "6"], "Demucs": ["5"], "Docker": ["5"], "Express.js": ["6"],
      "FastAPI": ["5"], "FFmpeg": ["5"], "Framer Motion": ["3", "4", "5"], "Git": ["3", "4", "5", "6"],
      "GitHub": ["3", "4", "5", "6"], "HTML": ["3", "4", "5", "6"], "Hugging Face Transformers": ["5"],
      "IndicF5": ["5"], "Java": [], "JavaScript": ["5", "6"], "Large language models": ["5", "9"], "MongoDB": [],
      "Next.js": ["3", "4"], "next-intl": ["3"], "Node.js": ["6"], "Playwright": ["5"], "PostgreSQL": ["3"],
      "pyannote": ["5"], "Python": ["5"], "PyTorch": ["5"], "React": ["3", "4", "5", "6"],
      "Recharts": ["6"], "SQL": ["3", "4", "9"], "SQLite": ["4"], "Supabase": ["3"],
      "Tailwind CSS": ["3", "4", "5", "6"], "TypeScript": ["3", "4"], "Vite": ["5", "6"], "Wav2Lip": ["5"],
      "Whisper": ["5"], "Zustand": ["3"]
    };
    const groups = {};
    Object.keys(terms).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })).forEach(t => {
      const L = t[0].toUpperCase(); (groups[L] ||= []).push(t);
    });
    idx.innerHTML = Object.entries(groups).map(([L, list]) =>
      `<div class="idx-group"><p class="idx-letter" aria-hidden="true">${L}</p>` +
      list.map(t => `<p class="idx-row"><span class="term">${t}</span><span class="dots" aria-hidden="true"></span><span class="pp">${
        terms[t].length ? terms[t].map(p => `<a href="${P[p]}" aria-label="${t}, page ${p}">${p}</a>`).join(", ") : "<em>coursework</em>"
      }</span></p>`).join("") + `</div>`).join("");
  }

  /* ---------- Copy email, local time, year ---------- */
  const copyBtn = $(".copy-email"), status = $("#copyStatus");
  if (copyBtn) {
    let t = 0;
    copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(copyBtn.dataset.email); }
      catch { location.href = `mailto:${copyBtn.dataset.email}`; return; }
      copyBtn.classList.add("is-copied"); if (status) status.textContent = "Email address copied";
      clearTimeout(t); t = setTimeout(() => { copyBtn.classList.remove("is-copied"); if (status) status.textContent = ""; }, 1800);
    });
  }
  const timeEl = $("#localTime");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const tickTime = () => { timeEl.textContent = fmt.format(new Date()) + " IST"; };
    tickTime(); setInterval(tickTime, 30000);
  }
  const year = $("#year"); if (year) year.textContent = String(new Date().getFullYear());
})();
