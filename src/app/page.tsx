'use client';

import Footer from '@/components/Footer';
import SlidePreview from '@/components/SlidePreview';
import { getSavedLinks, removeLink, SavedLink } from '@/lib/saved-links';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Palette,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const STYLES = [
  {
    id: 'minimalist' as const,
    label: 'Minimal',
    colors: ['#2563eb', '#ffffff'],
    description: 'Clean, professional blue',
  },
  {
    id: 'dark' as const,
    label: 'Dark',
    colors: ['#10b981', '#000000'],
    description: 'Modern developer vibe',
  },
  {
    id: 'storyteller' as const,
    label: 'Vibrant',
    colors: ['#3b82f6', '#8b5cf6'],
    description: 'Energetic gradient',
  },
];

const LANGUAGES = [
  { id: 'auto', label: 'Auto Detect' },
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Indonesian' },
  { id: 'ms', label: 'Malay' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'it', label: 'Italian' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'jp', label: 'Japanese' },
  { id: 'kr', label: 'Korean' },
  { id: 'zh', label: 'Chinese' },
  { id: 'ar', label: 'Arabic' },
  { id: 'hi', label: 'Hindi' },
  { id: 'tr', label: 'Turkish' },
  { id: 'vi', label: 'Vietnamese' },
  { id: 'th', label: 'Thai' },
  { id: 'nl', label: 'Dutch' },
  { id: 'pl', label: 'Polish' },
  { id: 'ru', label: 'Russian' },
  { id: 'bn', label: 'Bengali' },
  { id: 'pa', label: 'Punjabi' },
  { id: 'jv', label: 'Javanese' },
  { id: 'te', label: 'Telugu' },
  { id: 'mr', label: 'Marathi' },
  { id: 'ta', label: 'Tamil' },
  { id: 'gu', label: 'Gujarati' },
  { id: 'kn', label: 'Kannada' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'uk', label: 'Ukrainian' },
  { id: 'ro', label: 'Romanian' },
  { id: 'hu', label: 'Hungarian' },
  { id: 'cs', label: 'Czech' },
  { id: 'el', label: 'Greek' },
  { id: 'he', label: 'Hebrew' },
  { id: 'sv', label: 'Swedish' },
  { id: 'da', label: 'Danish' },
  { id: 'fi', label: 'Finnish' },
  { id: 'no', label: 'Norwegian' },
  { id: 'fa', label: 'Persian' },
  { id: 'ur', label: 'Urdu' },
  { id: 'am', label: 'Amharic' },
  { id: 'sw', label: 'Swahili' },
  { id: 'yo', label: 'Yoruba' },
  { id: 'ha', label: 'Hausa' },
  { id: 'ig', label: 'Igbo' },
  { id: 'su', label: 'Sundanese' },
  { id: 'az', label: 'Azerbaijani' },
  { id: 'uz', label: 'Uzbek' },
  { id: 'kk', label: 'Kazakh' },
];

