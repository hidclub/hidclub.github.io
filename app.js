(function () {
  "use strict";

  var SITE = window.SITE || {};
  var REFS = (window.REFS || []).slice().sort(function (a, b) { return b.year - a.year; });
  var app = document.getElementById("app");
  var foot = document.getElementById("foot");
  var activeYear = "all";

  // 작은 DOM 헬퍼 (데이터는 textContent 로만 넣어 안전하게 렌더링)
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      for (var j = 0; j < kids.length; j++) {
        var c = kids[j];
        if (c === null || c === undefined || c === false) continue;
        el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      }
    }
    return el;
  }

  function hue(s) {
    var x = 0;
    for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 360;
    return x;
  }

  // 사진이 있으면 사진, 없으면 포스터형 카드
  function poster(r, big) {
    if (r.image) {
      return h("div", { class: "poster" + (big ? " big" : "") },
        h("img", { src: r.image, alt: r.title, loading: "lazy" }));
    }
    var hu = hue(r.slug);
    var bg = "linear-gradient(160deg, hsl(" + hu + " 72% 40%), hsl(" + ((hu + 45) % 360) + " 60% 13%))";
    return h("div", { class: "poster gen" + (big ? " big" : ""), style: "background:" + bg },
      h("span", { class: "tg" }, r.tag),
      h("span", { class: "yr" }, String(r.year)),
      h("span", { class: "nm" }, r.title));
  }

  function setTitle(t) { document.title = t ? t + " | " + SITE.name : "수행 레퍼런스 | " + SITE.name; }

  function renderList() {
    setTitle("");
    app.textContent = "";

    var years = REFS.map(function (r) { return r.year; });
    var minY = Math.min.apply(null, years), maxY = Math.max.apply(null, years);
    var clients = {};
    REFS.forEach(function (r) {
      r.meta.forEach(function (m) { if (m[0] === "발주처") clients[m[1]] = 1; });
    });

    var lines = String(SITE.headline || "").split("\n");
    var h1 = h("h1", {});
    lines.forEach(function (ln, i) {
      if (i) h1.appendChild(document.createTextNode("\n"));
      if (i === lines.length - 1 && lines.length > 1) h1.appendChild(h("em", {}, ln));
      else h1.appendChild(document.createTextNode(ln));
    });

    app.appendChild(h("section", { class: "hero" },
      h1,
      h("p", {}, SITE.sub),
      h("div", { class: "stats" },
        h("div", { class: "stat" }, h("b", {}, String(REFS.length)), h("span", {}, "수행 레퍼런스")),
        h("div", { class: "stat" }, h("b", {}, minY + "–" + String(maxY).slice(2)), h("span", {}, "수행 기간")),
        h("div", { class: "stat" }, h("b", {}, String(Object.keys(clients).length)), h("span", {}, "발주처"))
      )
    ));

    var yearList = ["all"].concat(Array.from(new Set(years)).sort(function (a, b) { return b - a; }));
    var chips = h("div", { class: "filters", role: "group", "aria-label": "연도 필터" });
    yearList.forEach(function (y) {
      chips.appendChild(h("button", {
        class: "chip", type: "button",
        "aria-pressed": String(String(y) === String(activeYear)),
        onclick: function () { activeYear = y; renderList(); }
      }, y === "all" ? "전체" : String(y)));
    });
    app.appendChild(chips);

    var shown = REFS.filter(function (r) { return activeYear === "all" || String(r.year) === String(activeYear); });
    var grid = h("div", { class: "grid" });
    shown.forEach(function (r) {
      var when = (r.meta.filter(function (m) { return m[0] === "일시"; })[0] || [0, String(r.year)])[1];
      grid.appendChild(h("a", { class: "card", href: "#/r/" + r.slug },
        poster(r, false),
        h("div", { class: "cap" },
          h("div", { class: "meta" }, r.year + " · " + r.tag),
          h("h3", {}, r.title)
        )
      ));
    });
    app.appendChild(shown.length ? grid : h("p", { class: "empty" }, "표시할 레퍼런스가 없습니다."));
    window.scrollTo(0, 0);
  }

  function copyLink(btn) {
    var url = location.href;
    function done() { btn.textContent = "링크를 복사했습니다"; setTimeout(function () { btn.textContent = "링크 복사"; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("링크를 복사하세요", url); });
    } else {
      window.prompt("링크를 복사하세요", url);
    }
  }

  function renderDetail(slug) {
    var r = REFS.filter(function (x) { return x.slug === slug; })[0];
    if (!r) { location.hash = "#/"; return; }
    setTitle(r.title);
    app.textContent = "";

    var dl = h("dl", { class: "dl" });
    r.meta.forEach(function (m) { dl.appendChild(h("div", {}, h("dt", {}, m[0]), h("dd", {}, m[1]))); });

    var nums = h("div", { class: "nums" });
    r.numbers.forEach(function (n) { nums.appendChild(h("div", { class: "num" }, h("b", {}, n[0]), h("span", {}, n[1]))); });

    var list = h("ul", { class: "list" });
    r.items.forEach(function (t) { list.appendChild(h("li", {}, t)); });

    var share = h("button", { class: "btn", type: "button", onclick: function (e) { copyLink(e.currentTarget); } }, "링크 복사");

    app.appendChild(h("article", { class: "detail" },
      h("a", { class: "back", href: "#/" }, "← 전체 보기"),
      h("div", { class: "hd" },
        poster(r, true),
        h("div", {},
          h("div", { class: "tags" }, h("span", { class: "tag hot" }, r.tag), h("span", { class: "tag" }, String(r.year))),
          h("h1", {}, r.title),
          h("p", { class: "tagline" }, r.tagline),
          dl
        )
      ),
      h("section", { class: "sec" },
        h("h2", {}, r.plan ? "계획 규모" : "숫자로 보기"),
        nums,
        r.plan ? h("p", { class: "note" }, "기획 단계에서 세운 목표 수치이며, 실제 결과와 다를 수 있습니다.") : null
      ),
      h("section", { class: "sec" },
        h("h2", {}, "과업 내용"),
        h("p", { class: "about" }, r.about),
        list
      ),
      h("div", { class: "actions" },
        h("a", { class: "btn primary", href: "#/" }, "다른 레퍼런스 보기"),
        share
      )
    ));
    window.scrollTo(0, 0);
  }

  function renderFoot() {
    foot.textContent = "";
    if (SITE.contact) foot.appendChild(h("p", {}, SITE.contact));
    foot.appendChild(h("p", {}, "© " + new Date().getFullYear() + " " + SITE.name));
  }

  function route() {
    var m = /^#\/r\/([\w-]+)/.exec(location.hash);
    if (m) renderDetail(m[1]); else renderList();
  }

  document.getElementById("brand").textContent = SITE.name;
  renderFoot();
  window.addEventListener("hashchange", route);
  route();
})();
