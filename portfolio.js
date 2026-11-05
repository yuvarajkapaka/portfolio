(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const viewTimeline = CSS.supports("animation-timeline: view()");
  const scrollTimeline = CSS.supports("animation-timeline: scroll()");
  const body = document.body;
  body.classList.add("motion-ready");

  let timer = 0, pending = null;
  const later = (fn, ms) => {
    pending = fn;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (document.hidden) return;
      pending = null;
      fn();
    }, ms);
  };
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pending) {
      const fn = pending;
      pending = null;
      clearTimeout(timer);
      fn();
    }
  });

  const nameNode = document.getElementById("typedName");
  const roleNode = document.getElementById("typedRole");
  const roles = ["Problem Solver", "Software Developer", "AI Enthusiast"];
  if (reduced) {
    nameNode.textContent = "Yuvaraj Kapaka";
    roleNode.textContent = roles[0];
  } else {
    let roleIndex = 0, charIndex = 0, deleting = false;
    const typeRole = () => {
      body.classList.add("role-active");
      const word = roles[roleIndex];
      roleNode.textContent = word.slice(0, charIndex);
      if (!deleting && charIndex < word.length) { charIndex++; later(typeRole, 38); }
      else if (!deleting) { deleting = true; body.classList.remove("role-active"); later(typeRole, 1600); }
      else if (charIndex) { charIndex--; later(typeRole, 28); }
      else { deleting = false; roleIndex = (roleIndex + 1) % roles.length; body.classList.remove("role-active"); later(typeRole, 240); }
    };
    const typeName = i => {
      const fullName = "Yuvaraj Kapaka";
      if (i === 0) body.classList.add("name-active");
      nameNode.textContent = fullName.slice(0, i);
      if (i < fullName.length) later(() => typeName(i + 1), i < 8 ? 34 : 42);
      else { body.classList.remove("name-active"); later(typeRole, 100); }
    };
    later(() => typeName(0), 160);
  }

  const canvas = document.getElementById("depthCanvas"), ctx = canvas?.getContext("2d");
  if (canvas && ctx) {
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const rootStyle = getComputedStyle(document.documentElement);
    const palette = Object.fromEntries(["paper", "gold", "tangerine", "royal-purple", "lagoon"].map(name => [name, rootStyle.getPropertyValue(`--${name}`).trim()]));
    let w = 0, h = 0, dpr = 1, x = innerWidth * .5, y = innerHeight * .45, tx = x, ty = y, raf = 0, last = 0;
    const draw = now => {
      ctx.clearRect(0, 0, w, h);
      const count = Math.max(14, Math.min(28, Math.round(h / 38)));
      for (let i = 0; i < count; i++) {
        const p = i / (count - 1), base = -h * .08 + Math.pow(p, 1.55) * h * 1.18, points = [];
        for (let sx = -24; sx <= w + 24; sx += 20) {
          const sy = base + Math.sin(sx * .004 + now * .0003 + i * .34) * (4 + 18 * p) + Math.sin(sx * .009 - now * .00018 + i * .7) * (2 + 5 * p);
          const dx = sx - x, dy = sy - y, dist = Math.hypot(dx, dy) || 1;
          const influence = Math.exp(-(dx * dx + dy * dy) / (2 * 280 * 280));
          const pull = (76 + 12 * Math.sin(dist * .035 - now * .0018)) * influence;
          const swirl = Math.sin(now * .0004 + i * .42) * 9 * influence;
          points.push({ x: sx - dx / dist * pull - dy / dist * swirl, y: sy - dy / dist * pull + dx / dist * swirl });
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length - 1; j++) {
          const midX = (points[j].x + points[j + 1].x) * .5, midY = (points[j].y + points[j + 1].y) * .5;
          ctx.quadraticCurveTo(points[j].x, points[j].y, midX, midY);
        }
        const end = points[points.length - 1];
        ctx.lineTo(end.x, end.y);
        let tone = palette.paper, opacity = .105;
        if (i % 17 === 3) { tone = palette.tangerine; opacity = .16; }
        else if (i % 11 === 4) { tone = palette["royal-purple"]; opacity = .16; }
        else if (i % 9 === 0) { tone = palette.gold; opacity = .22; }
        else if (i % 7 === 2) { tone = palette.lagoon; opacity = .15; }
        ctx.strokeStyle = tone;
        ctx.globalAlpha = (.48 + p * .52) * opacity;
        ctx.lineWidth = .5 + p * .55;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const resize = () => {
      w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduced ? 0 : performance.now());
    };
    const tick = now => {
      raf = 0;
      if (document.hidden) return;
      if (finePointer) { x += (tx - x) * .12; y += (ty - y) * .12; }
      if (now - last >= 30) { draw(now); last = now; }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!reduced && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
    resize();
    addEventListener("resize", resize, { passive: true });
    if (finePointer && !reduced) addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else { last = 0; start(); }
    });
    start();
  }

  const header = document.getElementById("siteHeader");
  const progress = document.getElementById("scrollProgress");
  const scroll = () => {
    header.classList.toggle("is-scrolled", scrollY > 20);
    if (progress && !scrollTimeline) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }
  };
  addEventListener("scroll", scroll, { passive: true });
  scroll();

  const menu = document.getElementById("menuToggle"), nav = document.getElementById("navLinks");
  const closeMenu = () => {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  document.getElementById("year").textContent = String(new Date().getFullYear());

  const bindTabKeys = (tabs, activate) => tabs.forEach((tab, index) => tab.addEventListener("keydown", e => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (index + 1) % tabs.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (index - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    activate(tabs[next]);
  }));

  const portraitStage = document.getElementById("portraitStage");
  if (portraitStage && !reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const setPortraitDepth = event => {
      const rect = portraitStage.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
      const depth = (1 - Math.abs(x)) * (1 - Math.abs(y)) * 12;
      portraitStage.style.setProperty("--portrait-x", `${(-x * 8).toFixed(1)}px`);
      portraitStage.style.setProperty("--portrait-y", `${(-y * 6).toFixed(1)}px`);
      portraitStage.style.setProperty("--portrait-z", `${depth.toFixed(1)}px`);
    };
    const resetPortraitDepth = () => {
      ["--portrait-x", "--portrait-y", "--portrait-z"]
        .forEach(name => portraitStage.style.removeProperty(name));
    };
    portraitStage.addEventListener("pointermove", setPortraitDepth, { passive: true });
    portraitStage.addEventListener("pointerleave", resetPortraitDepth, { passive: true });
  }

  const projectTabs = [...document.querySelectorAll(".project-tab")];
  const projectPanels = [...document.querySelectorAll(".project-detail")];
  const projectWorkbench = document.getElementById("projectWorkbench");
  const scrollProjects = !reduced && matchMedia("(min-width: 901px)").matches;
  const projectHold = .72, projectTurn = .45;
  const projectProgress = document.getElementById("projectProgress");
  const projectRailStatus = document.getElementById("projectRailStatus");
  const updateProjectMarker = index => {
    if (index < 0) return;
    projectProgress.textContent = String(index + 1).padStart(2, "0");
    projectRailStatus.setAttribute("aria-label", `Project ${index + 1} of ${projectTabs.length}`);
  };
  updateProjectMarker(0);
  let activeProject = projectPanels.find(panel => !panel.hidden), projectHideTimer = 0;
  const selectProject = tab => {
    const next = document.getElementById(tab.getAttribute("aria-controls"));
    if (!next) return;
    projectTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (next === activeProject) return;
    updateProjectMarker(projectTabs.indexOf(tab));
    clearTimeout(projectHideTimer);
    const forward = projectTabs.indexOf(tab) > projectPanels.indexOf(activeProject);
    const leavingClass = forward ? "is-page-leaving-forward" : "is-page-leaving-back";
    const enteringClass = forward ? "is-page-entering-forward" : "is-page-entering-back";
    activeProject.classList.remove("is-active", "is-page-entering-forward", "is-page-entering-back");
    activeProject.classList.add(leavingClass);
    activeProject.setAttribute("aria-hidden", "true");
    activeProject.inert = true;
    next.classList.remove("is-page-leaving-forward", "is-page-leaving-back", "is-page-entering-forward", "is-page-entering-back");
    next.classList.add(enteringClass);
    next.hidden = false;
    next.inert = false;
    next.tabIndex = 0;
    next.setAttribute("aria-hidden", "false");
    activeProject.tabIndex = -1;
    activeProject = next;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (activeProject !== next) return;
      next.classList.remove(enteringClass);
      next.classList.add("is-active");
    }));
    projectHideTimer = setTimeout(() => projectPanels.forEach(panel => {
      if (panel === activeProject) return;
      panel.classList.remove("is-active", "is-page-leaving-forward", "is-page-leaving-back", "is-page-entering-forward", "is-page-entering-back");
      panel.hidden = true;
      panel.inert = true;
      panel.setAttribute("aria-hidden", "true");
    }), reduced ? 170 : 790);
  };
  const activateProject = tab => {
    if (!scrollProjects || !projectWorkbench) { selectProject(tab); return; }
    const travel = projectWorkbench.offsetHeight - innerHeight;
    if (travel <= 0) { selectProject(tab); return; }
    const step = projectTabs.indexOf(tab);
    const timelineLength = projectTabs.length * projectHold + (projectTabs.length - 1) * projectTurn;
    const target = step * (projectHold + projectTurn) + projectHold / 2;
    const top = projectWorkbench.getBoundingClientRect().top + scrollY + travel * target / timelineLength;
    window.scrollTo({ top, behavior: "smooth" });
  };
  projectTabs.forEach(tab => tab.addEventListener("click", () => activateProject(tab)));
  bindTabKeys(projectTabs, activateProject);
  document.querySelectorAll(".hero-project[data-hero-project]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    const tab = document.getElementById(`project-tab-${link.dataset.heroProject}`);
    if (event.detail === 0) tab?.focus({ preventScroll: true });
    tab?.click();
    if (!scrollProjects) document.getElementById("projects").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }));
  if (scrollProjects && projectWorkbench) {
    let projectScrollFrame = 0, renderedProjectProgress = null;
    let selectedProjectIndex = -1;
    const scrollStates = ["is-scroll-still", "is-scroll-outgoing", "is-scroll-incoming"];
    const motionVars = ["--page-x", "--page-y", "--page-z", "--page-yaw", "--page-pitch", "--page-scale", "--page-opacity", "--page-shadow"];
    const updateSelectedProject = index => {
      if (index === selectedProjectIndex) return;
      selectedProjectIndex = index;
      activeProject = projectPanels[index];
      updateProjectMarker(index);
      projectTabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      projectPanels.forEach((panel, i) => {
        panel.setAttribute("aria-hidden", String(i !== index));
        panel.inert = i !== index;
        panel.tabIndex = i === index ? 0 : -1;
      });
    };
    const setPageState = (panel, state, values) => {
      if (panel.dataset.scrollState !== state) {
        panel.classList.remove("is-active", "is-page-leaving-forward", "is-page-leaving-back", "is-page-entering-forward", "is-page-entering-back", ...scrollStates);
        if (state) panel.classList.add(state);
        panel.dataset.scrollState = state || "";
      }
      if (!state) {
        motionVars.forEach(name => panel.style.removeProperty(name));
        if (!panel.hidden) panel.hidden = true;
        panel.inert = true;
        return;
      }
      if (panel.hidden) panel.hidden = false;
      panel.inert = projectPanels.indexOf(panel) !== selectedProjectIndex;
      if (values) Object.entries(values).forEach(([name, value]) => panel.style.setProperty(name, value));
      else motionVars.forEach(name => panel.style.removeProperty(name));
    };
    const syncProjectToScroll = () => {
      projectScrollFrame = 0;
      const travel = projectWorkbench.offsetHeight - innerHeight;
      const targetProgress = travel > 0 ? Math.min(1, Math.max(0, -projectWorkbench.getBoundingClientRect().top / travel)) : 0;
      if (renderedProjectProgress === null) renderedProjectProgress = targetProgress;
      else renderedProjectProgress += (targetProgress - renderedProjectProgress) * .3;
      if (Math.abs(targetProgress - renderedProjectProgress) < .001) renderedProjectProgress = targetProgress;
      const progress = renderedProjectProgress;
      const timelineLength = projectTabs.length * projectHold + (projectTabs.length - 1) * projectTurn;
      const position = progress * timelineLength;
      let from = projectTabs.length - 1, to = -1, turnProgress = 0;
      for (let i = 0; i < projectTabs.length - 1; i++) {
        const holdEnd = i * (projectHold + projectTurn) + projectHold;
        const turnEnd = holdEnd + projectTurn;
        if (position < holdEnd) { from = i; break; }
        if (position <= turnEnd) { from = i; to = i + 1; turnProgress = Math.max(0, Math.min(1, (position - holdEnd) / projectTurn)); break; }
      }
      const selected = to < 0 || turnProgress < .5 ? from : to;
      updateSelectedProject(selected);
      projectPanels.forEach((panel, i) => {
        if (to < 0) {
          setPageState(panel, i === from ? "is-scroll-still" : "", null);
          return;
        }
        if (i === from) {
          const p = turnProgress;
          setPageState(panel, "is-scroll-outgoing", {
            "--page-x": `${-16 * p}px`, "--page-y": `${-12 * p}px`, "--page-z": `${64 * p}px`,
            "--page-yaw": `${-58 * p}deg`, "--page-pitch": `${6 * p}deg`, "--page-scale": `${1 - .006 * p}`,
            "--page-opacity": `${1 - .18 * p}`, "--page-shadow": `${.82 * p}`
          });
        } else if (i === to) {
          const q = 1 - turnProgress;
          setPageState(panel, "is-scroll-incoming", {
            "--page-x": `${20 * q}px`, "--page-y": `${14 * q}px`, "--page-z": `${-84 * q}px`,
            "--page-yaw": `${9 * q}deg`, "--page-pitch": `${2 * q}deg`, "--page-scale": `${1 - .015 * q}`,
            "--page-opacity": `${turnProgress}`, "--page-shadow": "0"
          });
        } else setPageState(panel, "", null);
      });
      if (Math.abs(targetProgress - renderedProjectProgress) >= .001) projectScrollFrame = requestAnimationFrame(syncProjectToScroll);
    };
    addEventListener("scroll", () => {
      if (!projectScrollFrame) projectScrollFrame = requestAnimationFrame(syncProjectToScroll);
    }, { passive: true });
    addEventListener("resize", () => {
      if (projectScrollFrame) cancelAnimationFrame(projectScrollFrame);
      projectScrollFrame = 0;
      syncProjectToScroll();
    }, { passive: true });
    syncProjectToScroll();
  }

  const toolTabs = [...document.querySelectorAll(".tool-tab")];
  const toolPanels = [...document.querySelectorAll(".tool-panel")];
  const selectToolCategory = tab => {
    toolTabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    toolPanels.forEach(panel => {
      const selected = panel.id === tab.getAttribute("aria-controls");
      panel.setAttribute("aria-hidden", String(!selected));
      if (selected) {
        panel.hidden = false;
        panel.classList.remove("is-active");
        requestAnimationFrame(() => panel.classList.add("is-active"));
      } else {
        panel.classList.remove("is-active");
        panel.hidden = true;
      }
    });
  };
  toolTabs.forEach(tab => tab.addEventListener("click", () => selectToolCategory(tab)));
  bindTabKeys(toolTabs, selectToolCategory);

  const stackTray = document.getElementById("toolStackTray");
  const stackCount = document.getElementById("toolStackCount");
  const clearStack = document.getElementById("clearToolStack");
  const toolOptions = [...document.querySelectorAll(".tool-option")];
  const selectedTools = new Set();
  const updateStackCount = () => {
    stackCount.textContent = `${selectedTools.size} SELECTED`;
    clearStack.disabled = selectedTools.size === 0;
  };
  const addTool = value => {
    if (selectedTools.has(value)) return;
    selectedTools.add(value);
    toolOptions.filter(option => option.dataset.tool === value).forEach(option => option.setAttribute("aria-pressed", "true"));
    stackTray.querySelector("p")?.remove();
    const chip = document.createElement("button"), label = document.createElement("span"), remove = document.createElement("b");
    chip.className = "tool-stack-chip";
    chip.type = "button";
    chip.setAttribute("aria-label", `Remove ${value} from stack`);
    chip.dataset.stackTool = value;
    label.textContent = value;
    remove.textContent = "×";
    remove.setAttribute("aria-hidden", "true");
    chip.append(label, remove);
    chip.addEventListener("click", () => removeTool(value, chip));
    stackTray.append(chip);
    updateStackCount();
  };
  const removeTool = (value, chip) => {
    if (!selectedTools.delete(value)) return;
    toolOptions.filter(option => option.dataset.tool === value).forEach(option => option.setAttribute("aria-pressed", "false"));
    const item = chip || [...stackTray.querySelectorAll(".tool-stack-chip")].find(node => node.dataset.stackTool === value);
    if (item) {
      item.classList.add("is-removing");
      item.disabled = true;
      setTimeout(() => item.remove(), 190);
    }
    updateStackCount();
    setTimeout(() => {
      if (!selectedTools.size && !stackTray.querySelector(".tool-stack-chip") && !stackTray.querySelector("p")) {
        const empty = document.createElement("p");
        empty.textContent = "Choose tools to pin them here. Remove any one at any time.";
        stackTray.append(empty);
      }
    }, 200);
  };
  toolOptions.forEach(option => option.addEventListener("click", () => {
    selectedTools.has(option.dataset.tool) ? removeTool(option.dataset.tool) : addTool(option.dataset.tool);
  }));
  clearStack.addEventListener("click", () => [...selectedTools].forEach(value => removeTool(value)));

  let activeLink;
  const indicator = nav.querySelector(".nav-indicator");
  const moveIndicator = a => {
    if (!a || innerWidth <= 700) return;
    nav.style.setProperty("--indicator-x", `${a.offsetLeft + a.offsetWidth / 2 - 9}px`);
    indicator.style.opacity = "1";
    activeLink = a;
  };
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const a = links.find(item => item.hash === `#${entry.target.id}`);
      links.forEach(item => item.removeAttribute("aria-current"));
      if (a) { a.setAttribute("aria-current", "location"); moveIndicator(a); }
    }), { rootMargin: "-25% 0px -65% 0px" });
    links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean).forEach(s => navObserver.observe(s));
  }
  addEventListener("resize", () => moveIndicator(activeLink), { passive: true });

  if (!reduced && "IntersectionObserver" in window) {
    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const item = entry.target, group = item.closest(".reveal-group");
      const siblings = group ? [...group.children].filter(child => child.matches(".reveal")) : [];
      const step = Math.min(Math.max(siblings.indexOf(item), 0), 3);
      if (!viewTimeline) {
        item.style.transitionDelay = `${step * 70}ms`;
        setTimeout(() => { item.style.transitionDelay = ""; }, 1100);
      }
      item.classList.add("is-visible");
      observer.unobserve(item);
    }), { threshold: viewTimeline ? .06 : .12, rootMargin: "0px 0px -24px 0px" });
    reveals.forEach(item => revealObserver.observe(item));

    const projectObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const el = entry.target;
      if (el.classList.contains("project-card")) {
        if (entry.isIntersecting) { el.classList.add("is-in-view"); projectObserver.unobserve(el); }
      } else if (el.classList.contains("audio-visual")) el.classList.toggle("is-in-view", entry.isIntersecting);
      else if (entry.isIntersecting) { el.classList.add("is-in-view"); projectObserver.unobserve(el); }
    }), { threshold: .12 });
    document.querySelectorAll(".project-card, .finova-visual, .audio-visual, .campus-visual").forEach(el => projectObserver.observe(el));
  } else document.querySelectorAll(".reveal").forEach(item => item.classList.add("is-visible"));
})();