const PREVIEW_CONTENT: Record<string, { headline: string; body: string }> = {
  auto: {
    headline: 'Visual Identity: <Auto Detect>',
    body: 'Link2Slide will automatically analyze and adapt to the source language and tone.',
  },
  en: {
    headline: 'Your slides will look like this',
    body: 'This is a preview of your carousel style based on selected personalization.',
  },
  id: {
    headline: 'Slide Anda akan tampil seperti ini',
    body: 'Inilah pratinjau gaya karosel Anda berdasarkan personalisasi yang dipilih.',
  },
  ms: {
    headline: 'Slaid anda akan kelihatan seperti ini',
    body: 'Ini adalah pratonton gaya karosel anda berdasarkan pemperibadian yang dipilih.',
  },
  es: {
    headline: 'Tus diapositivas se verán así',
    body: 'Esta es una vista previa del estilo de tu carrusel basada en la personalización seleccionada.',
  },
  fr: {
    headline: 'Vos diapositives ressembleront à ceci',
    body: 'Ceci est un aperçu du style de votre carrousel basé sur la personnalisation sélectionnée.',
  },
  de: {
    headline: 'Ihre Folien werden so aussehen',
    body: 'Dies ist eine Vorschau Ihres Karussell-Stils basierend auf der gewählten Personalisierung.',
  },
  it: {
    headline: 'Le tue diapositive appariranno così',
    body: "Questa è un'anteprima dello stile del tuo carosello basata sulla personalizzazione selezionata.",
  },
  pt: {
    headline: 'Os seus slides ficarão assim',
    body: 'Esta é uma prévisão do estilo do seu carrossel com base na personalização selecionada.',
  },
  jp: {
    headline: 'スライドは次のように表示されます',
    body: 'これは、選択したパーソナライズに基づくカルーセル スタイルのプレビューです。',
  },
  kr: {
    headline: '슬라이드는 다음과 같이 표시됩니다',
    body: '선택한 개인화 설정에 따른 캐러셀 스타일의 미리보기입니다.',
  },
  zh: {
    headline: '您的幻灯片将如下所示',
    body: '这是基于所选个性化设置的轮播样式的预览。',
  },
  ar: {
    headline: 'ستبدو شرائحك بهذا الشكل',
    body: 'هذا معاينة لنمط الدوار الخاص بك بناءً على التخصيص المختار.',
  },
  hi: {
    headline: 'आपकी स्लाइड्स इस तरह दिखेंगी',
    body: 'यह चयनित वैयक्तिकरण के आधार पर आपके हिंडोला शैली का पूर्वावलोकन है।',
  },
  tr: {
    headline: 'Slaytlarınız böyle görünecek',
    body: 'Bu, seçilen kişiselleştirmeye dayalı karusel stilinizin bir önizlemesidir.',
  },
  vi: {
    headline: 'Các slide của bạn sẽ trông như thế này',
    body: 'Đây là bản xem trước kiểu băng chuyền của bạn dựa trên cá nhân hóa đã chọn.',
  },
  th: {
    headline: 'สไลด์ของคุณจะเป็นแบบนี้',
    body: 'นี่คือตัวอย่างสไตล์ภาพสไลด์ตามการปรับแต่งที่เลือก',
  },
  nl: {
    headline: "Je dia's zien er zo uit",
    body: 'Dit is een voorbeeld van je carrouselstijl op basis van de geselecteerde personalisatie.',
  },
  pl: {
    headline: 'Twoje slajdy będą wyglądać tak',
    body: 'To jest podgląd stylu Twojej karuzeli na podstawie wybranej personalizacji.',
  },
  ru: {
    headline: 'Ваши слайды будут выглядеть так',
    body: 'Это предварительный просмотр стиля вашей карусели на основе выбранной персонализации.',
  },
  bn: {
    headline: 'আপনার স্লাইডগুলো এমন দেখাবে',
    body: 'এটি নির্বাচিত ব্যক্তিগতকরণের উপর ভিত্তি করে আপনার ক্যারোজেল স্টাইলের একটি প্রিভিউ।',
  },
  pa: {
    headline: 'ਤੁਹਾਡੀਆਂ ਸਲਾਈਡਾਂ ਇਸ ਤਰ੍ਹਾਂ ਦਿਖਾਈ ਦੇਣਗੀਆਂ',
    body: "ਇਹ ਚੁਣੀ ਗਈ ਨਿੱਜੀਕਰਨ 'ਤੇ ਅਧਾਰਤ ਤੁਹਾਡੀ ਕੈਰੋਜ਼ਲ ਸ਼ੈਲੀ ਦੀ ਇੱਕ ਝਲਕ ਹੈ।",
  },
  jv: {
    headline: 'Slide sampeyan bakal katon kaya iki',
    body: 'Iki tampilan gaya karosel sampeyan adhedhasar personalisasi sing dipilih.',
  },
  te: {
    headline: 'మీ స్లైడ్‌లు ఇలా కనిపిస్తాయి',
    body: 'ఎంచుకున్న వ్యక్తిగతీకరణ ఆధారంగా మీ రంగులరాట్నం (carousel) శైలి యొక్క ప్రివ్యూ ఇది.',
  },
  mr: {
    headline: 'तुमच्या स्लाईड्स अशा दिसतील',
    body: 'हे निवडलेल्या वैयक्तिकरणानुसार तुमच्या कॅरोसेल शैलीचे पूर्वावलोकन आहे.',
  },
  ta: {
    headline: 'உங்கள் ஸ்லைடுகள் இப்படி இருக்கும்',
    body: 'தேர்ந்தெடுக்கப்பட்ட தனிப்பயனாக்கத்தின் அடிப்படையில் உங்கள் கொணர்வி பாணியின் முன்னோட்டம் இது.',
  },
  gu: {
    headline: 'તમારી સ્લાઇડ્સ આના જેવી દેખાશે',
    body: 'આ પસંદ કરેલ વૈયક્તિકરણ પર આધારિત તમારી કેરોયુઝલ શૈલીનું પૂર્વાવलोकन છે.',
  },
  kn: {
    headline: 'ನಿಮ್ಮ ಸ್ಲೈಡ್‌ಗಳು ಹೀಗೆ ಕಾಣುತ್ತವೆ',
    body: 'ಆಯ್ದ ವೈಯಕ್ತೀಕರಣವನ್ನು ಆಧರಿಸಿ ಇದು ನಿಮ್ಮ ಕ್ಯಾರೋಸೆಲ್ ಶೈಲಿಯ ಮುನ್ನೋಟವಾಗಿದೆ.',
  },
  ml: {
    headline: 'നിങ്ങളുടെ സ്ലൈഡുകൾ ഇതുപോലെയിരിക്കും',
    body: 'തിരഞ്ഞെടുത്ത വ്യക്തിഗതമാക്കലിനെ അടിസ്ഥാനമാക്കിയുള്ള നിങ്ങളുടെ കറൗസൽ ശൈലിയുടെ ഒരു പ്രിവ്യൂ ആണിത്.',
  },
  uk: {
    headline: 'Ваші слайди виглядатимуть так',
    body: 'Це попередній перегляд вашого стилю каруселі на основі вибраної персоналізації.',
  },
  ro: {
    headline: 'Slide-urile tale vor arăta așa',
    body: 'Aceasta este o previzualizare a stilului caruselului tău, bazată pe personalizarea selectată.',
  },
  hu: {
    headline: 'A diáid így fognak kinézni',
    body: 'Ez a kiválasztott személyre szabás alapján készült diavetítés stílusának előnézete.',
  },
  cs: {
    headline: 'Vaše snímky budou vypadat takto',
    body: 'Toto je náhled stylu vašeho karuselu na základě vybrané personalizace.',
  },
  el: {
    headline: 'Οι διαφάνειές σας θα μοιάζουν κάπως έτσι',
    body: 'Αυτή είναι μια προεπισκόπηση του στυλ καρουζέλ σας με βάση την επιλεγμένη εξατομίκευση.',
  },
  he: {
    headline: 'השקופיות שלך ייראו כך',
    body: 'זוהי תצוגה מקדימה של סגנון הקרוסלה שלך המבוססת על ההתאמה האישית שנבחרה.',
  },
  sv: {
    headline: 'Dina bilder kommer att se ut så här',
    body: 'Detta är en förhandsgranskning av din karusellstil baserat på vald anpassning.',
  },
  da: {
    headline: 'Dine slides vil se sådan ud',
    body: 'Dette er en forhåndsvisning af din karruselstil baseret på valgt tilpasning.',
  },
  fi: {
    headline: 'Diasti näyttävät tältä',
    body: 'Tämä on karusellityylisi esikatselu valitun mukautuksen perusteella.',
  },
  no: {
    headline: 'Lysbildene dine vil se slik ut',
    body: 'Dette er en forhåndsvisning av karusellstilen din basert på valgt tilpasning.',
  },
  fa: {
    headline: 'اسلایدهای شما به این شکل خواهند بود',
    body: 'این پیش‌نمایشی از سبک اسلاید شما بر اساس شخصی‌سازی انتخاب‌شده است.',
  },
  ur: {
    headline: 'آپ کی سلائیڈز اس طرح نظر آئیں گی',
    body: 'یہ منتخب کردہ پرسنلائزیشن کی بنیاد پر آپ کے کیروسل اسٹائل کا پیش نظارہ ہے۔',
  },
  am: {
    headline: 'ስላይዶችዎ ይህን ይመስላሉ',
    body: 'ይህ በተመረጠው ግላዊነት ማላበስ ላይ የተመሰረተ የእርስዎ የካሮሴል ዘይቤ ቅድመ እይታ ነው።',
  },
  sw: {
    headline: 'Slaidi zako zitaonekana hivi',
    body: 'Huu ni onyesho la kukagua mtindo wako wa jukwaa kulingana na ubinafsishaji uliochaguliwa.',
  },
  yo: {
    headline: 'Awọn ifaworanhan rẹ yoo dabi eyi',
    body: 'Eyi jẹ awotẹlẹ ti ara carousel rẹ ti o da lori isọdi ti o yan.',
  },
  ha: {
    headline: 'Slaid ɗinku za su yi kama da haka',
    body: 'Wannan samfoti ne na salon carousel ɗin ku dangane da zaɓin da aka zaɓa.',
  },
  ig: {
    headline: 'Ihe mmịfe gị ga-adị ka nke a',
    body: 'Nke a bụ nlele nke ụdị carousel gị dabere na nhazi ahọpụtara.',
  },
  su: {
    headline: 'Slide anjeun bakal katingal sapertos kieu',
    body: 'Ieu sawangan gaya karosel anjeun dumasar kana personalisasi anu dipilih.',
  },
  az: {
    headline: 'Slaydlarınız belə görünəcək',
    body: 'Bu, seçilmiş fərdiləşdirmə əsasında karusel stilinizin ilkin baxışıdır.',
  },
  uz: {
    headline: "Slaydlaringiz shunday ko'rinadi",
    body: "Bu tanlangan shaxsiylashtirish asosida karusel uslubingizning oldindan ko'rishidir.",
  },
  kk: {
    headline: 'Сіздің слайдтарыңыз осылай көрінеді',
    body: 'Бұл таңдалған жекелендіруге негізделген карусель стилінің алдын ала қарауы.',
  },
};

