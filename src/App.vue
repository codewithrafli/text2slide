<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch, type Component } from 'vue';
import { toJpeg, toPng } from 'html-to-image';
import { zipSync } from 'fflate';
import {
  Asterisk,
  Bot,
  BookOpen,
  Bookmark,
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Heart,
  ImagePlus,
  KeyRound,
  Link as LinkIcon,
  MessageCircle,
  Play,
  Plus,
  Save,
  Star,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Youtube,
} from 'lucide-vue-next';
import { isSupabaseConfigured, storageBucket, supabase } from './lib/supabase';
import type {
  BrandSettings,
  CarouselDraft,
  CarouselSlide,
  PptAiBlock,
  PptAiLayout,
  PptAiSize,
  PptAiTone,
  PptLayout,
  SlideCard,
  SlideDecoration,
  SlideIconId,
  SlideVisualCue,
  SlideTemplate,
  ThemeId,
} from './types/carousel';

const themes: Array<{ id: ThemeId; label: string }> = [
  { id: 'rafli', label: 'Blue promo' },
  { id: 'promo', label: 'Neon course' },
  { id: 'dark', label: 'Dark code' },
];

const templateOptions: Array<{ id: SlideTemplate; label: string }> = [
  { id: 'cover', label: 'Cover' },
  { id: 'content', label: 'Content' },
  { id: 'quote', label: 'Quote' },
  { id: 'stat', label: 'Stat' },
  { id: 'list', label: 'List' },
  { id: 'steps', label: 'Steps' },
  { id: 'reels', label: 'Reels' },
  { id: 'ppt', label: 'PPT' },
  { id: 'ppt-cover', label: 'PPT Cover' },
  { id: 'ppt-content', label: 'PPT Content' },
  { id: 'ppt-image', label: 'PPT Image' },
  { id: 'ppt-closing', label: 'PPT Closing' },
  { id: 'closing', label: 'Closing' },
];

const iconOptions: Array<{ id: SlideIconId; label: string; icon: Component }> = [
  { id: 'bookmark', label: 'Save', icon: Bookmark },
  { id: 'video', label: 'YouTube', icon: Youtube },
  { id: 'play', label: 'Play', icon: Play },
  { id: 'link', label: 'Link', icon: LinkIcon },
  { id: 'check', label: 'Check', icon: Check },
  { id: 'follow', label: 'Follow', icon: UserPlus },
  { id: 'comment', label: 'Comment', icon: MessageCircle },
  { id: 'heart', label: 'Like', icon: Heart },
  { id: 'key', label: 'Secret', icon: KeyRound },
];

const decorationSelectOptions: Array<{ id: SlideDecoration['icon']; label: string }> = [
  ...iconOptions.map((option) => ({ id: option.id, label: option.label })),
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'star', label: 'Star' },
  { id: 'asterisk', label: 'Asterisk' },
];

const allIconComponents: Record<SlideDecoration['icon'], Component> = {
  bookmark: Bookmark,
  video: Youtube,
  play: Play,
  link: LinkIcon,
  check: Check,
  follow: UserPlus,
  comment: MessageCircle,
  heart: Heart,
  key: KeyRound,
  sparkles: Sparkles,
  star: Star,
  asterisk: Asterisk,
};

const backgroundPositionOptions = [
  'center center',
  'center top',
  'center bottom',
  'left center',
  'right center',
  'left top',
  'right top',
];

const starterSlides: CarouselSlide[] = [
  {
    id: crypto.randomUUID(),
    template: 'cover',
    eyebrow: '',
    title: '5 Channel youtube GRATIS!',
    body: 'Biar kamu makin paham soal coding!',
    tag: 'Simpan dulu biar nggak lupa',
    icon: 'video',
    backgroundPosition: 'center top',
    cta: 'Simpan dulu liat lagi nanti',
  },
  {
    id: crypto.randomUUID(),
    template: 'content',
    eyebrow: 'Problem',
    title: 'Setiap hari ribuan\nbot scraping.',
    body: 'Mereka crawl public repo terus-terusan cari keyword AWS_SECRET, DB_PASSWORD, API_KEY. Gak perlu nunggu jam - hitungan menit setelah push, secret kamu udah bocor.',
    tag: 'Save slide ini biar kamu nggak lupa',
    icon: 'key',
    backgroundPosition: 'center center',
    cta: 'Kalo iya, ebook ini cocok buat kamu',
  },
  {
    id: crypto.randomUUID(),
    template: 'content',
    eyebrow: 'Channel belajar',
    title: '5 Channel youtube GRATIS!',
    body: 'Biar kamu makin paham soal coding!',
    tag: 'Simpan dulu liat lagi nanti',
    icon: 'video',
    backgroundPosition: 'center center',
    cta: 'Follow untuk resource coding',
  },
  {
    id: crypto.randomUUID(),
    template: 'closing',
    eyebrow: 'CTA',
    title: 'Sudah siap asah skill kamu?\nGRATIS\nAmbil sekarang disini!',
    body: 'Link akses ebook: https://s.id/ebookl13',
    tag: 'Like  Comment  Follow',
    icon: 'link',
    backgroundPosition: 'center center',
    cta: 'https://s.id/ebookl13',
  },
];

type StoredProject = CarouselDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const PROJECTS_STORAGE_KEY = 'ig-carousel-projects';
const LEGACY_DRAFT_STORAGE_KEY = 'ig-carousel-draft';

function cloneSlides(slides: CarouselSlide[], keepIds = true) {
  return slides.map((slide) => ({
    ...slide,
    id: keepIds ? slide.id || crypto.randomUUID() : crypto.randomUUID(),
    decorations: slide.decorations?.map((decoration) => ({ ...decoration })),
    visualCards: slide.visualCards?.map((card) => ({ ...card })),
    visualCue: slide.visualCue ? { ...slide.visualCue } : undefined,
    aiLayout: slide.aiLayout
      ? { blocks: slide.aiLayout.blocks.map((block) => ({ ...block, items: block.items?.slice() })) }
      : undefined,
  }));
}

function createDefaultDraft(): CarouselDraft {
  return {
    id: crypto.randomUUID(),
    title: 'Laravel 13 Promo Carousel',
    subtitle: 'Code With Rafli',
    brand: {
      handle: 'codewithrafli',
      logoUrl: '',
      website: 'codewithrafli.com',
      accent: '#a6ff1a',
      theme: 'rafli',
      showNoise: true,
    },
    slides: cloneSlides(starterSlides, false),
  };
}

const draft = reactive<CarouselDraft>(createDefaultDraft());

const defaultBrand: BrandSettings = {
    handle: 'codewithrafli',
    logoUrl: '',
    website: 'codewithrafli.com',
    accent: '#a6ff1a',
    theme: 'rafli',
    showNoise: true,
};

const activeIndex = ref(0);
const currentView = ref<'projects' | 'editor'>('projects');
const activeProjectId = ref(draft.id || '');
const projects = ref<StoredProject[]>([]);
const saving = ref(false);
const exporting = ref(false);
const arranging = ref(false);
const statusMessage = ref('');
const slideRefs = ref<HTMLElement[]>([]);
const bodyDraft = ref('');
const activeDecorationIndex = ref(0);
const showAddSlideMenu = ref(false);
const addImageSlideInput = ref<HTMLInputElement | null>(null);
let bodyDraftTimer: number | undefined;

const activeSlide = computed(() => draft.slides[activeIndex.value]);
const activeTheme = computed(() => `theme-${draft.brand.theme}`);
const activeTemplate = computed(() => activeSlide.value.template || 'content');
const markdownCache = new Map<string, string>();

const sortedProjects = computed(() =>
  [...projects.value].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  ),
);

function projectSnapshot(source: CarouselDraft = draft): StoredProject {
  const now = new Date().toISOString();
  const id = source.id || activeProjectId.value || crypto.randomUUID();
  const existing = projects.value.find((project) => project.id === id);

  return {
    id,
    title: source.title || 'Untitled carousel',
    subtitle: source.subtitle || 'Draft project',
    brand: { ...defaultBrand, ...source.brand },
    slides: cloneSlides(source.slides || [], true),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function persistProjects() {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects.value));
}

function upsertProject(project: StoredProject) {
  const index = projects.value.findIndex((item) => item.id === project.id);
  if (index >= 0) projects.value.splice(index, 1, project);
  else projects.value.push(project);
  persistProjects();
}

function assignDraft(source: CarouselDraft) {
  draft.id = source.id || crypto.randomUUID();
  draft.title = source.title || 'Untitled carousel';
  draft.subtitle = source.subtitle || 'Code With Rafli';
  draft.brand = { ...defaultBrand, ...source.brand };
  draft.slides = source.slides?.length
    ? source.slides.map((slide, index) => normalizeSlide(slide, index))
    : cloneSlides(starterSlides, false);
  activeIndex.value = 0;
  activeProjectId.value = draft.id;
  bodyDraft.value = draft.slides[0]?.body || '';
}

