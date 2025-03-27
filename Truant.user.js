// ==UserScript==
// @name         Truant
// @namespace    https://edu.rk.gov.ru/
// @version      1.0.2
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
  const currentVersion = "1.0.2";

  function checkUpdates() {
    const updateURL =
      "https://raw.githubusercontent.com/Svyaaaaaaaat/Truant/main/Truant.user.js";

    fetch(updateURL + "?ts=" + Date.now())
      .then((response) => response.text())
      .then((text) => {
        const remoteVersionMatch = text.match(/@version\s+([\d.]+)/i);
        if (remoteVersionMatch) {
          const remoteVersion = remoteVersionMatch[1];
          if (remoteVersion != currentVersion) {
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

  let startAttempts = +sessionStorage.getItem("startAttempts") || 0;
  let canStart = JSON.parse(sessionStorage.getItem("canStart")) || false;

  function startPeek() {
    if (startAttempts >= 5) {
      return false;
    }
    startAttempts++;
    sessionStorage.setItem("startAttempts", startAttempts);
    const savedPage = sessionStorage.getItem("savedPage");
    let suffixMatch = sessionStorage.getItem("suffixMatch");
    if (!suffixMatch && suffixMatch != "unknown") {
      suffixMatch = savedPage.match(/u\.\d+$/);
      sessionStorage.setItem(
        "suffixMatch",
        suffixMatch ? suffixMatch : "unknown"
      );
    }
    console.log(suffixMatch);

    canStart = sessionStorage.setItem("canStart", true);
    if (
      !JSON.parse(sessionStorage.getItem("holidays")) ||
      !JSON.parse(sessionStorage.getItem("schedule")) ||
      !JSON.parse(sessionStorage.getItem("skipped")) ||
      !JSON.parse(sessionStorage.getItem("grades"))
    ) {
      if (
        !JSON.parse(sessionStorage.getItem("holidays")) ||
        !JSON.parse(sessionStorage.getItem("schedule"))
      ) {
        if (
          window.location.href !==
          `https://edu.rk.gov.ru/journal-schedule-action${
            suffixMatch && suffixMatch != "unknown"
              ? `/class./${suffixMatch[0]}`
              : ""
          }`
        ) {
          window.location.href = `https://edu.rk.gov.ru/journal-schedule-action${
            suffixMatch && suffixMatch != "unknown"
              ? `/class./${suffixMatch[0]}`
              : ""
          }`;

          return;
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
          `https://edu.rk.gov.ru/journal-app/view.miss_report/${
            suffixMatch && suffixMatch != "unknown" ? `${suffixMatch[0]}` : ""
          }`
        ) {
          window.location.href = `https://edu.rk.gov.ru/journal-app/view.miss_report/${
            suffixMatch && suffixMatch != "unknown" ? `${suffixMatch[0]}` : ""
          }`;
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
      if (!JSON.parse(sessionStorage.getItem("grades"))) {
        if (
          window.location.href !==
          `https://edu.rk.gov.ru/journal-student-grades-action/${
            suffixMatch && suffixMatch != "unknown" ? `${suffixMatch[0]}` : ""
          }`
        ) {
          window.location.href = `https://edu.rk.gov.ru/journal-student-grades-action/${
            suffixMatch && suffixMatch != "unknown" ? `${suffixMatch[0]}` : ""
          }`;
        }

        // Отметки
        const cellsInRowName = document.querySelectorAll(
          '[xls="hcolumn"] .cell'
        );
        const cellsName = Array.from(cellsInRowName).map((cell) =>
          cell.getAttribute("name")
        );
        const cells = document.querySelectorAll(".cell");
        const grades = {};

        cellsName.forEach((name) => {
          grades[name] = [];
        });

        cells.forEach((cell) => {
          const subjectName = cell.getAttribute("name");
          const cellData = cell.querySelector(".cell-data");

          if (cellData && cellsName.includes(subjectName)) {
            const gradeParts = cellData.textContent.trim().split("/");
            const numericGrades = gradeParts
              .map((part) => parseFloat(part))
              .filter((num) => !isNaN(num));

            if (numericGrades.length > 0) {
              grades[subjectName].push(...numericGrades);
            }
          }
        });
        sessionStorage.setItem(
          "grades",
          Object.keys(grades).length ? JSON.stringify(grades) : null
        );
      }
    }
    if (
      JSON.parse(sessionStorage.getItem("holidays")) &&
      JSON.parse(sessionStorage.getItem("schedule")) &&
      JSON.parse(sessionStorage.getItem("skipped")) &&
      JSON.parse(sessionStorage.getItem("grades"))
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
          z-index: 9999;
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
          pointer-events: none;
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

      .button-next, .button-prev {
	width: 30px;
	height: 30px;
	position: absolute;
	z-index: -1;
	opacity: 0;
	right: 2px;
	bottom: 112px;
  transition: all 0.1s ease-in-out
}
.button-next:hover, .button-prev:hover {
	width: 33px;
	height: 33px;
}

.button-prev {
  transform: rotate(180deg);
}
  .block_open .button-next {
  z-index: 9999;
  opacity: 1;
  }

.block_two {
	position: absolute;
	width: 100%;
	height: 100%;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.block_two_active {
transform: translateX(0) !important;
} 

.grades-list {
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.grades-list::-webkit-scrollbar {
  display: none;
}

.grades-general__button, .grades-general__button-wrapper {
  width: 27px;
  height: 27px;
  transition: all 0.17s ease-in-out;
}
.grades-general__button svg {
  color: var(--color-primary);
}
.grades-general__button:hover {
  width: 35px;
  height: 35px;
}
.grades-general__decrease.disable:hover,
.grades-general__increase.disable:hover,
button.grades-general__increase.disable,
button.grades-general__decrease.disable {
  width: 24px;
  height: 24px;
  cursor: none !important;
	pointer-events: none !important;
}
.grades-general__edit, .grades-general__save, .grades-general__button-wrapper {
  transition: width 0.12s ease-in-out, height 0.12s ease-in-out, transform 0.3s ease-in-out;
}
.grades-general__edit:hover, .grades-general__button-wrapper:hover {
  width: 32px;
  height: 32px;
}
.grades-list__item:last-child {
  margin-bottom: 16px;
}
.grades-list__item:first-child {
  margin-top: 0px;
}
.grades-list div span {
  color: var(--color-primary);
}
.status {
	margin-left: 25px;
}
.status-important {
position: absolute;
bottom: 10px;
right: 10px;
}
.text-green-500.status {
  width: 33.5px;
}
.grades-general {
margin-right: 65px;
max-width: 420px;
margin-left: auto;
}
.grades-list {
transition: flex 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
flex: 1 0 100%;
}
.grades-list_active {
flex: 0 0 0%;
transform: translateY(-80px);
}
.grades-list-edit {
flex: 0 0 0%;
flex-grow: 0;
}
.grades-list-edit_active {
flex: 1 0 100%;
}
.current-grades {
    margin-bottom: 6px;
    position: relative;
    padding-right: 55px;
    overflow: hidden;
    min-height: 30px;
}
.current-avg {
position: absolute;
right: 0;
top: -1px;

}
.grades-general__button-wrapper {
  position: relative;
  overflow: hidden
}
.grades-general__save {
    position: absolute;
    top: 50%;
	left: 50%;
	transform: translate(-50%, 50%);
    width: 30px;
    height: 30px;
}
    .grades-general__edit_active {
transform: translateY(-100%);
}
.grades-general__save_active {
transform: translate(-50%, -50%);
}
.grades-general__reset-button {
position: absolute;
bottom: 15px;
right: 10px;
width: 30px;
height: 30px;
}
.grades-list-edit__item {
position: relative;
}
.grade-count {
transform: translateY(-3.5px);
    font-size: 13px;
}
.grade-x {
transform: translateY(-2px);
    font-size: 12px;
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
			<button class="button-close" type="button"><svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="21.33px" height="21.33px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
							<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
									<path d="M1217 4086 c-154 -42 -232 -206 -168 -351 18 -41 120 -148 584 -612 l562 -563 -562 -562 c-614 -615 -606 -606 -606 -719 0 -141 111 -252 253 -252 112 0 104 -7 718 606 l562 562 563 -562 c614 -614 605 -606 718 -606 141 0 252 111 252 253 0 112 7 104 -606 718 l-562 562 562 563 c613 613 606 605 606 717 0 142 -111 253 -252 253 -113 0 -104 8 -718 -606 l-563 -562 -562 562 c-589 588 -594 593 -693 607 -22 3 -62 -1 -88 -8z" />
							</g>
					</svg></button>
			<button class="button-theme-change" type="button"><svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="21.33px" height="21.33px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
							<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
									<path d="M2315 5109 c-268 -25 -594 -118 -851 -243 -415 -201 -750 -494 -1009 -881 -89 -133 -161 -267 -170 -316 -10 -56 12 -118 59 -165 49 -50 105 -69 169 -60 75 11 114 49 190 182 346 611 950 1007 1649 1083 523 57 1090 -108 1518 -442 92 -73 240 -217 326 -319 72 -87 160 -208 149 -208 -3 0 -68 45 -145 100 -174 124 -173 123 -241 124 -181 2 -267 -223 -133 -345 53 -47 878 -632 919 -650 101 -46 216 0 260 104 11 26 31 213 67 606 l52 568 -25 48 c-13 27 -41 63 -62 79 -36 29 -45 31 -117 31 -72 0 -81 -2 -117 -31 -64 -50 -80 -97 -94 -273 -13 -152 -13 -154 -31 -130 -174 240 -290 374 -430 499 -385 342 -828 550 -1328 625 -128 19 -468 27 -605 14z" />
									<path d="M220 2154 c-19 -8 -45 -25 -58 -37 -57 -53 -58 -59 -113 -669 l-53 -575 25 -48 c13 -27 41 -63 62 -79 36 -29 45 -31 117 -31 72 0 81 2 117 31 64 50 80 97 94 273 13 152 13 154 31 130 9 -13 51 -69 91 -124 497 -669 1276 -1049 2097 -1021 278 9 472 43 729 129 527 174 989 528 1306 1002 89 133 161 267 170 316 10 56 -12 118 -59 165 -49 50 -105 69 -169 60 -75 -11 -114 -49 -190 -182 -347 -613 -959 -1013 -1656 -1084 -699 -70 -1402 228 -1859 788 -60 73 -136 182 -127 182 4 0 69 -45 145 -99 172 -123 173 -124 241 -125 181 -2 267 223 133 345 -53 47 -878 632 -919 650 -48 22 -108 23 -155 3z" />
							</g>
					</svg></button>
			 <button class="button-theme-mode-change" type="button">
					 <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="21.33px" height="21.33px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet"> <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none"> <path d="M2330 5110 c-494 -48 -950 -230 -1350 -538 -195 -150 -448 -432 -594 -662 -63 -99 -186 -351 -230 -471 -49 -134 -102 -340 -128 -499 -31 -195 -31 -565 0 -760 45 -276 116 -498 237 -745 132 -269 269 -460 489 -681 221 -220 412 -357 681 -489 247 -121 469 -192 745 -237 195 -31 565 -31 760 0 276 45 498 116 745 237 269 132 460 269 681 489 220 221 357 412 489 681 88 179 132 296 180 476 63 240 78 371 78 649 0 278 -15 409 -78 649 -48 180 -92 297 -180 476 -132 269 -269 460 -489 681 -221 220 -412 357 -681 489 -246 121 -474 193 -740 235 -147 23 -475 34 -615 20z m585 -339 c637 -107 1177 -462 1531 -1006 163 -251 279 -558 331 -880 24 -153 24 -497 0 -650 -106 -652 -456 -1196 -1001 -1553 -258 -170 -563 -286 -891 -339 -153 -24 -497 -24 -650 0 -656 106 -1202 460 -1561 1012 -163 251 -279 558 -331 880 -24 153 -24 497 0 650 106 656 460 1202 1012 1561 291 189 661 315 1025 348 108 10 418 -4 535 -23z" /> <path d="M2560 2560 l0 -1923 104 6 c430 27 798 163 1109 413 328 262 554 625 652 1044 40 172 49 255 49 460 0 205 -9 288 -49 460 -98 419 -324 782 -652 1044 -311 250 -679 386 -1109 413 l-104 6 0 -1923z" /> </g> </svg>
			 </button>
       	<button class="button-next" >
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="100%" height="100%" viewBox="0 0 512.000000 512.000000"
 preserveAspectRatio="xMidYMid meet" style="color: var(--color-primary);">

<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
fill="#fff" stroke="none">
<path d="M2705 3971 c-92 -41 -144 -126 -145 -230 0 -115 -4 -111 471 -539
l429 -387 -1263 -5 -1262 -5 -40 -22 c-90 -48 -135 -123 -135 -223 0 -100 45
-175 135 -223 l40 -22 1269 -5 1268 -5 -393 -365 c-217 -200 -409 -380 -426
-399 -86 -91 -80 -255 14 -343 73 -69 187 -87 278 -44 36 18 226 188 700 628
357 331 663 622 679 646 25 36 31 55 34 113 6 96 -13 140 -90 216 -179 174
-1328 1198 -1363 1214 -53 24 -147 24 -200 0z"/>
</g>
</svg>
	</button>


  <div class="block block_two bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] block_resize block_active block_open">
		<div id="grades-general" class="grades-general flex flex-col items-center justify-center gap-2">
			<div class="flex items-center justify-center gap-2 mb-1">
				<button class="grades-general__increase grades-general__button">
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
				</button>
				<div class="grades-general__value text-2xl font-bold text-primary min-w-[48px] pb-1 text-center">4.5</div>
				<button class="grades-general__decrease grades-general__button">
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
				</button>
        
        
        <div class="grades-general__button-wrapper">
        <button class="grades-general__edit grades-general__button">
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 512.000000 512.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
fill="currentColor" stroke="none">
<path d="M3982 4840 c-23 -5 -70 -21 -105 -36 -58 -26 -123 -88 -1000 -963
-553 -551 -954 -959 -977 -993 -60 -90 -264 -618 -326 -845 -54 -199 -8 -339
137 -418 82 -44 167 -46 310 -5 244 69 737 260 829 322 31 21 460 443 991 975
883 885 937 942 963 1002 40 91 53 183 37 271 -23 128 -55 174 -265 388 -198
202 -273 261 -360 288 -63 19 -177 26 -234 14z m135 -320 c42 -16 391 -368
404 -408 24 -72 10 -93 -172 -277 l-168 -170 -258 257 -258 258 160 160 c190
191 217 207 292 180z m-417 -825 l255 -255 -540 -540 -540 -540 -257 257 -258
258 537 537 c296 296 540 538 543 538 3 0 120 -115 260 -255z m-1305 -1305
c131 -131 236 -242 233 -245 -13 -13 -411 -169 -563 -221 -172 -58 -195 -63
-195 -39 0 56 258 745 279 745 3 0 114 -108 246 -240z"/>
<path d="M995 4423 c-338 -40 -586 -243 -696 -568 l-24 -70 -3 -1408 c-2
-1377 -2 -1410 18 -1492 70 -299 297 -525 596 -596 80 -19 122 -19 1596 -17
l1513 3 70 24 c229 77 394 217 490 416 81 167 80 159 80 687 0 458 0 467 -21
495 -73 98 -195 98 -268 0 -20 -28 -21 -42 -26 -480 -5 -447 -6 -453 -29 -512
-60 -151 -165 -251 -310 -295 -61 -20 -100 -20 -1525 -20 -1600 0 -1500 -4
-1620 57 -64 32 -157 125 -189 189 -60 119 -57 31 -57 1508 0 875 4 1366 11
1395 40 177 206 331 389 360 38 6 233 11 463 11 347 0 403 2 433 16 50 24 77
68 82 133 5 70 -22 115 -88 149 -44 22 -48 22 -450 21 -223 -1 -418 -4 -435
-6z"/>
</g>
</svg>
    </button>
    
        <button class="grades-general__save grades-general__button">
      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 512.000000 512.000000"
 preserveAspectRatio="xMidYMid meet">

<g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
fill="currentColor" stroke="none">
<path d="M1352 4469 c-175 -29 -320 -107 -457 -244 -141 -141 -215 -281 -244
-465 -15 -90 -15 -2310 0 -2400 29 -184 103 -324 244 -465 142 -142 284 -216
471 -245 47 -7 442 -10 1239 -8 l1170 3 72 23 c158 48 276 118 380 224 111
112 178 225 224 378 23 74 23 85 27 677 2 395 -1 615 -7 641 -6 21 -27 57 -46
79 -94 110 -267 93 -342 -34 l-28 -48 -5 -600 -5 -600 -32 -67 c-44 -94 -109
-160 -202 -206 l-75 -37 -1175 0 -1176 0 -67 32 c-94 44 -160 109 -206 202
l-37 75 0 1175 0 1176 32 67 c44 94 109 160 202 206 l75 37 615 5 616 5 45 25
c67 38 103 96 108 174 5 71 -14 120 -65 168 -62 59 -47 58 -700 57 -329 -1
-622 -5 -651 -10z"/>
<path d="M4415 4258 c-35 -9 -154 -124 -947 -916 l-908 -907 -372 372 c-402
400 -402 400 -498 391 -68 -7 -120 -37 -157 -91 -38 -56 -49 -117 -33 -178 10
-40 58 -91 473 -508 310 -310 475 -469 502 -482 49 -23 113 -24 163 -4 46 19
2003 1971 2033 2027 24 48 25 130 0 184 -23 51 -81 99 -137 113 -50 13 -65 13
-119 -1z"/>
</g>
</svg>
    </button>
        </div>


			</div>

    <div class="flex flex-col overflow-hidden">
     <div id="grades-list" class="grades-list flex flex-col space-y-4"></div>
     <div id="grades-list-edit" class="grades-list-edit grades-list space-y-4"></div>
    </div>


		</div>
  </div>
  </div>


	</div>
	<button class="button-area" type="button"></button>
					<button style="background-color: #000; border-color: #000;" aria-label="create something epic" type="button" class="button-start button-all inline-flex justify-center items-center aspect-square whitespace-nowrap rounded-full border border-primary bg-primary p-2 text-base font-medium tracking-wide text-on-primary transition text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-100 active:outline-offset-0 disabled:opacity-75 disabled:cursor-not-allowed dark:border-primary-dark dark:bg-primary-dark dark:text-on-primary-dark dark:focus-visible:outline-primary-dark">
					<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="26.66px" height="26.66px" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
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
  let grades = JSON.parse(sessionStorage.getItem("grades"));

  const totalSchedule = {};
  const totalLesson = {};
  const totalLessonSkipped = {};

  let remainingLessons = {};

  let defaultPercent = 50;
  let currentTheme = localStorage.getItem("theme") || "Prototype";
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
      JSON.parse(sessionStorage.getItem("skipped")) &&
      JSON.parse(sessionStorage.getItem("grades"))
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
          li.classList.remove("border-green-500", "border-red-500");
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
            svg.classList.remove("text-green-500", "text-red-500");
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
      if (buttonInput.checked) {
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
          iframeDoc
            .querySelector(".button-next svg g")
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
          !JSON.parse(sessionStorage.getItem("skipped")) ||
          !JSON.parse(sessionStorage.getItem("grades"))
        ) {
          startPeek();
        } else {
          checkUpdates();
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
      iframeDoc.querySelector(".button-next").classList.remove("button-prev");
      iframeDoc
        .querySelector(".block_two")
        .classList.remove("block_two_active");
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
      iframeDoc
        .querySelectorAll(".block_two *")
        .forEach((item) => item.classList.remove("dark:text-on-surface-dark"));

      if (!isDarkMode) {
        iframeDoc.querySelector(".block_open").style.backgroundColor = "#fff";
        button.style.backgroundColor = "var(--color-primary)";
        button.style.borderColor = "var(--color-primary)";
        iframeDoc.querySelector(".button-theme-change").style.color =
          "var(--color-primary)";
        iframeDoc
          .querySelector(".button-theme-change svg g")
          .setAttribute("fill", "currentColor");
        iframeDoc
          .querySelector(".button-next svg g")
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
        iframeDoc
          .querySelectorAll(".grades-list div, .grades-list button")
          .forEach((element) => {
            element.style.backgroundColor = "transparent";
          });
        if (currentTheme === "Prototype" || currentTheme === "Modern") {
          iframeDoc
            .querySelectorAll(".block_two *")
            .forEach((item) => item.classList.add("dark:text-on-surface-dark"));
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
          iframeDoc
            .querySelectorAll(".block_two *")
            .forEach((item) =>
              item.classList.remove("dark:text-on-surface-dark")
            );
          iframeDoc
            .querySelectorAll(".grades-list div, .grades-list button")
            .forEach((element) => {
              element.style.backgroundColor = "";
            });
          iframeDoc
            .querySelectorAll(".weekday-list div div span")
            .forEach((element) => {
              element.style.color = "var(--color-on-surface)";
            });
          iframeDoc.querySelector(".block_open").style.backgroundColor = "#fff";
          button.style.backgroundColor = "var(--color-primary)";
          button.style.borderColor = "var(--color-primary)";
          iframeDoc.querySelector(".button-theme-change").style.color =
            "var(--color-primary)";
          iframeDoc
            .querySelector(".button-theme-change svg g")
            .setAttribute("fill", "currentColor");
          iframeDoc
            .querySelector(".button-next svg g")
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
          iframeDoc.querySelector(".entry-percent").style.color =
            "var(--color-on-surface)";
        }
        if (isDarkMode) {
          if (currentTheme === "Prototype" || currentTheme === "Modern") {
            iframeDoc
              .querySelectorAll(".block_two *")
              .forEach((item) =>
                item.classList.add("dark:text-on-surface-dark")
              );
          }
          iframeDoc
            .querySelectorAll(".grades-list div, .grades-list button")
            .forEach((element) => {
              element.style.backgroundColor = "transparent";
            });
          iframeDoc
            .querySelectorAll(".weekday-list div div span")
            .forEach((element) => {
              element.style.color = "";
            });
          iframeDoc.querySelector(".block_open").style.backgroundColor = "#000";
          button.style.backgroundColor = "#000";
          button.style.borderColor = "#000";
          iframeDoc
            .querySelector(".button-theme-change svg g")
            .setAttribute("fill", "#fff");
          iframeDoc
            .querySelector(".button-next svg g")
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
          iframeDoc
            .querySelector(".entry-percent")
            .style.removeProperty("color");
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

      let dayCounter = 0;
      let weekdayCounter = 0;

      while (currentDate < localEventDate) {
        const dayName = dayNames[currentDate.getDay()];
        dayCounter++;
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

      Object.keys(totalSchedule).forEach((key) => delete totalSchedule[key]);
      Object.keys(totalLesson).forEach((key) => delete totalLesson[key]);
      Object.keys(totalLessonSkipped).forEach(
        (key) => delete totalLessonSkipped[key]
      );

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

      let tomorrow = (new Date().getDay() + 1) % 7;
      let tomorrowName = dayNames[tomorrow];

      console.log(totalLesson);

      for (let lesson in totalLesson) {
        remainingLessons[lesson] = 0;
      }

      for (let i = 0; i < dayCounter; i++) {
        tomorrowName = dayNames[tomorrow];
        let lessons = schedule[tomorrowName];

        if (lessons && weekdayCount[tomorrowName]) {
          for (let lesson in lessons) {
            remainingLessons[lesson] += lessons[lesson];
          }
        }
        tomorrow = (tomorrow + 1) % 7;
      }

      tomorrow = (new Date().getDay() + 1) % 7;
      tomorrowName = dayNames[tomorrow];

      for (let i = 0; i < dayCounter; i++) {
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
      //console.log(remainingLessons);

      const LessonSkippedList = iframeDoc.querySelector(".lesson-skipped");
      LessonSkippedList.innerHTML = "";
      console.log("asasasas");

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
        weekdayCounter += Object.values(addWeekday).reduce((a, b) => a - b, 0);
    }

    function copyStyles(from, to) {
      to.style.cssText = from.style.cssText;
      to.style.transform = "translateX(100%)";
      to.style.width = "100%";
      to.style.height = "100%";
      to.style.border = "none";
    }

    function calcRequiredGrades(
      target,
      requiredQuantity,
      grades,
      remainingLessons
    ) {
      const result = {};

      for (const subject in totalLesson) {
        const subjectGrades = grades[subject] || [];
        const currentSum = subjectGrades.reduce((a, b) => a + b, 0);
        const currentCount = subjectGrades.length;
        const remaining = remainingLessons[subject] || 0;

        // Проверка выполнения требования
        if (currentCount >= requiredQuantity) {
          const currentAvg = currentSum / currentCount;
          if (currentAvg >= target) {
            result[subject] = { type: "pass", reason: "complete" };
            continue;
          }
        }

        const possibleGrades = [];
        const requiredK = Math.max(requiredQuantity - currentCount, 0);
        let important = false;

        if (requiredK >= requiredQuantity) {
          console.log(Math.round(target));

          possibleGrades.push({ grade: Math.round(target), count: requiredK });
          // Фильтрация и определение important
          const validGrades = possibleGrades
            .filter((g) => g.count <= remaining)
            .sort((a, b) => a.count - b.count);

          important = possibleGrades.some((g) => g.count > remaining);

          result[subject] = {
            type: "possible",
            grades: validGrades.length > 0 ? validGrades : possibleGrades,
            ...(important ? { important: true } : {}),
          };
          continue;
        }

        // Перебор возможных оценок от 5 до 2
        for (let grade = 5; grade >= 2; grade--) {
          if (grade <= target) continue; // Оценка не может повысить средний

          let count;
          if (requiredK > 0) {
            // Расчет для случая, когда нужно добавить оценки до requiredQuantity
            const sumAfterRequired = currentSum + grade * requiredK;
            const totalAfterRequired = currentCount + requiredK;
            const deficitAfterRequired =
              target * totalAfterRequired - sumAfterRequired;

            if (deficitAfterRequired <= 0) {
              // Если после добавления requiredK оценок дефицит покрыт
              count = requiredK;
            } else {
              // Нужны дополнительные оценки
              const additional = Math.ceil(
                deficitAfterRequired / (grade - target)
              );
              count = requiredK + additional;
            }
          } else {
            // Улучшение существующего среднего
            const deficit = target * currentCount - currentSum;
            count = Math.ceil(deficit / (grade - target));
          }

          possibleGrades.push({ grade, count });
        }

        if (possibleGrades.length === 0) {
          result[subject] = { type: "pass", reason: "impossible" };
          continue;
        }

        // Фильтрация и определение important
        const validGrades = possibleGrades
          .filter((g) => g.count <= remaining)
          .sort((a, b) => a.count - b.count);

        important = possibleGrades.some((g) => g.count > remaining);

        result[subject] = {
          type: "possible",
          grades: validGrades.length > 0 ? validGrades : possibleGrades,
          ...(important ? { important: true } : {}),
        };
      }

      return result;
    }

    function formatValue(value) {
      return value.toFixed(2).replace(/\.?0+$/, "");
    }

    function getValueColor(value) {
      if (value >= 4.5) return "text-on-surface";
      if (value >= 3.5) return "text-on-surface";
      return "text-on-surface";
    }

    function updateValue(newValue) {
      currentValue = newValue;
      gradesGeneralValue.textContent = formatValue(currentValue);
    }

    function calculateAverage(arr) {
      if (!arr || arr.length === 0) return 0;
      const sum = arr.reduce((a, b) => a + b, 0);
      return (sum / arr.length).toFixed(1);
    }

    const originalGrades = JSON.parse(JSON.stringify(grades));
    let currentValue =
      +localStorage.getItem("gradesGeneralCurrentValue") || 4.5;
    let requiredQuantity = 3;

    const buttonNext = iframeDoc.querySelector(".button-next");
    const blockTwo = iframeDoc.querySelector(".block_two");
    copyStyles(block, blockTwo);
    new MutationObserver(() => copyStyles(block, blockTwo)).observe(block, {
      attributes: true,
      attributeFilter: ["style"],
    });
    buttonNext.addEventListener("click", () => {
      buttonNext.classList.toggle("button-prev");
      blockTwo.classList.toggle("block_two_active");
    });
    console.log(remainingLessons);

    const increaseButton = iframeDoc.querySelector(".grades-general__increase");
    const decreaseButton = iframeDoc.querySelector(".grades-general__decrease");
    const gradesGeneralValue = iframeDoc.querySelector(
      ".grades-general__value"
    );

    increaseButton.addEventListener("click", () => {
      const newValue = currentValue - 0.25;
      updateValue(newValue < 2 ? 2 : newValue);
      renderSecondPage();
    });

    decreaseButton.addEventListener("click", () => {
      const newValue = currentValue + 0.25;
      updateValue(newValue > 5 ? 5 : newValue);
      renderSecondPage();
    });

    const buttonEdit = iframeDoc.querySelector(".grades-general__edit");
    buttonEdit.addEventListener("click", () => {
      buttonEdit.classList.toggle("grades-general__edit_active");
      iframeDoc
        .querySelector(".grades-general__save")
        .classList.toggle("grades-general__save_active");
      iframeDoc.querySelectorAll(".grades-general__button").forEach((el) => {
        el.classList.toggle("disable");
      });
      iframeDoc
        .querySelector(".grades-list")
        .classList.toggle("grades-list_active");
      iframeDoc
        .querySelector(".grades-list-edit")
        .classList.toggle("grades-list-edit_active");
    });

    const buttonSave = iframeDoc.querySelector(".grades-general__save");
    buttonSave.addEventListener("click", () => {
      buttonEdit.click();
      renderSecondPage();
    });

    function renderSecondPage() {
      const requiredGrades = calcRequiredGrades(
        currentValue,
        requiredQuantity,
        grades,
        remainingLessons
      );
      console.log(requiredGrades);

      gradesGeneralValue.textContent = formatValue(currentValue);
      gradesGeneralValue.classList.remove(
        "text-green-500",
        "text-yellow-500",
        "text-red-500"
      );
      gradesGeneralValue.classList.add(getValueColor(currentValue));
      localStorage.setItem("gradesGeneralCurrentValue", currentValue);

      const container = iframeDoc.getElementById("grades-list");
      container.innerHTML = "";

      Object.entries(requiredGrades).forEach(([subject, data]) => {
        const item = document.createElement("div");
        item.className =
          "grades-list__item bg-white rounded-lg border p-4 shadow-lg border border-outline dark:border-outline-dark";

        const title = document.createElement("h3");
        title.className = "text-lg font-semibold mb-3 text-primary";
        title.textContent = subject;
        item.appendChild(title);

        const status = document.createElement("span");

        if (data.type === "pass") {
          status.innerHTML =
            data.reason === "impossible"
              ? `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
   width="40px" height="40px" viewBox="0 0 512.000000 512.000000"
   preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
  fill="currentColor" stroke="none">
  <path d="M1069 5109 c-55 -16 -130 -78 -158 -134 l-26 -49 0 -2101 0 -2100 22
  -47 c30 -66 96 -133 162 -165 50 -25 69 -28 179 -32 l122 -3 0 -214 c0 -215 0
  -215 25 -239 13 -14 33 -25 44 -25 11 0 98 25 193 55 l173 54 175 -54 c96 -30
  182 -55 192 -55 11 0 30 11 43 25 25 24 25 24 25 239 l0 216 868 2 867 3 67
  33 c77 38 130 92 167 171 l26 56 3 2075 c2 2296 7 2125 -62 2206 -18 22 -55
  50 -82 64 l-49 25 -1470 2 c-909 0 -1484 -3 -1506 -8z m2955 -154 c18 -9 40
  -28 49 -44 16 -27 17 -150 17 -1823 0 -1730 -1 -1794 -19 -1834 -10 -23 -36
  -54 -57 -70 l-37 -29 -1416 -5 c-1322 -5 -1419 -6 -1460 -23 -24 -9 -50 -22
  -58 -28 -11 -10 -13 304 -13 1886 0 1767 1 1899 17 1926 37 62 -61 59 1511 59
  1261 0 1438 -2 1466 -15z m43 -4214 c-13 -26 -41 -59 -66 -76 l-43 -30 -859
  -3 -859 -2 0 44 0 43 46 6 c28 3 54 13 67 25 25 26 26 75 2 102 -18 20 -30 20
  -536 20 l-518 0 -20 -26 c-12 -15 -21 -34 -21 -44 0 -30 39 -69 75 -76 34 -6
  35 -8 35 -50 l0 -44 -95 0 c-136 0 -189 25 -226 105 -43 93 -8 191 86 243 27
  16 151 17 1450 22 l1420 5 40 22 40 21 3 -131 c2 -121 1 -135 -21 -176z
  m-1977 -292 c0 -253 -1 -270 -17 -265 -10 3 -69 21 -131 41 -63 19 -124 35
  -137 35 -12 0 -79 -18 -148 -40 -68 -22 -127 -40 -131 -40 -3 0 -6 122 -6 270
  l0 270 285 0 285 0 0 -271z"/>
  <path d="M1445 4805 c-15 -14 -25 -36 -25 -52 0 -78 -82 -162 -158 -163 -21 0
  -41 -9 -57 -25 -25 -24 -25 -25 -25 -229 0 -112 3 -212 6 -221 4 -8 20 -23 36
  -31 24 -12 36 -13 58 -4 43 18 50 47 50 214 l0 153 47 18 c62 24 144 106 168
  168 l18 47 997 0 997 0 18 -47 c24 -62 106 -144 168 -168 l47 -18 0 -1377 0
  -1377 -65 -32 c-70 -35 -114 -80 -148 -153 l-22 -48 -996 0 -995 0 -24 52
  c-35 78 -100 138 -182 168 l-28 10 0 1078 c0 1077 0 1079 -21 1106 -27 34 -79
  36 -109 4 -20 -22 -20 -28 -20 -1153 l0 -1132 23 -21 c13 -12 36 -22 52 -22
  44 0 112 -38 135 -75 11 -18 24 -54 29 -79 5 -26 17 -56 26 -66 18 -20 38 -20
  1115 -20 1077 0 1097 0 1115 20 9 10 21 40 26 66 5 25 18 61 29 79 23 38 91
  75 136 75 19 0 39 9 52 23 l22 23 0 1473 0 1472 -25 24 c-16 16 -36 25 -57 25
  -76 1 -158 85 -158 163 0 16 -10 38 -25 52 l-24 25 -1091 0 -1091 0 -24 -25z"/>
  <path d="M2344 4446 l-34 -34 0 -211 0 -211 -197 0 c-180 0 -201 -2 -231 -20
  -18 -11 -37 -32 -42 -46 -6 -14 -10 -103 -10 -197 0 -250 -4 -247 285 -247
  l195 0 0 -525 c0 -577 -1 -569 60 -600 22 -12 66 -15 190 -15 254 0 250 -4
  250 294 0 211 0 215 -22 230 -30 21 -71 20 -99 -3 -23 -19 -24 -24 -27 -195
  l-4 -176 -99 0 -99 0 0 521 c0 461 -2 525 -16 555 -28 59 -49 64 -269 64
  l-195 0 0 105 0 105 195 0 c290 0 285 -5 285 294 l0 196 100 0 100 0 0 -182
  c0 -101 5 -200 10 -220 6 -20 24 -48 41 -62 l31 -26 199 0 199 0 0 -105 0
  -105 -201 0 -201 0 -33 -33 c-43 -43 -47 -75 -43 -310 3 -176 4 -188 25 -208
  27 -27 75 -29 103 -4 19 17 20 30 20 212 l0 193 195 0 c290 0 285 -5 285 255
  0 260 5 255 -285 255 l-195 0 0 205 c0 224 -5 251 -55 273 -17 8 -87 12 -201
  12 l-176 0 -34 -34z"/>
  <path d="M1805 2128 c-45 -35 -55 -74 -54 -210 0 -143 11 -184 58 -215 l34
  -23 439 0 439 0 24 25 c14 13 25 36 25 50 0 14 -11 37 -25 50 l-24 25 -411 0
  -410 0 0 85 0 85 655 0 655 0 0 -85 0 -85 -110 0 c-104 0 -112 -1 -135 -25
  -14 -13 -25 -36 -25 -50 0 -14 11 -37 25 -50 23 -24 29 -25 162 -25 214 0 233
  20 233 240 0 142 -8 171 -56 209 -27 21 -32 21 -749 21 l-722 0 -28 -22z"/>
  </g>
  </svg>`
              : `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
   width="30px" height="30px" viewBox="0 0 512.000000 512.000000"
   preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
  fill="currentColor" stroke="none">
  <path d="M3197 3022 l-997 -997 78 -78 77 -77 1000 1000 1000 1000 -75 75
  c-41 41 -77 75 -80 75 -3 0 -454 -449 -1003 -998z"/>
  <path d="M3648 2713 l-1308 -1308 -703 703 c-386 386 -707 702 -712 702 -6 0
  -43 -33 -83 -73 l-72 -72 785 -785 785 -785 1390 1390 1390 1390 -72 72 c-40
  40 -77 73 -83 73 -5 0 -598 -588 -1317 -1307z"/>
  <path d="M72 2737 l-72 -72 780 -780 780 -780 77 78 78 77 -775 775 c-426 426
  -780 775 -785 775 -6 0 -43 -33 -83 -73z"/>
  </g>
  </svg>`;
          status.className =
            data.reason === "impossible"
              ? "text-red-500 status"
              : "text-green-500 status";
          item.style.display = "flex";
          item.style.alignItems = "center";
          item.style.justifyContent = "space-between";
          title.classList.remove("mb-3");
          data.reason === "complete" ? item.classList.add("order-last") : null;
          // item.style.height = "62px";
          item.appendChild(status);
        } else {
          const gradeContainer = document.createElement("div");
          gradeContainer.className = "flex flex-wrap gap-2";

          if (data.important == true) {
            status.innerHTML = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
   width="40px" height="40px" viewBox="0 0 512.000000 512.000000"
   preserveAspectRatio="xMidYMid meet">
  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
  fill="currentColor" stroke="none">
  <path d="M1069 5109 c-55 -16 -130 -78 -158 -134 l-26 -49 0 -2101 0 -2100 22
  -47 c30 -66 96 -133 162 -165 50 -25 69 -28 179 -32 l122 -3 0 -214 c0 -215 0
  -215 25 -239 13 -14 33 -25 44 -25 11 0 98 25 193 55 l173 54 175 -54 c96 -30
  182 -55 192 -55 11 0 30 11 43 25 25 24 25 24 25 239 l0 216 868 2 867 3 67
  33 c77 38 130 92 167 171 l26 56 3 2075 c2 2296 7 2125 -62 2206 -18 22 -55
  50 -82 64 l-49 25 -1470 2 c-909 0 -1484 -3 -1506 -8z m2955 -154 c18 -9 40
  -28 49 -44 16 -27 17 -150 17 -1823 0 -1730 -1 -1794 -19 -1834 -10 -23 -36
  -54 -57 -70 l-37 -29 -1416 -5 c-1322 -5 -1419 -6 -1460 -23 -24 -9 -50 -22
  -58 -28 -11 -10 -13 304 -13 1886 0 1767 1 1899 17 1926 37 62 -61 59 1511 59
  1261 0 1438 -2 1466 -15z m43 -4214 c-13 -26 -41 -59 -66 -76 l-43 -30 -859
  -3 -859 -2 0 44 0 43 46 6 c28 3 54 13 67 25 25 26 26 75 2 102 -18 20 -30 20
  -536 20 l-518 0 -20 -26 c-12 -15 -21 -34 -21 -44 0 -30 39 -69 75 -76 34 -6
  35 -8 35 -50 l0 -44 -95 0 c-136 0 -189 25 -226 105 -43 93 -8 191 86 243 27
  16 151 17 1450 22 l1420 5 40 22 40 21 3 -131 c2 -121 1 -135 -21 -176z
  m-1977 -292 c0 -253 -1 -270 -17 -265 -10 3 -69 21 -131 41 -63 19 -124 35
  -137 35 -12 0 -79 -18 -148 -40 -68 -22 -127 -40 -131 -40 -3 0 -6 122 -6 270
  l0 270 285 0 285 0 0 -271z"/>
  <path d="M1445 4805 c-15 -14 -25 -36 -25 -52 0 -78 -82 -162 -158 -163 -21 0
  -41 -9 -57 -25 -25 -24 -25 -25 -25 -229 0 -112 3 -212 6 -221 4 -8 20 -23 36
  -31 24 -12 36 -13 58 -4 43 18 50 47 50 214 l0 153 47 18 c62 24 144 106 168
  168 l18 47 997 0 997 0 18 -47 c24 -62 106 -144 168 -168 l47 -18 0 -1377 0
  -1377 -65 -32 c-70 -35 -114 -80 -148 -153 l-22 -48 -996 0 -995 0 -24 52
  c-35 78 -100 138 -182 168 l-28 10 0 1078 c0 1077 0 1079 -21 1106 -27 34 -79
  36 -109 4 -20 -22 -20 -28 -20 -1153 l0 -1132 23 -21 c13 -12 36 -22 52 -22
  44 0 112 -38 135 -75 11 -18 24 -54 29 -79 5 -26 17 -56 26 -66 18 -20 38 -20
  1115 -20 1077 0 1097 0 1115 20 9 10 21 40 26 66 5 25 18 61 29 79 23 38 91
  75 136 75 19 0 39 9 52 23 l22 23 0 1473 0 1472 -25 24 c-16 16 -36 25 -57 25
  -76 1 -158 85 -158 163 0 16 -10 38 -25 52 l-24 25 -1091 0 -1091 0 -24 -25z"/>
  <path d="M2344 4446 l-34 -34 0 -211 0 -211 -197 0 c-180 0 -201 -2 -231 -20
  -18 -11 -37 -32 -42 -46 -6 -14 -10 -103 -10 -197 0 -250 -4 -247 285 -247
  l195 0 0 -525 c0 -577 -1 -569 60 -600 22 -12 66 -15 190 -15 254 0 250 -4
  250 294 0 211 0 215 -22 230 -30 21 -71 20 -99 -3 -23 -19 -24 -24 -27 -195
  l-4 -176 -99 0 -99 0 0 521 c0 461 -2 525 -16 555 -28 59 -49 64 -269 64
  l-195 0 0 105 0 105 195 0 c290 0 285 -5 285 294 l0 196 100 0 100 0 0 -182
  c0 -101 5 -200 10 -220 6 -20 24 -48 41 -62 l31 -26 199 0 199 0 0 -105 0
  -105 -201 0 -201 0 -33 -33 c-43 -43 -47 -75 -43 -310 3 -176 4 -188 25 -208
  27 -27 75 -29 103 -4 19 17 20 30 20 212 l0 193 195 0 c290 0 285 -5 285 255
  0 260 5 255 -285 255 l-195 0 0 205 c0 224 -5 251 -55 273 -17 8 -87 12 -201
  12 l-176 0 -34 -34z"/>
  <path d="M1805 2128 c-45 -35 -55 -74 -54 -210 0 -143 11 -184 58 -215 l34
  -23 439 0 439 0 24 25 c14 13 25 36 25 50 0 14 -11 37 -25 50 l-24 25 -411 0
  -410 0 0 85 0 85 655 0 655 0 0 -85 0 -85 -110 0 c-104 0 -112 -1 -135 -25
  -14 -13 -25 -36 -25 -50 0 -14 11 -37 25 -50 23 -24 29 -25 162 -25 214 0 233
  20 233 240 0 142 -8 171 -56 209 -27 21 -32 21 -749 21 l-722 0 -28 -22z"/>
  </g>
  </svg>`;
            status.className = "status-important";
            item.style.position = "relative";
            item.classList.add("order-first");
            gradeContainer.className = "flex flex-wrap gap-2 mr-10";
            item.appendChild(status);
          }

          data.grades.forEach(({ grade, count }, index, array) => {
            const gradeElement = document.createElement("div");
            gradeElement.className =
              "inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium bg-surface-alt text-primary text-gray-700 border dark:border-outline-dark";

            if (count < 10) {
              const gradesString = Array(count).fill(grade).join(", ");
              gradeElement.textContent = gradesString;
            } else {
              gradeElement.innerHTML = `
                ${grade}
                <span class="grade-x ml-1 ${
                  grade >= 4 ? "text-green-900" : "text-gray-900"
                } font-semibold">
                  x
                </span>
                <span class="grade-count ml-1 ${
                  grade >= 4 ? "text-green-900" : "text-gray-900"
                } font-semibold">
                  ${count}
                </span>
              `;
            }

            gradeContainer.appendChild(gradeElement);

            if (index < array.length - 1) {
              const orSpan = document.createElement("span");
              orSpan.className = "mt-0.5 font-medium";
              orSpan.textContent = "or";
              gradeContainer.appendChild(orSpan);
            }
          });
          item.appendChild(gradeContainer);
        }
        container.appendChild(item);
      });

      const containerEdit = iframeDoc.getElementById("grades-list-edit");
      containerEdit.innerHTML = "";

      Object.entries(grades).forEach(([subject, gradesArray]) => {
        if (totalLesson.hasOwnProperty(subject)) {
          const itemDiv = document.createElement("div");
          const h3 = document.createElement("h3");
          const flexContainer = document.createElement("div");
          const badge = document.createElement("div");
          const currentAvg = document.createElement("div");

          itemDiv.className =
            "grades-list-edit__item bg-white rounded-lg border p-4 shadow-lg border-outline dark:border-outline-dark";
          h3.className = "text-lg font-semibold mb-2 text-primary";
          h3.textContent = subject;
          flexContainer.className = "flex flex-col gap-[4.5px]";

          badge.className =
            "current-grades inline-flex items-center bg-gray-100 rounded-[15px] px-3 py-1 text-sm font-medium bg-surface-alt text-primary text-gray-700 border dark:border-outline-dark";
          let gradesText = document.createTextNode(gradesArray.join(", "));

          currentAvg.className =
            "current-avg inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium bg-surface-alt text-primary text-gray-700 border dark:border-outline-dark";
          currentAvg.textContent = calculateAverage(gradesArray);

          const addButtonsContainer = document.createElement("div");
          addButtonsContainer.className = "flex flex-wrap gap-2";
          const deleteButtonsContainer = document.createElement("div");
          deleteButtonsContainer.className = "flex flex-wrap gap-2 mr-7";

          const createButton = (value, add) => {
            const button = document.createElement("button");
            button.className =
              "inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium bg-surface-alt text-primary text-gray-700 border dark:border-outline-dark";
            button.textContent = `${add ? "+" : "-"}${value}`;

            button.addEventListener("click", () => {
              console.log(
                `${add ? "Add" : "Remove"} grade ${value} for ${subject}`
              );
              if (add) {
                grades[subject].push(value);
              } else {
                const index = grades[subject].indexOf(value);
                if (index !== -1) {
                  grades[subject].splice(index, 1);
                }
              }

              gradesText.nodeValue = grades[subject].join(", ");
              currentAvg.textContent = calculateAverage(grades[subject]);
              console.log("Updated grades:", grades);
            });

            return button;
          };

          [2, 3, 4, 5].forEach((value) => {
            addButtonsContainer.appendChild(createButton(value, true));
            deleteButtonsContainer.appendChild(createButton(value, false));
          });

          const resetButton = document.createElement("button");
          resetButton.className =
            "grades-general__reset-button dark:text-on-surface-dark";

          resetButton.innerHTML = `
          <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
   viewBox="0 0 512.000000 512.000000"
   preserveAspectRatio="xMidYMid meet">
  
  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
  fill="currentColor" stroke="none">
  <path d="M2320 5109 c-487 -46 -966 -239 -1344 -538 -183 -146 -397 -368 -417
  -433 -34 -110 69 -218 179 -189 30 9 63 37 156 136 210 224 411 374 668 500
  475 234 1006 294 1523 173 207 -48 477 -160 664 -277 97 -60 255 -177 290
  -215 l24 -26 -127 0 c-140 0 -165 -7 -210 -60 -21 -25 -26 -42 -26 -83 0 -69
  27 -112 85 -138 43 -19 64 -20 364 -17 305 3 321 4 347 24 15 11 37 33 48 48
  20 26 21 40 21 366 0 326 -1 340 -21 366 -37 50 -72 69 -124 69 -52 0 -87 -19
  -124 -69 -18 -23 -22 -47 -26 -151 l-5 -123 -85 70 c-161 132 -382 268 -581
  358 -381 172 -857 249 -1279 209z"/>
  <path d="M2473 3219 c-214 -36 -353 -184 -353 -379 0 -88 27 -163 81 -224 53
  -60 89 -80 294 -162 167 -67 235 -109 235 -146 0 -27 -39 -75 -75 -92 -30 -14
  -55 -17 -115 -14 -90 5 -142 27 -218 92 -67 57 -114 67 -177 36 -74 -36 -103
  -117 -71 -193 32 -77 197 -187 332 -221 81 -21 234 -21 305 0 157 46 279 172
  309 321 31 149 -49 313 -195 398 -26 16 -127 61 -224 100 -183 74 -190 79
  -177 131 10 39 58 57 141 52 60 -3 85 -10 147 -42 68 -35 81 -38 132 -34 41 3
  63 11 82 29 85 80 67 182 -45 257 -126 84 -265 115 -408 91z"/>
  <path d="M70 3198 c-72 -48 -70 -30 -70 -638 0 -499 2 -548 18 -580 50 -100
  197 -108 259 -13 14 22 19 55 23 167 l5 141 142 -161 c182 -207 190 -214 256
  -214 84 0 133 41 151 127 11 51 -21 105 -152 253 l-120 135 52 28 c155 84 245
  262 216 425 -24 139 -109 251 -237 314 l-68 33 -220 3 c-217 3 -221 3 -255
  -20z m439 -303 c16 -14 35 -41 41 -60 10 -30 9 -41 -7 -72 -26 -53 -71 -73
  -165 -73 l-78 0 0 115 0 115 89 0 c81 0 92 -2 120 -25z"/>
  <path d="M1179 3197 c-72 -48 -70 -27 -67 -649 3 -548 3 -557 24 -585 12 -15
  36 -37 55 -48 32 -19 52 -20 289 -20 248 0 256 1 291 23 90 55 92 198 4 252
  -29 18 -49 20 -199 20 l-166 0 0 110 0 110 143 0 c156 0 191 10 232 64 28 38
  28 134 0 172 -41 54 -76 64 -232 64 l-143 0 0 104 0 104 163 4 c147 3 166 6
  199 26 89 55 91 198 3 252 -30 19 -49 20 -297 20 -259 0 -266 -1 -299 -23z"/>
  <path d="M3370 3213 c-8 -3 -26 -15 -38 -27 -53 -47 -52 -34 -52 -626 0 -592
  -1 -578 52 -627 12 -12 43 -26 68 -32 58 -14 432 -14 490 0 126 29 161 169 65
  259 -26 24 -31 25 -201 28 l-174 3 0 110 0 109 140 0 c119 0 147 3 178 19 43
  22 82 84 82 131 0 47 -39 109 -82 131 -31 16 -59 19 -178 19 l-140 0 0 105 0
  105 133 0 c149 1 211 11 245 43 71 66 69 159 -3 227 l-27 25 -271 2 c-150 1
  -279 -1 -287 -4z"/>
  <path d="M4319 3197 c-93 -62 -88 -193 10 -251 21 -12 60 -20 116 -24 l84 -5
  3 -456 c3 -436 4 -457 23 -489 57 -95 195 -98 256 -6 18 27 19 55 19 490 l0
  461 89 5 c62 4 100 11 122 24 98 58 103 189 10 251 -34 23 -37 23 -366 23
  -329 0 -332 0 -366 -23z"/>
  <path d="M615 1160 c-82 -41 -80 -32 -83 -410 -3 -385 -3 -385 81 -428 58 -30
  113 -23 163 20 43 38 54 79 54 206 l0 102 103 -83 c368 -298 808 -484 1297
  -549 144 -19 509 -16 655 5 536 78 1025 313 1405 674 152 144 237 244 250 294
  24 87 -45 181 -133 183 -67 1 -99 -19 -182 -115 -276 -319 -692 -575 -1115
  -685 -628 -163 -1311 -46 -1840 317 -99 68 -224 166 -228 179 -2 6 48 10 125
  10 110 0 133 3 161 20 51 31 74 76 69 136 -4 61 -28 97 -83 124 -38 19 -60 20
  -350 20 -290 0 -311 -1 -349 -20z"/>
  </g>
  </svg>
          `;

          resetButton.addEventListener("click", () => {
            grades[subject] = [...originalGrades[subject]];
            gradesText.nodeValue = grades[subject].join(", ");
            currentAvg.textContent = calculateAverage(grades[subject]);
          });

          badge.appendChild(gradesText);
          badge.appendChild(currentAvg);
          flexContainer.appendChild(badge);
          flexContainer.appendChild(addButtonsContainer);
          flexContainer.appendChild(deleteButtonsContainer);
          itemDiv.appendChild(resetButton);
          itemDiv.appendChild(h3);
          itemDiv.appendChild(flexContainer);
          containerEdit.appendChild(itemDiv);
        }
      });

      if (isDarkMode) {
        iframeDoc
          .querySelectorAll(".grades-list div, .grades-list button")
          .forEach((element) => {
            element.style.backgroundColor = "transparent";
          });
        if (currentTheme === "Prototype" || currentTheme === "Modern") {
          iframeDoc
            .querySelectorAll(".block_two *")
            .forEach((item) => item.classList.add("dark:text-on-surface-dark"));
        }
      }
    }

    if (
      JSON.parse(sessionStorage.getItem("holidays")) &&
      JSON.parse(sessionStorage.getItem("schedule")) &&
      JSON.parse(sessionStorage.getItem("skipped")) &&
      JSON.parse(sessionStorage.getItem("grades"))
    ) {
      func();
      renderSecondPage();
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
      renderSecondPage();
    });
  };
})();
