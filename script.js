'use strict';

document.documentElement.classList.add('has-js');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.querySelector('span').textContent = open ? 'Закрыть' : 'Меню';
}

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !nav.classList.contains('open')) return;
  const destination = document.querySelector(link.hash);
  setMenu(false);
  destination.tabIndex = -1;
  destination.focus({ preventScroll: true });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header') && nav.classList.contains('open')) setMenu(false);
});
matchMedia('(max-width: 760px)').addEventListener('change', () => setMenu(false));

if (!motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('is-visible');
      observer.unobserve(target);
    }
  }, { rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    if (element.getBoundingClientRect().top >= innerHeight) {
      element.classList.add('will-reveal');
      observer.observe(element);
    }
  });
}

const gallery = document.querySelector('.gallery');
const stage = gallery.querySelector('.gallery-stage');
const images = [...stage.querySelectorAll('img')];
const caption = gallery.querySelector('.gallery-caption');
const lightbox = document.querySelector('.lightbox');
const fullImage = lightbox.querySelector('img');
const scenes = [
  {
    title: 'Пудровые тона',
    alt: 'Кухня с пудровыми фасадами и рифлёными верхними шкафами',
    description: 'Свет из окна подчёркивает рельеф верхних шкафов и рисунок фартука.'
  },
  {
    title: 'Тихая олива',
    alt: 'Оливковые рамочные фасады, каменный фартук и кресло рядом с окном',
    description: 'Рамочные фасады обрамляют рабочую зону. Рисунок камня выделяется на спокойном фоне.'
  },
  {
    title: 'Свет у окна',
    alt: 'Светлая кухня с островом и высокими окнами',
    description: 'Остров в центре комнаты оставляет проходы свободными, а высокие окна наполняют кухню светом.'
  }
];
let selectedScene = 0;

const count = (index, total) => [index + 1, total].map((value) => String(value).padStart(2, '0')).join(' / ');

function updateLightbox() {
  const scene = scenes[selectedScene];
  fullImage.src = images[selectedScene].src;
  fullImage.alt = scene.alt;
  lightbox.querySelector('h2').textContent = scene.title;
  lightbox.querySelector('.lightbox-count').textContent = count(selectedScene, scenes.length);
}

function stepGallery(direction) {
  selectedScene = (selectedScene + direction + scenes.length) % scenes.length;
  const scene = scenes[selectedScene];
  images.forEach((img, index) => {
    img.classList.toggle('inactive', index !== selectedScene);
    img.alt = index === selectedScene ? scene.alt : '';
  });
  caption.querySelector('.gallery-count').textContent = count(selectedScene, scenes.length);
  caption.querySelector('h3').textContent = scene.title;
  caption.querySelector('.gallery-description').textContent = scene.description;
  stage.setAttribute('aria-label', `Открыть фотографию «${scene.title}» крупным планом`);
  if (lightbox.open) updateLightbox();
}

for (const region of [gallery, lightbox]) {
  region.querySelector('.prev').addEventListener('click', () => stepGallery(-1));
  region.querySelector('.next').addEventListener('click', () => stepGallery(1));
  region.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    stepGallery(event.key === 'ArrowLeft' ? -1 : 1);
  });
}

stage.addEventListener('click', () => {
  updateLightbox();
  lightbox.showModal();
});

const swatches = [...document.querySelectorAll('[data-material]')];
const boards = [...document.querySelectorAll('.board-scene')];
const palettes = [
  'Тёплое дерево · Молочный тон · Светлый камень',
  'Светлый камень · Песочный тон · Серо-оливковый',
  'Мягкий графит · Тёплое дерево · Серый камень'
];
swatches.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = Number(button.dataset.material);
    swatches.forEach((swatch, index) => swatch.setAttribute('aria-pressed', String(index === selected)));
    boards.forEach((board, index) => board.classList.toggle('inactive', index !== selected));
    document.querySelector('.material-index').textContent = count(selected, palettes.length);
    document.querySelector('.material-caption').textContent = palettes[selected];
  });
});

const brief = document.querySelector('#brief');
const notes = brief.elements.notes;
const error = document.querySelector('#brief-error');
const message = document.querySelector('.message-dialog');
const draft = document.querySelector('#draft');
const copyStatus = document.querySelector('#copy-status');
brief.noValidate = true;
brief.querySelector('[type="submit"]').disabled = false;

function validateNotes() {
  const valid = notes.value.trim().length > 0;
  notes.setAttribute('aria-invalid', String(!valid));
  error.textContent = valid ? '' : 'Напишите пару слов о том, какой вы видите кухню.';
  return valid;
}

notes.addEventListener('blur', () => {
  if (notes.value || notes.hasAttribute('aria-invalid')) validateNotes();
});
notes.addEventListener('input', () => {
  if (notes.getAttribute('aria-invalid') === 'true') validateNotes();
});

brief.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateNotes()) {
    notes.focus();
    return;
  }
  const data = new FormData(brief);
  const dimensions = data.get('dimensions').trim();
  const lines = ['Здравствуйте! Хочу обсудить кухню на заказ.'];
  if (dimensions) lines.push(`Размеры: ${dimensions}.`);
  lines.push(`Планировка: ${data.get('layout')}.`, `Что для меня важно: ${notes.value.trim()}`);
  draft.value = lines.join('\n');
  copyStatus.textContent = '';
  message.showModal();
});

document.querySelector('#copy-draft').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    copyStatus.textContent = 'Черновик скопирован.';
  } catch {
    draft.focus();
    draft.select();
    copyStatus.textContent = 'Текст выделен. Скопируйте его вручную.';
  }
});

for (const dialog of [lightbox, message]) {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
