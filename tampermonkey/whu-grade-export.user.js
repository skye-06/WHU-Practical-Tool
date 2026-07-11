// ==UserScript==
// @name         武大课程成绩导出
// @namespace    local.whu-grade-export
// @version      2.2.0
// @description  自动收集课程成绩并导出 HTML
// @match        http://zyfzzd.whu.edu.cn/xshx/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  const ENDPOINT = "/api/cjxx/queryPage";
  const TERMS = [
    "2024-2025学年第一学期",
    "2024-2025学年第二学期",
    "2024-2025学年第三学期",
    "2025-2026学年第一学期",
    "2025-2026学年第二学期",
  ];
  const TERM_INDEX = new Map(TERMS.map((term, index) => [term, index]));
  const SEMESTERS = { 1: "第一", 2: "第二", 3: "第三" };
  const collator = new Intl.Collator("zh-Hans-CN", { numeric: true });
  const state = { records: new Map(), pages: new Set(), total: 0, pageCount: 0, waitingFor: 0, complete: false, timer: 0 };

  const text = (value) => value == null ? "" : String(value).trim();
  const escape = (value) => text(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function termOf(row) {
    const year = Number(row.xn);
    const semester = SEMESTERS[Number(row.xqm)];
    return year && semester ? `${year}-${year + 1}学年${semester}学期` : "";
  }

  function teachers(value) {
    return text(value).split(";").map((entry) => {
      const parts = entry.split("/").map(text).filter(Boolean);
      return (parts.length > 1 ? parts.slice(1) : parts).filter((part) => part !== "无").join(" ");
    }).filter(Boolean).join("；");
  }

  function normalize(row) {
    return {
      term: termOf(row),
      category: text(row.kcxzmc),
      course: text(row.kcmc),
      grade: text(row.kccj),
      credit: text(row.xf),
      teacher: teachers(row.skjs),
      exam: text(row.ksxzmc),
    };
  }

  function ordered(rows) {
    return rows.filter((row) => TERM_INDEX.has(row.term) && row.course && row.grade).sort((a, b) =>
      TERM_INDEX.get(a.term) - TERM_INDEX.get(b.term)
      || collator.compare(a.category, b.category)
      || collator.compare(a.course, b.course)
      || collator.compare(a.teacher, b.teacher));
  }

  function reportHtml(rows) {
    const prepared = ordered(rows.map(normalize));
    const sections = TERMS.map((term) => {
      const items = prepared.filter((row) => row.term === term);
      if (!items.length) return "";
      const body = items.map((row) => `<tr><td class="category">${escape(row.category)}</td><td class="course">${escape(row.course)}</td><td><strong class="grade">${escape(row.grade)}</strong></td><td class="credit">${escape(row.credit)}</td></tr>`).join("");
      const hasExtra = items.some((row) => row.teacher || row.exam);
      const extra = hasExtra ? `<details><summary>教师与考试性质</summary><table class="extra"><thead><tr><th scope="col">课程名</th><th scope="col">教师</th><th scope="col">考试性质</th></tr></thead><tbody>${items.map((row) => `<tr><td>${escape(row.course)}</td><td>${escape(row.teacher)}</td><td>${escape(row.exam)}</td></tr>`).join("")}</tbody></table></details>` : "";
      return `<section><h2>${escape(term)}</h2><table><thead><tr><th scope="col">课程性质</th><th scope="col">课程名</th><th scope="col">成绩段</th><th scope="col">学分</th></tr></thead><tbody>${body}</tbody></table>${extra}</section>`;
    }).join("") || "<p>暂无符合条件的成绩。</p>";
    return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>成绩单</title><style>:root{color-scheme:light;--ink:#1d292d;--muted:#637071;--line:#d9ddd8;--paper:#fffefa;--tint:#edf3ee;--accent:#1c6258;--accent-soft:#dcece4}*{box-sizing:border-box}body{margin:0;background:#e8e6df;color:var(--ink);font:15px/1.65 "Aptos","Segoe UI","Noto Sans CJK SC","Microsoft YaHei",sans-serif}main{max-width:980px;margin:48px auto;padding:52px 56px 64px;background:var(--paper);box-shadow:0 18px 48px rgba(31,43,40,.1)}h1,h2{font-family:"Baskerville","Iowan Old Style","Noto Serif CJK SC","Source Han Serif SC",serif}h1{margin:0 0 44px;text-align:center;font-size:34px;line-height:1.2;letter-spacing:.24em;font-weight:700}section{margin:0 0 40px;break-inside:avoid}h2{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 0 14px;color:#183f3b;text-align:center;font-size:19px;line-height:1.35;font-weight:700}h2::before,h2::after{content:"";width:32px;height:1px;background:#9faca6}table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:12px 16px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}th{background:var(--tint);color:#315b55;font-size:13px;font-weight:700;letter-spacing:.08em}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#f8fbf8}.category{color:#315b55;font-weight:600}.course{font-weight:600}.grade{display:inline-block;min-width:3.4em;padding:2px 9px;border-radius:999px;background:var(--accent-soft);color:#174c43;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}.credit{color:var(--muted);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}details{margin-top:10px;border:1px solid var(--line);background:#fbfcfa}summary{padding:10px 14px;color:#42605a;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:.04em}summary:hover{background:var(--tint)}details[open] summary{border-bottom:1px solid var(--line)}.extra th,.extra td{padding:9px 14px}.extra th{background:#f4f7f3}@media(max-width:640px){main{margin:0;padding:36px 14px 44px;box-shadow:none}h1{margin-bottom:34px;font-size:28px}h2{gap:9px;font-size:16px}h2::before,h2::after{width:18px}table{font-size:13px}th,td{padding:10px 9px}.extra{font-size:12px}.extra th,.extra td{padding:8px}}@media print{body{background:#fff}main{max-width:none;margin:0;padding:0;box-shadow:none}tbody tr:hover{background:transparent}}</style><main><h1>成绩单</h1>${sections}</main></html>`;
  }

  function recordKey(row) {
    return [row.kch, row.xn, row.xqm, row.kccj, row.kcmc].map(text).join("\u0001");
  }

  function isComplete() {
    return (state.pageCount && state.pages.size >= state.pageCount) || (state.total && state.records.size >= state.total);
  }

  function statusText() {
    if (!state.total) return "等待课程数据";
    return state.complete ? `已收集 ${state.records.size} / ${state.total}` : `收集 ${state.records.size} / ${state.total}`;
  }

  function updatePanel() {
    const label = document.querySelector("#whu-grade-status");
    const button = document.querySelector("#whu-grade-export");
    if (label) label.textContent = statusText();
    if (button) button.disabled = !state.complete;
  }

  function download() {
    const url = URL.createObjectURL(new Blob([reportHtml([...state.records.values()])], { type: "text/html;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "成绩单.html" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function mountPanel() {
    if (document.querySelector("#whu-grade-panel")) return;
    const panel = document.createElement("aside");
    panel.id = "whu-grade-panel";
    panel.innerHTML = '<span id="whu-grade-status" aria-live="polite">等待课程数据</span><button id="whu-grade-export" type="button" disabled>导出 HTML</button>';
    Object.assign(panel.style, { position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483647", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#1d2a33", color: "#fff", borderRadius: "8px", boxShadow: "0 8px 24px #0005", font: "14px/1.2 'Microsoft YaHei',sans-serif" });
    const button = panel.querySelector("button");
    Object.assign(button.style, { minHeight: "36px", border: 0, borderRadius: "4px", padding: "0 12px", background: "#e8f0ed", color: "#18333a", font: "inherit", cursor: "pointer" });
    button.addEventListener("click", download);
    document.body.append(panel);
    updatePanel();
  }

  function nextPage() {
    if (state.complete || state.waitingFor || !state.pageCount) return;
    const next = Array.from({ length: state.pageCount }, (_, index) => index + 1).find((page) => !state.pages.has(page));
    if (!next) return;
    const pages = [...document.querySelectorAll(".el-pagination .el-pager li.number")];
    const target = pages.find((node) => Number(node.textContent.trim()) === next);
    if (!target) return;
    state.waitingFor = next;
    target.click();
  }

  function queueNext() {
    clearTimeout(state.timer);
    if (state.complete) return;
    state.timer = setTimeout(nextPage, 500);
  }

  function receive(body) {
    try {
      const payload = typeof body === "string" ? JSON.parse(body) : body;
      const result = payload?.data?.result;
      if (!Array.isArray(result?.records)) return;
      result.records.forEach((row) => state.records.set(recordKey(row), row));
      const current = Number(result.current);
      if (current) state.pages.add(current);
      if (current === state.waitingFor) state.waitingFor = 0;
      state.total = Math.max(state.total, Number(result.total) || 0);
      state.pageCount = Math.max(state.pageCount, Number(result.pages) || 0);
      state.complete = isComplete();
      updatePanel();
      queueNext();
    } catch (_) { /* 非目标 JSON 不处理 */ }
  }

  function installInterceptors() {
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      this.__whuGradeUrl = text(url);
      return open.call(this, method, url, ...args);
    };
    XMLHttpRequest.prototype.send = function (...args) {
      this.addEventListener("loadend", () => {
        if (this.__whuGradeUrl.includes(ENDPOINT)) receive(this.responseType === "json" ? this.response : this.responseText);
      }, { once: true });
      return send.apply(this, args);
    };
    const fetch = window.fetch;
    window.fetch = function (...args) {
      return fetch.apply(this, args).then((response) => {
        if (response.url.includes(ENDPOINT)) response.clone().text().then(receive);
        return response;
      });
    };
  }

  function selfTest() {
    const rows = [
      { xn: "2025", xqm: "2", kch: "b", kcmc: "B 课", kccj: "90-100分", xf: "2", kcxzmc: "专业教育必修", skjs: "001/乙/教授", ksxzmc: "正常考试" },
      { xn: "2024", xqm: "2", kch: "a", kcmc: "A 课", kccj: "78-89分", xf: "3", kcxzmc: "公共基础必修", skjs: "002/甲/讲师", ksxzmc: "正常考试" },
      { xn: "2024", xqm: "2", kch: "c", kcmc: "C 课", kccj: "90-100分", xf: "2", kcxzmc: "专业教育必修", skjs: "003/丙/讲师", ksxzmc: "正常考试" },
    ];
    const sorted = ordered(rows.map(normalize));
    const html = reportHtml(rows);
    if (!(sorted[0].term === "2024-2025学年第二学期" && sorted[0].category === "公共基础必修" && sorted[1].category === "专业教育必修" && html.includes("<h1>成绩单</h1>") && html.includes("课程性质") && html.includes("教师与考试性质") && !html.includes("main::before") && !html.includes("课程号"))) throw new Error("成绩导出自检失败");
  }

  if (typeof window === "undefined") return selfTest();
  installInterceptors();
  document.body ? mountPanel() : addEventListener("DOMContentLoaded", mountPanel, { once: true });
})();
