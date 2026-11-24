(() => {
  // Header name types itself out after the comet mark streaks in.
  {
    const brand = document.querySelector(".brand");
    const typed = brand?.querySelector(".brand-typed");
    if (typed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const full = typed.textContent;
      typed.textContent = "";
      brand.classList.add("is-typing");
      let i = 0;
      const step = () => {
        typed.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(step, full[i] === " " ? 140 : 55 + Math.random() * 45);
        else { brand.classList.remove("is-typing"); brand.classList.add("is-typed"); }
      };
      setTimeout(step, 750);
    }
  }

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Header: solid once scrolling starts; slides away once the hero is
  // behind you (it belongs to the night sky, not the paper sections).
  const header = document.getElementById("siteHeader");
  const heroEl = document.getElementById("top");
  let lastScrollY = scrollY;
  const reducedNow = matchMedia("(prefers-reduced-motion: reduce)");
  const contactEl = document.getElementById("contact");
  const onScroll = () => {
    const y = scrollY, goingDown = y > lastScrollY + 2, goingUp = y < lastScrollY - 2;
    header.classList.toggle("is-scrolled", y > 40);
    // Paper style once the header sits over the light sections.
    header.classList.toggle("on-paper", heroEl ? heroEl.getBoundingClientRect().bottom <= header.offsetHeight : false);
    const pastHero = heroEl ? heroEl.getBoundingClientRect().bottom <= header.offsetHeight : false;
    if (!pastHero || goingUp) header.classList.remove("is-hidden");
    else if (goingDown && !document.body.classList.contains("menu-open")) header.classList.add("is-hidden");
    if (goingDown || goingUp) lastScrollY = y;
    if (!reducedNow.matches) {
      // Hero exit 0→1 over the hero's height; sun rises as Contact comes up.
      if (heroEl) heroEl.style.setProperty("--exit", Math.max(0, Math.min(1, y / heroEl.offsetHeight)).toFixed(3));
      if (contactEl) {
        const r = contactEl.getBoundingClientRect();
        contactEl.style.setProperty("--rise", Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight * .8))).toFixed(3));
      }
    }
  };
  let scrollTick = 0;
  addEventListener("scroll", () => { if (!scrollTick) scrollTick = requestAnimationFrame(() => { scrollTick = 0; onScroll(); }); }, { passive: true });
  onScroll();

  // Mark the nav link for the section currently in view.
  const links = [...document.querySelectorAll(".nav-links a")];
  if ("IntersectionObserver" in window) {
    const byId = new Map(links.map(a => [a.hash.slice(1), a]));
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });

    // Project flows draw their rule once, the first time they're seen.
    const flowObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-seen");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".flow").forEach(el => flowObserver.observe(el));

    // Headlines rise out of their masks the first time they enter view.
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll("h2:has(.mask), h3:has(.mask), .contact, .project-shot, .skills").forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll(".flow").forEach(el => el.classList.add("is-seen"));
    document.querySelectorAll("h2, h3, .contact, .project-shot, .skills").forEach(el => el.classList.add("is-in"));
  }
  document.querySelectorAll(".skills > div").forEach((row, i) => row.style.setProperty("--i", i));

  /* ----------------------------------------------------------------
     Scroll-linked details below the hero:
     - About's opening line lights up word by word as it crosses the screen.
     - The education rail fills as you read down it; each dot lights when
       the fill reaches it.
     One rAF-throttled scroll handler; does nothing under reduced motion.
  ----------------------------------------------------------------- */
  const reducedScroll = matchMedia("(prefers-reduced-motion: reduce)");
  const lead = document.querySelector("[data-words]");
  let words = [];
  if (lead) {
    const text = lead.textContent;
    lead.textContent = "";
    text.trim().split(/\s+/).forEach((w, i, arr) => {
      const span = document.createElement("span");   // plain spans: screen readers still read the sentence normally
      span.className = "w"; span.textContent = w;
      lead.append(span, i < arr.length - 1 ? " " : "");
    });
    words = [...lead.querySelectorAll(".w")];
    lead.classList.add("is-split");
  }
  const timeline = document.querySelector(".timeline");
  const stops = timeline ? [...timeline.querySelectorAll("li")] : [];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  let scrollRaf = 0;
  const onScrollDetails = () => {
    scrollRaf = 0;
    const vh = innerHeight;
    if (reducedScroll.matches) {
      words.forEach(w => w.classList.add("on"));
      if (timeline) { timeline.style.setProperty("--fill", 1); stops.forEach(li => li.classList.add("is-lit")); }
      return;
    }
    if (words.length) {
      const r = lead.getBoundingClientRect();
      // 0 when the line's top is at 85% of the viewport, 1 when its bottom reaches 40%.
      const p = clamp01((vh * .85 - r.top) / (r.height + vh * .45));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    }
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp01((vh * .7 - r.top) / r.height);
      timeline.style.setProperty("--fill", p.toFixed(3));
      const fillY = r.top + r.height * p;
      stops.forEach(li => li.classList.toggle("is-lit", li.getBoundingClientRect().top + 30 <= fillY));
    }
  };
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScrollDetails); }, { passive: true });
  addEventListener("resize", onScrollDetails, { passive: true });
  reducedScroll.addEventListener("change", onScrollDetails);
  onScrollDetails();

  // Nav bar slides under whichever link is current.
  const bar = document.querySelector(".nav-bar");
  const placeBar = () => {
    const current = document.querySelector(".nav-links a[aria-current]");
    if (!bar) return;
    if (!current || current.classList.contains("nav-cta")) { bar.style.opacity = "0"; return; }
    bar.style.transform = `translateX(${current.offsetLeft}px) scaleX(${current.offsetWidth})`;
    bar.style.opacity = "1";
  };
  if (bar) {
    new MutationObserver(placeBar).observe(document.querySelector(".nav-links"), { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
    addEventListener("resize", placeBar, { passive: true });
  }

  /* ----------------------------------------------------------------
     Mobile menu: full-screen night overlay. Esc / link / button closes;
     focus moves in and returns to the button.
  ----------------------------------------------------------------- */
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (menuBtn && menu) {
    const setMenu = open => {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.querySelector("span").textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("menu-open", open);
      if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open")); menu.querySelector("a")?.focus({ preventScroll: true }); header.classList.remove("is-hidden"); }
      else { menu.classList.remove("is-open"); menu.hidden = true; }
    };
    menuBtn.addEventListener("click", () => { const open = menuBtn.getAttribute("aria-expanded") !== "true"; setMenu(open); if (!open) menuBtn.focus(); });
    menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    matchMedia("(min-width: 701px)").addEventListener("change", e => { if (e.matches) setMenu(false); });
  }

  /* ----------------------------------------------------------------
     Project constellations. Each project is a constellation whose stars
     are the tools it was built with (from the real stacks). Hover/focus a
     constellation: its lines light up and the star names appear; the
     others dim. Stars lean gently toward the pointer. The name links to
     the project.
  ----------------------------------------------------------------- */
  const skyMap = document.getElementById("skyMap");
  if (skyMap) {
    const groups = [
      { name: "FINOVA", href: "#p1", label: [.24, .42],
        stars: [["React", .10, .15], ["Vite", .26, .05], ["Tailwind CSS", .43, .15], ["Node.js", .37, .31], ["Express", .17, .34], ["Recharts", .03, .27, 1]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5]] },
      { name: "Telugu Auto-Dubbing", href: "#p2", label: [.78, .69],
        stars: [["Python", .60, .24], ["PyTorch", .79, .15], ["Whisper", .96, .31, 1], ["Demucs", .87, .47], ["FFmpeg", .66, .45], ["Hugging Face", .78, .59]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [3, 5]] },
      { name: "Campus Connect", href: "#p3", label: [.29, .93],
        stars: [["Next.js", .09, .62], ["React", .27, .56], ["TypeScript", .42, .69], ["SQLite", .33, .85], ["Tailwind CSS", .12, .86], ["Framer Motion", .52, .88]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5]] }
    ];
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    skyMap.prepend(svg);
    const all = [];   // every star: { el, gx, gy, x, y, lines: [[line, end]] }
    groups.forEach((g, gi) => {
      const wrap = document.createElement("div");
      wrap.className = "c-group";
      wrap.style.setProperty("--g", gi);
      const lineGroup = document.createElementNS(NS, "g");
      lineGroup.setAttribute("class", "c-group-lines");
      svg.append(lineGroup);
      g.stars.forEach(([name, x, y, flip], k) => {
        const el = document.createElement("span");
        el.className = "c-star" + (flip ? " flip" : "");
        el.style.setProperty("--k", k);
        el.style.setProperty("--tw", (3 + Math.random() * 3).toFixed(2) + "s");
        el.style.setProperty("--td", (-Math.random() * 4).toFixed(2) + "s");
        el.innerHTML = `<i></i><b>${name}</b><span class="c-hit"></span>`;
        el.setAttribute("aria-hidden", "true");
        wrap.append(el);
        all.push({ el, group: wrap, gx: x, gy: y, x: 0, y: 0, ox: 0, oy: 0, lines: [] });
      });
      const base = all.length - g.stars.length;
      g.edges.forEach(([a, b], k) => {
        const line = document.createElementNS(NS, "line");
        line.setAttribute("class", "c-line");
        line.setAttribute("pathLength", "1");
        line.style.setProperty("--g", gi); line.style.setProperty("--k", k);
        lineGroup.append(line);
        all[base + a].lines.push([line, 1]); all[base + b].lines.push([line, 2]);
      });
      const nameEl = document.createElement("a");
      nameEl.className = "c-name";
      nameEl.href = g.href;
      nameEl.textContent = g.name;
      nameEl.setAttribute("aria-label", `${g.name}, built with ${[...new Set(g.stars.map(s => s[0]))].join(", ")}`);
      nameEl.style.left = g.label[0] * 100 + "%";
      nameEl.style.top = g.label[1] * 100 + "%";
      wrap.append(nameEl);
      wrap._lines = lineGroup;
      skyMap.append(wrap);
    });
    const wraps = [...skyMap.querySelectorAll(".c-group")];
    const activate = w => wraps.forEach(o => {
      o.classList.toggle("is-active", o === w);
      o.classList.toggle("is-dim", !!w && o !== w);
      o._lines.classList.toggle("is-active", o === w);   // lines live in the shared SVG
      o._lines.classList.toggle("is-dim", !!w && o !== w);
    });
    wraps.forEach(w => {
      w.addEventListener("pointerenter", () => activate(w));
      w.addEventListener("pointerleave", () => activate(null));
      w.querySelector(".c-name").addEventListener("focus", () => activate(w));
      w.querySelector(".c-name").addEventListener("blur", () => activate(null));
      w.addEventListener("click", e => { if (!e.target.closest(".c-name")) { e.stopPropagation(); activate(w.classList.contains("is-active") ? null : w); } });
    });

    let mapW = 0, mapH = 0;
    const place = () => {
      for (const s of all) {
        s.x = s.gx * mapW + s.ox; s.y = s.gy * mapH + s.oy;
        s.el.style.setProperty("--sx", s.x.toFixed(1) + "px");
        s.el.style.setProperty("--sy", s.y.toFixed(1) + "px");
        for (const [line, end] of s.lines) { line.setAttribute(`x${end}`, s.x.toFixed(1)); line.setAttribute(`y${end}`, s.y.toFixed(1)); }
      }
    };
    const measure = () => { mapW = skyMap.clientWidth; mapH = skyMap.clientHeight; svg.setAttribute("viewBox", `0 0 ${mapW} ${mapH}`); place(); };
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(skyMap);

    // Stars lean toward the pointer (fine pointers, motion allowed).
    if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let pxm = -1e4, pym = -1e4, raf = 0;
      const step = () => {
        raf = 0; let moving = false;
        for (const s of all) {
          const dx = pxm - s.gx * mapW, dy = pym - s.gy * mapH, d = Math.hypot(dx, dy);
          const pull = d < 140 ? (1 - d / 140) * 10 : 0;
          const tx = d ? dx / d * pull : 0, ty = d ? dy / d * pull : 0;
          s.ox += (tx - s.ox) * .18; s.oy += (ty - s.oy) * .18;
          if (Math.abs(tx - s.ox) > .05 || Math.abs(ty - s.oy) > .05) moving = true;
        }
        place();
        if (moving) raf = requestAnimationFrame(step);
      };
      skyMap.addEventListener("pointermove", e => { const r = skyMap.getBoundingClientRect(); pxm = e.clientX - r.left; pym = e.clientY - r.top; if (!raf) raf = requestAnimationFrame(step); });
      skyMap.addEventListener("pointerleave", () => { pxm = pym = -1e4; if (!raf) raf = requestAnimationFrame(step); });
    }
  }

  /* ----------------------------------------------------------------
     Small interaction touches (fine pointers, motion allowed only):
     - the primary button leans a few px toward the cursor;
     - project screenshots tilt gently toward the cursor.
  ----------------------------------------------------------------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".magnetic").forEach(btn => {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px");
        btn.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", () => { btn.style.setProperty("--mx", "0px"); btn.style.setProperty("--my", "0px"); });
    });
    document.querySelectorAll(".about-photo").forEach(fig => {
      fig.addEventListener("pointermove", e => {
        const r = fig.getBoundingClientRect();
        fig.style.setProperty("--spx", (((e.clientX - r.left) / r.width - .5) * 18).toFixed(1) + "px");
        fig.style.setProperty("--spy", (((e.clientY - r.top) / r.height - .5) * 18).toFixed(1) + "px");
      });
      fig.addEventListener("pointerleave", () => { fig.style.setProperty("--spx", "0px"); fig.style.setProperty("--spy", "0px"); });
    });
    document.querySelectorAll(".project-shot").forEach(shot => {
      shot.addEventListener("pointermove", e => {
        const r = shot.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        shot.classList.add("is-tilting");
        shot.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        shot.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
      });
      shot.addEventListener("pointerleave", () => { shot.style.setProperty("--ry", "0deg"); shot.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ----------------------------------------------------------------
     Dubbing demo: a lit copy of each waveform is revealed by a playhead
     (CSS animates --p). Plays only while the diagram is on screen.
     Hovering a pipeline step highlights the matching part.
  ----------------------------------------------------------------- */
  const dub = document.getElementById("dubDemo");
  if (dub) {
    dub.querySelectorAll(".dub-track").forEach(track => {
      const wave = track.querySelector(".dub-wave");
      const lit = wave.cloneNode(true);
      lit.setAttribute("class", "dub-wave-lit");
      const head = document.createElement("span");
      head.className = "dub-head";
      wave.after(lit, head);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => dub.classList.toggle("is-playing", e.isIntersecting), { threshold: .4 }).observe(dub);
    }
    document.querySelectorAll(".flow li[data-step]").forEach(li => {
      const on = () => { dub.classList.add("has-hl"); dub.querySelectorAll(`[data-part="${li.dataset.step}"]`).forEach(n => n.classList.add("is-hl")); };
      const off = () => { dub.classList.remove("has-hl"); dub.querySelectorAll(".is-hl").forEach(n => n.classList.remove("is-hl")); };
      li.addEventListener("pointerenter", on); li.addEventListener("pointerleave", off);
    });
  }

  /* ----------------------------------------------------------------
     Skills filter: choose a project and the tools it used light up.
     Mapping follows the stacks listed on the site / résumé.
  ----------------------------------------------------------------- */
  const skillsDl = document.querySelector(".skills");
  if (skillsDl) {
    const uses = {
      finova: ["JavaScript", "HTML", "CSS", "React", "Tailwind CSS", "Node.js", "Express.js", "Vite", "Git", "GitHub"],
      dubbing: ["Python", "FastAPI", "Faster-Whisper", "speech recognition", "neural TTS", "Git", "GitHub"],
      campus: ["TypeScript", "HTML", "CSS", "React", "Next.js", "Tailwind CSS", "SQL", "SQLite", "Git", "GitHub"],
      dukaan: ["TypeScript", "HTML", "CSS", "React", "Next.js", "Tailwind CSS", "SQL", "PostgreSQL", "Supabase", "Git", "GitHub"]
    };
    skillsDl.querySelectorAll("dd").forEach(dd => {
      const items = dd.textContent.split(",").map(t => t.trim());
      dd.textContent = "";
      items.forEach((t, i) => {
        const s = document.createElement("span");
        s.className = "sk"; s.textContent = t;
        s.dataset.p = Object.keys(uses).filter(k => uses[k].includes(t)).join(" ");
        dd.append(s, i < items.length - 1 ? ", " : "");
      });
    });
    const bar = document.createElement("div");
    bar.className = "skill-filter";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Highlight the tools used in a project");
    bar.innerHTML = `<span>Used in</span>` +
      [["all", "All"], ["finova", "FINOVA"], ["dubbing", "Telugu Auto-Dubbing"], ["campus", "Campus Connect"], ["dukaan", "DukaanShoot"]]
        .map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === "all"}">${l}</button>`).join("") +
      `<span class="skill-count" aria-live="polite"></span>`;
    // Wrap filter + list together so they stay in the same grid column.
    const wrapSk = document.createElement("div");
    skillsDl.before(wrapSk);
    wrapSk.append(bar, skillsDl);
    const count = bar.querySelector(".skill-count");
    bar.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const f = b.dataset.f;
      bar.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      skillsDl.dataset.filter = f;
      let n = 0;
      skillsDl.querySelectorAll(".sk").forEach(s => { const m = f !== "all" && s.dataset.p.split(" ").includes(f); s.classList.toggle("is-match", m); if (m) n++; });
      count.textContent = f === "all" ? "" : `${n} tools`;
    });
  }

  // Screenshot galleries: tabs swap the visible screen (crossfade in CSS).
  document.querySelectorAll(".shot-gallery").forEach(g => {
    const imgs = [...g.querySelectorAll("img[data-shot]")];
    g.querySelector(".shot-tabs")?.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      g.querySelectorAll(".shot-tabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      imgs.forEach(img => { img.hidden = img.dataset.shot !== b.dataset.shot; if (!img.hidden) img.loading = "eager"; });
    });
  });

  /* ================================================================
     Graphic-design motion layer
  ================================================================ */
  const gdReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePtr = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Kinetic headings: split section titles into words → letters.
  document.querySelectorAll(".section-head h2 .mask > span").forEach(span => {
    const text = span.textContent;
    span.closest("h2").setAttribute("aria-label", text);
    span.textContent = "";
    let li = 0;
    text.split(" ").forEach((word, wi, arr) => {
      const w = document.createElement("span");
      w.className = "ltr-word"; w.setAttribute("aria-hidden", "true");
      [...word].forEach(ch => { const l = document.createElement("span"); l.className = "ltr"; l.textContent = ch; l.style.setProperty("--li", li++); w.append(l); });
      span.append(w, wi < arr.length - 1 ? " " : "");
    });
  });

  // Flat geometric shapes in the margins, misregistered-print style.
  const star = (pts, r1, r2) => Array.from({ length: pts * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, a = Math.PI * i / pts - Math.PI / 2; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="46"/>',
    half: '<path d="M4 60 A46 46 0 0 1 96 60 Z"/>',
    burst: `<polygon points="${star(8, 48, 22)}"/>`,
    star: `<polygon points="${star(5, 48, 20)}"/>`,
    tri: '<polygon points="50,6 96,90 4,90"/>',
    squiggle: '<path d="M4 50 Q 16 22 28 50 T 52 50 T 76 50 T 100 50"/>'
  };
  const layout = {
    work: [["burst", "--sun", 130, "left:-170px;top:18%", 90], ["half", "--pink", 110, "right:-150px;top:46%", -60, "hide-sm"], ["squiggle", "--sky", 120, "left:-160px;top:78%", 30, "hide-sm"]],
    about: [["circle", "--pink", 120, "right:-150px;top:12%", 0], ["tri", "--sun", 90, "left:-130px;top:64%", 120, "hide-sm"]],
    skills: [["star", "--sky", 120, "left:-150px;top:58%", 140], ["half", "--sun", 100, "right:-140px;top:20%", 80, "hide-sm"]],
    education: [["squiggle", "--pink", 130, "right:-170px;top:30%", -40], ["burst", "--sky", 100, "left:-140px;top:72%", 90, "hide-sm"]]
  };
  const shapes = [];
  Object.entries(layout).forEach(([id, list]) => {
    const sec = document.getElementById(id); if (!sec) return;
    list.forEach(([type, col, size, pos, spin, extra]) => {
      const el = document.createElement("div");
      el.className = "shape" + (type === "squiggle" ? " line" : "") + (extra ? " " + extra : "");
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = `${pos};--s:${size}px;--c:var(${col})`;
      el.innerHTML = `<div class="shape-inner"><svg viewBox="0 0 100 100"><g class="sh-ink">${SHAPES[type]}</g><g class="sh-fill">${SHAPES[type]}</g></svg></div>`;
      sec.append(el);
      shapes.push({ el: el.firstChild, sec, spin });
    });
  });

  // Sticker badge spin + crossed tapes, both pushed by scroll velocity.
  const sticker = document.querySelector(".sticker svg");
  const tapes = [...document.querySelectorAll(".tape-track")].map((track, i) => {
    const group = track.querySelector(".tape-group");
    for (let k = 0; k < 4; k++) { const c = group.cloneNode(true); track.append(c); }
    return { track, group, x: i ? -group.offsetWidth : 0, dir: i ? 1 : -1 };
  });
  let gdLastY = scrollY, gdVel = 0, gdSpin = 0, gdT = 0, gdRaf = 0;
  const gdFrame = now => {
    gdRaf = 0;
    const dt = Math.min(50, gdT ? now - gdT : 16.7); gdT = now;
    const dy = scrollY - gdLastY; gdLastY = scrollY;
    gdVel += (Math.max(-4, Math.min(4, dy / dt)) - gdVel) * .1;
    const vh = innerHeight;
    // Shapes: rotate + drift with each section's scroll progress.
    for (const s of shapes) {
      const r = s.sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const p = (vh - r.top) / (vh + r.height);
      s.el.style.setProperty("--rot", (p * s.spin * 2).toFixed(1) + "deg");
      s.el.style.setProperty("--dy", ((p - .5) * -80).toFixed(1) + "px");
    }
    if (sticker) { gdSpin += (.012 + Math.abs(gdVel) * .25) * dt; sticker.style.setProperty("--spin", (gdSpin % 360).toFixed(1) + "deg"); }
    for (const t of tapes) {
      const w = t.group.offsetWidth || 1;
      const dir = gdVel < -.05 ? -t.dir : t.dir;
      t.x += dir * (.04 + Math.abs(gdVel) * .5) * dt;
      if (t.x <= -w) t.x += w; if (t.x > 0) t.x -= w;
      t.track.style.transform = `translate3d(${t.x.toFixed(1)}px,0,0)`;
    }
    if (!document.hidden) gdRaf = requestAnimationFrame(gdFrame);
  };
  if (!gdReduced) gdRaf = requestAnimationFrame(gdFrame);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !gdRaf && !gdReduced) { gdT = 0; gdRaf = requestAnimationFrame(gdFrame); } });

  // "Open live" sticker cursor over screenshots that have a live site.
  const vc = document.querySelector(".view-cursor");
  if (vc && finePtr) {
    document.querySelectorAll(".project-shot[data-href]").forEach(fig => {
      const inTabs = e => e.target.closest(".shot-tabs");
      fig.addEventListener("pointermove", e => {
        const on = !inTabs(e);
        vc.classList.toggle("is-on", on); fig.classList.toggle("is-viewing", on);
        vc.style.setProperty("--cx", e.clientX + "px"); vc.style.setProperty("--cy", e.clientY + "px");
      });
      fig.addEventListener("pointerleave", () => { vc.classList.remove("is-on"); fig.classList.remove("is-viewing"); });
      fig.addEventListener("click", e => { if (!inTabs(e)) window.open(fig.dataset.href, "_blank", "noopener"); });
    });
  }

  // Copy email, with a short confirmation that reverts on its own.
  const copyBtn = document.querySelector(".copy-email");
  const status = document.getElementById("copyStatus");
  if (copyBtn) {
    let resetTimer = 0;
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        // Clipboard blocked (e.g. insecure context): fall back to mail client.
        location.href = `mailto:${email}`;
        return;
      }
      copyBtn.classList.add("is-copied");
      if (status) status.textContent = "Email address copied";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        if (status) status.textContent = "";
      }, 1800);
    });
  }

  /* ----------------------------------------------------------------
     Hero night sky: an original, procedural scene that plays like a
     slow film shot. Dense tinted stars, a faint galactic haze, one long
     comet whose tail shimmers, moonlit clouds drifting at three depths,
     the odd shooting star, and the Hyderabad skyline with the Charminar.
     A slow camera pan + push-in runs underneath everything.
     Reduced motion: one still frame. Paused when off-screen or hidden.
  ----------------------------------------------------------------- */
  const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const skyCanvas = document.getElementById("sky");
  const sctx = skyCanvas?.getContext("2d");
  if (skyCanvas && sctx) {
    let W = 0, H = 0, stars = [], haze = [], clouds = [], city = null, meteor = null, nextMeteor = 4000, sparks = [];
    let seed = 21; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let px = 0, tpx = 0, py = 0, tpy = 0, raf = 0, last = 0, visible = true;
    let textRect = null, wishes = [];
    const heroCopy = document.querySelector(".hero-copy");

    // Cloud sprite: puff cluster → mask → moonlit body + bright top rim.
    const makeCloud = (w, h) => {
      const pad = Math.round(h * .5) + 12, cw = w + pad * 2, ch = h + pad * 2;   // room for fragments + blur
      const mask = document.createElement("canvas"); mask.width = cw; mask.height = ch;
      const m = mask.getContext("2d"); m.translate(pad, pad); m.fillStyle = "#000";
      // Many small, uneven puffs (not a few big balls) so the outline is
      // lumpy, then loose fragments scattered off the top and sides.
      const core = 40 + Math.floor(rand() * 30), tops = [];
      for (let i = 0; i < core; i++) {
        const t = rand(), x = w * (.06 + t * .88), hump = Math.pow(Math.sin(t * Math.PI), .8);
        const r = h * (.06 + rand() * .12 + hump * rand() * .16);
        const y = h - r - rand() * h * .62 * hump;
        m.beginPath(); m.ellipse(x, y, r * (1 + rand() * .5), r, 0, 0, 6.283); m.fill();
        tops.push({ x, y, r });
      }
      for (let i = 0; i < 18; i++) {
        const b = tops[Math.floor(rand() * tops.length)];
        const a = -Math.PI * (.1 + rand() * .8), d = b.r * (1 + rand() * .9), r = b.r * (.12 + rand() * .3);
        m.beginPath(); m.ellipse(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, r * 1.4, r, 0, 0, 6.283); m.fill();
      }
      const c = document.createElement("canvas"); c.width = cw; c.height = ch;
      const g = c.getContext("2d");
      g.drawImage(mask, 0, 0);
      g.globalCompositeOperation = "source-in";
      const body = g.createLinearGradient(0, pad, 0, pad + h);
      body.addColorStop(0, "#C7DAEE"); body.addColorStop(.45, "#86A6CB"); body.addColorStop(1, "#3B5B88");
      g.fillStyle = body; g.fillRect(0, 0, cw, ch);
      // Painterly texture: soft light and shadow dabs inside the cloud, so it
      // reads as brushed volume rather than a flat bubble.
      g.save(); g.globalCompositeOperation = "source-atop"; g.filter = `blur(${Math.max(2, h * .05).toFixed(1)}px)`;
      for (let i = 0; i < 90; i++) {
        const x = pad + rand() * w, y = pad + rand() * h, r = h * (.04 + rand() * .1), up = (y - pad) / h;
        g.fillStyle = up < .55 ? `rgba(232, 242, 255, ${(.08 + rand() * .14).toFixed(2)})` : `rgba(30, 52, 96, ${(.08 + rand() * .16).toFixed(2)})`;
        g.beginPath(); g.ellipse(x, y, r * (1.2 + rand()), r, rand() * 3, 0, 6.283); g.fill();
      }
      g.restore();
      // Moonlight from above: cloud minus itself shifted down = lit top edge.
      const rim = (shift, color, blur) => {
        const r = document.createElement("canvas"); r.width = cw; r.height = ch;
        const rg = r.getContext("2d");
        rg.drawImage(mask, 0, 0);
        rg.globalCompositeOperation = "source-in"; rg.fillStyle = color; rg.fillRect(0, 0, cw, ch);
        rg.globalCompositeOperation = "destination-out"; rg.drawImage(mask, 0, shift);
        g.save(); g.globalCompositeOperation = "source-atop"; g.filter = `blur(${blur}px)`; g.drawImage(r, 0, 0); g.restore();
      };
      rim(h * .22, "rgba(206, 226, 248, .5)", 4);
      rim(h * .05, "rgba(244, 250, 255, .95)", 1);
      const out = document.createElement("canvas"); out.width = cw; out.height = ch;
      const o = out.getContext("2d"); o.filter = "blur(.5px)"; o.drawImage(c, 0, 0);
      return out;
    };

    const buildCity = () => {
      const base = H, sh = Math.max(44, H * .075);
      const p = new Path2D(), lights = [];
      const cmX = W < 800 ? W * .7 : W * .38, cmW = Math.min(120, Math.max(72, W * .075));
      p.moveTo(0, base);
      let x = 0;
      while (x < W) {
        if (x > cmX - cmW * .7 && x < cmX + cmW * .7) { p.lineTo(x, base); x = cmX + cmW * .7; p.lineTo(x, base); continue; }
        const bw = 22 + rand() * 64, bh = sh * (.3 + rand() * .6) * (rand() < .1 ? 1.7 : 1);
        p.lineTo(x, base); p.lineTo(x, base - bh); p.lineTo(x + bw, base - bh); p.lineTo(x + bw, base);
        for (let wy = base - bh + 8; wy < base - 6; wy += 10)
          for (let wx = x + 5; wx < x + bw - 5; wx += 8)
            if (rand() < .14) lights.push({ x: wx, y: wy, on: rand() < .6, t: rand() * 9000 });
        x += bw;
      }
      p.lineTo(W, base); p.closePath();
      const u = cmW / 160, cx = cmX, L = cx - 80 * u, R = cx + 80 * u;
      const body = new Path2D();
      body.rect(L, base - 110 * u, 160 * u, 110 * u);
      body.moveTo(cx - 42 * u, base); body.lineTo(cx - 42 * u, base - 46 * u);
      body.quadraticCurveTo(cx - 42 * u, base - 84 * u, cx, base - 94 * u);
      body.quadraticCurveTo(cx + 42 * u, base - 84 * u, cx + 42 * u, base - 46 * u);
      body.lineTo(cx + 42 * u, base); body.closePath();
      const parts = new Path2D();
      parts.rect(L - 4 * u, base - 114 * u, 168 * u, 6 * u);
      parts.rect(L + 6 * u, base - 132 * u, 148 * u, 18 * u);
      for (let i = 0; i < 9; i++) parts.rect(L + 10 * u + i * 16.5 * u, base - 140 * u, 8 * u, 8 * u);
      [L, R].forEach(mm => {
        const mw = 20 * u, mTop = base - 230 * u;
        parts.rect(mm - mw / 2, mTop + 18 * u, mw, base - mTop - 18 * u);
        [150, 190].forEach(hh => parts.rect(mm - mw / 2 - 5 * u, base - hh * u, mw + 10 * u, 5 * u));
        parts.ellipse(mm, mTop + 12 * u, 13 * u, 14 * u, 0, 0, Math.PI * 2);
        parts.moveTo(mm - 1.2 * u, mTop); parts.lineTo(mm, mTop - 18 * u); parts.lineTo(mm + 1.2 * u, mTop); parts.closePath();
      });
      return { skyline: p, body, parts, lights };
    };

    const resize = () => {
      W = skyCanvas.clientWidth; H = skyCanvas.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      skyCanvas.width = Math.round(W * dpr); skyCanvas.height = Math.round(H * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 21;
      const tints = ["#FFFFFF", "#FFFFFF", "#DDEBFF", "#CFE4FF", "#FFE9F2", "#FFF4DA"];
      stars = Array.from({ length: Math.round(W * H / 1700) }, () => {
        const y = Math.pow(rand(), 1.25) * H * .85;
        return { x: rand() * W * 1.1 - W * .05, y, r: Math.pow(rand(), 3) * 1.7 + .3, p: rand() * 6.28, s: .4 + rand() * 1.8, c: tints[Math.floor(rand() * tints.length)] };
      });
      // Faint galactic haze: a diagonal band of soft glows + extra tiny stars.
      haze = Array.from({ length: 26 }, (_, i) => {
        const t = i / 25, x = W * (-.05 + t * 1.1), y = H * (.62 - t * .55) + (rand() - .5) * H * .08;
        return { x, y, r: H * (.08 + rand() * .12), a: .035 + rand() * .04 };
      });
      for (let i = 0; i < W * H / 3000; i++) {
        const t = rand(), x = W * (-.05 + t * 1.1), y = H * (.62 - t * .55) + (rand() - .5) * H * .16;
        stars.push({ x, y, r: rand() * .7 + .2, p: rand() * 6.28, s: .5 + rand(), c: "#E8F0FF" });
      }
      clouds = [];
      const layers = [
        { n: 6, y: [.06, .34], w: [.07, .14], h: .07, v: .0025, a: .8 },   // small, high, far
        { n: 5, y: [.36, .58], w: [.12, .22], h: .1, v: .005, a: .92 },
        { n: 4, y: [.6, .78], w: [.22, .36], h: .15, v: .008, a: 1 }        // big low bank
      ];
      layers.forEach((Ly, depth) => {
        const count = W < 800 ? Math.ceil(Ly.n / 2) : Ly.n;   // fewer clouds over text on phones
        for (let i = 0; i < count; i++) {
          // Size from width only (with a floor for phones) and a fixed aspect,
          // so tall or narrow screens never stretch clouds into columns.
          const cw = Math.max(W * (Ly.w[0] + rand() * (Ly.w[1] - Ly.w[0])), 110 + depth * 70);
          const ch = cw * (.32 + rand() * .14);
          clouds.push({ img: makeCloud(cw, ch), x: (i / Ly.n) * W * 1.3 - W * .15 + rand() * W * .12, y: H * (Ly.y[0] + rand() * (Ly.y[1] - Ly.y[0])), v: Ly.v, a: Ly.a, depth });
        }
      });
      city = buildCity();
      // Where the intro text sits (canvas coordinates), so clouds can part around it.
      if (heroCopy && W >= 800) {
        const a = heroCopy.getBoundingClientRect(), b = skyCanvas.getBoundingClientRect();
        textRect = { x: a.left - b.left - 40, y: a.top - b.top - 40, w: a.width + 80, h: a.height + 80 };
      } else textRect = null;
      sparks = Array.from({ length: 40 }, () => ({ t: rand(), o: (rand() - .5) * 14, p: rand() * 6.28, v: .00003 + rand() * .00006 }));
    };

    // Comet path (a gentle arc, head at the lower end); points in sky space.
    const cometPoint = (t) => {
      // Desktop: through the open sky above the portrait. Mobile: high and short.
      const narrow = W < 800;
      const x0 = W * 1.04, y0 = H * .09, x1 = narrow ? W * .5 : W * .64, y1 = narrow ? H * .2 : H * .19, cx = W * .84, cy = H * .06;   // high, clear of the constellations
      const a = 1 - t;
      return { x: a * a * x0 + 2 * a * t * cx + t * t * x1, y: a * a * y0 + 2 * a * t * cy + t * t * y1 };
    };

    const drawComet = now => {
      const shimmer = .85 + .15 * Math.sin(now * .0015);
      const strokeArc = (width, color, offset = 0) => {
        sctx.beginPath();
        for (let i = 0; i <= 40; i++) { const q = cometPoint(i / 40); i ? sctx.lineTo(q.x + offset, q.y) : sctx.moveTo(q.x + offset, q.y); }
        sctx.lineWidth = width; sctx.strokeStyle = color; sctx.stroke();
      };
      const s0 = cometPoint(0), s1 = cometPoint(1);
      const fade = (r, g, b, a) => {   // bright at the head, gone at the far end of the tail
        const gr = sctx.createLinearGradient(s1.x, s1.y, s0.x, s0.y);
        gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(.55, `rgba(${r},${g},${b},${a * .45})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        return gr;
      };
      sctx.save(); sctx.lineCap = "round"; sctx.globalCompositeOperation = "lighter";
      sctx.filter = "blur(20px)"; strokeArc(70, fade(80, 160, 255, .32 * shimmer));
      sctx.filter = "blur(6px)";  strokeArc(20, fade(110, 215, 255, .7 * shimmer)); strokeArc(12, fade(185, 110, 255, .45 * shimmer), 12);
      sctx.filter = "blur(1px)";  strokeArc(6, fade(200, 245, 255, .9));
      sctx.filter = "none";       strokeArc(2.6, fade(255, 255, 255, 1));
      // Sparkles drifting along the tail.
      for (const sp of sparks) {
        sp.t = (sp.t + (reducedMQ.matches ? 0 : sp.v * 33)) % 1;
        const q = cometPoint(sp.t), a = (1 - sp.t) * (.4 + .6 * Math.sin(now * .004 + sp.p));
        if (a <= 0) continue;
        sctx.fillStyle = `rgba(210, 240, 255, ${a})`; sctx.beginPath(); sctx.arc(q.x + sp.o, q.y + sp.o * .4, .9, 0, 6.283); sctx.fill();
      }
      // Head glow.
      const hg = sctx.createRadialGradient(s1.x, s1.y, 0, s1.x, s1.y, 18);
      hg.addColorStop(0, "rgba(255,255,255,.95)"); hg.addColorStop(.3, "rgba(150,220,255,.5)"); hg.addColorStop(1, "rgba(150,220,255,0)");
      sctx.fillStyle = hg; sctx.beginPath(); sctx.arc(s1.x, s1.y, 18, 0, 6.283); sctx.fill();
      sctx.restore();
    };

    const draw = now => {
      sctx.clearRect(0, 0, W, H);
      px += (tpx - px) * .04; py += (tpy - py) * .04;
      // Slow "camera": a drifting pan with a gentle push-in, like a held film shot.
      const camX = Math.sin(now * .00005) * 18 + px * 14, camY = Math.cos(now * .00004) * 8 + py * 8;
      const zoom = 1.04 + Math.sin(now * .000035) * .03;
      sctx.save();
      sctx.translate(W / 2, H / 2); sctx.scale(zoom, zoom); sctx.translate(-W / 2 + camX, -H / 2 + camY);

      for (const h of haze) {
        const g = sctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
        g.addColorStop(0, `rgba(170, 190, 255, ${h.a})`); g.addColorStop(1, "rgba(170, 190, 255, 0)");
        sctx.fillStyle = g; sctx.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
      }
      for (const s of stars) {
        const a = .55 + .45 * Math.sin(now * .001 * s.s + s.p);
        sctx.globalAlpha = a * (1 - Math.max(0, s.y - H * .6) / (H * .35));
        sctx.fillStyle = s.c; sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, 6.283); sctx.fill();
        if (s.r > 1.5) { sctx.globalAlpha *= .35; sctx.fillRect(s.x - s.r * 3, s.y - .3, s.r * 6, .6); sctx.fillRect(s.x - .3, s.y - s.r * 3, .6, s.r * 6); }
      }
      sctx.globalAlpha = 1;

      drawComet(now);

      // Shooting star now and then.
      if (!reducedMQ.matches) {
        if (!meteor && now > nextMeteor) meteor = { t0: now, x: W * (.2 + rand() * .7), y: H * (.05 + rand() * .25), dur: 700 + rand() * 400 };
        if (meteor) {
          const k = (now - meteor.t0) / meteor.dur;
          if (k >= 1) { meteor = null; nextMeteor = now + 5000 + rand() * 9000; }
          else {
            const hx = meteor.x - k * 220, hy = meteor.y + k * 110, f = Math.sin(Math.PI * k);
            const g = sctx.createLinearGradient(hx, hy, hx + 90, hy - 45);
            g.addColorStop(0, `rgba(255,255,255,${f})`); g.addColorStop(1, "rgba(255,255,255,0)");
            sctx.strokeStyle = g; sctx.lineWidth = 1.4; sctx.beginPath(); sctx.moveTo(hx, hy); sctx.lineTo(hx + 90, hy - 45); sctx.stroke();
          }
        }
      }

      for (const c of clouds) {
        if (!reducedMQ.matches) { c.x += c.v * 33; if (c.x > W + 60) c.x = -c.img.width - 60; }
        const cx0 = c.x + px * c.depth * 10, cy0 = c.y + py * c.depth * 4;
        let fade = 1;
        if (textRect) {   // the more a cloud overlaps the text, the more it thins out
          const ox = Math.max(0, Math.min(cx0 + c.img.width, textRect.x + textRect.w) - Math.max(cx0, textRect.x));
          const oy = Math.max(0, Math.min(cy0 + c.img.height, textRect.y + textRect.h) - Math.max(cy0, textRect.y));
          fade = 1 - .85 * Math.min(1, (ox * oy) / (c.img.width * c.img.height) * 1.6);
        }
        sctx.globalAlpha = c.a * fade;
        sctx.drawImage(c.img, cx0, cy0);
      }
      sctx.globalAlpha = 1;
      sctx.restore();

      // Wishes: shooting stars launched by clicking the sky.
      wishes = wishes.filter(wi => now - wi.t0 < 1400);
      for (const wi of wishes) {
        const k = (now - wi.t0) / 1000, f = Math.max(0, 1 - k / 1.4);
        const hx = wi.x - k * 420, hy = wi.y + k * 230;
        const g = sctx.createLinearGradient(hx, hy, hx + 150, hy - 82);
        g.addColorStop(0, `rgba(255,255,255,${f})`); g.addColorStop(.3, `rgba(170,225,255,${.6 * f})`); g.addColorStop(1, "rgba(170,225,255,0)");
        sctx.save(); sctx.globalCompositeOperation = "lighter"; sctx.lineCap = "round";
        sctx.strokeStyle = g; sctx.lineWidth = 2.2; sctx.beginPath(); sctx.moveTo(hx, hy); sctx.lineTo(hx + 150, hy - 82); sctx.stroke();
        sctx.fillStyle = `rgba(255,255,255,${f})`; sctx.beginPath(); sctx.arc(hx, hy, 2.4, 0, 6.283); sctx.fill();
        const burst = Math.max(0, 1 - k / .5);   // a little sparkle where you clicked
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * 6.283 + wi.a, d = 6 + k * 60;
          sctx.fillStyle = `rgba(210,240,255,${burst})`; sctx.beginPath(); sctx.arc(wi.x + Math.cos(a) * d, wi.y + Math.sin(a) * d, 1.4, 0, 6.283); sctx.fill();
        }
        sctx.restore();
      }

      // Horizon glow from the city, then the skyline (outside the camera move so it stays planted).
      const hg = sctx.createLinearGradient(0, H * .7, 0, H);
      hg.addColorStop(0, "rgba(90, 160, 200, 0)"); hg.addColorStop(1, "rgba(90, 160, 200, .28)");
      sctx.fillStyle = hg; sctx.fillRect(0, H * .7, W, H * .3);
      sctx.fillStyle = "#0A1530";
      sctx.fill(city.skyline); sctx.fill(city.body, "evenodd"); sctx.fill(city.parts);
      for (const w of city.lights) {
        if (!reducedMQ.matches && now - w.t > 7000) { w.t = now + rand() * 5000; if (rand() < .25) w.on = !w.on; }
        if (w.on) { sctx.fillStyle = "rgba(255, 214, 150, .8)"; sctx.fillRect(w.x, w.y, 2.5, 3.5); }
      }
    };

    const loop = now => {
      raf = 0;
      if (now - last >= 33) { draw(now); last = now; }
      if (visible && !document.hidden && !reducedMQ.matches) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reducedMQ.matches) { draw(0); return; }
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    resize(); start();
    if ("ResizeObserver" in window) new ResizeObserver(() => { const w = skyCanvas.clientWidth, h = skyCanvas.clientHeight; if (w !== W || h !== H) { resize(); if (reducedMQ.matches) draw(0); } }).observe(skyCanvas);
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; } }).observe(skyCanvas);
    document.addEventListener("visibilitychange", start);
    reducedMQ.addEventListener("change", () => { cancelAnimationFrame(raf); raf = 0; start(); });
    addEventListener("pointermove", e => { tpx = -(e.clientX / innerWidth - .5); tpy = -(e.clientY / innerHeight - .5); }, { passive: true });
    // Click / tap the open sky to make a wish.
    heroEl?.addEventListener("click", e => {
      if (reducedMQ.matches || e.target.closest("a, button, .c-group, .hero-copy")) return;
      const r = skyCanvas.getBoundingClientRect();
      wishes.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now(), a: Math.random() * 6 });
      start();
    });
  }

  // Local time in Hyderabad, so visitors know when a reply is likely.
  const timeEl = document.getElementById("localTime");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    const tick = () => { timeEl.textContent = `${fmt.format(new Date())} IST`; };
    tick();
    setInterval(tick, 30_000);
  }
})();
