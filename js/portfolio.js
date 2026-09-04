const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const savedTheme = localStorage.getItem("portfolio-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const sudokuDialog = document.querySelector("[data-sudoku-dialog]");
let portfolioScrollPosition = 0;

const accessGate = document.querySelector("[data-access-gate]");
const accessForm = document.querySelector("[data-access-form]");
const accessInput = document.querySelector("[data-access-input]");
const accessError = document.querySelector("[data-access-error]");
const isUnlocked = sessionStorage.getItem("portfolio-unlocked") === "true";

if (isUnlocked) {
  accessGate.hidden = true;
  document.body.classList.remove("is-locked");
} else {
  window.requestAnimationFrame(() => accessInput.focus({ preventScroll: true }));
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (accessInput.value === "402") {
    sessionStorage.setItem("portfolio-unlocked", "true");
    document.body.classList.remove("is-locked");
    accessGate.classList.add("is-unlocking");
    window.setTimeout(() => {
      accessGate.hidden = true;
    }, 450);
    return;
  }

  accessError.textContent = "That passcode isn’t correct. Please try again.";
  accessInput.value = "";
  accessInput.focus();
  accessInput.closest(".access-input").classList.add("has-error");
});

document.querySelector("[data-open-sudoku]").addEventListener("click", () => {
  portfolioScrollPosition = window.scrollY;
  sudokuDialog.showModal();
  window.requestAnimationFrame(() => window.scrollTo(0, portfolioScrollPosition));
});

function closeSudoku() {
  sudokuDialog.close();
  window.requestAnimationFrame(() => window.scrollTo(0, portfolioScrollPosition));
}

document.querySelector("[data-close-sudoku]").addEventListener("click", closeSudoku);

sudokuDialog.addEventListener("click", (event) => {
  if (event.target === sudokuDialog) closeSudoku();
});

sudokuDialog.addEventListener("close", () => {
  window.requestAnimationFrame(() => window.scrollTo(0, portfolioScrollPosition));
});


if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  root.dataset.theme = "dark";
  themeToggle.setAttribute("aria-pressed", "true");
}

themeToggle.addEventListener("click", () => {
  const useDarkTheme = root.dataset.theme !== "dark";

  root.dataset.theme = useDarkTheme ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(useDarkTheme));
  localStorage.setItem("portfolio-theme", useDarkTheme ? "dark" : "light");
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.13 },
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const header = document.querySelector("[data-header]");

window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 24),
  { passive: true },
);

const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (hasFinePointer && !prefersReducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      card.style.transform = [
        "perspective(1200px)",
        `rotateX(${-y * 1.4}deg)`,
        `rotateY(${x * 1.4}deg)`,
      ].join(" ");
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
