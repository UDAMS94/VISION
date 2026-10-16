/* =========================================================
 * VISION 클래스 - 공통 스크립트
 * 페이지별 동작은 <body data-page="..."> 값으로 구분합니다.
 * 학습 기록(수강 시작, 완료, 메모)은 브라우저 localStorage 에 저장됩니다.
 * ========================================================= */
(function () {
  "use strict";

  const SITE = window.SITE;
  const COURSES = window.COURSES;
  const DAY_MS = 24 * 60 * 60 * 1000;

  /* ---------- 유틸 ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);

  function toast(msg) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------- 저장소 ---------- */
  const STORE_KEY = "vision.v1";
  const Store = {
    load() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      } catch (e) {
        return {};
      }
    },
    save(data) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) {
        /* 저장 불가(사파리 개인정보 보호 모드 등) - 무시 */
      }
    },
    get() {
      const d = this.load();
      d.enrolled ||= {};
      d.done ||= {};
      d.notes ||= {};
      d.last ||= {};
      return d;
    },
    update(fn) {
      const d = this.get();
      fn(d);
      this.save(d);
      return d;
    },
  };

  /* ---------- 강의 데이터 ---------- */
  function getCourse(id) {
    return COURSES.find((c) => c.id === String(id));
  }

  function phaseOf(course, day) {
    return course.phases.find((p) => day >= p.from && day <= p.to) || course.phases[0];
  }

  function getLessons(course) {
    const list = [];
    for (let day = 1; day <= course.days; day++) {
      const custom = (course.lessons && course.lessons[day]) || {};
      list.push({
        day,
        title: custom.title || `${day}일차 강의`,
        videoId: custom.videoId || "",
        duration: custom.duration || "",
        mission: custom.mission || "오늘 강의 내용을 하나 골라 실천하고, 느낀 점을 메모에 남겨보세요.",
        phase: phaseOf(course, day).title,
      });
    }
    return list;
  }

  function doneDays(courseId) {
    return Store.get().done[courseId] || [];
  }

  function isEnrolled(courseId) {
    return Boolean(Store.get().enrolled[courseId]);
  }

  function isUnlocked(course, day) {
    if (day === 1) return true; // 1일차는 미리보기로 항상 공개
    if (!isEnrolled(course.id)) return false;
    const mode = SITE.unlockMode;
    if (mode === "all") return true;
    if (mode === "daily") {
      const start = Store.get().enrolled[course.id].startedAt;
      const passed = Math.floor((startOfDay(Date.now()) - startOfDay(start)) / DAY_MS);
      return day - 1 <= passed;
    }
    return doneDays(course.id).includes(day - 1); // sequential
  }

  function startOfDay(t) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function nextDay(course) {
    const done = doneDays(course.id);
    for (let d = 1; d <= course.days; d++) if (!done.includes(d)) return d;
    return course.days;
  }

  function percent(course) {
    return Math.round((doneDays(course.id).length / course.days) * 100);
  }

  function enroll(courseId) {
    Store.update((d) => {
      if (!d.enrolled[courseId]) d.enrolled[courseId] = { startedAt: Date.now() };
    });
  }

  function streak(courseId) {
    // 완료한 날짜 기록 기준 연속 학습일
    const log = Store.get().enrolled[courseId]?.log || [];
    const days = new Set(log.map((t) => startOfDay(t)));
    let count = 0;
    let cur = startOfDay(Date.now());
    if (!days.has(cur)) cur -= DAY_MS; // 오늘 아직 안 했으면 어제부터 계산
    while (days.has(cur)) {
      count++;
      cur -= DAY_MS;
    }
    return count;
  }

  function ytThumb(id) {
    return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  }

  function ytEmbed(id, autoplay) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`;
  }

  /* ---------- 공통 레이아웃 ---------- */
  function renderChrome(page) {
    const nav = [
      { href: "index.html#courses", label: "강의", key: "courses", ico: "📚" },
      { href: "index.html#youtube", label: "유튜브", key: "youtube", ico: "▶️" },
      { href: "my.html", label: "내 강의실", key: "my", ico: "🎓" },
    ];

    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="container">
        <a class="logo" href="index.html"><span class="logo-mark">V</span>${esc(SITE.name)}</a>
        <nav class="main-nav">
          ${nav.map((n) => `<a href="${n.href}" class="${n.key === page ? "active" : ""}">${n.label}</a>`).join("")}
        </nav>
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm install-btn hidden" type="button">📲 앱 설치</button>
          <a class="btn btn-primary btn-sm hide-mobile" href="my.html">내 강의실</a>
        </div>
      </div>`;
    document.body.prepend(header);

    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div>
          <b style="color:var(--text)">${esc(SITE.name)}</b><br>
          문의: <a href="mailto:${esc(SITE.contact.email)}">${esc(SITE.contact.email)}</a>
          ${SITE.contact.kakao ? ` · <a href="${esc(SITE.contact.kakao)}" target="_blank" rel="noopener">카카오톡 채널</a>` : ""}
        </div>
        <div>© ${new Date().getFullYear()} ${esc(SITE.name)}. All rights reserved.</div>
      </div>`;
    document.body.appendChild(footer);

    const tabbar = document.createElement("nav");
    tabbar.className = "tabbar";
    const tabs = [{ href: "index.html", label: "홈", key: "home", ico: "🏠" }, ...nav];
    tabbar.innerHTML = tabs
      .map((t) => `<a href="${t.href}" class="${t.key === page ? "active" : ""}"><span class="ico">${t.ico}</span>${t.label}</a>`)
      .join("");
    document.body.appendChild(tabbar);
  }

  function courseCard(course) {
    const enrolled = isEnrolled(course.id);
    const pct = percent(course);
    return `
      <a class="course-card" href="course.html?id=${course.id}">
        <div class="course-thumb" style="background:linear-gradient(135deg, ${course.color}, ${course.color}cc)">
          <span class="badge">${esc(course.badge)}</span>
          <div class="big">${course.days}<small>일</small></div>
        </div>
        <div class="course-body">
          <h3>${esc(course.title)}</h3>
          <p>${esc(course.subtitle)}</p>
          ${
            enrolled
              ? `<div style="margin-top:auto;padding-top:10px"><div class="progress"><i style="width:${pct}%;background:${course.color}"></i></div>
                 <div class="course-meta" style="padding-top:6px"><span>진도 ${pct}%</span><span>${doneDays(course.id).length} / ${course.days}강 완료</span></div></div>`
              : `<div class="course-meta"><span>📅 ${course.days}일</span><span>🎬 ${course.days}강</span><span class="course-price" style="margin-left:auto;color:var(--text)">${esc(course.price)}</span></div>`
          }
        </div>
      </a>`;
  }

  /* ---------- 유튜브 모달 ---------- */
  function openVideo(id) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-box">
        <button class="modal-close" type="button" aria-label="닫기">×</button>
        <div class="player"><iframe src="${ytEmbed(id, true)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
      </div>`;
    const close = () => {
      modal.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => e.key === "Escape" && close();
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("modal-close")) close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(modal);
  }

  /* =========================================================
   * 페이지: 홈
   * ========================================================= */
  function pageHome() {
    $("#hero-title").innerHTML = esc(SITE.tagline).replace(/(확실하게|매일)/, "<em>$1</em>");
    $("#hero-lead").textContent = SITE.description;
    $("#course-grid").innerHTML = COURSES.map(courseCard).join("");

    $("#hero-visual").innerHTML = COURSES.map(
      (c) => `
      <a class="hero-chip" href="course.html?id=${c.id}">
        <span class="num" style="background:${c.color}">${c.days}</span>
        <span><b>${esc(c.title)}</b><small>${esc(c.subtitle)}</small></span>
      </a>`
    ).join("");

    // 유튜브
    $("#yt-channel").href = SITE.youtube.channelUrl;
    $("#video-grid").innerHTML = SITE.youtube.featured
      .map(
        (v) => `
      <div class="video-card" data-id="${esc(v.id)}">
        <div class="thumb">
          ${
            v.id
              ? `<img src="${ytThumb(v.id)}" alt="${esc(v.title)}" loading="lazy"><div class="play"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span></div>`
              : `<div class="placeholder-thumb">js/data.js 에서<br>YouTube 영상 ID를 입력하세요</div>`
          }
        </div>
        <h4>${esc(v.title)}</h4>
      </div>`
      )
      .join("");
    $("#video-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".video-card");
      if (!card) return;
      if (card.dataset.id) openVideo(card.dataset.id);
      else toast("아직 영상이 등록되지 않았어요");
    });

    // 강사
    const ins = SITE.instructor;
    $("#instructor").innerHTML = `
      ${ins.avatar ? `<img class="avatar" src="${esc(ins.avatar)}" alt="${esc(ins.name)}">` : `<div class="avatar">${esc(ins.name.slice(0, 1))}</div>`}
      <div>
        <div class="role">${esc(ins.role)}</div>
        <h3>${esc(ins.name)}</h3>
        <p class="muted" style="margin-top:10px">${esc(ins.bio)}</p>
      </div>`;
  }

  /* =========================================================
   * 페이지: 강의 상세
   * ========================================================= */
  function lessonItem(course, lesson, currentDay) {
    const done = doneDays(course.id).includes(lesson.day);
    const unlocked = isUnlocked(course, lesson.day);
    const cls = ["lesson-item", done ? "done" : "", lesson.day === currentDay ? "current" : ""].join(" ");
    const inner = `
      <span class="day">DAY ${lesson.day}</span>
      <span class="title">${esc(lesson.title)}</span>
      ${lesson.duration ? `<span class="dur">${esc(lesson.duration)}</span>` : ""}
      <span class="state">${done ? "✓" : unlocked ? "" : "🔒"}</span>`;
    return `<li class="${cls}" data-day="${lesson.day}">${
      unlocked ? `<a href="watch.html?id=${course.id}&day=${lesson.day}">${inner}</a>` : `<div class="locked">${inner}</div>`
    }</li>`;
  }

  function curriculum(course, currentDay, openAll) {
    const lessons = getLessons(course);
    return course.phases
      .map((p) => {
        const items = lessons.filter((l) => l.day >= p.from && l.day <= p.to);
        const open = openAll || (currentDay >= p.from && currentDay <= p.to);
        return `
        <details class="phase" ${open ? "open" : ""}>
          <summary>${esc(p.title)} <small>DAY ${p.from}–${p.to} · ${items.length}강</small></summary>
          <ul class="lesson-list">${items.map((l) => lessonItem(course, l, currentDay)).join("")}</ul>
        </details>`;
      })
      .join("");
  }

  function pageCourse() {
    const course = getCourse(params.get("id")) || COURSES[0];
    document.title = `${course.title} | ${SITE.name}`;

    $("#course-hero").style.background = `linear-gradient(135deg, ${course.color}, ${course.color}bb)`;
    $("#course-hero-text").innerHTML = `
      <div class="crumbs"><a href="index.html">홈</a> › ${course.days}일 과정</div>
      <span class="badge" style="margin-top:14px">${esc(course.badge)}</span>
      <h1>${esc(course.title)}</h1>
      <p>${esc(course.subtitle)}</p>`;

    const renderEnroll = () => {
      const enrolled = isEnrolled(course.id);
      const pct = percent(course);
      const nd = nextDay(course);
      $("#enroll-card").innerHTML = enrolled
        ? `
          <div><small class="muted">내 진도</small><div class="price">${pct}%</div></div>
          <div class="progress"><i style="width:${pct}%;background:${course.color}"></i></div>
          <a class="btn btn-primary btn-block" style="background:${course.color}" href="watch.html?id=${course.id}&day=${nd}">${pct === 100 ? "다시 보기" : `DAY ${nd} 이어서 학습하기`}</a>`
        : `
          <div><small class="muted">수강료</small><div class="price">${esc(course.price)}</div></div>
          <ul>
            <li>${course.days}일 · 총 ${course.days}강</li>
            <li>매일 실천 미션 제공</li>
            <li>모바일 · 앱에서 시청 가능</li>
            <li>DAY 1 무료 미리보기</li>
          </ul>
          <button class="btn btn-primary btn-block" id="enroll-btn" style="background:${course.color}">수강 시작하기</button>
          <a class="btn btn-ghost btn-block" href="watch.html?id=${course.id}&day=1">DAY 1 미리보기</a>`;
      const btn = $("#enroll-btn");
      if (btn)
        btn.addEventListener("click", () => {
          // TODO: 결제 연동 시 이 부분에서 결제 페이지로 이동시키세요.
          enroll(course.id);
          toast("수강이 시작되었어요! DAY 1부터 함께해요 🎉");
          renderEnroll();
          $("#curriculum").innerHTML = curriculum(course, nextDay(course));
        });
    };
    renderEnroll();

    $("#course-desc").textContent = course.description;
    $("#outcomes").innerHTML = course.outcomes.map((o) => `<li>${esc(o)}</li>`).join("");
    $("#curriculum-count").textContent = `총 ${course.days}강 · ${course.phases.length}단계`;
    $("#curriculum").innerHTML = curriculum(course, isEnrolled(course.id) ? nextDay(course) : 1);
  }

  /* =========================================================
   * 페이지: 강의 시청
   * ========================================================= */
  function pageWatch() {
    const course = getCourse(params.get("id")) || COURSES[0];
    const lessons = getLessons(course);
    const day = Math.min(Math.max(parseInt(params.get("day"), 10) || 1, 1), course.days);
    const lesson = lessons[day - 1];
    const unlocked = isUnlocked(course, day);
    document.title = `DAY ${day}. ${lesson.title} | ${course.title}`;

    // 플레이어
    if (!unlocked) {
      $("#player").innerHTML = `<div class="empty"><div><b>🔒 아직 열리지 않은 강의예요</b>${
        isEnrolled(course.id)
          ? SITE.unlockMode === "daily"
            ? "하루에 한 강씩 열립니다. 내일 다시 만나요!"
            : "이전 강의를 완료하면 열립니다."
          : `수강을 시작하면 볼 수 있어요.<br><br><a class="btn btn-primary btn-sm" href="course.html?id=${course.id}">수강 신청하러 가기</a>`
      }</div></div>`;
    } else if (lesson.videoId) {
      $("#player").innerHTML = `<iframe src="${ytEmbed(lesson.videoId)}" title="${esc(lesson.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else {
      $("#player").innerHTML = `<div class="empty"><div><b>🎬 영상 준비 중</b>js/data.js 에서 DAY ${day} 의 videoId 를 입력하면 이곳에 재생됩니다.</div></div>`;
    }

    // 정보
    $("#watch-crumbs").innerHTML = `<a href="course.html?id=${course.id}">${esc(course.title)}</a> › ${esc(lesson.phase)}`;
    $("#watch-title").textContent = `DAY ${day}. ${lesson.title}`;
    $("#mission-text").textContent = lesson.mission;
    if (!unlocked) $("#watch-extra").classList.add("hidden");

    // 메모
    const noteKey = `${course.id}-${day}`;
    const ta = $("#note");
    ta.value = Store.get().notes[noteKey] || "";
    let t;
    ta.addEventListener("input", () => {
      clearTimeout(t);
      $("#note-saved").textContent = "저장 중…";
      t = setTimeout(() => {
        Store.update((d) => {
          d.notes[noteKey] = ta.value;
        });
        $("#note-saved").textContent = "자동 저장됨 ✓";
      }, 500);
    });

    // 버튼
    const prev = $("#prev-btn");
    const next = $("#next-btn");
    const doneBtn = $("#done-btn");
    if (day > 1) prev.href = `watch.html?id=${course.id}&day=${day - 1}`;
    else prev.setAttribute("disabled", "");

    const renderSide = () => {
      const pct = percent(course);
      $("#side-head").innerHTML = `
        <b>${esc(course.title)}</b>
        <small>${doneDays(course.id).length} / ${course.days}강 완료 · ${pct}%</small>
        <div class="progress"><i style="width:${pct}%;background:${course.color}"></i></div>`;
      $("#side-list").innerHTML = curriculum(course, day, false);
      const cur = $(`#side-list .lesson-item[data-day="${day}"]`);
      if (cur && window.matchMedia("(min-width: 1025px)").matches) cur.scrollIntoView({ block: "center" });

      const isDone = doneDays(course.id).includes(day);
      doneBtn.textContent = isDone ? "✓ 완료한 강의" : "✅ 오늘 강의 완료";
      doneBtn.className = isDone ? "btn btn-ghost" : "btn btn-primary";
      if (day < course.days && isUnlocked(course, day + 1)) {
        next.href = `watch.html?id=${course.id}&day=${day + 1}`;
        next.removeAttribute("disabled");
      } else {
        next.removeAttribute("href");
        next.setAttribute("disabled", "");
      }
    };
    renderSide();

    doneBtn.addEventListener("click", () => {
      if (!isEnrolled(course.id)) {
        toast("수강을 시작하면 진도가 기록돼요");
        setTimeout(() => (location.href = `course.html?id=${course.id}`), 900);
        return;
      }
      const already = doneDays(course.id).includes(day);
      Store.update((d) => {
        const list = new Set(d.done[course.id] || []);
        if (already) list.delete(day);
        else {
          list.add(day);
          const e = d.enrolled[course.id];
          e.log = [...(e.log || []), Date.now()].slice(-500);
        }
        d.done[course.id] = [...list].sort((a, b) => a - b);
        d.last[course.id] = day;
      });
      if (!already) {
        toast(doneDays(course.id).length === course.days ? `🎉 ${course.days}일 과정을 모두 완주했어요!` : `DAY ${day} 완료! 잘하셨어요 👏`);
      }
      renderSide();
    });

    Store.update((d) => {
      if (unlocked) d.last[course.id] = day;
    });
  }

  /* =========================================================
   * 페이지: 내 강의실
   * ========================================================= */
  function pageMy() {
    const enrolled = COURSES.filter((c) => isEnrolled(c.id));
    const root = $("#my-courses");
    if (!enrolled.length) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="ico">🎓</div>
          <h3>아직 수강 중인 강의가 없어요</h3>
          <p>21일, 66일, 100일 과정 중 하나를 골라 시작해보세요.</p>
          <a class="btn btn-primary" style="margin-top:20px" href="index.html#courses">강의 둘러보기</a>
        </div>`;
    } else {
      root.innerHTML = enrolled
        .map((c) => {
          const done = doneDays(c.id);
          const pct = percent(c);
          const started = new Date(Store.get().enrolled[c.id].startedAt);
          const elapsed = Math.floor((startOfDay(Date.now()) - startOfDay(started)) / DAY_MS) + 1;
          const nd = nextDay(c);
          const cells = [];
          for (let d = 1; d <= c.days; d++) {
            const isDone = done.includes(d);
            const style = isDone ? ` style="background:${c.color}"` : "";
            cells.push(
              isUnlocked(c, d)
                ? `<a href="watch.html?id=${c.id}&day=${d}" class="${isDone ? "done" : ""}"${style} title="DAY ${d}">${d}</a>`
                : `<span title="DAY ${d} (잠김)">${d}</span>`
            );
          }
          return `
          <div class="my-card">
            <div class="my-card-head">
              <div>
                <span class="badge outline">${c.days}일 과정</span>
                <h3 style="margin-top:6px">${esc(c.title)}</h3>
              </div>
              <a class="btn btn-primary btn-sm" style="background:${c.color}" href="watch.html?id=${c.id}&day=${nd}">${pct === 100 ? "다시 보기" : `DAY ${nd} 이어하기`}</a>
            </div>
            <div class="my-stats">
              <div><strong>${pct}%</strong>진도율</div>
              <div><strong>${done.length}/${c.days}</strong>완료한 강의</div>
              <div><strong>🔥 ${streak(c.id)}일</strong>연속 학습</div>
              <div><strong>${elapsed}일째</strong>${started.toLocaleDateString("ko-KR")} 시작</div>
            </div>
            <div class="progress"><i style="width:${pct}%;background:${c.color}"></i></div>
            <div class="day-grid">${cells.join("")}</div>
          </div>`;
        })
        .join("");
    }

    const others = COURSES.filter((c) => !isEnrolled(c.id));
    $("#other-wrap").classList.toggle("hidden", !others.length || !enrolled.length);
    $("#other-courses").innerHTML = others.map(courseCard).join("");

    $("#reset-btn").addEventListener("click", () => {
      if (confirm("이 기기에 저장된 학습 기록을 모두 지울까요?")) {
        try {
          localStorage.removeItem(STORE_KEY);
        } catch (e) {}
        location.reload();
      }
    });
  }

  /* =========================================================
   * 앱(PWA) 설치
   * ========================================================= */
  function setupPWA() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }

    const btn = $(".install-btn");
    let deferred = null;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e;
      btn.classList.remove("hidden");
    });
    if (isIOS && !standalone) btn.classList.remove("hidden");

    btn.addEventListener("click", async () => {
      if (deferred) {
        deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        btn.classList.add("hidden");
      } else if (isIOS) {
        toast("Safari 하단 공유 버튼 → '홈 화면에 추가'를 눌러주세요");
      }
    });
    window.addEventListener("appinstalled", () => btn.classList.add("hidden"));
  }

  /* ---------- 시작 ---------- */
  const page = document.body.dataset.page;
  renderChrome(page);
  ({ home: pageHome, courses: pageCourse, watch: pageWatch, my: pageMy })[page]?.();
  setupPWA();
})();