function saveCurrentProject(silent = false) {
  const project = projectSnapshot();
  draft.id = project.id;
  activeProjectId.value = project.id;
  upsertProject(project);
  localStorage.setItem(LEGACY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  if (!silent) statusMessage.value = 'Project saved locally.';
}

function createProject() {
  const nextDraft = createDefaultDraft();
  nextDraft.title = `Untitled project ${projects.value.length + 1}`;
  assignDraft(nextDraft);
  saveCurrentProject(true);
  currentView.value = 'editor';
  statusMessage.value = 'New project created.';
}

function openProject(project: StoredProject) {
  assignDraft(project);
  currentView.value = 'editor';
  statusMessage.value = '';
}

function duplicateProject(project: StoredProject) {
  const copy: StoredProject = {
    ...project,
    id: crypto.randomUUID(),
    title: `${project.title} copy`,
    slides: cloneSlides(project.slides, false),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  upsertProject(copy);
}

function deleteProject(project: StoredProject) {
  projects.value = projects.value.filter((item) => item.id !== project.id);
  persistProjects();
  if (activeProjectId.value === project.id) {
    const nextProject = sortedProjects.value[0];
    if (nextProject) assignDraft(nextProject);
    else assignDraft(createDefaultDraft());
  }
}

function goToProjects() {
  saveCurrentProject(true);
  currentView.value = 'projects';
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function supportsDecorations(template?: SlideTemplate) {
  return template === 'cover' || template === 'closing';
}

watch(
  () => activeSlide.value.id,
  () => {
    bodyDraft.value = activeSlide.value.body;
    activeDecorationIndex.value = 0;
  },
  { immediate: true },
);

const editableDecorations = computed(() => {
  if (!supportsDecorations(activeSlide.value.template)) {
    activeSlide.value.decorations = [];
    return activeSlide.value.decorations;
  }

  if (!activeSlide.value.decorations?.length) {
    activeSlide.value.decorations = getDecorations(
      activeSlide.value,
      activeSlide.value.template === 'cover',
    ).map((decoration) => ({ ...decoration }));
  }

  return activeSlide.value.decorations;
});

const activeDecoration = computed(() => editableDecorations.value[activeDecorationIndex.value]);

function updateBodyDraft(value: string) {
  bodyDraft.value = value;
  window.clearTimeout(bodyDraftTimer);
  bodyDraftTimer = window.setTimeout(() => {
    activeSlide.value.body = value;
  }, 180);
}

function handleBodyInput(event: Event) {
  if (event.target instanceof HTMLTextAreaElement) {
    updateBodyDraft(event.target.value);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInlineMarkdown(value: string) {
  let html = escapeHtml(value);

  html = html.replace(
    /!\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)\s]+)\)/g,
    (_match, alt: string, src: string) =>
      `<img class="markdown-image" src="${src}" alt="${escapeHtml(alt)}" />`,
  );
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<span class="markdown-link">$1</span>',
  );
  html = html.replace(
    /\[\s*tambahkan ilustrasi\s*:\s*([^\]]+)\]/gi,
    '<span class="illustration-hint"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>$1</span>',
  );
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return html;
}

function renderMarkdown(value: string) {
  const cached = markdownCache.get(value);
  if (cached) return cached;

  const lines = value.split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(`<ul>${listItems.join('')}</ul>`);
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      listItems.push(`<li>${renderInlineMarkdown(listMatch[1])}</li>`);
      continue;
    }

    flushList();
    if (trimmed.startsWith('### ')) {
      blocks.push(`<h4>${renderInlineMarkdown(trimmed.slice(4))}</h4>`);
    } else if (trimmed.startsWith('## ')) {
      blocks.push(`<h3>${renderInlineMarkdown(trimmed.slice(3))}</h3>`);
    } else if (trimmed.startsWith('# ')) {
      blocks.push(`<h3>${renderInlineMarkdown(trimmed.slice(2))}</h3>`);
    } else {
      blocks.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
    }
  }

  flushList();
  const html = blocks.join('');
  markdownCache.set(value, html);
  if (markdownCache.size > 80) {
    markdownCache.delete(markdownCache.keys().next().value as string);
  }
  return html;
}

function getSlideIcon(iconId?: SlideIconId) {
  return iconOptions.find((option) => option.id === iconId)?.icon || Bookmark;
}

function getDecorationIcon(iconId: SlideDecoration['icon']) {
  return allIconComponents[iconId] || Sparkles;
}

function getSecondaryIcon(iconId?: SlideIconId) {
  if (iconId === 'video' || iconId === 'play') return Play;
  if (iconId === 'link') return ExternalLink;
  if (iconId === 'key') return KeyRound;
  return BookOpen;
}

function normalizeVisualCards(cards?: SlideCard[]) {
  const tones = new Set<NonNullable<SlideCard['tone']>>([
    'blue',
    'green',
    'orange',
    'purple',
    'neutral',
  ]);

  return (cards || [])
    .filter((card) => card && (card.title || card.body || card.label))
    .slice(0, 4)
    .map((card, index) => {
      const tone = card.tone || 'neutral';
      return {
        label: String(card.label || `Card ${index + 1}`).slice(0, 36),
        title: String(card.title || '').slice(0, 44),
        body: String(card.body || '').slice(0, 92),
        icon: iconOptions.some((option) => option.id === card.icon) ? card.icon : 'bookmark',
        tone: tones.has(tone) ? tone : 'neutral',
      };
    });
}

function normalizeVisualCue(cue?: SlideVisualCue): SlideVisualCue | undefined {
  if (!cue || (!cue.title && !cue.body)) return undefined;
  const tone = cue.tone || 'blue';
  const tones = new Set<NonNullable<SlideVisualCue['tone']>>([
    'blue',
    'green',
    'orange',
    'purple',
    'neutral',
  ]);

  return {
    title: String(cue.title || '').slice(0, 44),
    body: String(cue.body || '').slice(0, 96),
    icon: iconOptions.some((option) => option.id === cue.icon) ? cue.icon : 'bookmark',
    tone: tones.has(tone) ? tone : 'blue',
  };
}

function normalizePptLayout(layout?: PptLayout): PptLayout | undefined {
  return ['split', 'cards', 'quote', 'points', 'statement'].includes(layout || '')
    ? layout
    : undefined;
}

