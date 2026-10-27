"use strict";

/* ==========================================================
   Confession site: one script shared by all three pages.
   Each page sets <body data-page="letter | meaning | question">
   ========================================================== */

const STORAGE = {
    opened: "confession:letterOpened",
    answer: "confession:answer",
};

/* ---------- small helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const store = {
    get(key) {
        try {
            return sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    set(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch {
            /* storage unavailable: the page still works */
        }
    },
};

/* Personalise with ?name=Anna in the link */
function applyName() {
    const name = new URLSearchParams(location.search).get("name");
    if (!name) return;
    $$("[data-name]").forEach((el) => (el.textContent = name.slice(0, 40)));
}

/* Some browsers block autoplay; try once, ignore failure */
function startVideo() {
    const video = $("#bg-video");
    if (video) video.play().catch(() => {});
}

/* ==========================================================
   Page 1: the letter
   ========================================================== */
function initLetterPage() {
    const cover = $("#cover");
    const letter = $("#letter");
    const openBtn = $("#open-letter");

    function revealParagraphs() {
        $$("#letter-text p").forEach((p, i) => {
            setTimeout(() => p.classList.add("show"), 600 + i * 1100);
        });
    }

    function openLetter() {
        cover.classList.add("hidden");
        letter.classList.remove("hidden");
        store.set(STORAGE.opened, "1");
        revealParagraphs();
    }

    openBtn.addEventListener("click", openLetter);
}

/* ==========================================================
   Page 2: the meaning
   ========================================================== */
function initMeaningPage() {
    const cards = $$(".meaning-card");

    function toggle(card) {
        card.classList.toggle("open");
    }

    cards.forEach((card) => {
        card.addEventListener("click", () => toggle(card));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle(card);
            }
        });
    });
}

/* ==========================================================
   Page 3: the yes / no question
   ========================================================== */
function initQuestionPage() {
    const yesBtn = $("#yes-btn");
    const noBtn = $("#no-btn");
    const ask = $("#ask");
    const result = $("#result");
    const askText = $("#ask-text");

    const MAX_DODGES = 100;
    const noLines = [
        "Take your time. There's no wrong answer.",
        "Hey, that button is a bit shy.",
        "Are you sure about that?",
        "Hmm, it keeps slipping away.",
        "Okay, last one. I promise.",
    ];
    let dodges = 0;

    /* ----- No button: playful dodge a few times, then respect the answer ----- */
    function dodge() {
        if (dodges >= MAX_DODGES) return;

        dodges += 1;
        askText.textContent = noLines[Math.min(dodges, noLines.length - 1)];

        const margin = 12;
        const maxLeft = window.innerWidth - noBtn.offsetWidth - margin;
        const maxTop = window.innerHeight - noBtn.offsetHeight - margin;

        noBtn.classList.add("dodging");
        noBtn.style.left = `${margin + Math.random() * Math.max(maxLeft - margin, 0)}px`;
        noBtn.style.top = `${margin + Math.random() * Math.max(maxTop - margin, 0)}px`;

        /* Yes grows a little each time */
        yesBtn.style.transform = `scale(${1 + dodges * 0.12})`;
    }

    noBtn.addEventListener("mouseenter", dodge);
    noBtn.addEventListener("touchstart", (event) => {
        if (dodges < MAX_DODGES) {
            event.preventDefault();
            dodge();
        }
    }, { passive: false });

    noBtn.addEventListener("click", () => {
        if (dodges < MAX_DODGES) {
            dodge();
            return;
        }
        showResult("no");
    });

    yesBtn.addEventListener("click", () => showResult("yes"));

    /* ----- Result ----- */
    function showResult(answer) {
        store.set(STORAGE.answer, answer);
        ask.classList.add("hidden");
        result.classList.remove("hidden");
        noBtn.classList.remove("dodging");

        const title = $("#result-title");
        const text = $("#result-text");

        if (answer === "yes") {
            title.textContent = "Thank you ❤";
            text.textContent = "You've made me really happy. I promise to treat this chance with care.";
            launchConfetti();
        } else {
            title.textContent = "Thank you for being honest";
            text.textContent = "I understand, and I respect your answer. I wish you all the happiness in the world.";
        }
    }
}

/* ---------- Confetti (canvas, no libraries) ---------- */
function launchConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = $("#confetti");
    const ctx = canvas.getContext("2d");
    const symbols = ["❤", "♥", "✦"];
    const colors = ["#ff4d7d", "#ff8fab", "#ffd166", "#fff"];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const pieces = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        size: 14 + Math.random() * 18,
        speed: 1.5 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 1.5,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const endAt = performance.now() + 7000;

    function frame(now) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of pieces) {
            p.y += p.speed;
            p.x += p.drift;
            ctx.font = `${p.size}px sans-serif`;
            ctx.fillStyle = p.color;
            ctx.fillText(p.symbol, p.x, p.y);
        }

        if (now < endAt) {
            requestAnimationFrame(frame);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    requestAnimationFrame(frame);
}

/* ==========================================================
   Boot: run the right setup for the current page
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
    applyName();
    startVideo();

    const page = document.body.dataset.page;
    const pages = {
        letter: initLetterPage,
        meaning: initMeaningPage,
        question: initQuestionPage,
    };

    if (pages[page]) pages[page]();
});