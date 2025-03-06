// ==UserScript==
// @name         Truant
// @namespace    https://edu.rk.gov.ru/
// @version      1.0.0
// @description  Counts the number of passes
// @author       SvyaT_T
// @match        https://edu.rk.gov.ru/*
// @icon         https://static.wikia.nocookie.net/subwaysurf/images/a/a9/Super_Sneaker.png/revision/latest/scale-to-width-down/150?cb=20221016171039
// @updateURL    https://github.com/Svyaaaaaaaat/Truant/raw/refs/heads/main/Truant.user.js
// @downloadURL  https://github.com/Svyaaaaaaaat/Truant/raw/refs/heads/main/Truant.user.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  console.log("Restart!");
  const currentVersion = "1.0.0";

  function checkUpdates() {
    const updateURL =
      "https://raw.githubusercontent.com/Svyaaaaaaaat/Truant/main/Truant.user.js";

    fetch(updateURL + "?ts=" + Date.now())
      .then((response) => response.text())
      .then((text) => {
        const remoteVersionMatch = text.match(/@version\s+([\d.]+)/i);
        if (remoteVersionMatch) {
          const remoteVersion = remoteVersionMatch[1];
          if (remoteVersion > currentVersion) {
            showUpdateNotification(remoteVersion);
          }
        }
      })
      .catch((error) => console.error("Ошибка проверки обновлений:", error));
  }
  function showUpdateNotification(newVersion) {
    const scriptName = "Truant";
    if (
      confirm(
        `Доступна новая версия "${scriptName}" ${newVersion}! Обновить сейчас?`
      )
    ) {
      window.open(
        "https://github.com/Svyaaaaaaaat/Truant/raw/refs/heads/main/Truant.user.js",
        "_blank"
      );
    }
  }

  let canStart = JSON.parse(sessionStorage.getItem("canStart")) || false;
  function startPeek() {
    canStart = sessionStorage.setItem("canStart", true);
    if (
      !JSON.parse(sessionStorage.getItem("holidays")) ||
      !JSON.parse(sessionStorage.getItem("schedule"))
    ) {
      if (
        window.location.href !== "https://edu.rk.gov.ru/journal-schedule-action"
      ) {
        window.location.href = "https://edu.rk.gov.ru/journal-schedule-action";
      }

      // Каникулы
      const holidayItems = window.holidayItems;
      const holidays = [];

      new DOMParser()
        .parseFromString(holidayItems, "text/html")
        .querySelectorAll(".list-mdash li")
        .forEach((item) => {
          const dates = item.textContent.match(/\d{2}\.\d{2}\.\d{4}/g);
          holidays.push({
            start: new Date(dates[0].split(".").reverse().join("-")),
            end: dates[1]
              ? new Date(dates[1].split(".").reverse().join("-"))
              : null,
          });
        });

      // Расписание
      const schedule = {};

      document.querySelectorAll(".schedule__day").forEach((dayElement) => {
        const weekDay = dayElement
          .querySelector(".schedule__day__content__header__dayweek")
          ?.textContent.trim();
        schedule[weekDay] = {};
        dayElement
          .querySelector(".schedule__day__content__column")
          ?.querySelectorAll(".schedule__day__content__lesson--main")
          ?.forEach((item) => {
            const lessonElement = item
              .querySelector(".schedule-lesson")
              ?.cloneNode(true);
            lessonElement.querySelector(".schedule-group")?.remove();
            const lesson = lessonElement.textContent.trim();
            schedule[weekDay][lesson] = (schedule[weekDay][lesson] || 0) + 1;
          });
      });

      delete schedule["Суббота"];
      delete schedule["Воскресенье"];

      sessionStorage.setItem(
        "holidays",
        holidays.length ? JSON.stringify(holidays) : null
      );
      sessionStorage.setItem(
        "schedule",
        Object.keys(schedule).length ? JSON.stringify(schedule) : null
      );
    }

    if (!JSON.parse(sessionStorage.getItem("skipped"))) {
      if (
        window.location.href !==
        "https://edu.rk.gov.ru/journal-app/view.miss_report/"
      ) {
        window.location.href =
          "https://edu.rk.gov.ru/journal-app/view.miss_report/";
      }

      // Прогулы
      const skipped = {};
      document.querySelectorAll('[xls="row"]')?.forEach((item) => {
        const lesson = item.querySelector(".text-left")?.textContent.trim();
        const totalLessonsMissed = item
          .querySelector(".strong.miss_detail.pointer")
          ?.textContent.trim();
        skipped[lesson] = +totalLessonsMissed || 0;
      });

      sessionStorage.setItem(
        "skipped",
        Object.keys(skipped).length ? JSON.stringify(skipped) : null
      );
    }
    if (
      JSON.parse(sessionStorage.getItem("holidays")) &&
      JSON.parse(sessionStorage.getItem("schedule")) &&
      JSON.parse(sessionStorage.getItem("skipped"))
    ) {
      sessionStorage.setItem("canStart", false);
      window.location.href = sessionStorage.getItem("savedPage");
    }
  }

  if (canStart) {
    startPeek();
  }

  function deleteLessons() {
    const originalSchedule = JSON.parse(sessionStorage.getItem("schedule"));
    const originalSkipped = JSON.parse(sessionStorage.getItem("skipped"));

    for (const day in originalSchedule) {
      for (const lesson of excludedLesson) {
        if (originalSchedule[day][lesson]) {
          delete originalSchedule[day][lesson];
        }
      }
    }

    excludedLesson.forEach((lesson) => {
      if (originalSkipped.hasOwnProperty(lesson)) {
        delete originalSkipped[lesson];
      }
    });

    schedule = { ...originalSchedule };
    skipped = { ...originalSkipped };
  }

  let isDarkMode =
    JSON.parse(localStorage.getItem("isDarkMode")) ??
    (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);

  iframe.style.overflow = "hidden";
  iframe.style.position = "fixed";
  iframe.style.zIndex = "9999";
  iframe.style.right = "140px";
  iframe.style.bottom = "140px";
  iframe.style.width = "60px";
  iframe.style.height = "60px";
  iframe.style.borderRadius = "50%";
  iframe.style.border = "none";
  iframe.style.background = "transparent";

  iframe.srcdoc = `
<html>
<head>
	<script src="https://unpkg.com/@tailwindcss/browser@4"></script>
	<style class="theme-style" type="text/tailwindcss"></style>
	<style>
			.dark .dark\\:border-outline-dark {
border-color: var(--color-outline-dark);
}
.dark .dark\\:border-primary-dark {
border-color: var(--color-primary-dark);
}
.dark .dark\\:bg-\\[var\\(--color-surface-dark\\)\\] {
background-color: var(--color-surface-dark);
}
.dark .dark\\:bg-primary-dark {
background-color: var(--color-primary-dark);
}
.dark .dark\\:bg-surface-dark-alt {
background-color: var(--color-surface-dark-alt);
}
.dark .dark\\:bg-surface-dark-alt\\/50 {
background-color: color-mix(in oklab, var(--color-surface-dark-alt) 50%, transparent);
}
.dark .dark\\:text-on-primary-dark {
color: var(--color-on-primary-dark);
}
.dark .dark\\:text-on-surface-dark {
color: var(--color-on-surface-dark);
}
.dark .dark\\:text-on-surface-dark-strong {
color: var(--color-on-surface-dark-strong);
}
.dark .dark\\:text-primary-dark {
color: var(--color-primary-dark);
}
.dark .dark\\:checked\:border-primary-dark {
&:checked {
	border-color: var(--color-primary-dark);
}
}
.dark .dark\\:checked\\:before\\:bg-primary-dark {
&:checked {
	&::before {
		content: var(--tw-content);
		background-color: var(--color-primary-dark);
	}
}
}
.dark .dark\\:hover\\:bg-primary-dark\\/10 {
&:hover {
	@media (hover: hover) {
		background-color: color-mix(in oklab, var(--color-primary-dark) 10%, transparent);
	}
}
}
.dark .dark\\:focus\\:outline-outline-dark-strong {
&:focus {
	outline-color: var(--color-outline-dark-strong);
}
}

.dark .dark\\:checked\\:focus\\:outline-primary-dark {
&:checked {
	&:focus {
		outline-color: var(--color-primary-dark);
	}
}
}

.dark .dark\\:focus-visible\\:outline-primary-dark {
&:focus-visible {
	outline-color: var(--color-primary-dark);
}
}

.dark .dark\\:has-checked\\:text-on-surface-dark-strong {
&:has(*:checked) {
	color: var(--color-on-surface-dark-strong);
}
}

.dark .dark\\:bg-primary\\/20 {
		background-color: color-mix(in oklab, var(--color-primary) 20%, transparent);
	}

			html {
					overflow: hidden;
					box-sizing: border-box;
					-webkit-font-smoothing: antialiased;
			}
			.weekday-list span {
					font-size: 18px;
					pointer-events: none;
			}

			.entry-percent {
					pointer-events: none;
			}

			kbd {
					cursor: pointer;
			}

			.checkbox-list label {
					padding-top: 3px;
					margin-top: -3px;
			}

			.author-link {
					position: absolute;
					top: 5px;
					left: 50%;
					transform: translateX(-50%);
					font-size: 18px;
					/* color: #fff; */
					text-decoration: underline;
			}
			.author-link:hover {
					font-size: 18.4px;
					transition: all 0.15s ease;
			}

			.green {
					color: #007bff;
			}

			.red {
					color: #ff5722;
			}

			.button-start label {
					display: none;
			}

			.button-menu svg {
					display: none;
			}

			button,
			label {
					cursor: pointer;
			}

			.button-all {
					position: absolute;
					z-index: 99999;
					right: 0;
					bottom: 0;
					border-radius: 50%;
					background-color: #000;
					border-color: #000;
			}

			.button-start {
					width: 60px;
					height: 60px;
			}

			.button-menu {
					transition: all 0.2s;
					width: 50px;
					height: 50px;
			}

			.button-menu_active {
					/* transition: all 0s; */
					right: 2px;
					bottom: 2px;
			}

			.button-close {
					width: 30px;
					height: 40px;
					cursor: pointer;
					position: absolute;
					right: 0;
					top: 0;
					transition: all 0.25s ease;
			}
							.button-close:hover {
					height: 35px;
			}
			.button-close svg {
					transition: all 0.25s ease;
			}
			.button-close:hover svg {
					width: 18pt;
					height: 18pt;
			}

			.button-theme-change {
					width: 30px;
					height: 30px;
					position: absolute;
					z-index: -1;
					opacity: 0;
					right: -10px;
					bottom: 55px;
					transition: all 0.1s ease-in-out;
			}
			.button-theme-change:hover {
					width: 34px;
					height: 34px;
					transition: all 0.16s ease-in-out;
			}
			.rotate svg {
					transition: transform 0.5s ease;
			}
			.rotate svg {
					transform: rotate(180deg);
			}

			.button-theme-mode-change {
					width: 30px;
					height: 30px;
					position: absolute;
					z-index: -1;
					opacity: 0;
					right: -10px;
					bottom: 85px;
					transition: all 0.1s ease-in-out;
			}
			.button-theme-mode-change:hover {
					width: 34px;
					height: 34px;
					transition: all 0.16s ease-in-out;
			}

			.block_open .button-theme-change {
					z-index: 9999;
					opacity: 1;
					right: 0;
					bottom: 55px;
			}

			.block_open .button-theme-mode-change {
					z-index: 9999;
					opacity: 1;
					right: -3px;
			}

			.form {
					white-space: nowrap;
					display: flex;
					align-items: end;
					gap: 0 20px;
			}

			.block {
					position: absolute;
					z-index: 1;
					width: 60px;
					height: 60px;
					max-width: 60px;
					max-height: 60px;
					border-radius: 50%;
					overflow: hidden;
					transition: all 0s;
					background-color: inherit;
					user-select: none;
					-webkit-user-select: none;
					-moz-user-select: none;
					-ms-user-select: none;
			}

			.block_resize {
					width: 50px;
					height: 50px;
					max-width: 50px;
					max-height: 50px;
					transition:
							all 0.15s,
							background 0.11s;
					right: 0;
					bottom: 0;
			}

			.block_active {
					transition:
							max-width 0.25s cubic-bezier(0.25, 1, 0.5, 1),
							max-height 0.25s cubic-bezier(0.25, 1, 0.5, 1);
					display: flex;
					gap: 0 30px;
					padding-left: 17px;
					padding-top: 15px;
					padding-right: 10px;
					padding-bottom: 15px;
					width: 247px;
					height: 256px;
					max-width: 247px;
					max-height: 256px;
					border-radius: 15px;
					background-color: #000;
			}

			.block_open {
					z-index: 999;
					transition:
							max-width 0.25s cubic-bezier(0.25, 1, 0.5, 1),
							max-height 0.15s cubic-bezier(0.25, 1, 0.5, 1),
							transform 3s,
							background-color 0.3s;
					width: auto;
					height: auto;
					max-width: 1185.61px;
					max-height: 542px;
					padding-right: 25px;
					padding-bottom: 25px;
					padding-left: 25px;
			}

			.countdown-wrapper {
					margin-bottom: 5px;
			}

			.lesson-skipped {
					white-space: nowrap;
					display: flex;
					flex-direction: column;
					justify-content: end;
					color: #fff;
					margin-top: 25px;
			}

			.lesson-skipped h2 {
					font-size: 17px;
					/* color: #fff; */
					font-weight: bold;
			}

			.weekday-skipping {
					margin-bottom: 10px;
			}

			.countdown {
					color: #fff;
			}

			.weekday-countdown {
					color: #fff;
			}

			.wrapper {
					max-width: 180px;
					display: flex;
					flex-direction: column;
					justify-content: end;
					margin-right: 40px;
			}

			.toggle {
					display: block;
					cursor: pointer;
			}

			.toggle input {
					display: none;
			}

			.toggle input+div {
					width: 20px;
					height: 14px;
					position: relative;
			}

			.toggle input+div div {
					position: absolute;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					transition: transform 0.5s ease;
			}

			.toggle input+div div span {
					display: block;
					position: absolute;
					left: 0;
					right: 0;
			}

			.toggle input+div div span:first-child {
					top: 0;
			}

			.toggle input+div div span:first-child:before,
			.toggle input+div div span:first-child:after {
					top: 0;
			}

			.toggle input+div div span:last-child {
					bottom: 0;
			}

			.toggle input+div div span:last-child:before,
			.toggle input+div div span:last-child:after {
					bottom: 0;
			}

			.toggle input+div div span:before,
			.toggle input+div div span:after {
					content: "";
					display: block;
					width: 47%;
					height: 2px;
					border-radius: 1px;
					background: #fff;
					position: absolute;
					backface-visibility: hidden;
					transition:
							transform 0.5s ease,
							border-radius 0.3s ease,
							background 0.4s ease;
			}

			.toggle input+div div span:before {
					left: 0;
					transform-origin: 0 50%;
					transform: translate(1px, 0) scaleX(1.1);
			}

			.toggle input+div div span:after {
					right: 0;
					transform-origin: 100% 50%;
					transform: translate(-1px, 0) scaleX(1.1);
			}

			.toggle input+div svg {
					display: block;
					fill: none;
					stroke: #fff;
					stroke-width: 2px;
					width: 44px;
					height: 44px;
					stroke-linecap: round;
					position: absolute;
					left: 50%;
					top: 50%;
					margin: -22px 0 0 -22px;
					stroke-dasharray: 0 82.801 8 82.801;
					stroke-dashoffset: 82.801;
					transform-origin: 50% 50%;
					backface-visibility: hidden;
					transform: scale(1);
					transition:
							stroke-dashoffset 0.5s ease,
							stroke-dasharray 0.6s ease,
							transform 0.5s ease,
							stroke 0.4s ease;
			}

			.toggle input+div svg:nth-child(3) {
					transform: rotate(180deg) scale(1);
			}

			.toggle input:checked+div div {
					transform: rotate(135deg);
			}

			.toggle_close input:checked+div div {
					transform: rotate(270deg);
			}

			.toggle input:checked+div div span:before,
			.toggle input:checked+div div span:after {
					background: #fff;
			}

			.toggle input:checked+div div span:first-child:before {
					transform: rotate(45deg) translate(2.2px, -3px) scaleX(1.05);
			}

			.toggle input:checked+div div span:first-child:after {
					transform: rotate(-45deg) translate(-2.2px, -3px) scaleX(1.05);
			}

			.toggle input:checked+div div span:last-child:before {
					transform: rotate(-45deg) translate(2.2px, 3px) scaleX(1.05);
			}

			.toggle input:checked+div div span:last-child:after {
					transform: rotate(45deg) translate(-2.2px, 3px) scaleX(1.05);
			}

			.toggle input:checked+div svg {
					stroke-dashoffset: 62;
					stroke-dasharray: 0 82.801 62 82.801;
					transform: rotate(90deg);
					stroke: #fff;
			}

			.toggle input:checked+div svg:nth-child(3) {
					transform: rotate(270deg);
			}

			* {
					box-sizing: inherit;
			}

			*:before,
			*:after {
					box-sizing: inherit;
			}

			body .dribbble {
					position: fixed;
					display: block;
					right: 24px;
					bottom: 24px;
			}

			body .dribbble img {
					display: block;
					width: 76px;
			}

			.button-area {
			position: absolute;
			z-index: -1;
			width: 100%;
			height: 100%;
			}
	</style>
</head>

<body class="${isDarkMode ? "dark" : "light"}">
	<div class="block bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]" style="background-color: rgb(0, 0, 0); border: none;">
			<a class="author-link text-on-surface dark:text-on-surface-dark" style="position: absolute; z-index: -1; visibility: hidden";" target="_blank" href="https://t.me/SvyatBgdn">SvyatBgdn</a>
			<form class="form" id="form" style="position: absolute; z-index: -1; visibility: hidden";">
					<div class="checkbox-list flex flex-col gap-1">
							<button class="checkbox-list__clear-all order-last mt-2 whitespace-nowrap w-full p-2 rounded-lg bg-transparent border border-primary text-primary text-sm font-semibold shadow-inner transition-colors hover:bg-primary/10 dark:border-primary-dark dark:text-primary-dark dark:hover:bg-primary-dark/10">очистить всё</button>
					</div>
					<div class="weekday-list flex flex-col gap-1">
							<button class="weekday-list__clear-all order-last mt-3 whitespace-nowrap w-full p-2 rounded-lg bg-transparent border border-primary text-primary text-sm font-semibold shadow-inner transition-colors hover:bg-primary/10 dark:border-primary-dark dark:text-primary-dark dark:hover:bg-primary-dark/10">очистить всё</button>
					</div>
			</form>
			<ul class="lesson-skipped" style="position: absolute; z-index: -1; visibility: hidden";">
					<h2>Уйти с уроков</h2>
			</ul>
			<div class="wrapper">
					<ul class="weekday-skipping flex flex-wrap gap-1">
					</ul>
					<div style="position: absolute; z-index: -1; visibility: hidden";" class="countdown-wrapper flex flex-col items-center gap-2 p-3 bg-surface-alt rounded-lg shadow-lg border border-outline dark:bg-surface-dark-alt dark:border-outline-dark">
							<div class="countdown w-full p-2 rounded-lg bg-primary text-white text-center">
									<p class="text-xs opacity-80"></p>
									<p class="text-lg font-bold"></p>
									<p class="text-xs"></p>
							</div>
							<div class="weekday-countdown bg-primary text-white p-2 rounded-lg w-full text-sm text-center font-semibold shadow-inner border border-white/20">
									Рабочих дней: <span class="font-bold"></span>
							</div>
					</div>
					<div style="position: absolute; z-index: -1; visibility: hidden";" class="entry-percent-wrapper flex flex-col items-center gap-1"><span class="pl-1 text-sm text-on-surface dark:text-on-surface-dark"></span>
							<div class="flex items-center"><button type="button" class="entry-percent-decrease flex h-10 items-center justify-center rounded-tl-radius border border-outline bg-surface-alt px-4 py-2 text-on-surface hover:opacity-75 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark dark:focus-visible:outline-primary-dark"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2" class="size-4">
													<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15"></path>
											</svg></button><span class="entry-percent h-10 w-20 flex items-center justify-center border border-outline bg-surface-alt/50 text-on-surface-strong dark:border-outline-dark dark:bg-surface-dark-alt/50 dark:text-on-surface-dark-strong">50%</span><button type="button" class="entry-percent-increase flex h-10 items-center justify-center rounded-tr-radius border border-outline bg-surface-alt px-4 py-2 text-on-surface hover:opacity-75 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark dark:focus-visible:outline-primary-dark"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2" class="size-4">
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path>
											</svg></button></div>
					</div>
					<div style="position: absolute; z-index: -1; visibility: hidden";" class="entry-percent-wrapper flex items-center justify-center">
							<kbd class="entry-percent-update inline-block flex-grow rounded-bl-radius whitespace-nowrap border border-outline bg-surface-alt text-center py-1 font-mono text-xs font-semibold text-on-surface dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark">10%</kbd>
							<kbd class="entry-percent-update inline-block flex-grow whitespace-nowrap border border-outline bg-surface-alt text-center py-1 font-mono text-xs font-semibold text-on-surface dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark">20%</kbd>
							<kbd class="entry-percent-update inline-block flex-grow whitespace-nowrap border border-outline bg-surface-alt text-center py-1 font-mono text-xs font-semibold text-on-surface dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark">30%</kbd>
							<kbd class="entry-percent-update inline-block flex-grow whitespace-nowrap border border-outline bg-surface-alt text-center py-1 font-mono text-xs font-semibold text-on-surface dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark">40%</kbd>
							<kbd class="entry-percent-update inline-block flex-grow rounded-br-radius whitespace-nowrap border border-outline bg-surface-alt text-center py-1 font-mono text-xs font-semibold text-on-surface dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark">50%</kbd>
					</div>
					<button type="submit" form="form" style="position: absolute; z-index: -1; visibility: hidden";" class="button-save whitespace-nowrap mt-3 w-full p-2 rounded-lg bg-transparent border border-primary text-primary text-sm font-semibold shadow-inner transition-colors hover:bg-primary/10 dark:border-primary-dark dark:text-primary-dark dark:hover:bg-primary-dark/10">Сохранить</button>
			</div>
			<button class="button-close" type="button"><svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="16.000000pt" height="16.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
							<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
									<path d="M1217 4086 c-154 -42 -232 -206 -168 -351 18 -41 120 -148 584 -612 l562 -563 -562 -562 c-614 -615 -606 -606 -606 -719 0 -141 111 -252 253 -252 112 0 104 -7 718 606 l562 562 563 -562 c614 -614 605 -606 718 -606 141 0 252 111 252 253 0 112 7 104 -606 718 l-562 562 562 563 c613 613 606 605 606 717 0 142 -111 253 -252 253 -113 0 -104 8 -718 -606 l-563 -562 -562 562 c-589 588 -594 593 -693 607 -22 3 -62 -1 -88 -8z" />
							</g>
					</svg></button>
			<button class="button-theme-change" type="button"><svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="16.000000pt" height="16.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
							<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
									<path d="M2315 5109 c-268 -25 -594 -118 -851 -243 -415 -201 -750 -494 -1009 -881 -89 -133 -161 -267 -170 -316 -10 -56 12 -118 59 -165 49 -50 105 -69 169 -60 75 11 114 49 190 182 346 611 950 1007 1649 1083 523 57 1090 -108 1518 -442 92 -73 240 -217 326 -319 72 -87 160 -208 149 -208 -3 0 -68 45 -145 100 -174 124 -173 123 -241 124 -181 2 -267 -223 -133 -345 53 -47 878 -632 919 -650 101 -46 216 0 260 104 11 26 31 213 67 606 l52 568 -25 48 c-13 27 -41 63 -62 79 -36 29 -45 31 -117 31 -72 0 -81 -2 -117 -31 -64 -50 -80 -97 -94 -273 -13 -152 -13 -154 -31 -130 -174 240 -290 374 -430 499 -385 342 -828 550 -1328 625 -128 19 -468 27 -605 14z" />
									<path d="M220 2154 c-19 -8 -45 -25 -58 -37 -57 -53 -58 -59 -113 -669 l-53 -575 25 -48 c13 -27 41 -63 62 -79 36 -29 45 -31 117 -31 72 0 81 2 117 31 64 50 80 97 94 273 13 152 13 154 31 130 9 -13 51 -69 91 -124 497 -669 1276 -1049 2097 -1021 278 9 472 43 729 129 527 174 989 528 1306 1002 89 133 161 267 170 316 10 56 -12 118 -59 165 -49 50 -105 69 -169 60 -75 -11 -114 -49 -190 -182 -347 -613 -959 -1013 -1656 -1084 -699 -70 -1402 228 -1859 788 -60 73 -136 182 -127 182 4 0 69 -45 145 -99 172 -123 173 -124 241 -125 181 -2 267 223 133 345 -53 47 -878 632 -919 650 -48 22 -108 23 -155 3z" />
							</g>
					</svg></button>
			 <button class="button-theme-mode-change" type="button">
					 <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="16.000000pt" height="16.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet"> <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none"> <path d="M2330 5110 c-494 -48 -950 -230 -1350 -538 -195 -150 -448 -432 -594 -662 -63 -99 -186 -351 -230 -471 -49 -134 -102 -340 -128 -499 -31 -195 -31 -565 0 -760 45 -276 116 -498 237 -745 132 -269 269 -460 489 -681 221 -220 412 -357 681 -489 247 -121 469 -192 745 -237 195 -31 565 -31 760 0 276 45 498 116 745 237 269 132 460 269 681 489 220 221 357 412 489 681 88 179 132 296 180 476 63 240 78 371 78 649 0 278 -15 409 -78 649 -48 180 -92 297 -180 476 -132 269 -269 460 -489 681 -221 220 -412 357 -681 489 -246 121 -474 193 -740 235 -147 23 -475 34 -615 20z m585 -339 c637 -107 1177 -462 1531 -1006 163 -251 279 -558 331 -880 24 -153 24 -497 0 -650 -106 -652 -456 -1196 -1001 -1553 -258 -170 -563 -286 -891 -339 -153 -24 -497 -24 -650 0 -656 106 -1202 460 -1561 1012 -163 251 -279 558 -331 880 -24 153 -24 497 0 650 106 656 460 1202 1012 1561 291 189 661 315 1025 348 108 10 418 -4 535 -23z" /> <path d="M2560 2560 l0 -1923 104 6 c430 27 798 163 1109 413 328 262 554 625 652 1044 40 172 49 255 49 460 0 205 -9 288 -49 460 -98 419 -324 782 -652 1044 -311 250 -679 386 -1109 413 l-104 6 0 -1923z" /> </g> </svg>
			 </button>
	</div>
	<button class="button-area" type="button"></button>
					<button style="background-color: #000; border-color: #000;" aria-label="create something epic" type="button" class="button-start button-all inline-flex justify-center items-center aspect-square whitespace-nowrap rounded-full border border-primary bg-primary p-2 text-base font-medium tracking-wide text-on-primary transition text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 disabled:opacity-75 disabled:cursor-not-allowed dark:border-primary-dark dark:bg-primary-dark dark:text-on-primary-dark dark:focus-visible:outline-primary-dark">
					<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="20.000000pt" height="20.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
							<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
									<path d="M4320 5109 c-170 -13 -441 -53 -602 -89 -306 -69 -533 -148 -803 -280 -632 -308 -1259 -918 -1634 -1589 l-53 -94 914 -914 914 -914 117 65 c651 365 1261 995 1567 1621 142 289 228 546 296 882 58 290 77 486 78 818 l1 290 -28 57 c-31 64 -70 101 -137 132 -41 18 -68 20 -275 22 -126 1 -286 -2 -355 -7z m-630 -876 c267 -65 481 -281 547 -551 25 -102 22 -267 -6 -366 -71 -253 -260 -449 -506 -526 -108 -34 -276 -39 -385 -11 -150 38 -281 112 -377 213 -340 361 -242 950 196 1177 169 87 349 109 531 64z" />
									<path d="M3408 3944 c-164 -39 -291 -161 -333 -318 -74 -273 120 -546 400 -564 238 -14 435 142 477 378 40 229 -130 466 -366 509 -75 14 -106 13 -178 -5z" />
									<path d="M1056 3720 c-231 -19 -284 -29 -348 -61 -83 -43 -129 -100 -395 -503 -146 -220 -274 -418 -286 -440 -16 -31 -22 -59 -22 -116 0 -65 4 -82 29 -128 35 -62 87 -107 148 -127 34 -12 412 -75 446 -75 5 0 24 62 42 138 99 414 276 807 542 1199 95 140 91 133 76 132 -7 -1 -111 -10 -232 -19z" />
									<path d="M1057 2661 c-77 -214 -143 -499 -134 -577 10 -89 29 -112 549 -631 490 -488 505 -501 561 -519 52 -16 67 -17 144 -5 116 16 323 70 462 120 63 23 117 43 120 46 5 6 -1649 1665 -1660 1665 -4 0 -23 -44 -42 -99z" />
									<path d="M585 1679 c-11 -6 -143 -133 -293 -283 -296 -295 -304 -305 -282 -385 13 -48 66 -97 114 -106 76 -15 85 -8 370 274 148 146 274 280 282 298 33 76 4 160 -66 195 -39 20 -95 23 -125 7z" />
									<path d="M3625 1223 c-407 -277 -822 -463 -1257 -563 -54 -12 -98 -27 -98 -32 0 -34 63 -411 75 -446 20 -61 65 -113 127 -148 46 -25 63 -29 128 -29 57 0 85 6 116 22 23 12 221 141 440 286 462 305 496 336 533 474 9 34 52 503 47 510 -1 1 -51 -32 -111 -74z" />
									<path d="M1025 1224 c-43 -22 -983 -962 -1006 -1006 -10 -21 -19 -51 -19 -68 0 -50 35 -107 80 -130 49 -25 90 -25 138 -1 20 11 256 239 524 508 525 526 510 509 494 597 -17 92 -127 144 -211 100z" />
									<path d="M1465 771 c-16 -10 -148 -137 -292 -282 -221 -224 -262 -270 -268 -301 -21 -111 77 -207 182 -179 54 15 587 549 598 599 14 69 -16 136 -75 167 -40 21 -109 19 -145 -4z" />
							</g>
					</svg>
					<label class="toggle">
							<input type="checkbox">
							<div>
									<div>
											<span></span>
											<span></span>
									</div>
									<svg>
											<use xlink:href="#path">
									</svg>
									<svg>
											<use xlink:href="#path">
									</svg>
							</div>
					</label>
					<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
							<symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" id="path">
									<path d="M22,22 L2,22 C2,11 11,2 22,2 C33,2 42,11 42,22"></path>
							</symbol>
					</svg>
			</button>
</body>
</html>
`;

  const holidays = JSON.parse(sessionStorage.getItem("holidays"));
  let schedule = JSON.parse(sessionStorage.getItem("schedule"));
  let skipped = JSON.parse(sessionStorage.getItem("skipped"));

  let defaultPercent = 50;
  let currentTheme = localStorage.getItem("theme") || "Modern";
  let userPercent = +localStorage.getItem("userPercent") || defaultPercent;
  const excludedLesson =
    JSON.parse(localStorage.getItem("excludedLesson")) || [];
  const addWeekday = JSON.parse(localStorage.getItem("addWeekday")) || {
    Понедельник: 0,
    Вторник: 0,
    Среда: 0,
    Четверг: 0,
    Пятница: 0,
  };

  iframe.onload = () => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const checkboxList = iframeDoc.querySelector(".checkbox-list");
    const weekdayList = iframeDoc.querySelector(".weekday-list");
    const form = iframeDoc.querySelector(".form");

    function clearExceptButtons(parent) {
      parent.querySelectorAll("*:not(button)").forEach((el) => el.remove());
    }

    clearExceptButtons(checkboxList);
    clearExceptButtons(weekdayList);

    if (
      JSON.parse(sessionStorage.getItem("holidays")) &&
      JSON.parse(sessionStorage.getItem("schedule")) &&
      JSON.parse(sessionStorage.getItem("skipped"))
    ) {
      Object.keys(skipped)
        .sort((a, b) => a.length - b.length)
        .forEach((lesson) => {
          if (lesson) {
            const label = document.createElement("label");
            label.className =
              "flex items-center gap-2 text-sm font-medium text-on-surface dark:text-on-surface-dark has-checked:text-on-surface-strong dark:has-checked:text-on-surface-dark-strong has-disabled:cursor-not-allowed has-disabled:opacity-75";

            const wrapper = document.createElement("div");
            wrapper.className = "relative flex items-center";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className =
              "before:content[''] peer relative size-4 appearance-none overflow-hidden rounded-sm border border-outline bg-surface-alt before:absolute before:inset-0 before:scale-0 before:rounded-full before:transition before:duration-200 checked:border-primary checked:before:scale-125 checked:before:bg-primary focus:outline-outline-strong checked:focus:outline-primary active:outline-offset-0 disabled:cursor-not-allowed dark:border-outline-dark dark:bg-surface-dark-alt dark:checked:border-primary-dark dark:checked:before:bg-primary-dark dark:focus:outline-outline-dark-strong dark:checked:focus:outline-primary-dark";

            const span = document.createElement("span");
            span.appendChild(document.createTextNode(lesson));

            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke-width", "4");

            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("d", "M4.5 12.75l6 6 9-13.5");

            svg.classList.add(
              "pointer-events-none",
              "invisible",
              "absolute",
              "left-1/2",
              "top-1/2",
              "size-3",
              "-translate-x-1/2",
              "-translate-y-1/2",
              "scale-0",
              "transition",
              "duration-200",
              "delay-200",
              "peer-checked:scale-100",
              "text-on-primary",
              "peer-checked:visible",
              "dark:text-on-primary-dark"
            );
            svg.appendChild(path);

            checkbox.value = lesson;
            checkbox.checked = excludedLesson.includes(lesson);
            label.appendChild(wrapper);
            label.appendChild(span);
            wrapper.appendChild(checkbox);
            wrapper.appendChild(svg);
            checkboxList.appendChild(label);
          }
        });

      Object.keys(addWeekday).forEach((weekday) => {
        const container = document.createElement("div");
        container.className = "flex flex-col items-center gap-1";

        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center";

        const weekdayName = document.createElement("span");
        weekdayName.textContent = weekday;
        weekdayName.className =
          "pl-1 text-sm text-on-surface dark:text-on-surface-dark";

        const quantity = document.createElement("span");
        quantity.textContent = addWeekday[weekday];
        quantity.className =
          "h-10 w-20 flex items-center justify-center border border-outline bg-surface-alt/50 text-on-surface-strong dark:border-outline-dark dark:bg-surface-dark-alt/50 dark:text-on-surface-dark-strong";
        !isDarkMode && (quantity.style.color = "var(--color-on-surface)");

        const increaseButton = document.createElement("button");
        increaseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`;
        increaseButton.type = "button";
        increaseButton.className =
          "flex h-10 items-center justify-center rounded-r-radius border border-outline bg-surface-alt px-4 py-2 text-on-surface hover:opacity-75 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark dark:focus-visible:outline-primary-dark";

        const decreaseButton = document.createElement("button");
        decreaseButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15"/></svg>`;
        decreaseButton.type = "button";
        decreaseButton.className =
          "flex h-10 items-center justify-center rounded-l-radius border border-outline bg-surface-alt px-4 py-2 text-on-surface hover:opacity-75 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 dark:border-outline-dark dark:bg-surface-dark-alt dark:text-on-surface-dark dark:focus-visible:outline-primary-dark";

        increaseButton.addEventListener("click", () => {
          addWeekday[weekday]++;
          quantity.textContent = addWeekday[weekday];
        });

        decreaseButton.addEventListener("click", () => {
          addWeekday[weekday]--;
          quantity.textContent = addWeekday[weekday];
        });

        container.appendChild(weekdayName);
        container.appendChild(wrapper);
        wrapper.appendChild(decreaseButton);
        wrapper.appendChild(quantity);
        wrapper.appendChild(increaseButton);
        weekdayList.appendChild(container);
      });

      deleteLessons();
    }

    const button = iframeDoc.querySelector(".button-all");
    const buttonClose = iframeDoc.querySelector(".button-close");
    const buttonInput = iframeDoc.querySelector(".toggle input");
    const buttonLabel = iframeDoc.querySelector(".toggle");
    const block = iframeDoc.querySelector(".block");

    function toggleColors() {
      iframeDoc.querySelectorAll(".weekday-skipping li").forEach((li) => {
        if (currentTheme === "Purple") {
          li.className =
            "flex items-center gap-2 px-4 py-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow text-primary-dark dark:bg-primary/20 dark:border-primary-light dark:text-primary-light border-primary bg-primary/10";

          const svg = li.querySelector("svg");

          svg.setAttribute("class", "w-5 h-5 text-primary");

          const spans = li.querySelectorAll("span");

          if (spans.length > 0)
            spans[0].className = "font-medium text-on-surface";
          if (spans.length > 1)
            spans[1].className =
              "font-bold text-primary dark:text-primary-light";
        } else {
          //li.classList.replace('bg-white', 'bg-surface-alt');
          li.classList.replace("border-primary", "border-outline");
          li.classList.remove("border-green-500");
          li.classList.add(
            "dark:bg-surface-dark-alt",
            "dark:border-outline-dark",
            "text-on-surface",
            "dark:text-on-surface-dark"
          );
          li.classList.remove(
            "text-primary-dark",
            "bg-primary/10",
            "dark:bg-primary/20"
          );

          const svg = li.querySelector("svg");
          if (svg) {
            svg.classList.replace("text-primary", "text-on-surface");
            svg.classList.remove("text-green-500");
            svg.classList.add("dark:text-on-surface-dark");
          }
          const spans = li.querySelectorAll("span");
          if (spans.length > 0) {
            spans[0].classList.replace(
              "text-on-surface",
              "text-on-surface-strong"
            );
            spans[0].classList.remove("text-gray-700");
            spans[0].classList.add("dark:text-on-surface-dark-strong");
          }

          if (spans.length > 1) {
            spans[1].classList.replace(
              "text-primary",
              "text-on-surface-strong"
            );
            spans[1].classList.add("dark:text-on-surface-dark-strong");
            spans[1].classList.remove("text-green-600");
          }
        }
      });
    }

    button.addEventListener("click", (event) => {
      if (block.classList.contains("block_open")) {
        buttonClose.click();
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      if (buttonLabel.classList.contains("toggle_close")) {
        block.classList.add("block_open");

        if (currentTheme === "Prototype") {
          document
            .querySelectorAll(
              ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
            )
            .forEach((el) => el.classList.remove("rounded-lg"));
        } else {
          document
            .querySelectorAll(
              ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
            )
            .forEach((el) => el.classList.add("rounded-lg"));
        }
        if (currentTheme === "Arctic") {
          block.style.backgroundColor = "var(--color-surface-dark)";
          button.style.backgroundColor = "var(--color-surface-dark)";
          button.style.borderColor = "var(--color-surface-dark)";
        }
        if (!isDarkMode) {
          iframeDoc.querySelector(".block_open").style.backgroundColor = "#fff";
          button.style.backgroundColor = "var(--color-primary)";
          button.style.borderColor = "var(--color-primary)";
          iframeDoc.querySelector(".button-theme-change").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-theme-change svg g")
            .setAttribute("fill", "currentColor");
          iframeDoc.querySelector(".button-theme-mode-change").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-theme-mode-change svg g")
            .setAttribute("fill", "currentColor");
          iframeDoc.querySelector(".button-close").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-close svg g")
            .setAttribute("fill", "currentColor");
          block.style.border = "1px solid var(--color-primary)";
          if (currentTheme === "Arctic") {
            iframeDoc.querySelector(".entry-percent").style.color =
              "var(--color-on-surface)";
          }
        }
        toggleColors();
      }
      if (buttonInput.checked) {
        buttonLabel.classList.add("toggle_close");
        const elements = iframeDoc.querySelectorAll(
          ".form, .lesson-skipped, .countdown, .weekday-countdown, .button-save, .entry-percent-wrapper, .author-link, .countdown-wrapper"
        );
        elements.forEach((element) => {
          element.style.position = "";
          element.style.zIndex = "";
          element.style.visibility = "";
        });
      }
      if (button.classList.contains("button-menu")) {
        if (!isDarkMode) {
          block.style.border = "1px solid var(--color-primary)";
        }
        block.style.transform = "translateX(0)";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.borderRadius = "0";
        button.classList.add("button-menu_active");
        block.classList.add("block_active");
        buttonInput.checked = true;
      }
      if (button.classList.contains("button-start")) {
        button.classList.replace("button-start", "button-menu");
        sessionStorage.setItem("savedPage", window.location.href);
        iframe.style.width = "60px";
        iframe.style.height = "60px";
        iframe.style.borderRadius = "0";
        if (
          !JSON.parse(sessionStorage.getItem("holidays")) ||
          !JSON.parse(sessionStorage.getItem("schedule")) ||
          !JSON.parse(sessionStorage.getItem("skipped"))
        ) {
          startPeek();
        } else {
          checkUpdates()
        }
      }
      if (button.classList.contains("button-menu")) {
        block.classList.add("block_resize");
      }
    });

    iframeDoc.querySelector(".button-area").addEventListener("click", () => {
      buttonClose.click();
    });

    buttonClose.addEventListener("click", () => {
      if (block.classList.contains("block_open")) {
        block.style.transform = "translateX(0px)";
      }
      block.style.border = "none";
      const { width, height } = block.getBoundingClientRect();
      if (width > 250 && height > 250) {
        block.style.width = `${width}px`;
        block.style.height = `${height}px`;
      }
      block.addEventListener(
        "transitionend",
        () => {
          iframe.style.width = "50px";
          iframe.style.height = "50px";
          iframe.style.borderRadius = "50%";
        },
        { once: true }
      );
      // block.style.transition = `0.25s cubic-bezier(0.25, 1, 0.5, 1)`;
      const elements = iframeDoc.querySelectorAll(
        ".form, .lesson-skipped, .countdown, .weekday-countdown, .button-save, .entry-percent-wrapper, .author-link, .countdown-wrapper"
      );
      elements.forEach((element) => {
        element.style.position = "absolute";
        element.style.zIndex = "-1";
        element.style.visibility = "hidden";
      });
      block.classList.remove("block_active");
      block.classList.remove("block_open");
      button.classList.remove("button-menu_active");
      buttonLabel.classList.remove("toggle_close");
      buttonInput.checked = false;
    });

    const entryPercent = iframeDoc.querySelector(".entry-percent");
    let interval = null;
    let timeout = null;

    function updatePercent() {
      entryPercent.textContent = `${userPercent}%`;
    }

    function startChanging(changeFunc) {
      if (timeout || interval) return;

      timeout = setTimeout(() => {
        interval = setInterval(() => {
          changeFunc();
          updatePercent();
        }, 50);
      }, 150);
    }

    function stopChanging() {
      clearTimeout(timeout);
      clearInterval(interval);
      timeout = null;
      interval = null;
    }

    iframeDoc
      .querySelector(".entry-percent-increase")
      .addEventListener("click", () => {
        if (userPercent < 100) {
          userPercent += 1;
          updatePercent();
        }
      });
    iframeDoc
      .querySelector(".entry-percent-decrease")
      .addEventListener("click", () => {
        if (userPercent > 0) {
          userPercent -= 1;
          updatePercent();
        }
      });
    iframeDoc
      .querySelector(".entry-percent-increase")
      .addEventListener("mousedown", () => {
        startChanging(() => {
          if (userPercent < 100) userPercent += 1;
        });
      });
    iframeDoc
      .querySelector(".entry-percent-decrease")
      .addEventListener("mousedown", () => {
        startChanging(() => {
          if (userPercent > 0) userPercent -= 1;
        });
      });

    iframeDoc.addEventListener("mouseup", stopChanging);
    iframeDoc.addEventListener("mouseleave", stopChanging);

    iframeDoc.querySelectorAll(".entry-percent-update").forEach((button) => {
      button.addEventListener("click", () => {
        const newValue = parseInt(button.textContent);
        if (!isNaN(newValue)) {
          userPercent = newValue;
          updatePercent();
        }
      });
    });
    updatePercent();

    iframeDoc
      .querySelector(".checkbox-list__clear-all")
      .addEventListener("click", (event) => {
        event.preventDefault();
        iframeDoc
          .querySelectorAll(".checkbox-list input[type='checkbox']")
          .forEach((checkbox) => {
            checkbox.checked = false;
          });
        excludedLesson.length = 0;
      });

    iframeDoc
      .querySelector(".weekday-list__clear-all")
      .addEventListener("click", (event) => {
        event.preventDefault();
        Object.keys(addWeekday).forEach((weekday) => {
          addWeekday[weekday] = 0;
        });
        iframeDoc
          .querySelectorAll(".weekday-list div div span")
          .forEach((span) => {
            span.textContent = "0";
          });
      });

    const themes = {
      Purple: `
					 @theme {
	/* light theme */
	--color-surface: var(--color-white);
	--color-on-surface: var(--color-purple-600);
	--color-on-surface-strong: var(--color-purple-900);
	--color-primary: var(--color-purple-700);
	--color-on-primary: var(--color-white);
	--color-secondary: var(--color-purple-500);
	--color-on-secondary: var(--color-white);
	--color-outline: var(--color-purple-300);
	--color-outline-strong: var(--color-purple-800);

	/* dark theme */
	--color-surface-dark: var(--color-purple-950);
	--color-on-surface-dark: var(--color-purple-300);
	--color-on-surface-dark-strong: var(--color-white);
	--color-primary-dark: var(--color-purple-400);
	--color-on-primary-dark: var(--color-black);
	--color-secondary-dark: var(--color-purple-300);
	--color-on-secondary-dark: var(--color-black);
	--color-outline-dark: var(--color-purple-700);
	--color-outline-dark-strong: var(--color-purple-300);

	/* shared colors */
	--color-info: var(--color-indigo-500);
	--color-on-info: var(--color-white);
	--color-success: var(--color-emerald-500);
	--color-on-success: var(--color-white);
	--color-warning: var(--color-amber-500);
	--color-on-warning: var(--color-white);
	--color-danger: var(--color-rose-500);
	--color-on-danger: var(--color-white);

	/* border radius */
	--radius-radius: var(--radius-sm);
	}
`,
      Modern: `
		@theme {
	/* light theme */
	--color-surface: var(--color-white);
	--color-surface-alt: var(--color-neutral-50);
	--color-on-surface: var(--color-neutral-600);
	--color-on-surface-strong: var(--color-neutral-900);
	--color-primary: var(--color-black);
	--color-on-primary: var(--color-neutral-100);
	--color-secondary: var(--color-neutral-800);
	--color-on-secondary: var(--color-white);
	--color-outline: var(--color-neutral-300);
	--color-outline-strong: var(--color-neutral-800);

	/* dark theme */
	--color-surface-dark: var(--color-neutral-950);
	--color-surface-dark-alt: var(--color-neutral-900);
	--color-on-surface-dark: var(--color-neutral-300);
	--color-on-surface-dark-strong: var(--color-white);
	--color-primary-dark: var(--color-white);
	--color-on-primary-dark: var(--color-black);
	--color-secondary-dark: var(--color-neutral-300);
	--color-on-secondary-dark: var(--color-black);
	--color-outline-dark: var(--color-neutral-700);
	--color-outline-dark-strong: var(--color-neutral-300);

	/* shared colors */
	--color-info: var(--color-sky-500);
	--color-on-info: var(--color-white);
	--color-success: var(--color-green-500);
	--color-on-success: var(--color-white);
	--color-warning: var(--color-amber-500);
	--color-on-warning: var(--color-white);
	--color-danger: var(--color-red-500);
	--color-on-danger: var(--color-white);

	/* border radius */
	--radius-radius: var(--radius-sm);
}
`,
      Prototype: `
		@theme {
	/* light theme */
	--color-surface: var(--color-white);
	--color-surface-alt: var(--color-neutral-100);
	--color-on-surface: var(--color-black);
	--color-on-surface-strong: var(--color-black);
	--color-primary: var(--color-black);
	--color-on-primary: var(--color-white);
	--color-secondary: var(--color-neutral-700);
	--color-on-secondary: var(--color-white);
	--color-outline: var(--color-black);
	--color-outline-strong: var(--color-black);

	/* dark theme */
	--color-surface-dark: var(--color-black);
	--color-surface-dark-alt: var(--color-neutral-900);
	--color-on-surface-dark: var(--color-white);
	--color-on-surface-dark-strong: var(--color-white);
	--color-primary-dark: var(--color-white);
	--color-on-primary-dark: var(--color-black);
	--color-secondary-dark: var(--color-neutral-300);
	--color-on-secondary-dark: var(--color-black);
	--color-outline-dark: var(--color-white);
	--color-outline-dark-strong: var(--color-white);

	/* shared colors */
	--color-info: var(--color-sky-300);
	--color-on-info: var(--color-black);
	--color-success: var(--color-green-300);
	--color-on-success: var(--color-black);
	--color-warning: var(--color-yellow-200);
	--color-on-warning: var(--color-black);
	--color-danger: var(--color-red-300);
	--color-on-danger: var(--color-black);

	/* border radius */
	--radius-radius: var(--radius-none);
}
`,
      Arctic: `
		@theme {
	/* light theme */
	--color-surface: var(--color-white);
	--color-surface-alt: var(--color-slate-100);
	--color-on-surface: var(--color-slate-700);
	--color-on-surface-strong: var(--color-black);
	--color-primary: var(--color-blue-700);
	--color-on-primary: var(--color-slate-100);
	--color-secondary: var(--color-indigo-700);
	--color-on-secondary: var(--color-slate-100);
	--color-outline: var(--color-slate-300);
	--color-outline-strong: var(--color-slate-800);

	/* dark theme */
	--color-surface-dark: var(--color-slate-900);
	--color-surface-dark-alt: var(--color-slate-800);
	--color-on-surface-dark: var(--color-slate-300);
	--color-on-surface-dark-strong: var(--color-white);
	--color-primary-dark: var(--color-blue-600);
	--color-on-primary-dark: var(--color-slate-100);
	--color-secondary-dark: var(--color-indigo-600);
	--color-on-secondary-dark: var(--color-slate-100);
	--color-outline-dark: var(--color-slate-700);
	--color-outline-dark-strong: var(--color-slate-300);

	/* shared colors */
	--color-info: var(--color-sky-600);
	--color-on-info: var(--color-white);
	--color-success: var(--color-green-600);
	--color-on-success: var(--color-white);
	--color-warning: var(--color-amber-500);
	--color-on-warning: var(--color-white);
	--color-danger: var(--color-red-600);
	--color-on-danger: var(--color-white);

	/* border radius */
	--radius-radius: var(--radius-lg);
}
`,
      Green: `
		@theme {
	/* light theme */
	--color-surface: var(--color-white);
	--color-surface-alt: var(--color-green-50);
	--color-on-surface: var(--color-green-700);
	--color-on-surface-strong: var(--color-green-900);
	--color-primary: var(--color-green-600);
	--color-on-primary: var(--color-white);
	--color-secondary: var(--color-green-800);
	--color-on-secondary: var(--color-white);
	--color-outline: var(--color-green-300);
	--color-outline-strong: var(--color-green-800);

	/* dark theme */
	--color-surface-dark: var(--color-green-950);
	--color-surface-dark-alt: var(--color-green-900);
	--color-on-surface-dark: var(--color-green-300);
	--color-on-surface-dark-strong: var(--color-white);
	--color-primary-dark: var(--color-green-400);
	--color-on-primary-dark: var(--color-black);
	--color-secondary-dark: var(--color-green-300);
	--color-on-secondary-dark: var(--color-black);
	--color-outline-dark: var(--color-green-700);
	--color-outline-dark-strong: var(--color-green-300);

	/* shared colors */
	--color-info: var(--color-green-500);
	--color-on-info: var(--color-white);
	--color-success: var(--color-green-600);
	--color-on-success: var(--color-white);
	--color-warning: var(--color-amber-500);
	--color-on-warning: var(--color-white);
	--color-danger: var(--color-red-500);
	--color-on-danger: var(--color-white);

	/* border radius */
	--radius-radius: var(--radius-sm);
}
`,
    };

    function applyTheme(themeName) {
      iframeDoc.querySelector(".theme-style").innerHTML = themes[themeName];
      localStorage.setItem("theme", themeName);
    }

    applyTheme(currentTheme);

    const buttonThemeChange = iframeDoc.querySelector(".button-theme-change");
    buttonThemeChange.addEventListener("click", () => {
      buttonThemeChange.classList.remove("rotate");
      void buttonThemeChange.offsetWidth;
      buttonThemeChange.classList.add("rotate");
      const themeNames = Object.keys(themes);
      const nextIndex =
        (themeNames.indexOf(currentTheme) + 1) % themeNames.length;
      currentTheme = themeNames[nextIndex];
      applyTheme(currentTheme);

      if (currentTheme === "Prototype") {
        iframeDoc
          .querySelectorAll(
            ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
          )
          .forEach((el) => el.classList.remove("rounded-lg"));
      } else {
        iframeDoc
          .querySelectorAll(
            ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
          )
          .forEach((el) => el.classList.add("rounded-lg"));
      }

      if (currentTheme === "Arctic") {
        iframeDoc.querySelector(".block_open").style.backgroundColor =
          "var(--color-surface-dark)";
        button.style.backgroundColor = "var(--color-surface-dark)";
        button.style.borderColor = "var(--color-surface-dark)";
      } else {
        iframeDoc.querySelector(".block_open").style.backgroundColor = "#000";
        button.style.backgroundColor = "#000";
        button.style.borderColor = "#000";
      }

      if (!isDarkMode) {
        iframeDoc.querySelector(".block_open").style.backgroundColor = "#fff";
        button.style.backgroundColor = "var(--color-primary)";
        button.style.borderColor = "var(--color-primary)";
        iframeDoc.querySelector(".button-theme-change").style.color =
          "var(--color-primary)";
        iframeDoc
          .querySelector(".button-theme-change svg g")
          .setAttribute("fill", "currentColor");
        iframeDoc.querySelector(".button-theme-mode-change").style.color =
          "var(--color-primary)";
        iframeDoc
          .querySelector(".button-theme-mode-change svg g")
          .setAttribute("fill", "currentColor");
        iframeDoc.querySelector(".button-close").style.color =
          "var(--color-primary)";
        iframeDoc
          .querySelector(".button-close svg g")
          .setAttribute("fill", "currentColor");
        block.style.border = "1px solid var(--color-primary)";
        if (currentTheme === "Arctic") {
          iframeDoc.querySelector(".entry-percent").style.color =
            "var(--color-on-surface)";
        }
      }

      toggleColors();
    });
    iframeDoc
      .querySelector(".button-theme-mode-change")
      .addEventListener("click", () => {
        isDarkMode = !isDarkMode;
        iframeDoc.querySelector("body").className = `${
          isDarkMode ? "dark" : "light"
        }`;
        if (!isDarkMode) {
          iframeDoc.querySelector(".block_open").style.backgroundColor = "#fff";
          button.style.backgroundColor = "var(--color-primary)";
          button.style.borderColor = "var(--color-primary)";
          iframeDoc.querySelector(".button-theme-change").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-theme-change svg g")
            .setAttribute("fill", "currentColor");
          iframeDoc.querySelector(".button-theme-mode-change").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-theme-mode-change svg g")
            .setAttribute("fill", "currentColor");
          iframeDoc.querySelector(".button-close").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-close svg g")
            .setAttribute("fill", "currentColor");
          block.style.border = "1px solid var(--color-primary)";
          if (currentTheme === "Arctic") {
            iframeDoc.querySelector(".entry-percent").style.color =
              "var(--color-on-surface)";
          }
        }
        if (isDarkMode) {
          iframeDoc.querySelector(".block_open").style.backgroundColor = "#000";
          button.style.backgroundColor = "#000";
          button.style.borderColor = "#000";
          iframeDoc
            .querySelector(".button-theme-change svg g")
            .setAttribute("fill", "#fff");
          iframeDoc
            .querySelector(".button-close svg g")
            .setAttribute("fill", "#fff");
          iframeDoc
            .querySelector(".button-theme-mode-change svg g")
            .setAttribute("fill", "#fff");
          block.style.border = "none";
          if (currentTheme === "Prototype") {
            document
              .querySelectorAll(
                ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
              )
              .forEach((el) => el.classList.remove("rounded-lg"));
          } else {
            document
              .querySelectorAll(
                ".checkbox-list__clear-all, .weekday-list__clear-all, .button-save"
              )
              .forEach((el) => el.classList.add("rounded-lg"));
          }
          if (currentTheme === "Arctic") {
            block.style.backgroundColor = "var(--color-surface-dark)";
            button.style.backgroundColor = "var(--color-surface-dark)";
            button.style.borderColor = "var(--color-surface-dark)";
          }
          if (currentTheme === "Arctic") {
            iframeDoc
              .querySelector(".entry-percent")
              .style.removeProperty("color");
          }
        }

        localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
      });

    function getHoliday() {
      const now = new Date();

      for (const holiday of holidays) {
        const start = new Date(holiday.start);
        const end = holiday.end
          ? new Date(
              new Date(holiday.end).setDate(new Date(holiday.end).getDate() + 1)
            )
          : null;

        if (now < start) {
          return { type: "start", date: start };
        } else if (end && now < end) {
          return { type: "end", date: end };
        }
      }
      return { type: "end", date: null };
    }

    function getHolidayInterval() {
      const now = new Date();

      for (let i = 0; i < holidays.length - 1; i++) {
        const currentStart = new Date(holidays[i].start);
        const currentEnd = new Date(holidays[i].end);
        const nextStart = new Date(holidays[i + 1].start);

        if (now > currentEnd && now < nextStart) {
          return {
            start: currentEnd.toISOString(),
            end: nextStart.toISOString(),
          };
        }

        if (now >= currentStart && now <= currentEnd) {
          return {
            start: currentEnd.toISOString(),
            end: nextStart.toISOString(),
          };
        }
      }

      return null;
    }

    let isFirstCall = true;

    function func() {
      const date = getHoliday();

      if (!date.date) {
        console.log("Дата окончания неизвестна");
        date.date = new Date(prompt("Дата окончания:", "2025-09-01"));
        console.log(date.date);
      }

      const now = new Date();
      const eventDate = new Date(date.date);

      let localEventDate = new Date(
        eventDate.getUTCFullYear(),
        eventDate.getUTCMonth(),
        eventDate.getUTCDate(),
        eventDate.getUTCHours(),
        eventDate.getUTCMinutes(),
        eventDate.getUTCSeconds()
      );

      const timeDiff = localEventDate - now;
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;

      const dayNames = [
        "Воскресенье",
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
      ];

      const weekdayCount = {
        Понедельник: 0,
        Вторник: 0,
        Среда: 0,
        Четверг: 0,
        Пятница: 0,
      };

      const dateInterval = getHolidayInterval();
      if (!dateInterval) {
        console.log("Интервал неизвестен");
        return;
      }

      let currentDate =
        date.type == "end" ? new Date(dateInterval.start) : new Date();
      currentDate.setDate(currentDate.getDate() + 1);

      if (date.type == "end") {
        localEventDate = new Date(dateInterval.end);
      }

      let weekdayCounter = 0;

      while (currentDate < localEventDate) {
        const dayName = dayNames[currentDate.getDay()];
        if (weekdayCount.hasOwnProperty(dayName)) {
          weekdayCount[dayName]++;
          weekdayCounter++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const totalWeekdayCount = {
        Понедельник: 0,
        Вторник: 0,
        Среда: 0,
        Четверг: 0,
        Пятница: 0,
      };

      let currentDateStart = new Date(dateInterval.start);
      let currentDateEnd = new Date(dateInterval.end);
      currentDateStart.setDate(currentDateStart.getDate() + 1);
      currentDateEnd.setDate(currentDateEnd.getDate() + 1);

      while (currentDateStart < currentDateEnd) {
        const dayName = dayNames[currentDateStart.getDay()];
        if (totalWeekdayCount.hasOwnProperty(dayName)) {
          totalWeekdayCount[dayName]++;
        }
        currentDateStart.setDate(currentDateStart.getDate() + 1);
      }

      Object.keys(addWeekday).forEach((day) => {
        weekdayCount[day] += addWeekday[day];
        weekdayCounter += addWeekday[day];
        totalWeekdayCount[day] += addWeekday[day];
      });

      const totalSchedule = {};
      const totalLesson = {};
      const totalLessonSkipped = {};

      for (const day in schedule) {
        totalSchedule[day] = {};
        for (const lesson in schedule[day]) {
          totalSchedule[day][lesson] =
            schedule[day][lesson] * totalWeekdayCount[day];
          totalLesson[lesson] =
            (totalLesson[lesson] || 0) + totalSchedule[day][lesson];
          totalLessonSkipped[lesson] = Math.floor(
            totalLesson[lesson] * (userPercent / 100) - skipped[lesson]
          );
        }
      }

      const skippingWeekday = {
        Понедельник: 0,
        Вторник: 0,
        Среда: 0,
        Четверг: 0,
        Пятница: 0,
      };

      let tomorrow = (new Date("2025-01-13").getDay() + 1) % 7;
      let tomorrowName = dayNames[tomorrow];

      for (let i = 0; i < weekdayCounter; i++) {
        tomorrowName = dayNames[tomorrow];
        let lessons = schedule[tomorrowName];

        if (lessons && weekdayCount[tomorrowName]) {
          let canSkip = Object.keys(lessons).every(
            (lesson) => (totalLessonSkipped[lesson] || 0) >= lessons[lesson]
          );

          if (canSkip) {
            skippingWeekday[tomorrowName]++;
            weekdayCount[tomorrowName]--;

            Object.keys(lessons).forEach((lesson) => {
              totalLessonSkipped[lesson] -= lessons[lesson];
            });
          }
        }

        tomorrow = (tomorrow + 1) % 7;
      }

      // console.log(weekdayCount);
      // console.log(totalWeekdayCount);
      // console.log(totalSchedule);
      // console.log(totalLesson);
      // console.log(totalLessonSkipped);
      // console.log(schedule);
      // console.log(weekdayCounter);
      // console.log(skippingWeekday);

      const LessonSkippedList = iframeDoc.querySelector(".lesson-skipped");
      LessonSkippedList.innerHTML = "";
      const heading = document.createElement("h2");
      heading.textContent = "Уйти с уроков:";
      heading.className = "text-on-surface dark:text-on-surface-dark";
      LessonSkippedList.appendChild(heading);
      const WeekdaySkippedList = iframeDoc.querySelector(".weekday-skipping");
      WeekdaySkippedList.innerHTML = "";

      let hasLessons = false;
      Object.entries(totalLessonSkipped)
        .sort((a, b) => a[0].length - b[0].length)
        .forEach(([lesson, value]) => {
          if (value != 0) {
            hasLessons = true;
            const listItem = document.createElement("li");
            listItem.className = "text-on-surface dark:text-on-surface-dark";
            listItem.textContent = `${lesson}: ${value}`;
            LessonSkippedList.appendChild(listItem);
          }
        });

      if (!hasLessons) {
        heading.remove();
      }

      Object.entries(skippingWeekday).forEach(([weekday, value]) => {
        const listItem = document.createElement("li");
        listItem.className =
          "flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow";

        listItem.classList.add(
          value > 0 ? "border-green-500" : "border-red-500"
        );

        const icon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        icon.setAttribute(
          "class",
          `w-5 h-5 ${value > 0 ? "text-green-500" : "text-red-500"}`
        );
        icon.setAttribute("fill", "currentColor");
        icon.setAttribute("viewBox", "0 0 20 20");

        icon.innerHTML =
          value > 0
            ? `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>`
            : `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>`;

        const spanItem = document.createElement("span");
        spanItem.className = "font-medium text-gray-700";
        spanItem.textContent = weekday;

        listItem.appendChild(icon);
        listItem.appendChild(spanItem);

        if (value !== 0 && value !== 1) {
          const spanValue = document.createElement("span");
          spanValue.className =
            value > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold";
          spanValue.textContent = value;
          listItem.appendChild(spanValue);
        }

        WeekdaySkippedList.appendChild(listItem);
      });

      if (!isFirstCall) {
        toggleColors();
      }
      isFirstCall = false;

      const declension = (n, w) =>
        w[
          n % 10 === 1 && n % 100 !== 11
            ? 0
            : n % 10 >= 2 && n % 10 <= 4 && ![12, 13, 14].includes(n % 100)
            ? 1
            : 2
        ];
      const formatSegment = (val, units) => (val > 0 ? `${val}${units}` : null);

      iframeDoc.querySelector(".countdown p:nth-child(1)").textContent = `До ${
        date.type === "start" ? "начала" : "конца"
      } каникул`;
      const timeSegments = [
        formatSegment(days, "д"),
        formatSegment(hours, "ч"),
      ].filter(Boolean);
      iframeDoc.querySelector(".countdown p:nth-child(2)").textContent =
        timeSegments.join(" ") || "";

      const weekSegments = [
        weeks > 0 &&
          `${weeks} ${declension(weeks, ["неделя", "недели", "недель"])}`,
        remainingDays > 0 &&
          `${remainingDays} ${declension(remainingDays, [
            "день",
            "дня",
            "дней",
          ])}`,
      ].filter(Boolean);
      iframeDoc.querySelector(".countdown p:nth-child(3)").textContent =
        weekSegments.join(", ") || "";

      iframeDoc.querySelector(".weekday-countdown span").textContent =
        weekdayCounter;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      excludedLesson.length = 0;

      iframeDoc
        .querySelectorAll(".checkbox-list input:checked")
        .forEach((checkbox) => {
          excludedLesson.push(checkbox.value);
        });

      localStorage.setItem("excludedLesson", JSON.stringify(excludedLesson));
      localStorage.setItem("addWeekday", JSON.stringify(addWeekday));
      localStorage.setItem("userPercent", userPercent);

      block.style.width = `auto`;
      block.style.height = `auto`;
      deleteLessons();
      func();
    });

    if (
      JSON.parse(sessionStorage.getItem("holidays")) &&
      JSON.parse(sessionStorage.getItem("schedule")) &&
      JSON.parse(sessionStorage.getItem("skipped"))
    ) {
      func();
    }
  };
})();