function clampPercent(value: unknown, fallback: number, min = 0, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeAiTone(tone?: PptAiTone): PptAiTone {
  return ['blue', 'green', 'orange', 'purple', 'neutral'].includes(tone || '')
    ? tone || 'blue'
    : 'blue';
}

function normalizeAiSize(size?: PptAiSize): PptAiSize {
  return ['sm', 'md', 'lg', 'xl'].includes(size || '') ? size || 'md' : 'md';
}

function normalizeAiLayout(layout?: PptAiLayout): PptAiLayout | undefined {
  const allowedTypes = new Set<PptAiBlock['type']>([
    'badge',
    'headline',
    'body',
    'card',
    'quote',
    'list',
    'visual',
    'callout',
    'metric',
  ]);
  const blocks = (layout?.blocks || [])
    .filter((block) => block && allowedTypes.has(block.type))
    .slice(0, 10)
    .map((block) => {
      const x = clampPercent(block.x, 8, 2, 94);
      const y = clampPercent(block.y, 14, 6, 88);
      const w = clampPercent(block.w, 36, 8, 92 - x);
      const h = clampPercent(block.h, 12, 5, 92 - y);
      return {
        type: block.type,
        x,
        y,
        w,
        h,
        text: String(block.text || '').slice(0, 150),
        title: String(block.title || '').slice(0, 96),
        body: String(block.body || '').slice(0, 180),
        label: String(block.label || '').slice(0, 48),
        items: (block.items || []).map((item) => String(item).slice(0, 82)).slice(0, 5),
        icon: iconOptions.some((option) => option.id === block.icon) ? block.icon : 'bookmark',
        tone: normalizeAiTone(block.tone),
        size: normalizeAiSize(block.size),
        align: ['left', 'center', 'right'].includes(block.align || '') ? block.align : 'left',
      };
    });

  return blocks.length ? { blocks } : undefined;
}

function hasVisualCards(slide: CarouselSlide) {
  return Boolean(normalizeVisualCards(slide.visualCards).length);
}

function normalizeSlide(slide: CarouselSlide, index: number): CarouselSlide {
  const allowedTemplates = new Set<SlideTemplate>([
    'cover',
    'content',
    'quote',
    'stat',
    'list',
    'steps',
    'reels',
    'ppt',
    'ppt-cover',
    'ppt-content',
    'ppt-image',
    'ppt-closing',
    'closing',
  ]);
  const template = allowedTemplates.has(slide.template)
    ? slide.template
    : index === 0
      ? 'cover'
      : 'content';

  return {
    ...slide,
    template,
    icon: slide.icon || (index === 0 ? 'video' : 'bookmark'),
    backgroundPosition: slide.backgroundPosition || (index === 0 ? 'center top' : 'center center'),
    decorations: slide.decorations,
    visualCards: normalizeVisualCards(slide.visualCards),
    visualCue: normalizeVisualCue(slide.visualCue),
    pptLayout: normalizePptLayout(slide.pptLayout),
    aiLayout: normalizeAiLayout(slide.aiLayout),
  };
}

function bodyLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function listItems(value: string) {
  const parsed = bodyLines(value)
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
    .filter(Boolean);

  return parsed.length ? parsed : [value.trim()].filter(Boolean);
}

function isStructuredPptMarkdown(value: string) {
  return (value.match(/^\s*#{1,3}\s*Slide\s+\d+/gim) || []).length >= 3;
}

function structuredPptSlideCount(value: string) {
  const count = (value.match(/^\s*#{1,3}\s*Slide\s+\d+/gim) || []).length;
  return count >= 3 ? count : undefined;
}

function isPptTemplate(template?: SlideTemplate) {
  return (
    template === 'ppt' ||
    template === 'ppt-cover' ||
    template === 'ppt-content' ||
    template === 'ppt-image' ||
    template === 'ppt-closing'
  );
}

function isPptCover(template?: SlideTemplate) {
  return template === 'ppt-cover';
}

function isPptClosing(template?: SlideTemplate) {
  return template === 'ppt-closing';
}

function isPptCoverAt(template: SlideTemplate | undefined, index: number) {
  return template === 'ppt-cover' || (template === 'ppt' && index === 0);
}

function isPptClosingAt(template: SlideTemplate | undefined, index: number, total: number) {
  return template === 'ppt-closing' || (template === 'ppt' && index === total - 1);
}

function pptTemplateForIndex(index: number, total = draft.slides.length): SlideTemplate {
  if (index === 0) return 'ppt-cover';
  if (index === total - 1) return 'ppt-closing';
  return 'ppt-content';
}

function stepItems(value: string) {
  return listItems(value).slice(0, 5);
}

function isDensePptBody(value: string) {
  return value.length > 360 || bodyLines(value).length > 6;
}

function illustrationHint(value: string) {
  return value.match(/\[tambahkan ilustrasi:\s*([^\]]+)\]/i)?.[1]?.trim() || '';
}

function cleanPptBody(value: string) {
  return value.replace(/\n?\s*\[tambahkan ilustrasi:\s*[^\]]+\]\s*/gi, '').trim();
}

function pptBodyIsCardCandidate(slide: CarouselSlide) {
  if (!isPptTemplate(slide.template) || isPptCover(slide.template) || isPptClosing(slide.template)) {
    return false;
  }
  return hasVisualCards(slide);
}

function getPptLayout(slide: CarouselSlide): PptLayout {
  if (slide.pptLayout === 'cards' && hasVisualCards(slide)) return 'cards';
  if (slide.pptLayout) return slide.pptLayout;
  if (hasVisualCards(slide)) return 'cards';
  if (/quote|kutipan|mindset|asumsi|bukan/i.test(`${slide.eyebrow} ${slide.title}`)) return 'quote';
  if (listItems(slide.body).length >= 3 && bodyLines(slide.body).length >= 3) return 'points';
  if (cleanPptBody(slide.body).length < 120) return 'statement';
  return 'split';
}

function pptVisualCue(slide: CarouselSlide): SlideVisualCue {
  const normalized = normalizeVisualCue(slide.visualCue);
  if (normalized) return normalized;

  const hint = illustrationHint(slide.body);
  if (hint) {
    return {
      title: hint.slice(0, 44),
      body: 'Visual pendukung untuk memperjelas inti slide.',
      icon: slide.icon || 'bookmark',
      tone: 'blue',
    };
  }

  if (slide.icon === 'key') {
    return {
      title: 'Fokus utama',
      body: 'Tekankan bagian yang paling penting untuk diingat.',
      icon: 'key',
      tone: 'purple',
    };
  }
  if (slide.icon === 'check') {
    return {
      title: 'Bukti nyata',
      body: 'Tunjukkan output yang bisa dilihat atau dicoba.',
      icon: 'check',
      tone: 'green',
    };
  }
  if (slide.icon === 'link') {
    return {
      title: 'Next step',
      body: 'Arahkan audiens ke aksi yang jelas.',
      icon: 'link',
      tone: 'orange',
    };
  }

  return {
    title: slide.tag || 'Core idea',
    body: 'Satu pesan utama, dibuat ringkas dan mudah dipahami.',
    icon: slide.icon || 'bookmark',
    tone: 'blue',
  };
}

function aiBlockStyle(block: PptAiBlock) {
  return {
    left: `${block.x}%`,
    top: `${block.y}%`,
    width: `${block.w}%`,
    height: `${block.h}%`,
    textAlign: block.align || 'left',
  };
}

function aiBlockText(block: PptAiBlock) {
  return block.text || block.title || block.body || '';
}

function aiLayoutForSlide(slide: CarouselSlide) {
  return normalizeAiLayout(slide.aiLayout);
}

function splitReelsLine(value: string) {
  return [{ text: value, accent: false }];
}

function reelsAutoLines(value: string) {
  const explicitLines = bodyLines(value);
  if (explicitLines.length !== 1) return explicitLines;

  const words = explicitLines[0]
    .replace(/\s+dan\s+/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const targetLines = words.length <= 3 ? 1 : words.length <= 9 ? 2 : 3;
  const perLine = Math.ceil(words.length / targetLines);
  const lines: string[] = [];

  for (let index = 0; index < words.length; index += perLine) {
    lines.push(words.slice(index, index + perLine).join(' '));
  }

  return lines.filter(Boolean);
}

function reelsPosterLines(slide: CarouselSlide) {
  const titleLines = reelsAutoLines(slide.title).map((line) => splitReelsLine(line));
  const bodyPosterLines = reelsAutoLines(slide.body).map((line) =>
    splitReelsLine(line.replace(/^[-*]\s+/, '')),
  );

  return [
    ...bodyLines(slide.eyebrow).map((line) => splitReelsLine(line)),
    ...titleLines,
    ...bodyPosterLines,
  ];
}

const decorationCache = new Map<string, SlideDecoration[]>();

// Safe corner slots that never overlap the headline text or the top-left logo.
// Cover headline sits at the bottom -> decorations live in the top area.
// Closing headline is centered -> decorations live in the corners.
const COVER_DECO_SLOTS = [
  { left: 84, top: 12, size: 9, rotate: -10 },
  { left: 88, top: 40, size: 6.5, rotate: 8 },
  { left: 63, top: 9, size: 7, rotate: -6 },
];
const CLOSING_DECO_SLOTS = [
  { left: 85, top: 14, size: 9, rotate: -10 },
  { left: 11, top: 85, size: 8, rotate: 8 },
  { left: 66, top: 12, size: 6.5, rotate: -6 },
];

function getDecorations(slide: CarouselSlide, isCover: boolean) {
  if (slide.decorations?.length) return slide.decorations;

  const cacheKey = `${slide.id}-${isCover ? 'cover' : 'body'}`;
  const cached = decorationCache.get(cacheKey);
  if (cached) return cached;

  const template = slide.template || (isCover ? 'cover' : 'content');
  const slots = template === 'cover' ? COVER_DECO_SLOTS : CLOSING_DECO_SLOTS;
  // Contextual icons: the slide's own icon first, then subtle accents.
  const icons: SlideDecoration['icon'][] = [slide.icon, 'sparkles', 'star'];

  const decorations: SlideDecoration[] = slots.map((zone, index) => ({
    icon: icons[index] ?? 'sparkles',
    left: `${zone.left}%`,
    top: `${zone.top}%`,
    size: `${zone.size}cqw`,
    rotate: `${zone.rotate}deg`,
    opacity: index === 0 ? 0.85 : 0.68,
  }));

  decorationCache.set(cacheKey, decorations);
  return decorations;
}

function addDecoration() {
  if (!supportsDecorations(activeSlide.value.template)) return;
  if (!activeSlide.value.decorations) activeSlide.value.decorations = [];
  activeSlide.value.decorations.push({
    icon: 'sparkles',
    left: '18%',
    top: '48%',
    size: '4cqw',
    rotate: '0deg',
    opacity: 0.9,
  });
  activeDecorationIndex.value = activeSlide.value.decorations.length - 1;
}

function removeDecoration() {
  if (!activeSlide.value.decorations?.length) return;
  activeSlide.value.decorations.splice(activeDecorationIndex.value, 1);
  activeDecorationIndex.value = Math.max(0, activeDecorationIndex.value - 1);
}

function inferLayout(slide: CarouselSlide, index: number) {
  const text = `${slide.eyebrow} ${slide.title} ${slide.body} ${slide.cta}`.toLowerCase();
  const isClosing = /ambil|akses|link|follow|comment|like|gratis|sekarang|download/.test(text) && index === draft.slides.length - 1;
  let template: SlideTemplate = index === 0 ? 'cover' : isClosing ? 'closing' : 'content';
  let icon: SlideIconId = 'bookmark';

  if (aiOutputType.value === 'ppt') template = pptTemplateForIndex(index);
  else if (aiOutputType.value === 'reels') template = 'reels';

  if (template === 'content') {
    if (/(^|\n)\s*\d+[.)]\s+|step|langkah|tahap/.test(text)) template = 'steps';
    else if (/(^|\n)\s*[-*]\s+/.test(text)) template = 'list';
    else if (/[0-9]+[%x]|\brp\b|\bjt\b|\bribu\b|\b\d+\b/.test(text)) template = 'stat';
    else if (/reels|thumbnail|cover video|nganggur|coding|laravel|vue|react/.test(text)) template = 'reels';
    else if (/["“”']|quote|kutipan|mindset/.test(text)) template = 'quote';
  }

  if (/youtube|channel|video|tutorial/.test(text)) icon = 'video';
  else if (/secret|password|api_key|key|token|aws/.test(text)) icon = 'key';
  else if (/link|akses|url|http|download/.test(text)) icon = 'link';
  else if (/follow/.test(text)) icon = 'follow';
  else if (/comment|komen/.test(text)) icon = 'comment';
  else if (/like/.test(text)) icon = 'heart';
  else if (/selesai|jalan|done|berhasil/.test(text)) icon = 'check';

  const slots = template === 'cover' ? COVER_DECO_SLOTS : CLOSING_DECO_SLOTS;
  const decorationIcons: SlideDecoration['icon'][] = [icon, 'sparkles', 'star'];
  const decorations: SlideDecoration[] =
    template !== 'cover' && template !== 'closing'
      ? []
      : slots.map((zone, slotIndex) => ({
          icon: decorationIcons[slotIndex] ?? 'sparkles',
          left: `${zone.left}%`,
          top: `${zone.top}%`,
          size: `${zone.size}cqw`,
          rotate: `${zone.rotate}deg`,
          opacity: slotIndex === 0 ? 0.85 : 0.68,
        }));

  return {
    template,
    icon,
    backgroundPosition: template === 'cover' ? 'center top' : 'center center',
    decorations,
  };
}

const AI_BRIDGE_URL = 'http://127.0.0.1:8787';

// Strip heavy/base64 fields (uploaded images) so the prompt stays small —
// The AI only needs the text + layout metadata to make decisions.
function slideForPrompt(slide: CarouselSlide, index: number) {
  return {
    index,
    template: slide.template,
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
    tag: slide.tag,
    cta: slide.cta ?? '',
    icon: slide.icon,
    backgroundPosition: slide.backgroundPosition,
    visualCards: normalizeVisualCards(slide.visualCards),
    visualCue: normalizeVisualCue(slide.visualCue),
    pptLayout: normalizePptLayout(slide.pptLayout),
    aiLayout: normalizeAiLayout(slide.aiLayout),
  };
}

function brandForPrompt(brand: BrandSettings) {
  return {
    handle: brand.handle,
    website: brand.website,
    accent: brand.accent,
    theme: brand.theme,
  };
}

async function requestAiLayout(slides: CarouselSlide[], scope: 'current' | 'all') {
  const indexedSlides =
    scope === 'current'
      ? [slideForPrompt(slides[0], activeIndex.value)]
      : slides.map((slide, index) => slideForPrompt(slide, index));
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 130_000);

  let response: Response;
  try {
    response = await fetch(`${AI_BRIDGE_URL}/ai-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        title: draft.title,
        subtitle: draft.subtitle,
        brand: brandForPrompt(draft.brand),
        activeIndex: activeIndex.value,
        scope,
        outputType: aiOutputType.value,
        slides: indexedSlides,
      }),
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`AI bridge returned ${response.status}`);
  }

  return (await response.json()) as {
    slides: Array<{
      index: number;
      template: SlideTemplate;
      icon: SlideIconId;
      backgroundPosition: string;
      decorations: SlideDecoration[];
      visualCards?: SlideCard[];
      visualCue?: SlideVisualCue;
      pptLayout?: PptLayout;
      aiLayout?: PptAiLayout;
    }>;
  };
}

function applyLayoutSuggestions(
  suggestions: Array<{
    index: number;
    template: SlideTemplate;
    icon: SlideIconId;
    backgroundPosition: string;
    decorations: SlideDecoration[];
    visualCards?: SlideCard[];
    visualCue?: SlideVisualCue;
    pptLayout?: PptLayout;
    aiLayout?: PptAiLayout;
  }>,
) {
  for (const suggestion of suggestions) {
    const slide = draft.slides[suggestion.index];
    if (!slide) continue;
    const forcedTemplate = forcedTemplateForOutput(suggestion.index, draft.slides.length);
    slide.template = forcedTemplate || suggestion.template;
    slide.icon = suggestion.icon;
    slide.backgroundPosition = suggestion.backgroundPosition;
    slide.decorations = forcedTemplate ? [] : suggestion.decorations;
    if (suggestion.visualCards) slide.visualCards = normalizeVisualCards(suggestion.visualCards);
    if (suggestion.visualCue) slide.visualCue = normalizeVisualCue(suggestion.visualCue);
    if (suggestion.pptLayout) slide.pptLayout = normalizePptLayout(suggestion.pptLayout);
    if (suggestion.aiLayout) slide.aiLayout = normalizeAiLayout(suggestion.aiLayout);
  }
}

function forcedTemplateForOutput(index = activeIndex.value, total = draft.slides.length): SlideTemplate | null {
  if (aiOutputType.value === 'ppt') return pptTemplateForIndex(index, total);
  if (aiOutputType.value === 'reels') return 'reels';
  return null;
}

async function autoArrange(scope: 'current' | 'all') {
  arranging.value = true;
  statusMessage.value = '';

  try {
    const targetSlides =
      scope === 'current' ? [draft.slides[activeIndex.value]] : draft.slides;
    const result = await requestAiLayout(targetSlides, scope);
    applyLayoutSuggestions(result.slides);
    statusMessage.value = 'AI picked templates, icons, and decoration layout.';
  } catch {
    const suggestions =
      scope === 'current'
        ? [{ index: activeIndex.value, ...inferLayout(activeSlide.value, activeIndex.value) }]
        : draft.slides.map((slide, index) => ({ index, ...inferLayout(slide, index) }));
    applyLayoutSuggestions(suggestions);
    statusMessage.value = 'AI bridge not running. Used local auto-detect fallback.';
  } finally {
    arranging.value = false;
  }
}

const aiTopic = ref('');
const aiOutputType = ref<'carousel' | 'reels' | 'ppt'>('carousel');
const generating = ref(false);

async function generateContent() {
  const topic = aiTopic.value.trim();
  if (!topic) {
    statusMessage.value = 'Tulis topik atau brief dulu untuk generate konten.';
    return;
  }

  const sourceSlideCount = aiOutputType.value === 'ppt' ? structuredPptSlideCount(topic) : undefined;

  generating.value = true;
  statusMessage.value =
    aiOutputType.value === 'ppt'
      ? sourceSlideCount
        ? `AI is adapting ${sourceSlideCount} source slides…`
        : 'AI is writing your PPT deck…'
      : aiOutputType.value === 'reels'
        ? 'AI is writing Reels thumbnails…'
        : 'AI is writing your carousel…';

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 130_000);
  try {
    const response = await fetch(`${AI_BRIDGE_URL}/ai-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        topic,
        brand: brandForPrompt(draft.brand),
        outputType: aiOutputType.value,
        sourceSlideCount,
      }),
    });
    if (!response.ok) {
      throw new Error(`AI bridge returned ${response.status}`);
    }
    const result = (await response.json()) as {
      title?: string;
      subtitle?: string;
      slides: Array<
        {
          index: number;
          eyebrow: string;
          title: string;
          body: string;
          tag: string;
          cta: string;
          visualCards?: SlideCard[];
          visualCue?: SlideVisualCue;
          pptLayout?: PptLayout;
          aiLayout?: PptAiLayout;
        } & ReturnType<typeof inferLayout>
      >;
    };

    if (result.title) draft.title = result.title;
    if (result.subtitle) draft.subtitle = result.subtitle;
    const sortedSlides = [...result.slides].sort((a, b) => a.index - b.index);
    draft.slides = sortedSlides
      .map((slide, generatedIndex) => {
        const forcedTemplate = forcedTemplateForOutput(generatedIndex, sortedSlides.length);
        return {
        id: crypto.randomUUID(),
        template: forcedTemplate || slide.template,
        eyebrow: slide.eyebrow,
        title: slide.title,
        body: slide.body,
        tag: slide.tag,
        icon: slide.icon,
        cta: slide.cta,
        backgroundPosition: slide.backgroundPosition,
        decorations: forcedTemplate ? [] : slide.decorations,
        visualCards: normalizeVisualCards(slide.visualCards),
        visualCue: normalizeVisualCue(slide.visualCue),
        pptLayout: normalizePptLayout(slide.pptLayout),
        aiLayout: normalizeAiLayout(slide.aiLayout),
        };
      });
    activeIndex.value = 0;
    statusMessage.value = `AI generated ${draft.slides.length} slides.`;
  } catch (error) {
    statusMessage.value =
      error instanceof Error && error.name === 'AbortError'
        ? 'AI bridge timed out. Make sure `bun run ai:bridge` is running.'
        : 'Could not reach AI bridge. Run `bun run ai:bridge` first.';
  } finally {
    window.clearTimeout(timeout);
    generating.value = false;
  }
}

function setSlideRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) {
    slideRefs.value[index] = el;
  }
}