const TEXTAREA_PLACEHOLDER =
  "e.g. 'Make it punchy for developers', 'Focus on data insights'...";

export default function LandingPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(
    null
  );
  const [showDesignConfig, setShowDesignConfig] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [recentLinks, setRecentLinks] = useState<SavedLink[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<
    { id: string; title: string } | 'all' | null
  >(null);

  const [personalization, setPersonalization] = useState({
    style: 'minimalist' as 'minimalist' | 'dark' | 'storyteller',
    handle: '',
    profilePic: null as string | null,
    showSource: false,
    includeEmojis: true,
    targetLanguage: 'auto',
    customInstructions: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load Preferences
    const savedPrefs = localStorage.getItem('link2slide_personalization');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPersonalization((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse preferences', e);
      }
    }

    const savedProfileId = localStorage.getItem('user_profile_id');
    if (savedProfileId) {
      fetch(`/api/profiles/upsert?id=${savedProfileId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.profile) {
            setPersonalization((prev) => {
              const updated = {
                ...prev,
                handle: json.data.profile.handle || prev.handle,
                profilePic: json.data.profile.profilePicUrl || prev.profilePic,
              };
              // Persist the synced data
              localStorage.setItem(
                'link2slide_personalization',
                JSON.stringify(updated)
              );
              return updated;
            });
          }
        })
        .catch(() => {});
    }
    // Load recent links
    setRecentLinks(getSavedLinks());
  }, []);

  // Handle body scroll locking when modals are open
  useEffect(() => {
    if (showDesignConfig || showPreviewModal || deleteTarget) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDesignConfig, showPreviewModal, deleteTarget]);

  // Sync Preferences to LocalStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        'link2slide_personalization',
        JSON.stringify(personalization)
      );
    }
  }, [personalization, mounted]);

  const handleDeleteLink = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget === 'all') {
      localStorage.removeItem('link2slide_saved_links');
      setRecentLinks([]);
    } else {
      removeLink(deleteTarget.id);
      setRecentLinks(getSavedLinks());
    }
    setDeleteTarget(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size too large (max 2MB)');
        return;
      }
      selectedFileRef.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalization((prev) => ({
          ...prev,
          profilePic: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const coreInput = inputMode === 'url' ? url : textContent;
    if (!coreInput) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setLoadingMessage('Initializing engine & brand sync...');

    let finalPersonalization = { ...personalization };
    const controller = new AbortController();

    // Helper to simulate smooth progress increments
    const smoothProgress = (start: number, end: number, duration: number) => {
      const stepTime = 100; // ms
      const steps = duration / stepTime;
      const increment = (end - start) / steps;
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          clearInterval(timer);
          setProgress(end);
        } else {
          setProgress(Math.floor(current));
        }
      }, stepTime);

      return timer;
    };

    try {
      // Step 1: Sync Profile (0-15%)
      setProgress(5);
      let profileId = localStorage.getItem('user_profile_id');
      if (personalization.handle || personalization.profilePic) {
        setLoadingMessage('Syncing brand identity...');
        const formData = new FormData();
        if (profileId) formData.append('id', profileId);
        formData.append('handle', personalization.handle);
        if (selectedFileRef.current) {
          formData.append('profilePic', selectedFileRef.current);
        }

        const pRes = await fetch('/api/profiles/upsert', {
          method: 'POST',
          body: formData,
        });

        const pJson = await pRes.json();
        if (pJson.success) {
          profileId = pJson.data.profile.id;
          if (profileId) localStorage.setItem('user_profile_id', profileId);
          finalPersonalization = {
            ...finalPersonalization,
            handle: pJson.data.profile.handle,
            profilePic: pJson.data.profile.profilePicUrl,
          };
          setPersonalization(finalPersonalization);

          // CRITICAL: Clear the file ref after successful upload.
          // This prevents re-uploading the same file if the user clicks Generate again
          // (e.g., after changing the handle but keeping the same photo).
          selectedFileRef.current = null;
        }
      }
      setProgress(15);

      // Step 2: Extract Content (15-50%)
      let contentToProcess = coreInput;
      let ipHash = 'local_dev'; // Default

      if (inputMode === 'url') {
        setLoadingMessage('Establishing connection to source...');
        const scrapeTimer = smoothProgress(15, 45, 8000); // Simulate progress for 8s

        const scrapeRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearInterval(scrapeTimer);
        const scrapeData = await scrapeRes.json();
        if (!scrapeData.success) throw scrapeData.error;

        contentToProcess = scrapeData.data.content;
        ipHash = scrapeData.data.ipHash;
      } else {
        // Manual Text Mode: Skip scraping
        setProgress(35);
        setLoadingMessage('Processing your thoughts...');

        // Fetch session to get IP Hash for rate limiting
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        if (sessionData.success) {
          ipHash = sessionData.data.ipHash;
        } else {
          ipHash = `manual_${Math.random().toString(36).substring(7)}`;
        }

        // Add a small artificial delay for UX feel
        await new Promise((r) => setTimeout(r, 400));
      }

      setProgress(50);
      setLoadingMessage('Context extracted. Summoning AI Ghostwriter...');

      // Step 3: Generate (50-100%)
      const genTimer = smoothProgress(50, 95, 15000); // Simulate progress for 15s
      setLoadingMessage('Drafting viral hooks & actionable slides...');

      const functionUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/generate-post';
      const genRes = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          content: contentToProcess,
          sourceUrl: inputMode === 'url' ? url : 'Manual Input',
          ipHash: ipHash,
          userProfileId: profileId,
          personalization: {
            ...finalPersonalization,
            targetLanguage:
              LANGUAGES.find(
                (l) => l.id === finalPersonalization.targetLanguage
              )?.label || 'auto',
          },
        }),
        signal: controller.signal,
      });

      clearInterval(genTimer);
      const genData = await genRes.json();
      if (!genData.success) throw genData.error;

      setProgress(100);
      setLoadingMessage('Carousel assembled! Finalizing...');

      setTimeout(() => {
        router.push(`/result/${genData.data.id}`);
      }, 500);
    } catch (err: unknown) {
      console.error('Generation flow failed:', err);
      setIsLoading(false);
      setProgress(0);
      let errorMessage = 'Something went wrong';
      let errorCode = 'GEN_ERROR';

      // Check if it's our custom error object from API
      if (err && typeof err === 'object' && 'message' in err) {
        const errorObj = err as { message: string; code?: string };
        errorMessage = errorObj.message;
        errorCode = errorObj.code || errorCode;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError({
        code: errorCode,
        message: errorMessage,
      });
    }
  };

  if (!mounted) return null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-[#050505] px-1 pt-[8vh] pb-16 selection:bg-emerald-500/30 sm:px-4">
      {/* Dynamic Background - Enhanced Intensity */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[60%] w-[60%] rounded-full bg-purple-500/[0.08] blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] brightness-125 contrast-150" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-[620px] px-3 sm:px-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header - More Visual Depth */}
        <div className="mb-12 text-center sm:mb-16">
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-3 w-3" />
            AI Carousel Generator
          </motion.div>

          <h1 className="font-brand relative mb-4 text-6xl leading-tight font-bold tracking-tighter text-white">
            Link
            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              2
            </span>
            Slide
          </h1>

          <p className="mx-auto max-w-[420px] text-[15px] leading-relaxed font-medium text-white/50">
            Convert any article, link, or text into viral LinkedIn Carousels.
            The fastest AI Carousel Generator for high-engagement authorities.
          </p>
          <h2 className="sr-only">
            Free LinkedIn Carousel PDF Creator from URL, Blog Post, or Raw Text.
          </h2>
        </div>

        {/* The "Power-Box" Input Card - fixed the dead feeling with extreme shine */}
        <div className="group relative">
          {/* Dual-Layer Glow Background */}
          <div className="absolute -inset-10 rounded-[60px] bg-emerald-500/10 opacity-40 blur-[80px] transition-opacity duration-1000 group-hover:opacity-100" />

          <div className="sm:shadow-4xl relative rounded-[32px] border border-white/5 bg-[#0A0A0A] p-6 sm:rounded-[40px] sm:p-12 md:p-14">
            <div className="absolute inset-x-12 top-0 hidden h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent sm:block" />
            <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`text-[10px] font-black tracking-widest transition-all ${inputMode === 'url' ? 'text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
                    >
                      URL
                    </button>
                    <span className="mx-1 text-[10px] font-bold text-white/10">
                      /
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`text-[10px] font-black tracking-widest transition-all ${inputMode === 'text' ? 'text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
                    >
                      SCRATCH
                    </button>
                    <span className="ml-2 text-[9px] font-bold text-red-500 opacity-60">
                      *
                    </span>
                  </div>
                  {error && (
                    <span className="text-[10px] font-bold text-red-400 uppercase">
                      {error.code}
                    </span>
                  )}
                </div>

                <div className="relative">
                  {inputMode === 'url' ? (
                    <input
                      type="url"
                      required
                      placeholder="Paste article or post URL..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-[14px] text-white transition-all placeholder:text-white/30 focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/5 disabled:opacity-50 sm:h-16 sm:px-6 sm:text-[15px]"
                    />
                  ) : (
                    <textarea
                      required
                      placeholder="Paste your raw thoughts, a thread, or an article snippet here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      disabled={isLoading}
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-[14px] leading-relaxed text-white transition-all placeholder:text-white/30 focus:border-emerald-500/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-500/5 disabled:opacity-50 sm:px-6 sm:text-[15px]"
                    />
                  )}
                  {error && (
                    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                      <div className="text-xs font-medium text-red-500/80">
                        {error.message}
                      </div>
                      {error.code === 'AI_TAKING_TOO_LONG' && (
                        <button
                          type="submit"
                          className="flex w-fit items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-red-400 uppercase transition-colors hover:bg-red-500/20"
                        >
                          <Sparkles className="h-3 w-3" />
                          Retry Generation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowDesignConfig(true)}
                  className="group/toggle flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-5 py-5 ring-1 ring-white/5 transition-all hover:bg-white/[0.06] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 shadow-sm transition-colors group-hover/toggle:bg-violet-500/20 sm:h-9 sm:w-9 sm:rounded-lg">
                      <Wand2 className="h-5 w-5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black tracking-widest text-white uppercase sm:text-[11px]">
                        Personalize
                      </p>
                      <p className="text-[10px] font-medium text-white/30 sm:text-[9px]">
                        Style, language & identity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden text-[10px] font-bold tracking-tighter text-emerald-400/60 uppercase sm:block">
                      {
                        STYLES.find((s) => s.id === personalization.style)
                          ?.label
                      }
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors group-hover/toggle:bg-white/10 sm:h-7 sm:w-7">
                      <Settings2 className="h-4 w-4 text-white/40 group-hover/toggle:text-white" />
                    </div>
                  </div>
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={
                  (inputMode === 'url' ? !url : !textContent) || isLoading
                }
                className="group/btn relative h-16 w-full overflow-hidden rounded-[20px] bg-white font-black text-black shadow-[0_4px_20px_rgba(255,255,255,0.05)] transition-all hover:scale-[1.01] hover:shadow-[0_8px_40px_rgba(255,255,255,0.15)] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-white/10 disabled:shadow-none"
                whileTap={{ scale: 0.99 }}
              >
                {isLoading && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-y-0 left-0 bg-emerald-500/10"
                    transition={{ ease: 'linear' }}
                  />
                )}

                <span className="relative z-10 flex flex-col items-center justify-center gap-0.5 tracking-widest uppercase">
                  {isLoading ? (
                    <>
                      <div className="flex items-center gap-3 text-[14px]">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                        <span>{progress}% COMPLETED</span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-500/60 lowercase italic">
                        {loadingMessage}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-[15px]">
                      Generate Carousel
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </div>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Micro Trust Indicators - Simplified for unboxed feel */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/[0.03] pt-6">
              {['100% Free', 'Professional Output', 'Instant Download'].map(
                (text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-2 w-2 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight text-white/20 uppercase">
                      {text}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* RECENT CREATIONS - Premium Local History Section */}
        {recentLinks.length > 0 && (
          <div className="mx-auto mt-16 mb-16 max-w-4xl px-2 sm:mt-24 sm:px-6">
            <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.03] text-white/40">
                  <Clock className="h-4 w-4" />
                </div>
                <h2 className="text-[11px] font-black tracking-[0.2em] text-white/50 uppercase">
                  Recent Creations
                </h2>
              </div>
              <button
                onClick={() => setDeleteTarget('all')}
                className="text-[9px] font-bold tracking-widest text-white/20 uppercase transition-colors hover:text-red-400"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {recentLinks.map((link) => (
                  <motion.div
                    key={link.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Link
                      href={`/result/${link.id}`}
                      className="group relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/5 text-emerald-500/50 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-500">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xs font-bold text-white/80 group-hover:text-white">
                          {link.title || 'Untitled Carousel'}
                        </h3>
                        <p className="mt-1 truncate text-[10px] text-white/20">
                          {getDisplayDomain(link.sourceUrl)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={(e) =>
                            handleDeleteLink(
                              link.id,
                              link.title || 'Untitled',
                              e
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      <Footer />

      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="shadow-4xl relative w-full max-w-[472px] overflow-hidden rounded-[40px] border border-white/10 bg-[#0A0A0A] p-4"
            >
              <SlidePreview
                slide={{
                  type: 'hook',
                  emoji: personalization.includeEmojis ? '✨' : null,
                  headline:
                    PREVIEW_CONTENT[personalization.targetLanguage]?.headline ||
                    PREVIEW_CONTENT['en'].headline,
                  body:
                    PREVIEW_CONTENT[personalization.targetLanguage]?.body ||
                    PREVIEW_CONTENT['en'].body,
                }}
                index={0}
                total={7}
                theme={personalization.style}
                personalization={{
                  ...personalization,
                  showSource: personalization.showSource,
                }}
                sourceUrl="https://example.com"
                className="shadow-4xl rounded-[48px] border border-white/20 ring-1 ring-white/5"
              />
              <button
                onClick={() => setShowPreviewModal(false)}
                className="mt-4 w-full rounded-2xl bg-white py-4 text-xs font-black tracking-[0.2em] text-black uppercase transition-transform active:scale-95"
              >
                Looks Great
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDesignConfig && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDesignConfig(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex h-[90vh] w-full flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-[#0A0A0A] shadow-2xl sm:h-auto sm:max-w-[500px] sm:rounded-[40px]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-white uppercase">
                      Personalization
                    </h3>
                    <p className="text-[10px] font-medium text-white/30">
                      Customize your slide journey
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDesignConfig(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="custom-scrollbar flex-1 overflow-y-auto p-6 pt-8 pb-12 sm:max-h-[70vh]">
                <div className="space-y-10">
                  {/* Visual Identity Section */}
                  <div className="space-y-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black tracking-[0.2em] text-emerald-500/60 uppercase">
                        Visual Identity
                      </label>
                      <p className="text-[10px] font-medium text-white/20">
                        Choose the aesthetic direction of your slides
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setPersonalization((prev) => ({
                              ...prev,
                              style: s.id,
                            }))
                          }
                          className={`flex flex-col items-center gap-3 rounded-2xl border py-5 transition-all ${
                            personalization.style === s.id
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex -space-x-1">
                            {s.colors.map((c, i) => (
                              <div
                                key={i}
                                className="h-3 w-3 rounded-full ring-2 ring-[#0A0A0A]"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-black tracking-tight text-white uppercase">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex h-14 items-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-colors focus-within:border-emerald-500/30">
                        <span className="flex h-full w-14 flex-shrink-0 items-center justify-center border-r border-white/5 text-sm font-bold text-white/20">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="Your professional handle (optional)"
                          value={personalization.handle}
                          onChange={(e) =>
                            setPersonalization((prev) => ({
                              ...prev,
                              handle: e.target.value.replace('@', ''),
                            }))
                          }
                          className="h-full w-full bg-transparent px-5 text-sm text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex h-14 items-center justify-center gap-3 rounded-2xl border px-6 transition-all ${
                          personalization.profilePic
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                        }`}
                      >
                        {personalization.profilePic ? (
                          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/50">
                            <NextImage
                              src={personalization.profilePic!}
                              alt={`${personalization.handle || 'User'} Profile`}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <ImageIcon className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span className="text-[11px] font-bold tracking-widest uppercase">
                          {personalization.profilePic
                            ? 'Change Photo'
                            : 'Add Photo (optional)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Creative Strategy Section */}
                  <div className="space-y-6 border-t border-white/5 pt-10">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black tracking-[0.2em] text-blue-500/60 uppercase">
                        Creative Strategy
                      </label>
                      <p className="text-[10px] font-medium text-white/20">
                        Customize how the AI crafts your visual content
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Language Selection */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowLangDropdown(!showLangDropdown)}
                          className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 text-[13px] font-bold text-white transition-all hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] tracking-widest text-white/30 uppercase">
                              Language:
                            </span>
                            <span>
                              {
                                LANGUAGES.find(
                                  (l) => l.id === personalization.targetLanguage
                                )?.label
                              }
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-white/20 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`}
                          />
                        </button>

                        <AnimatePresence>
                          {showLangDropdown && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute top-full right-0 left-0 z-[110] mt-2 max-h-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl"
                            >
                              <div className="sticky top-0 border-b border-white/5 bg-[#111] p-3">
                                <div className="relative">
                                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/20" />
                                  <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search 50+ languages..."
                                    value={langSearch}
                                    onChange={(e) =>
                                      setLangSearch(e.target.value)
                                    }
                                    className="h-10 w-full rounded-xl bg-white/5 pr-3 pl-10 text-xs text-white placeholder:text-white/20 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="custom-scrollbar max-h-48 overflow-y-auto p-1.5">
                                {LANGUAGES.filter((l) =>
                                  l.label
                                    .toLowerCase()
                                    .includes(langSearch.toLowerCase())
                                ).map((lang) => (
                                  <button
                                    key={lang.id}
                                    onClick={() => {
                                      setPersonalization((prev) => ({
                                        ...prev,
                                        targetLanguage: lang.id,
                                      }));
                                      setShowLangDropdown(false);
                                      setLangSearch('');
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-xs font-bold transition-colors ${
                                      personalization.targetLanguage === lang.id
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'text-white/50 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {lang.label}
                                    {personalization.targetLanguage ===
                                      lang.id && <Check className="h-3 w-3" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Emoji toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setPersonalization((prev) => ({
                            ...prev,
                            includeEmojis: !prev.includeEmojis,
                          }))
                        }
                        className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-[11px] font-black tracking-widest text-white uppercase">
                            Smart Emojis
                          </span>
                          <span className="text-[10px] text-white/30">
                            Enhance visual readability
                          </span>
                        </div>
                        <div
                          className={`relative h-6 w-11 rounded-full transition-colors ${personalization.includeEmojis ? 'bg-emerald-500' : 'bg-white/10'}`}
                        >
                          <div
                            className={`absolute top-1 h-4 w-4 transform rounded-full bg-white transition-transform ${personalization.includeEmojis ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </div>
                      </button>

                      <div className="flex flex-col gap-3">
                        <label className="block pl-1 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
                          Writing Style Guidelines{' '}
                          <span className="ml-1 text-[8px] font-medium lowercase opacity-50">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          placeholder={TEXTAREA_PLACEHOLDER}
                          value={personalization.customInstructions}
                          onChange={(e) =>
                            setPersonalization((prev) => ({
                              ...prev,
                              customInstructions: e.target.value,
                            }))
                          }
                          className="custom-scrollbar h-32 w-full resize-none rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm leading-relaxed font-medium text-white transition-all placeholder:text-white/10 focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-white/5 bg-[#0D0D0D] p-6 sm:p-8">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="group/preview flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.2em] text-white/40 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <Eye className="h-4 w-4 text-emerald-400" />
                    PREVIEW
                  </button>
                  <button
                    onClick={() => setShowDesignConfig(false)}
                    className="flex h-14 flex-[1.2] items-center justify-center rounded-2xl bg-white text-[10px] font-black tracking-[0.2em] text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    APPLY CHANGES
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-black/80"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 shadow-2xl"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  {deleteTarget === 'all'
                    ? 'Clear History?'
                    : 'Delete Carousel?'}
                </h3>
                <p className="text-sm leading-relaxed text-white/40">
                  {deleteTarget === 'all'
                    ? 'This will permanently remove all your recent creations from this device.'
                    : `Are you sure you want to delete "${typeof deleteTarget === 'object' ? deleteTarget.title : ''}"? This cannot be undone.`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-white/5 bg-white/5 py-4 text-[10px] font-black tracking-widest text-white/40 uppercase transition-all hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 py-4 text-[10px] font-black tracking-widest text-white uppercase shadow-[0_10px_20px_rgba(239,44,44,0.2)] transition-all hover:bg-red-600 active:scale-95"
                >
                  Confirm
                </button>
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
