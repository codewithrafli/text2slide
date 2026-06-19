'use client';

import Footer from '@/components/Footer';
import SlidePreview from '@/components/SlidePreview';
import type { Caption, Slide } from '@/lib/ai/schema';
import {
  CarouselStyle,
  downloadPDF,
  generateLinkedInPDF,
} from '@/lib/pdf/generator';
import { saveLink } from '@/lib/saved-links';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ResultData {
  id: string;
  sourceUrl: string;
  slides: Slide[];
  captions: Caption[];
  hashtags: string[];
  createdAt: string;
  personalization: Personalization;
}

interface Personalization {
  style: CarouselStyle;
  handle: string;
  profilePic: string | null;
  showSource: boolean;
  includeEmojis?: boolean;
}

interface HistoryItem {
  slides: Slide[];
  personalization: Personalization;
}

const STYLES = [
  {
    id: 'minimalist' as const,
    label: 'Minimal',
    colors: ['#2563eb', '#ffffff'],
  },
  { id: 'dark' as const, label: 'Dark', colors: ['#10b981', '#000000'] },
  {
    id: 'storyteller' as const,
    label: 'Vibrant',
    colors: ['#3b82f6', '#8b5cf6'],
  },
];

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [personalization, setPersonalization] = useState<Personalization>({
    style: 'minimalist',
    handle: '',
    profilePic: null,
    showSource: false,
    includeEmojis: true,
  });
  const [slides, setSlides] = useState<Slide[]>([]);
  const [originalSlides, setOriginalSlides] = useState<Slide[]>([]);
  const [originalPersonalization, setOriginalPersonalization] =
    useState<Personalization>({
      style: 'minimalist',
      handle: '',
      profilePic: null,
      showSource: false,
      includeEmojis: true,
    });
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'captions'>(
    'content'
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [platform, setPlatform] = useState<'mac' | 'win'>('win');

  // History Engine for Undo/Redo
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalUpdate = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setPlatform(isMac ? 'mac' : 'win');
    }
  }, []);

  // Handle outside clicks for emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/result/${id}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        const json = await res.json();

        if (!json.success) {
          setError(json.error?.message || 'Failed to load result');
          return;
        }

        setData(json.data);
        setSlides(json.data.slides || []);
        setOriginalSlides(json.data.slides || []);

        // PERSIST: Save to local history for later access
        if (json.data.slides?.[0]) {
          saveLink({
            id: id,
            sourceUrl: json.data.sourceUrl,
            title: json.data.slides[0].headline,
            createdAt: json.data.createdAt || new Date().toISOString(),
          });
        }

        if (json.data.personalization) {
          const perso: Personalization = {
            style: json.data.personalization.style || 'minimalist',
            handle: json.data.personalization.handle || '',
            profilePic: json.data.personalization.profilePic || null,
            showSource: json.data.personalization.showSource ?? false,
            includeEmojis: json.data.personalization.includeEmojis ?? true,
          };
          setPersonalization(perso);
          setOriginalPersonalization(perso);
          // Initial history snapshot
          setHistory([
            { slides: json.data.slides || [], personalization: perso },
          ]);
          setHistoryIndex(0);
        }
      } catch {
        setError('Failed to load result');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [id]);

  const saveChanges = useCallback(
    async (updatedSlides?: Slide[], updatedPerso?: Personalization) => {
      const finalSlides = updatedSlides || slides;
      const finalPerso = updatedPerso || personalization;

      if (
        !updatedSlides &&
        !updatedPerso &&
        JSON.stringify(finalSlides) === JSON.stringify(originalSlides) &&
        JSON.stringify(finalPerso) === JSON.stringify(originalPersonalization)
      ) {
        return;
      }

      setIsSaving(true);
      try {
        const res = await fetch(`/api/result/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: finalSlides,
            personalization: finalPerso,
          }),
        });

        const json = await res.json();
        if (json.success) {
          setOriginalSlides([...finalSlides]);
          setOriginalPersonalization({ ...finalPerso });
        }
      } catch (err) {
        console.error('Failed to save changes:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [id, slides, personalization, originalSlides, originalPersonalization]
  );

  const pushToHistory = useCallback(
    (newSlides: Slide[], newPerso: Personalization, debounce = false) => {
      if (isInternalUpdate.current) return;

      const performPush = () => {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          // Don't push if it's identical to the last state
          const last = sliced[sliced.length - 1];
          if (
            last &&
            JSON.stringify(last.slides) === JSON.stringify(newSlides) &&
            JSON.stringify(last.personalization) === JSON.stringify(newPerso)
          ) {
            return sliced;
          }
          const newState = [
            ...sliced,
            {
              slides: JSON.parse(JSON.stringify(newSlides)),
              personalization: { ...newPerso },
            },
          ];
          setHistoryIndex(newState.length - 1);
          return newState;
        });
      };

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (debounce) {
        debounceRef.current = setTimeout(performPush, 500);
      } else {
        performPush();
      }
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      isInternalUpdate.current = true;
      setSlides(JSON.parse(JSON.stringify(prevState.slides)));
      setPersonalization({ ...prevState.personalization });
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      isInternalUpdate.current = true;
      setSlides(JSON.parse(JSON.stringify(nextState.slides)));
      setPersonalization({ ...nextState.personalization });
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    }
  }, [historyIndex, history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveChanges();
      }

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        if (historyIndex > 0) {
          e.preventDefault();
          undo();
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && e.key === 'z') || e.key === 'y')
      ) {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveChanges, historyIndex, history.length, undo, redo]);

  const hasChanges =
    JSON.stringify(slides) !== JSON.stringify(originalSlides) ||
    JSON.stringify(personalization) !== JSON.stringify(originalPersonalization);

  // Debounced Auto-save
  useEffect(() => {
    if (!hasChanges || isSaving) return;

    const timer = setTimeout(() => {
      saveChanges();
    }, 3000); // 3-second debounce for auto-save

    return () => clearTimeout(timer);
  }, [hasChanges, isSaving, saveChanges]);

  // Exit Guard: Prevent leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges || isSaving) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isSaving]);

  const handleSlideChange = (
    index: number,
    field: keyof Slide,
    value: string
  ) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
    pushToHistory(newSlides, personalization, true); // Debounced push for typing
  };

  const updateStyle = (updates: Partial<Personalization>) => {
    const newPerso = { ...personalization, ...updates };
    setPersonalization(newPerso);
    pushToHistory(slides, newPerso, false); // Instant push for style changes
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateStyle({ profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const copyCaption = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllHashtags = useCallback(() => {
    if (!data?.hashtags) return;
    const text = data.hashtags
      .map((tag) => `#${tag.replace('#', '')}`)
      .join(' ');
    navigator.clipboard.writeText(text);
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  }, [data?.hashtags]);

  const handleDownloadPDF = useCallback(async () => {
    if (!data || slides.length === 0) return;

    setDownloading(true);
    try {
      // Create IDs for all slides in the hidden container
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `Link2Slide-${timestamp}-${id.substring(0, 8)}.pdf`;

      const slideIds = slides.map((_, i) => `pdf-slide-export-${i}`);
      const blob = await generateLinkedInPDF(slideIds, personalization.style);
      downloadPDF(blob, filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [data, id, personalization.style, slides]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505]">
        {/* Grainy Gradient Background for Loading */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-125 contrast-150" />
        </div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="relative z-10 mb-6 h-10 w-10 rounded-full border-t-2 border-emerald-500"
        />
        <p className="relative z-10 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
          Assembling your story...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 text-center">
        <div className="glass max-w-sm rounded-[32px] border border-white/5 p-8">
          <h1 className="mb-4 text-2xl font-bold text-white">404</h1>
          <p className="mb-8 text-sm leading-relaxed text-white/40">
            {error || 'Carousel not found in our records.'}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-sm font-bold text-black transition-transform hover:scale-105"
          >
            Back to Editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] pb-24 tracking-tight text-white selection:bg-emerald-500/30 sm:pb-0">
      {/* Grainy Gradient Background - Abstract pixelated vibes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] h-[50%] w-[50%] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        <div className="absolute right-[-5%] bottom-[-5%] h-[50%] w-[50%] rounded-full bg-purple-500/[0.05] blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-110 contrast-125" />
      </div>

      {/* Precision Top Bar - Enhanced Shine */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/95 py-3 shadow-[0_1px_20px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className={`group flex items-center gap-1.5 text-[9px] font-bold text-white/30 transition-colors hover:text-white sm:gap-2 sm:text-[10px] ${isSaving ? 'pointer-events-none opacity-20' : ''}`}
          >
            <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">BACK TO EDITOR</span>
            <span className="sm:hidden">BACK</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Native-style Status Indicator */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-bold transition-all sm:bg-white/5 sm:px-3 sm:py-1.5 sm:text-[10px] ${
                isSaving
                  ? 'text-emerald-400'
                  : hasChanges
                    ? 'text-orange-400'
                    : 'text-white/20'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 animate-spin sm:h-3 sm:w-3" />
                  <span>SAVING...</span>
                </>
              ) : hasChanges ? (
                <>
                  <div className="h-1 w-1 animate-pulse rounded-full bg-orange-400 sm:h-1.5 sm:w-1.5" />
                  <span>UNSAVED</span>
                </>
              ) : (
                <>
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>SAVED</span>
                </>
              )}
            </div>

            {/* Desktop-only Manual Save */}
            <button
              onClick={() => saveChanges()}
              disabled={!hasChanges || isSaving}
              className={`hidden items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black tracking-widest transition-all sm:flex ${
                hasChanges && !isSaving
                  ? 'border-emerald-500/20 bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:scale-105'
                  : 'border-white/5 bg-white/[0.03] text-white/40 opacity-50'
              }`}
            >
              <Save className="h-3 w-3" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px]">
                  {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </span>
                {!isSaving && hasChanges && (
                  <span className="mt-0.5 text-[8px] opacity-60">
                    {platform === 'mac' ? '⌘ + S' : 'CTRL + S'}
                  </span>
                )}
              </div>
            </button>

            {/* Desktop Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || isSaving}
              className="group relative hidden h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-[10px] font-black tracking-widest text-black uppercase shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 sm:flex sm:h-11 sm:gap-3 sm:rounded-2xl sm:px-8 sm:text-[12px]"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 sm:h-4 sm:w-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Visual Engine: Sticky Left */}
          <div className="lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
                    Visual Preview
                  </h2>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                  {personalization.style}
                </div>
              </div>

              {/* Interactive Visual Mockup */}
              <div className="group/mockup relative mx-auto w-full max-w-[440px]">
                <div className="absolute -inset-10 rounded-[60px] bg-emerald-500/[0.05] blur-[100px]" />

                {/* Navigation Overlay - Quick Slide */}
                <div
                  className="absolute inset-y-0 left-0 z-10 w-1/4 cursor-w-resize"
                  onClick={() =>
                    setCurrentSlide((prev) => Math.max(0, prev - 1))
                  }
                />
                <div
                  className="absolute inset-y-0 right-0 z-10 w-1/4 cursor-e-resize"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      Math.min(slides.length - 1, prev + 1)
                    )
                  }
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="shadow-4xl relative"
                  >
                    <SlidePreview
                      slide={slides[currentSlide]}
                      index={currentSlide}
                      total={slides.length}
                      theme={personalization.style}
                      personalization={personalization}
                      sourceUrl={data.sourceUrl}
                      className="rounded-[32px] border border-white/20 ring-1 ring-white/5 sm:rounded-[48px]"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Tactical Navigation Buttons */}
                <div className="absolute top-1/2 -left-4 z-20 -translate-y-1/2 md:-left-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) => Math.max(0, prev - 1));
                    }}
                    disabled={currentSlide === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0D0D0D] text-white shadow-xl backdrop-blur-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-0 sm:h-12 sm:w-12 sm:rounded-2xl"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
                <div className="absolute top-1/2 -right-4 z-20 -translate-y-1/2 md:-right-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) =>
                        Math.min(slides.length - 1, prev + 1)
                      );
                    }}
                    disabled={currentSlide === slides.length - 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0D0D0D] text-white shadow-xl backdrop-blur-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-0 sm:h-12 sm:w-12 sm:rounded-2xl"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>

                {/* Micro Pagination dots */}
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlide === i
                          ? 'w-6 bg-emerald-500'
                          : 'w-2 bg-white/10 hover:bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Engine: Large Right */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Tactical Tab Switcher */}
              <div className="flex items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.02] p-1.5">
                {[
                  { id: 'content', label: 'Content', icon: Type },
                  { id: 'style', label: 'Style', icon: Palette },
                  { id: 'captions', label: 'Captions', icon: Sparkles },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as 'content' | 'style' | 'captions')
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black tracking-widest uppercase transition-all ${
                      activeTab === tab.id
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content: Content Editor */}
              {activeTab === 'content' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
                  {/* Single Focused Slide Editor */}
                  <div className="rounded-[32px] border border-white/10 bg-[#0D0D0D] p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                          {currentSlide + 1}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
                          Editing Slide {currentSlide + 1}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newSlides = [...slides];
                            newSlides.splice(currentSlide + 1, 0, {
                              type: 'content',
                              headline: 'New Insight',
                              body: 'Details go here...',
                              emoji: null,
                            });
                            setSlides(newSlides);
                            setCurrentSlide(currentSlide + 1);
                            pushToHistory(newSlides, personalization, false);
                          }}
                          className="p-2 text-white/20 hover:text-emerald-400"
                          title="Add slide after this one"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newSlides = slides.filter(
                              (_, i) => i !== currentSlide
                            );
                            setSlides(newSlides);
                            setCurrentSlide(Math.max(0, currentSlide - 1));
                            pushToHistory(newSlides, personalization, false);
                          }}
                          disabled={slides.length <= 1}
                          className="p-2 text-white/20 hover:text-red-400 disabled:opacity-0"
                          title="Delete current slide"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8 sm:space-y-6">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-4">
                        <div className="relative flex-shrink-0 space-y-3 sm:space-y-2.5">
                          <label className="text-[9px] font-bold tracking-widest text-white/20 uppercase">
                            Emoji
                          </label>
                          <div className="group/emoji relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(true);
                              }}
                              className="flex h-[52px] w-[52px] items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-xl transition-all hover:border-emerald-500/30 hover:bg-white/[0.05] active:scale-95 sm:h-[46px] sm:w-[54px]"
                            >
                              {slides[currentSlide]?.emoji || (
                                <ImageIcon className="h-4 w-4 opacity-20" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3 sm:space-y-2.5">
                          <label className="text-[9px] font-bold tracking-widest text-white/20 uppercase">
                            Headline
                          </label>
                          <input
                            type="text"
                            value={slides[currentSlide]?.headline || ''}
                            onChange={(e) =>
                              handleSlideChange(
                                currentSlide,
                                'headline',
                                e.target.value
                              )
                            }
                            className="h-[52px] w-full rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white transition-all focus:border-emerald-500/30 focus:bg-white/[0.05] focus:outline-none sm:h-[46px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-2.5">
                        <label className="text-[9px] font-bold tracking-widest text-white/20 uppercase">
                          Body Text
                        </label>
                        <textarea
                          value={slides[currentSlide]?.body || ''}
                          onChange={(e) =>
                            handleSlideChange(
                              currentSlide,
                              'body',
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full resize-none rounded-md border border-white/5 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/60 transition-all focus:border-emerald-500/30 focus:bg-white/[0.05] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slide Navigation Controls - 50/50 Mobile Friendly Split */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setCurrentSlide((prev) => Math.max(0, prev - 1))
                      }
                      disabled={currentSlide === 0}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] text-[10px] font-black tracking-widest text-emerald-400 uppercase transition-all hover:bg-white/[0.06] active:scale-[0.98] disabled:opacity-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      PREV
                    </button>
                    <button
                      onClick={() =>
                        setCurrentSlide((prev) =>
                          Math.min(slides.length - 1, prev + 1)
                        )
                      }
                      disabled={currentSlide === slides.length - 1}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] text-[10px] font-black tracking-widest text-emerald-400 uppercase transition-all hover:bg-white/[0.06] active:scale-[0.98] disabled:opacity-10"
                    >
                      NEXT
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content: Style Editor */}
              {activeTab === 'style' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-300">
                  <section className="space-y-4">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      <Palette className="h-3.5 w-3.5" />
                      Color Themes
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => updateStyle({ style: s.id })}
                          disabled={isSaving}
                          className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:gap-3 sm:p-4 ${
                            personalization.style === s.id
                              ? 'border-emerald-500/40 bg-emerald-500/5'
                              : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                          }`}
                        >
                          <div className="flex -space-x-1.5">
                            {s.colors.map((c, idx) => (
                              <div
                                key={idx}
                                className="h-2.5 w-2.5 rounded-full ring-2 ring-black sm:h-3 sm:w-3"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-[8px] font-black tracking-widest uppercase sm:text-[9px]">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      <User className="h-3.5 w-3.5" />
                      Brand Identity
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold tracking-widest text-white/20 uppercase">
                          LinkedIn Handle
                        </label>
                        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
                          <span className="flex h-full w-10 flex-shrink-0 items-center justify-center border-r border-white/5 text-xs font-bold text-white/30">
                            @
                          </span>
                          <input
                            type="text"
                            value={personalization.handle}
                            disabled={isSaving}
                            onChange={(e) =>
                              updateStyle({
                                handle: e.target.value.replace('@', ''),
                              })
                            }
                            placeholder="yourhandle"
                            className="h-full w-full bg-transparent px-3 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold tracking-widest text-white/20 uppercase">
                          Profile Picture
                        </label>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving}
                          className={`flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            personalization.profilePic
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                              : 'border-white/5 bg-white/[0.03] text-white/40 hover:bg-white/[0.05]'
                          }`}
                        >
                          {personalization.profilePic ? (
                            <div className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-emerald-500/50">
                              <Image
                                src={personalization.profilePic}
                                alt=""
                                width={24}
                                height={24}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                          {personalization.profilePic
                            ? 'CHANGE PHOTO'
                            : 'UPLOAD PHOTO'}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-black tracking-widest text-white/70 uppercase">
                          Source Attribution
                        </span>
                        <span className="block text-[9px] text-white/20 lowercase">
                          Show &quot;Resource:{' '}
                          {getDisplayDomain(data?.sourceUrl || '')}&quot;
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          updateStyle({
                            showSource: !personalization.showSource,
                          })
                        }
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${personalization.showSource ? 'bg-emerald-500' : 'bg-white/10'}`}
                      >
                        <div
                          className={`h-4 w-4 transform rounded-full bg-white transition-transform ${personalization.showSource ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* Tab Content: Captions & Tags */}
              {activeTab === 'captions' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-300 sm:space-y-10">
                  <section className="space-y-4 sm:space-y-6">
                    <div className="grid gap-4 sm:gap-5">
                      {data.captions.map((caption, i) => (
                        <div
                          key={i}
                          className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0D0D0D] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all hover:border-white/20 hover:bg-[#121212] sm:rounded-[32px] sm:p-8"
                        >
                          <div className="mb-3 flex items-center justify-between sm:mb-4">
                            <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-0.5 text-[9px] font-black tracking-widest text-white/30 uppercase">
                              {caption.style}
                            </span>
                            <button
                              onClick={() => copyCaption(caption.text, i)}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400/70 transition-colors hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check className="h-3 w-3" /> COPIED
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> COPY
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[13px] leading-relaxed text-white/70 sm:text-[14px]">
                            {caption.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-500/50" />
                        </div>
                        <h2 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
                          Growth Metadata
                        </h2>
                      </div>
                      <button
                        onClick={copyAllHashtags}
                        disabled={isSaving}
                        className="text-[10px] font-black tracking-widest text-emerald-400 uppercase transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {copiedHashtags ? 'COPIED ALL!' : 'COPY ALL TAGS'}
                      </button>
                    </div>

                    <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-8">
                      <div className="flex flex-wrap gap-2">
                        {data.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-[12px] font-bold text-white/50"
                          >
                            #{tag.replace('#', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Persistent Mobile Bottom Action Bar - 50/50 Split */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-white/5 bg-[#050505]/80 p-4 backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => saveChanges()}
            disabled={!hasChanges || isSaving}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-[11px] font-black tracking-widest uppercase transition-all active:scale-95 ${
              isSaving
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                : hasChanges
                  ? 'border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.1)]'
                  : 'border-white/10 bg-white/5 text-white/30 opacity-50'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                SAVING
              </>
            ) : hasChanges ? (
              <>
                <Save className="h-4 w-4" />
                SAVE
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                SAVED
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading || isSaving}
            className="group relative flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-[11px] font-black tracking-widest text-black uppercase shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4" />
                PDF
              </>
            )}
          </button>
        </div>
      </div>
      {/* PDF Export Bridge - Positioned off-screen for high-fidelity capture */}
      <div className="pointer-events-none absolute -top-[5000px] -left-[5000px] -z-50 overflow-hidden">
        <div id="pdf-export-container" style={{ width: '1080px' }}>
          {slides.map((slide, i) => (
            <div
              key={i}
              id={`pdf-slide-export-${i}`}
              style={{ width: '1080px', height: '1350px' }}
            >
              <SlidePreview
                slide={slide}
                index={i}
                total={slides.length}
                theme={personalization.style}
                personalization={personalization}
                sourceUrl={data.sourceUrl}
                isExport={true}
                className="!rounded-none" // Force specific high-res styling for PDF
              />
            </div>
          ))}
        </div>
      </div>

      {/* Emoji Picker Global Modal / Bottom Sheet */}
      <AnimatePresence>
        {showEmojiPicker && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmojiPicker(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full rounded-t-[32px] border border-white/10 bg-[#0D0D0D] p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
            >
              <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/10 sm:hidden" />

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black tracking-[0.2em] text-white/40 uppercase">
                    Visual Assets
                  </h3>
                  <p className="mt-1 text-[10px] text-white/20">
                    Select an icon to anchor your slide
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleSlideChange(currentSlide, 'emoji', '');
                    setShowEmojiPicker(false);
                  }}
                  className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[9px] font-black text-white/40 transition-all hover:bg-red-500/20 hover:text-red-400"
                >
                  CLEAR
                </button>
              </div>

              <div className="custom-scrollbar grid max-h-[40vh] grid-cols-6 gap-2 overflow-y-auto pr-1 sm:max-h-[300px]">
                {[
                  '🚀',
                  '🔥',
                  '💡',
                  '✨',
                  '🎯',
                  '📌',
                  '✅',
                  '📈',
                  '👋',
                  '🤔',
                  '🙌',
                  '💎',
                  '📢',
                  '🛠️',
                  '🧠',
                  '🌟',
                  '⚡',
                  '🦾',
                  '🏆',
                  '👑',
                  '📊',
                  '📍',
                  '📅',
                  '🤝',
                  '💰',
                  '🔍',
                  '📝',
                  '🎨',
                  '📱',
                  '💻',
                  '🌍',
                  '🌈',
                  '💪',
                  '🚧',
                  '📐',
                  '🧬',
                  '🔑',
                  '🔐',
                  '📡',
                  '🔋',
                  '🔌',
                  '🕹️',
                ].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleSlideChange(currentSlide, 'emoji', emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="group relative flex h-12 w-full items-center justify-center rounded-xl transition-all hover:bg-white/5 active:scale-90"
                  >
                    <div className="absolute inset-0 rounded-xl bg-emerald-500/0 opacity-0 transition-all group-hover:bg-emerald-500/10 group-hover:opacity-100" />
                    <span className="relative z-10 text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getDisplayDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}