function normalizeHandle() {
  draft.brand.handle = draft.brand.handle.replace(/^@/, '').trim();
}

function hideBrokenImage(event: Event) {
  if (event.target instanceof HTMLImageElement) {
    event.target.style.display = 'none';
  }
}

function addSlide() {
  showAddSlideMenu.value = false;
  draft.slides.splice(activeIndex.value + 1, 0, {
    id: crypto.randomUUID(),
    template: 'content',
    eyebrow: 'New slide',
    title: 'Judul slide baru',
    body: 'Tulis pesan utama di sini.',
    tag: 'Save for later',
    icon: 'bookmark',
    backgroundPosition: 'center center',
    decorations: [],
    visualCards: [],
    visualCue: undefined,
    pptLayout: undefined,
    aiLayout: undefined,
    cta: 'CTA singkat',
  });
  activeIndex.value += 1;
}

function openImageSlidePicker() {
  showAddSlideMenu.value = false;
  addImageSlideInput.value?.click();
}

async function addImageSlide(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (isHeicFile(file)) statusMessage.value = 'Converting HEIC photo…';
  try {
    const mediaUrl = await uploadAsset(file, 'carousel-media');
    const template: SlideTemplate = 'ppt-image';
    draft.slides.splice(activeIndex.value + 1, 0, {
      id: crypto.randomUUID(),
      template,
      eyebrow: '',
      title: file.name.replace(/\.[^.]+$/, '') || 'Image slide',
      body: '',
      tag: '',
      icon: 'bookmark',
      mediaUrl,
      backgroundPosition: 'center center',
      decorations: [],
      visualCards: [],
      visualCue: undefined,
      pptLayout: undefined,
      aiLayout: undefined,
      cta: '',
    });
    activeIndex.value += 1;
    statusMessage.value = 'Image slide added.';
  } catch {
    statusMessage.value = 'Could not read that image. Try a JPG or PNG.';
  } finally {
    input.value = '';
  }
}

function duplicateSlide() {
  const source = activeSlide.value;
  draft.slides.splice(activeIndex.value + 1, 0, {
    ...source,
    id: crypto.randomUUID(),
  });
  activeIndex.value += 1;
}

function removeSlide() {
  if (draft.slides.length === 1) return;
  draft.slides.splice(activeIndex.value, 1);
  activeIndex.value = Math.max(0, activeIndex.value - 1);
}

function previousSlide() {
  activeIndex.value =
    activeIndex.value === 0 ? draft.slides.length - 1 : activeIndex.value - 1;
}

function nextSlide() {
  activeIndex.value = (activeIndex.value + 1) % draft.slides.length;
}

// HEIC/HEIF (iPhone photos) can't be rendered by most browsers — convert to JPEG.
async function ensureRenderableImage(file: File): Promise<File> {
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;

  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg') || 'image.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

async function uploadAsset(rawFile: File, folder: string) {
  const file = await ensureRenderableImage(rawFile);
  const localDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  if (!isSupabaseConfigured || !supabase) {
    statusMessage.value = 'Asset loaded locally. Configure Supabase env vars to upload it.';
    return localDataUrl;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    statusMessage.value = error.message;
    return '';
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
  statusMessage.value = 'Asset uploaded. Using local copy for clean PNG export.';
  return localDataUrl || data.publicUrl;
}

async function compressImageForMarkdown(rawFile: File) {
  const file = await ensureRenderableImage(rawFile);
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = sourceUrl;
    });

    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function isHeicFile(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (isHeicFile(file)) statusMessage.value = 'Converting HEIC photo…';
  try {
    draft.brand.logoUrl = await uploadAsset(file, 'logos');
  } catch {
    statusMessage.value = 'Could not read that image. Try a JPG or PNG.';
  } finally {
    input.value = '';
  }
}

async function uploadSlideMedia(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (isHeicFile(file)) statusMessage.value = 'Converting HEIC photo…';
  try {
    activeSlide.value.mediaUrl = await uploadAsset(file, 'carousel-media');
  } catch {
    statusMessage.value = 'Could not read that image. Try a JPG or PNG.';
  } finally {
    input.value = '';
  }
}

async function insertMarkdownImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const imageUrl = await compressImageForMarkdown(file);
  const imageMarkdown = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${imageUrl})`;
  const nextBody = `${bodyDraft.value.trim()}${imageMarkdown}`;
  bodyDraft.value = nextBody;
  activeSlide.value.body = nextBody;
  statusMessage.value = 'Markdown image compressed and inserted.';
  input.value = '';
}

async function saveDraft() {
  normalizeHandle();
  saveCurrentProject(true);
  if (!isSupabaseConfigured || !supabase) {
    statusMessage.value = 'Project saved locally. Add Supabase env vars to save online.';
    return;
  }

  saving.value = true;
  statusMessage.value = '';

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        handle: draft.brand.handle,
        profile_pic_url: draft.brand.logoUrl || null,
      },
      { onConflict: 'handle' },
    )
    .select('id')
    .single();

  if (profileError) {
    statusMessage.value = profileError.message;
    saving.value = false;
    return;
  }

  const payload = {
    id: draft.id,
    title: draft.title,
    subtitle: draft.subtitle,
    brand_json: draft.brand as BrandSettings,
    slides_json: draft.slides,
    user_profile_id: profile.id,
  };

  const { data, error } = await supabase
    .from('carousel_drafts')
    .upsert(payload)
    .select('id')
    .single();

  saving.value = false;

  if (error) {
    statusMessage.value = error.message;
    return;
  }

  draft.id = data.id;
  activeProjectId.value = data.id;
  saveCurrentProject(true);
  statusMessage.value = 'Draft saved to Supabase.';
}

// Render one slide to an image data URL without triggering a download.
async function renderSlideImage(index: number, format: 'png' | 'jpeg' = 'png'): Promise<string> {
  activeIndex.value = index;
  await nextTick();
  const node = slideRefs.value[index];
  if (!node) return '';
  const { width, height } = slideExportSize(draft.slides[index]);

  const exportHost = document.createElement('div');
  const exportNode = node.cloneNode(true) as HTMLElement;

  exportHost.style.position = 'fixed';
  exportHost.style.left = '-10000px';
  exportHost.style.top = '0';
  exportHost.style.width = `${width}px`;
  exportHost.style.height = `${height}px`;
  exportHost.style.overflow = 'hidden';
  exportHost.style.pointerEvents = 'none';

  exportNode.style.width = `${width}px`;
  exportNode.style.height = `${height}px`;
  exportNode.style.aspectRatio = 'auto';
  exportNode.style.display = 'flex';

  exportHost.appendChild(exportNode);
  document.body.appendChild(exportHost);

  await new Promise((resolve) => requestAnimationFrame(resolve));

  let dataUrl = '';
  try {
    const options = {
      cacheBust: true,
      width,
      height,
      pixelRatio: 1,
      backgroundColor: '#071d52',
    };
    dataUrl =
      format === 'jpeg'
        ? await toJpeg(exportNode, { ...options, quality: 0.92 })
        : await toPng(exportNode, options);
  } finally {
    exportHost.remove();
  }

  return dataUrl;
}

async function renderSlidePng(index: number): Promise<string> {
  return renderSlideImage(index, 'png');
}

function exportBaseName() {
  return draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carousel';
}

function slideFileName(index: number) {
  return `${exportBaseName()}-${String(index + 1).padStart(2, '0')}.png`;
}

function slideExportSize(slide: CarouselSlide) {
  if (slide.template === 'reels') return { width: 1080, height: 1920 };
  if (isPptTemplate(slide.template)) return { width: 1920, height: 1080 };
  return { width: 1080, height: 1350 };
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = href;
  link.click();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

function buildPdfFromJpegs(
  pages: Array<{ bytes: Uint8Array; width: number; height: number }>,
) {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;
  let objectId = 1;
  const catalogId = objectId++;
  const pagesId = objectId++;
  const pageObjects: Array<{ pageId: number; contentId: number; imageId: number }> = [];

  for (let index = 0; index < pages.length; index += 1) {
    pageObjects.push({ pageId: objectId++, contentId: objectId++, imageId: objectId++ });
  }

  const push = (chunk: Uint8Array) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };
  const addObject = (id: number, bodyParts: Uint8Array[]) => {
    offsets[id] = byteLength;
    push(asciiBytes(`${id} 0 obj\n`));
    for (const part of bodyParts) push(part);
    push(asciiBytes('\nendobj\n'));
  };

  push(asciiBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

  addObject(catalogId, [asciiBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)]);
  addObject(pagesId, [
    asciiBytes(
      `<< /Type /Pages /Kids [${pageObjects.map((page) => `${page.pageId} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    ),
  ]);

  pages.forEach((page, index) => {
    const refs = pageObjects[index];
    const imageName = `Im${index + 1}`;
    const content = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/${imageName} Do\nQ`;

    addObject(refs.pageId, [
      asciiBytes(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /${imageName} ${refs.imageId} 0 R >> >> /Contents ${refs.contentId} 0 R >>`,
      ),
    ]);
    addObject(refs.contentId, [
      asciiBytes(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`),
    ]);
    addObject(refs.imageId, [
      asciiBytes(
        `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`,
      ),
      page.bytes,
      asciiBytes('\nendstream'),
    ]);
  });

  const xrefOffset = byteLength;
  push(asciiBytes(`xref\n0 ${objectId}\n0000000000 65535 f \n`));
  for (let id = 1; id < objectId; id += 1) {
    push(asciiBytes(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`));
  }
  push(
    asciiBytes(
      `trailer\n<< /Size ${objectId} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    ),
  );

  return concatBytes(chunks);
}

async function exportCurrent() {
  exporting.value = true;
  try {
    const dataUrl = await renderSlidePng(activeIndex.value);
    if (dataUrl) triggerDownload(dataUrl, slideFileName(activeIndex.value));
  } catch (error) {
    statusMessage.value =
      error instanceof Error ? `PNG export failed: ${error.message}` : 'PNG export failed.';
  }
  exporting.value = false;
}

async function exportAll() {
  exporting.value = true;
  statusMessage.value = '';
  try {
    const files: Record<string, Uint8Array> = {};
    for (let index = 0; index < draft.slides.length; index += 1) {
      const dataUrl = await renderSlidePng(index);
      if (dataUrl) files[slideFileName(index)] = dataUrlToBytes(dataUrl);
    }

    const zipped = zipSync(files, { level: 6 });
    // Copy into a fresh ArrayBuffer-backed view so Blob accepts the BlobPart.
    const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    try {
      triggerDownload(url, `${exportBaseName()}.zip`);
    } finally {
      URL.revokeObjectURL(url);
    }
    statusMessage.value = `Exported ${Object.keys(files).length} slides to ${exportBaseName()}.zip`;
  } catch (error) {
    statusMessage.value =
      error instanceof Error ? `ZIP export failed: ${error.message}` : 'ZIP export failed.';
  }
  exporting.value = false;
}

async function exportPdf() {
  exporting.value = true;
  statusMessage.value = '';
  try {
    const pages: Array<{ bytes: Uint8Array; width: number; height: number }> = [];
    for (let index = 0; index < draft.slides.length; index += 1) {
      const dataUrl = await renderSlideImage(index, 'jpeg');
      if (!dataUrl) continue;
      const { width, height } = slideExportSize(draft.slides[index]);
      pages.push({ bytes: dataUrlToBytes(dataUrl), width, height });
    }

    if (!pages.length) throw new Error('No slides rendered');
    const pdfBytes = buildPdfFromJpegs(pages);
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    try {
      triggerDownload(url, `${exportBaseName()}.pdf`);
    } finally {
      URL.revokeObjectURL(url);
    }
    statusMessage.value = `Exported ${pages.length} slides to ${exportBaseName()}.pdf`;
  } catch (error) {
    statusMessage.value =
      error instanceof Error ? `PDF export failed: ${error.message}` : 'PDF export failed.';
  }
  exporting.value = false;
}

const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
if (savedProjects) {
  try {
    const parsed = JSON.parse(savedProjects) as StoredProject[];
    projects.value = parsed.map((project) => ({
      ...project,
      id: project.id || crypto.randomUUID(),
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
      brand: { ...defaultBrand, ...project.brand },
      slides: project.slides?.length
        ? project.slides.map((slide, index) => normalizeSlide(slide, index))
        : cloneSlides(starterSlides, false),
    }));
  } catch {
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
  }
}

const legacyDraft = localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
if (!projects.value.length && legacyDraft) {
  try {
    const parsed = JSON.parse(legacyDraft) as CarouselDraft;
    const importedProject = projectSnapshot({
      ...parsed,
      id: parsed.id || crypto.randomUUID(),
      brand: { ...defaultBrand, ...parsed.brand },
      slides: parsed.slides?.length
        ? parsed.slides.map((slide, index) => normalizeSlide(slide, index))
        : cloneSlides(starterSlides, false),
    });
    upsertProject(importedProject);
  } catch {
    localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
  }
}

if (projects.value.length) assignDraft(sortedProjects.value[0]);
else upsertProject(projectSnapshot());
</script>

<template>
  <main class="canva-shell" :class="{ 'project-mode': currentView === 'projects' }">
    <template v-if="currentView === 'projects'">
      <section class="projects-shell">
        <header class="projects-header">
          <div class="brand-mark">
            <span>IG</span>
            <div>
              <strong>Carousel Studio</strong>
              <small>{{ projects.length }} project{{ projects.length === 1 ? '' : 's' }}</small>
            </div>
          </div>

          <button type="button" class="primary-button" @click="createProject">
            <Plus :size="17" />
            New Project
          </button>
        </header>

        <div class="projects-hero">
          <div>
            <p>Projects</p>
            <h1>Create, edit, and export carousel assets.</h1>
          </div>
          <button type="button" class="primary-button" @click="createProject">
            <Plus :size="17" />
            Create new project
          </button>
        </div>

        <div class="project-grid">
          <article
            v-for="project in sortedProjects"
            :key="project.id"
            class="project-card"
          >
            <button type="button" class="project-preview" @click="openProject(project)">
              <span>{{ project.slides[0]?.template || 'cover' }}</span>
              <strong>{{ project.title }}</strong>
              <small>{{ project.slides.length }} slides</small>
            </button>
            <div class="project-meta">
              <div>
                <strong>{{ project.title }}</strong>
                <small>Updated {{ formatProjectDate(project.updatedAt) }}</small>
              </div>
              <div class="project-actions">
                <button type="button" title="Open project" @click="openProject(project)">
                  Open
                </button>
                <button type="button" title="Duplicate project" @click="duplicateProject(project)">
                  <Copy :size="15" />
                </button>
                <button type="button" title="Delete project" @click="deleteProject(project)">
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>

    <template v-else>
    <header class="topbar">
      <div class="brand-mark">
        <span>IG</span>
        <div>
          <strong>Carousel Studio</strong>
          <small>{{ isSupabaseConfigured ? 'Supabase connected' : 'Local mode' }}</small>
        </div>
      </div>

      <input v-model="draft.title" class="doc-title" type="text" aria-label="Document title" />

      <div class="top-actions">
        <button type="button" title="Back to projects" @click="goToProjects">
          <ChevronLeft :size="17" />
          Projects
        </button>
        <button type="button" title="Save draft" :disabled="saving" @click="saveDraft">
          <Save :size="17" />
          Save
        </button>
        <button type="button" :disabled="exporting" @click="exportPdf">
          <Download :size="17" />
          {{ exporting ? 'Exporting…' : 'Export PDF' }}
        </button>
        <button type="button" :disabled="exporting" @click="exportAll">
          <Download :size="17" />
          {{ exporting ? 'Exporting…' : 'Export ZIP' }}
        </button>
      </div>
    </header>

    <div class="studio-body">
      <aside class="pages-panel">
        <div class="panel-title">
          <span>Pages</span>
          <div class="add-slide-menu-wrap">
            <button
              type="button"
              title="Add slide"
              @click="showAddSlideMenu = !showAddSlideMenu"
            >
              <Plus :size="16" />
            </button>
            <div v-if="showAddSlideMenu" class="add-slide-menu">
              <button type="button" @click="addSlide">
                <Plus :size="15" />
                Template slide
              </button>
              <button type="button" @click="openImageSlidePicker">
                <ImagePlus :size="15" />
                Upload image slide
              </button>
            </div>
            <input
              ref="addImageSlideInput"
              class="visually-hidden-file"
              type="file"
              accept="image/*,.heic,.heif"
              @change="addImageSlide"
            />
          </div>
        </div>

        <div class="page-list">
          <button
            v-for="(slide, index) in draft.slides"
            :key="slide.id"
            type="button"
            :class="{ selected: activeIndex === index }"
            @click="activeIndex = index"
          >
            <span class="page-number">{{ index + 1 }}</span>
            <span class="page-thumb">
              <small>{{ slide.template || 'content' }}</small>
              <span>{{ slide.title.split('\n')[0] }}</span>
            </span>
          </button>
        </div>

        <div class="page-tools">
          <button type="button" title="Duplicate slide" @click="duplicateSlide">
            <Copy :size="16" />
          </button>
          <button
            type="button"
            title="Delete slide"
            :disabled="draft.slides.length === 1"
            @click="removeSlide"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </aside>

      <section class="workspace">
        <div class="workspace-toolbar">
          <div class="nav-group">
            <button type="button" title="Previous slide" @click="previousSlide">
              <ChevronLeft :size="17" />
            </button>
            <strong>Slide {{ activeIndex + 1 }} of {{ draft.slides.length }}</strong>
            <button type="button" title="Next slide" @click="nextSlide">
              <ChevronRight :size="17" />
            </button>
          </div>
          <button type="button" class="primary-button" :disabled="exporting" @click="exportCurrent">
            <Download :size="17" />
            Download PNG
          </button>
        </div>

        <div class="canvas-stage">
          <div
            class="phone-frame"
            :class="{ 'reels-frame': activeTemplate === 'reels', 'ppt-frame': isPptTemplate(activeTemplate) }"
          >
        <article
          v-for="(slide, index) in draft.slides"
          v-show="index === activeIndex"
          :key="slide.id"
          :ref="(el) => setSlideRef(el, index)"
          class="carousel-slide"
          :class="[
            activeTheme,
            `template-${slide.template || 'content'}`,
            {
              textured: draft.brand.showNoise,
              'has-media': Boolean(slide.mediaUrl),
              'ppt-is-cover': isPptTemplate(slide.template) && isPptCoverAt(slide.template, index),
              'ppt-is-content':
                isPptTemplate(slide.template) &&
                slide.template !== 'ppt-image' &&
                !isPptCoverAt(slide.template, index) &&
                !isPptClosingAt(slide.template, index, draft.slides.length),
              'ppt-is-closing':
                isPptTemplate(slide.template) &&
                isPptClosingAt(slide.template, index, draft.slides.length),
            },
          ]"
          :style="{ '--accent': draft.brand.accent }"
        >
          <div
            v-if="slide.mediaUrl"
            class="media-layer"
            :style="{
              backgroundImage: `url(${slide.mediaUrl})`,
              backgroundPosition: slide.backgroundPosition || 'center center',
            }"
          />
          <div v-else class="code-layer" />
          <div class="blue-overlay" />

          <header class="slide-top">
            <div class="brand-lockup" :data-handle="draft.brand.handle">
              <img
                v-if="draft.brand.logoUrl"
                :src="draft.brand.logoUrl"
                alt=""
                @error="hideBrokenImage"
              />
              <Braces v-else class="logo-placeholder" />
            </div>
            <span
              v-if="!['cover', 'closing'].includes(slide.template || 'content')"
              class="slide-indicator"
            >
              {{ String(index + 1).padStart(2, '0') }} / {{ String(draft.slides.length).padStart(2, '0') }}
            </span>
          </header>

          <template v-if="(slide.template || 'content') === 'cover'">
            <component
              :is="getDecorationIcon(decoration.icon)"
              v-for="(decoration, decorationIndex) in getDecorations(slide, true)"
              :key="`cover-decoration-${decorationIndex}`"
              class="decorative-icon"
              :style="{
                left: decoration.left,
                top: decoration.top,
                width: decoration.size,
                height: decoration.size,
                transform: `rotate(${decoration.rotate})`,
                opacity: decoration.opacity,
              }"
              fill="currentColor"
            />

            <section class="cover-copy">
              <h2>{{ slide.title }}</h2>
              <div class="body markdown-body" v-html="renderMarkdown(slide.body)" />
              <div v-if="slide.cta" class="cta-pill">
                {{ slide.cta }}
              </div>
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'content'">
            <section class="content-copy">
              <h2>{{ slide.title }}</h2>
              <div class="body markdown-body" v-html="renderMarkdown(slide.body)" />
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'quote'">
            <section class="quote-copy">
              <span class="quote-mark">“</span>
              <p class="slide-eyebrow">{{ slide.eyebrow }}</p>
              <h2>{{ slide.title }}</h2>
              <div class="body markdown-body" v-html="renderMarkdown(slide.body)" />
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'stat'">
            <section class="stat-copy">
              <p class="slide-eyebrow">{{ slide.eyebrow }}</p>
              <h2>{{ slide.title }}</h2>
              <div class="body markdown-body" v-html="renderMarkdown(slide.body)" />
              <div v-if="slide.cta" class="stat-caption">
                {{ slide.cta }}
              </div>
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'list'">
            <section class="list-copy">
              <p class="slide-eyebrow">{{ slide.eyebrow }}</p>
              <h2>{{ slide.title }}</h2>
              <ol class="template-list-items">
                <li v-for="(item, itemIndex) in listItems(slide.body)" :key="itemIndex">
                  <span>{{ String(itemIndex + 1).padStart(2, '0') }}</span>
                  <p>{{ item }}</p>
                </li>
              </ol>
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'steps'">
            <section class="steps-copy">
              <p class="slide-eyebrow">{{ slide.eyebrow }}</p>
              <h2>{{ slide.title }}</h2>
              <div class="step-list">
                <div v-for="(item, itemIndex) in stepItems(slide.body)" :key="itemIndex">
                  <span>{{ itemIndex + 1 }}</span>
                  <p>{{ item }}</p>
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'reels'">
            <section class="reels-copy">
              <p v-if="draft.brand.handle" class="reels-handle">@{{ draft.brand.handle }}</p>
              <div class="reels-poster-text" aria-label="Reels thumbnail text">
                <p
                  v-for="(line, lineIndex) in reelsPosterLines(slide)"
                  :key="lineIndex"
                  class="reels-line"
                >
                  <span
                    v-for="(segment, segmentIndex) in line"
                    :key="segmentIndex"
                    :class="{ accent: segment.accent }"
                  >
                    {{ segment.text }}
                  </span>
                </p>
              </div>
              <div v-if="slide.cta" class="reels-footer">
                {{ slide.cta }}
              </div>
            </section>
          </template>

          <template v-else-if="(slide.template || 'content') === 'ppt-image'"></template>

          <template v-else-if="isPptTemplate(slide.template)">
            <section
              class="ppt-copy"
              :class="{
                'ppt-cover-copy': isPptCoverAt(slide.template, index),
                'ppt-content-copy':
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length),
                'ppt-closing-copy': isPptClosingAt(slide.template, index, draft.slides.length),
                'ppt-ai-copy': Boolean(aiLayoutForSlide(slide)),
                [`ppt-layout-${getPptLayout(slide)}`]:
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length),
              }"
            >
              <div v-if="aiLayoutForSlide(slide)" class="ppt-ai-layout">
                <article
                  v-for="(block, blockIndex) in aiLayoutForSlide(slide)?.blocks"
                  :key="`${slide.id}-ai-block-${blockIndex}`"
                  class="ppt-ai-block"
                  :class="[
                    `type-${block.type}`,
                    `tone-${block.tone || 'blue'}`,
                    `size-${block.size || 'md'}`,
                    `align-${block.align || 'left'}`,
                  ]"
                  :style="aiBlockStyle(block)"
                >
                  <span v-if="block.type === 'badge'" class="ai-badge-text">
                    {{ aiBlockText(block) }}
                  </span>

                  <template v-else-if="block.type === 'headline'">
                    <h3>{{ aiBlockText(block) }}</h3>
                  </template>

                  <template v-else-if="block.type === 'body'">
                    <p>{{ aiBlockText(block) }}</p>
                  </template>

                  <template v-else-if="block.type === 'quote'">
                    <span class="ai-quote-mark">“</span>
                    <h3>{{ block.title || block.text }}</h3>
                    <p v-if="block.body">{{ block.body }}</p>
                  </template>

                  <template v-else-if="block.type === 'list'">
                    <p v-if="block.label" class="ai-block-label">{{ block.label }}</p>
                    <ul>
                      <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
                        <span>{{ String(itemIndex + 1).padStart(2, '0') }}</span>
                        <p>{{ item }}</p>
                      </li>
                    </ul>
                  </template>

                  <template v-else-if="block.type === 'card' || block.type === 'visual' || block.type === 'callout'">
                    <div class="ai-block-icon">
                      <component :is="getSlideIcon(block.icon)" />
                    </div>
                    <p v-if="block.label" class="ai-block-label">{{ block.label }}</p>
                    <h3>{{ block.title || block.text }}</h3>
                    <p v-if="block.body">{{ block.body }}</p>
                  </template>

                  <template v-else-if="block.type === 'metric'">
                    <p v-if="block.label" class="ai-block-label">{{ block.label }}</p>
                    <strong>{{ block.title || block.text }}</strong>
                    <p v-if="block.body">{{ block.body }}</p>
                  </template>
                </article>
              </div>
              <template v-else>
              <div class="ppt-kicker">
                {{ slide.eyebrow || `Slide ${String(index + 1).padStart(2, '0')}` }}
              </div>
              <h2 :class="isPptCoverAt(slide.template, index) || isPptClosingAt(slide.template, index, draft.slides.length) ? 'ppt-main-title' : 'ppt-title-pill'">
                {{ slide.title }}
              </h2>
              <p v-if="(isPptCoverAt(slide.template, index) || isPptClosingAt(slide.template, index, draft.slides.length)) && slide.body" class="ppt-lead">
                {{ slide.body }}
              </p>
              <div
                v-else-if="
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length) &&
                  pptBodyIsCardCandidate(slide)
                "
                class="ppt-card-grid"
                :class="`count-${normalizeVisualCards(slide.visualCards).length}`"
              >
                <article
                  v-for="(card, cardIndex) in normalizeVisualCards(slide.visualCards)"
                  :key="`${slide.id}-card-${cardIndex}`"
                  class="ppt-info-card"
                  :class="`tone-${card.tone || 'neutral'}`"
                >
                  <div class="ppt-card-icon">
                    <component :is="getSlideIcon(card.icon)" />
                  </div>
                  <div class="ppt-card-copy">
                    <p class="ppt-card-label">{{ card.label }}</p>
                    <h3>{{ card.title }}</h3>
                    <p>{{ card.body }}</p>
                  </div>
                </article>
              </div>
              <div
                v-else-if="
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length) &&
                  getPptLayout(slide) === 'quote'
                "
                class="ppt-quote-layout"
              >
                <span class="ppt-quote-mark">“</span>
                <p v-if="cleanPptBody(slide.body)" class="ppt-quote-body">
                  {{ cleanPptBody(slide.body) }}
                </p>
              </div>
              <div
                v-else-if="
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length) &&
                  getPptLayout(slide) === 'points'
                "
                class="ppt-points-layout"
              >
                <div class="ppt-point-list">
                  <div v-for="(item, itemIndex) in listItems(cleanPptBody(slide.body)).slice(0, 5)" :key="itemIndex" class="ppt-point">
                    <span>{{ String(itemIndex + 1).padStart(2, '0') }}</span>
                    <p>{{ item }}</p>
                  </div>
                </div>
                <aside class="ppt-visual-panel" :class="`tone-${pptVisualCue(slide).tone || 'blue'}`">
                  <component :is="getSlideIcon(pptVisualCue(slide).icon)" />
                  <strong>{{ pptVisualCue(slide).title }}</strong>
                  <p>{{ pptVisualCue(slide).body }}</p>
                </aside>
              </div>
              <div
                v-else-if="
                  !isPptCoverAt(slide.template, index) &&
                  !isPptClosingAt(slide.template, index, draft.slides.length)
                "
                class="ppt-split-layout"
              >
                <div
                  v-if="cleanPptBody(slide.body)"
                  class="body markdown-body ppt-md-body"
                  :class="{ dense: isDensePptBody(cleanPptBody(slide.body)) }"
                  v-html="renderMarkdown(cleanPptBody(slide.body))"
                />
                <div v-else class="ppt-empty-copy" />
                <aside class="ppt-visual-panel" :class="`tone-${pptVisualCue(slide).tone || 'blue'}`">
                  <component :is="getSlideIcon(pptVisualCue(slide).icon)" />
                  <strong>{{ pptVisualCue(slide).title }}</strong>
                  <p>{{ pptVisualCue(slide).body }}</p>
                </aside>
              </div>
              <div v-if="slide.cta" class="ppt-callout" :class="{ 'ppt-closing-bar': isPptClosingAt(slide.template, index, draft.slides.length) }">
                {{ slide.cta }}
              </div>
              </template>
            </section>
            <div class="ppt-watermark">{{ String(index + 1).padStart(2, '0') }}</div>
          </template>

          <template v-else>
            <component
              :is="getDecorationIcon(decoration.icon)"
              v-for="(decoration, decorationIndex) in getDecorations(slide, false)"
              :key="`slide-decoration-${decorationIndex}`"
              class="decorative-icon"
              :style="{
                left: decoration.left,
                top: decoration.top,
                width: decoration.size,
                height: decoration.size,
                transform: `rotate(${decoration.rotate})`,
                opacity: decoration.opacity,
              }"
              fill="currentColor"
            />

            <section class="slide-copy">
              <p class="slide-eyebrow">{{ slide.eyebrow }}</p>
              <h2>{{ slide.title }}</h2>
              <div class="body markdown-body" v-html="renderMarkdown(slide.body)" />

              <div v-if="slide.cta" class="cta-pill">
                {{ slide.cta }}
              </div>
            </section>

            <footer class="slide-footer">
              <div class="social-row" v-if="draft.brand.theme === 'promo'">
                <span>Like</span>
                <span>Comment</span>
                <span>Follow</span>
              </div>
              <div class="site-row">
                <Globe2 :size="22" />
                {{ draft.brand.website }}
              </div>
            </footer>
          </template>

          <div class="dots" aria-hidden="true">
            <span
              v-for="(_, dotIndex) in draft.slides"
              :key="dotIndex"
              :class="{ active: dotIndex === activeIndex }"
            />
          </div>
        </article>
          </div>
        </div>
      </section>

      <aside class="inspector-panel">
        <div class="inspector-section">
          <div class="section-heading">
            <strong>Brand</strong>
          </div>
          <label>
            <span>Name</span>
            <input v-model="draft.subtitle" type="text" />
          </label>
          <label>
            <span>Handle</span>
            <input v-model="draft.brand.handle" type="text" @blur="normalizeHandle" />
          </label>
          <label>
            <span>Website</span>
            <input v-model="draft.brand.website" type="text" />
          </label>
          <label>
            <span>Accent</span>
            <input v-model="draft.brand.accent" type="color" />
          </label>
        </div>

        <div class="inspector-section">
          <div class="section-heading">
            <strong>Style</strong>
          </div>
          <div class="theme-list">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              :class="{ selected: draft.brand.theme === theme.id }"
              @click="draft.brand.theme = theme.id"
            >
              {{ theme.label }}
            </button>
          </div>
          <div class="asset-actions">
            <label class="upload-button">
              <Upload :size="16" />
              Logo
              <input type="file" accept="image/*,.heic,.heif" @change="uploadLogo" />
            </label>
            <label class="upload-button">
              <ImagePlus :size="16" />
              Background
              <input type="file" accept="image/*,.heic,.heif" @change="uploadSlideMedia" />
            </label>
          </div>
        </div>

        <div class="inspector-section">
          <div class="section-heading">
            <strong>Current slide</strong>
          </div>
          <div class="ai-generate">
            <div class="generation-mode">
              <button
                type="button"
                :class="{ selected: aiOutputType === 'carousel' }"
                @click="aiOutputType = 'carousel'"
              >
                Carousel
              </button>
              <button
                type="button"
                :class="{ selected: aiOutputType === 'reels' }"
                @click="aiOutputType = 'reels'"
              >
                Reels
              </button>
              <button
                type="button"
                :class="{ selected: aiOutputType === 'ppt' }"
                @click="aiOutputType = 'ppt'"
              >
                PPT
              </button>
            </div>
            <textarea
              v-model="aiTopic"
              rows="2"
              placeholder="Topik / brief konten, mis. '5 tools AI buat developer'"
              :disabled="generating"
            ></textarea>
            <button
              type="button"
              class="primary-button"
              :disabled="generating"
              @click="generateContent"
            >
              <Bot :size="17" />
              {{ generating ? 'Generating…' : 'Generate konten (AI)' }}
            </button>
          </div>
          <div class="ai-actions">
            <button type="button" class="primary-button" :disabled="arranging" @click="autoArrange('current')">
              <Bot :size="17" />
              AI auto slide
            </button>
            <button type="button" :disabled="arranging" @click="autoArrange('all')">
              <Bot :size="17" />
              Auto all
            </button>
          </div>
          <label>
            <span>Template</span>
            <div class="segmented-control">
              <button
                v-for="template in templateOptions"
                :key="template.id"
                type="button"
                :class="{ selected: activeTemplate === template.id }"
                @click="activeSlide.template = template.id"
              >
                {{ template.label }}
              </button>
            </div>
          </label>
          <div v-if="supportsDecorations(activeSlide.template)" class="decoration-editor">
            <div class="section-heading compact-heading">
              <strong>Decor icons</strong>
              <div class="mini-actions">
                <button type="button" title="Add decoration" @click="addDecoration">
                  <Plus :size="15" />
                </button>
                <button
                  type="button"
                  title="Remove decoration"
                  :disabled="!editableDecorations.length"
                  @click="removeDecoration"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
            <label>
              <span>Selected</span>
              <select v-model.number="activeDecorationIndex">
                <option
                  v-for="(decoration, decorationIndex) in editableDecorations"
                  :key="decorationIndex"
                  :value="decorationIndex"
                >
                  {{ decorationIndex + 1 }} - {{ decoration.icon }}
                </option>
              </select>
            </label>
            <template v-if="activeDecoration">
              <label>
                <span>Decoration icon</span>
                <select v-model="activeDecoration.icon">
                  <option
                    v-for="option in decorationSelectOptions"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <div class="quad-grid">
                <label>
                  <span>Left</span>
                  <input v-model="activeDecoration.left" type="text" />
                </label>
                <label>
                  <span>Top</span>
                  <input v-model="activeDecoration.top" type="text" />
                </label>
                <label>
                  <span>Size</span>
                  <input v-model="activeDecoration.size" type="text" />
                </label>
                <label>
                  <span>Rotate</span>
                  <input v-model="activeDecoration.rotate" type="text" />
                </label>
              </div>
              <label>
                <span>Opacity</span>
                <input
                  v-model.number="activeDecoration.opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                />
              </label>
            </template>
          </div>
          <label>
            <span>Background position</span>
            <select v-model="activeSlide.backgroundPosition">
              <option
                v-for="position in backgroundPositionOptions"
                :key="position"
                :value="position"
              >
                {{ position }}
              </option>
            </select>
          </label>
          <label>
            <span>Small text</span>
            <input v-model="activeSlide.eyebrow" type="text" />
          </label>
          <label>
            <span>Main title</span>
            <textarea v-model="activeSlide.title" rows="4" />
          </label>
          <label>
            <span>Description</span>
            <textarea
              :value="bodyDraft"
              rows="4"
              @input="handleBodyInput"
            />
          </label>
          <div class="markdown-tools">
            <label class="upload-button">
              <ImagePlus :size="16" />
              Markdown image
              <input type="file" accept="image/*,.heic,.heif" @change="insertMarkdownImage" />
            </label>
            <small>Supports markdown: **bold**, `code`, lists, links, and ![image](url).</small>
          </div>
          <label>
            <span>Save text</span>
            <input v-model="activeSlide.tag" type="text" />
          </label>
          <label>
            <span>CTA / link</span>
            <input v-model="activeSlide.cta" type="text" />
          </label>
        </div>

        <p v-if="statusMessage" class="status">{{ statusMessage }}</p>
      </aside>
      </div>
    </template>
  </main>
</template>
