<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Captions,
  Clapperboard,
  Download,
  Film,
  Layers,
  Music2,
  Play,
  Save,
  Sparkles,
  Upload,
} from 'lucide-vue-next';
import { autoEditVideo } from './lib/autoEdit';
import { generateVideoDraft } from './lib/aiDraft';
import { isSupabaseConfigured, storageBucket, supabase } from './lib/supabase';
import type { CaptionSegment, CutSegment, OverlayLayer, SoundEffectLayer, VideoProject } from './types';

const videoElement = ref<HTMLVideoElement | null>(null);
const sourceVideoFile = ref<File | null>(null);
const currentTime = ref(0);
const activeCaptionId = ref('');
const activeOverlayId = ref('');
const statusMessage = ref('');
const saving = ref(false);
const autoEditing = ref(false);
const isPlaying = ref(false);
const sfxTypes: SoundEffectLayer['type'][] = [
  'whoosh',
  'pop',
  'click',
  'impact',
  'riser',
  'notification',
];

const project = reactive<VideoProject>({
  title: 'Short Form Caption Edit',
  goal: 'education',
  format: 'reels-9-16',
  sourceVideoUrl: '',
  duration: 30,
  transcript:
    '',
  captions: [],
  overlays: [],
  soundEffects: [],
  cuts: [],
  brand: {
    handle: 'codewithrafli',
    website: 'codewithrafli.com',
    accent: '#27f5ff',
  },
});

const activeCaption = computed(
  () =>
    project.captions.find(
      (caption) => currentTime.value >= caption.start && currentTime.value <= caption.end,
    ) || project.captions[0],
);

const selectedCaption = computed(
  () => project.captions.find((caption) => caption.id === activeCaptionId.value) || project.captions[0],
);

const selectedOverlay = computed(
  () => project.overlays.find((overlay) => overlay.id === activeOverlayId.value) || project.overlays[0],
);

const activeOverlays = computed(() =>
  project.overlays.filter(
    (overlay) => currentTime.value >= overlay.start && currentTime.value <= overlay.end,
  ),
);

const sceneMode = computed(() => {
  const text = `${activeCaption.value?.text || ''} ${activeOverlays.value.map((overlay) => overlay.text).join(' ')}`.toLowerCase();
  if (/5-7|hrs|hours|framework|free|gratis/.test(text)) return 'scene-card';
  if (/amount|capital|\$|money|uang|modal|airbnb|business/.test(text)) return 'scene-graphic';
  return 'scene-talking';
});

function setCurrentTime() {
  const video = videoElement.value;
  if (!video) return;

  const time = video.currentTime || 0;
  if (!project.cuts.length || video.paused) {
    currentTime.value = time;
    return;
  }

  const sortedCuts = [...project.cuts].sort((a, b) => a.start - b.start);
  const isInsideCut = sortedCuts.some((cut) => time >= cut.start && time <= cut.end);
  if (isInsideCut) {
    currentTime.value = time;
    return;
  }

  const nextCut = sortedCuts.find((cut) => cut.start > time) || sortedCuts[0];
  if (nextCut) {
    video.currentTime = nextCut.start;
    currentTime.value = nextCut.start;
  }
}

function syncDuration() {
  project.duration = Number((videoElement.value?.duration || project.duration).toFixed(2));
}

async function togglePlayback() {
  const video = videoElement.value;
  if (!video) return;

  if (video.paused) {
    await video.play();
    isPlaying.value = true;
    return;
  }

  video.pause();
  isPlaying.value = false;
}

function markPaused() {
  isPlaying.value = false;
}

function markPlaying() {
  isPlaying.value = true;
}

function overlayClass(overlay: OverlayLayer) {
  const text = overlay.text.toLowerCase();
  return {
    'overlay-label': true,
    'overlay-word3d': /hook|point|amount|capital|framework|step|hrs|hours|start|scale/.test(text),
    'overlay-yellow': /free|framework|step|hrs|hours|\$|0|capital|business/.test(text),
    'overlay-badge': /airbnb|logo|brand|free|save/.test(text) || overlay.type === 'sticker',
    'overlay-money': /amount|capital|\$|money|uang|modal/.test(text),
    'overlay-brand': /airbnb|brand|business/.test(text),
  };
}

function overlayKind(overlay: OverlayLayer) {
  const text = overlay.text.toLowerCase();
  if (/airbnb/.test(text)) return 'brand';
  if (/amount|capital|\$|money|uang|modal/.test(text)) return 'money';
  if (/free|gratis/.test(text)) return 'tag';
  if (/framework|step/.test(text)) return 'framework';
  return 'text';
}

function isHighlighted(caption: CaptionSegment, word: string) {
  const normalized = word.replace(/[^\p{L}\p{N}_-]/gu, '').toLowerCase();
  return caption.highlightWords.some((highlight) => highlight.toLowerCase() === normalized);
}

async function uploadVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  project.sourceVideoUrl = URL.createObjectURL(file);
  sourceVideoFile.value = file;
  project.title = file.name.replace(/\.[^.]+$/, '');
  project.transcript = '';
  project.captions = [];
  project.overlays = [];
  project.soundEffects = [];
  project.cuts = [];
  activeCaptionId.value = '';
  activeOverlayId.value = '';
  statusMessage.value = 'Video loaded. Klik Auto edit video untuk generate caption, cut, overlay, dan SFX.';

  if (isSupabaseConfigured && supabase) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `source/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
      project.sourceVideoUrl = data.publicUrl;
      statusMessage.value = 'Video uploaded to Supabase.';
    }
  }
}

async function autoEdit() {
  if (!sourceVideoFile.value) {
    statusMessage.value = 'Upload video dulu sebelum auto edit.';
    return;
  }

  autoEditing.value = true;
  statusMessage.value = 'Auto edit running: transcribe audio, pilih cut, caption, overlay, dan SFX...';

  try {
    const result = await autoEditVideo(sourceVideoFile.value, project.duration, project.brand, (message) => {
      statusMessage.value = message;
    });
    project.transcript = result.transcript;
    project.goal = result.project.goal || 'auto';
    project.title = result.project.title || project.title;
    project.captions = result.project.captions;
    project.overlays = result.project.overlays;
    project.soundEffects = result.project.soundEffects;
    project.cuts = result.project.cuts.sort((a, b) => a.start - b.start);
    activeCaptionId.value = project.captions[0]?.id || '';
    activeOverlayId.value = project.overlays[0]?.id || '';
    statusMessage.value = result.warning
      ? `Auto edit fallback selesai. Transcription warning: ${result.warning}`
      : 'Auto edit selesai. Review cut, caption, overlay, dan SFX di editor.';
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Auto edit failed.';
  } finally {
    autoEditing.value = false;
  }
}

function generateDraft() {
  const generated = generateVideoDraft(project);
  project.captions = generated.captions;
  project.overlays = generated.overlays;
  project.soundEffects = generated.soundEffects;
  project.cuts = generated.cuts;
  activeCaptionId.value = project.captions[0]?.id || '';
  activeOverlayId.value = project.overlays[0]?.id || '';
  statusMessage.value = 'AI draft generated.';
}

function addCaption() {
  const caption: CaptionSegment = {
    id: crypto.randomUUID(),
    start: Math.max(0, currentTime.value),
    end: Math.min(project.duration, currentTime.value + 2.5),
    text: 'New caption',
    highlightWords: [],
    style: 'cyan-bold',
    animation: 'pop',
    x: 50,
    y: 76,
  };
  project.captions.push(caption);
  activeCaptionId.value = caption.id;
}

function addOverlay() {
  const overlay: OverlayLayer = {
    id: crypto.randomUUID(),
    type: 'label',
    start: Math.max(0, currentTime.value),
    end: Math.min(project.duration, currentTime.value + 4),
    text: 'NEW LABEL',
    x: 50,
    y: 20,
    scale: 1,
    rotation: 0,
    color: project.brand.accent,
  };
  project.overlays.push(overlay);
  activeOverlayId.value = overlay.id;
}

function addSfx(type: SoundEffectLayer['type']) {
  project.soundEffects.push({
    id: crypto.randomUUID(),
    type,
    start: Number(currentTime.value.toFixed(2)),
    volume: 0.75,
  });
}

function jumpToCut(cut: CutSegment) {
  if (!videoElement.value) return;
  videoElement.value.currentTime = cut.start;
  currentTime.value = cut.start;
}

async function saveProject() {
  if (!isSupabaseConfigured || !supabase) {
    localStorage.setItem('ai-video-project', JSON.stringify(project));
    statusMessage.value = 'Project saved locally.';
    return;
  }

  saving.value = true;
  const { data, error } = await supabase
    .from('video_projects')
    .upsert({
      id: project.id,
      title: project.title,
      source_video_url: project.sourceVideoUrl || null,
      transcript: project.transcript,
      project_json: project,
      branding_handle: project.brand.handle,
      status: 'draft',
    })
    .select('id')
    .single();

  saving.value = false;

  if (error) {
    statusMessage.value = error.message;
    return;
  }

  project.id = data.id;
  statusMessage.value = 'Project saved to Supabase.';
}

function exportJson() {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const savedProject = localStorage.getItem('ai-video-project');
if (savedProject) {
  try {
    Object.assign(project, JSON.parse(savedProject));
    project.cuts ||= [];
    project.captions ||= [];
    project.overlays ||= [];
    project.soundEffects ||= [];
  } catch {
    localStorage.removeItem('ai-video-project');
  }
}
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div class="brand">
        <Film :size="24" />
        <div>
          <strong>AI Video Studio</strong>
          <span>{{ isSupabaseConfigured ? 'Supabase ready' : 'Local mode' }}</span>
        </div>
      </div>
      <input v-model="project.title" class="project-title" />
      <div class="top-actions">
        <button type="button" @click="saveProject" :disabled="saving">
          <Save :size="17" />
          Save
        </button>
        <button type="button" class="primary" @click="exportJson">
          <Download :size="17" />
          Export JSON
        </button>
      </div>
    </header>

    <section class="studio-grid">
      <aside class="left-panel">
        <section class="panel-block">
          <h2>Source</h2>
          <label class="upload-card">
            <Upload :size="18" />
            Upload video
            <input type="file" accept="video/mp4,video/quicktime,video/*" @change="uploadVideo" />
          </label>
          <label>
            <span>Goal</span>
            <select v-model="project.goal">
              <option value="auto">Auto</option>
              <option value="education">Education</option>
              <option value="promo">Promo</option>
              <option value="storytelling">Storytelling</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </label>
          <button type="button" class="primary wide auto-edit-button" :disabled="autoEditing || !sourceVideoFile" @click="autoEdit">
            <Sparkles :size="17" />
            {{ autoEditing ? 'Auto editing...' : 'Auto edit video' }}
          </button>
          <label>
            <span>Transcript from video</span>
            <textarea v-model="project.transcript" rows="8" placeholder="Auto edit akan mengisi transcript dari audio video." />
          </label>
          <button type="button" class="wide" @click="generateDraft">
            <Clapperboard :size="17" />
            Draft from transcript
          </button>
        </section>

        <section class="panel-block">
          <h2>Sound effects</h2>
          <div class="sfx-grid">
            <button v-for="sfx in sfxTypes" :key="sfx" type="button" @click="addSfx(sfx)">
              <Music2 :size="15" />
              {{ sfx }}
            </button>
          </div>
        </section>
      </aside>

      <section class="preview-column">
        <div class="preview-frame" :class="[project.format, sceneMode]">
          <video
            v-if="project.sourceVideoUrl"
            ref="videoElement"
            :src="project.sourceVideoUrl"
            playsinline
            @click="togglePlayback"
            @timeupdate="setCurrentTime"
            @loadedmetadata="syncDuration"
            @play="markPlaying"
            @pause="markPaused"
            @ended="markPaused"
          />
          <div v-else class="empty-video">
            <Play :size="42" />
            <p>Upload a vertical video to start</p>
          </div>

          <div
            v-for="overlay in activeOverlays"
            :key="overlay.id"
            :class="overlayClass(overlay)"
            :style="{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              color: overlay.color,
              transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg) scale(${overlay.scale})`,
            }"
          >
            <span v-if="overlayKind(overlay) === 'brand'" class="brand-chip">
              <span class="brand-mark">A</span>
              {{ overlay.text }}
            </span>
            <span v-else-if="overlayKind(overlay) === 'money'" class="money-graphic">
              <span class="bill bill-one">$</span>
              <span class="bill bill-two">$</span>
              <strong>{{ overlay.text }}</strong>
            </span>
            <span v-else-if="overlayKind(overlay) === 'tag'" class="free-tag">
              FREE
            </span>
            <span v-else>
              {{ overlay.text }}
            </span>
          </div>

          <div
            v-if="activeCaption"
            class="caption"
            :class="[activeCaption.style, activeCaption.animation]"
            :style="{ left: `${activeCaption.x}%`, top: `${activeCaption.y}%` }"
          >
            <span
              v-for="(word, index) in activeCaption.text.split(/\s+/)"
              :key="`${activeCaption.id}-${index}`"
              :class="{ 'caption-highlight': isHighlighted(activeCaption, word) }"
            >
              {{ word }}{{ index === activeCaption.text.split(/\s+/).length - 1 ? '' : ' ' }}
            </span>
          </div>

          <button
            v-if="project.sourceVideoUrl && !isPlaying"
            type="button"
            class="preview-play"
            aria-label="Play preview"
            @click="togglePlayback"
          >
            <Play :size="22" fill="currentColor" />
          </button>
        </div>

        <div class="timeline">
          <div class="timeline-head">
            <strong>{{ currentTime.toFixed(1) }}s / {{ project.duration.toFixed(1) }}s</strong>
            <span>{{ project.cuts.length }} cuts · {{ project.captions.length }} captions · {{ project.overlays.length }} overlays · {{ project.soundEffects.length }} sfx</span>
          </div>
          <div class="tracks">
            <button
              v-for="cut in project.cuts"
              :key="cut.id"
              type="button"
              class="track-item cut-track"
              :title="cut.reason"
              :style="{ left: `${(cut.start / project.duration) * 100}%`, width: `${((cut.end - cut.start) / project.duration) * 100}%` }"
            />
            <button
              v-for="caption in project.captions"
              :key="caption.id"
              type="button"
              class="track-item caption-track"
              :style="{ left: `${(caption.start / project.duration) * 100}%`, width: `${((caption.end - caption.start) / project.duration) * 100}%` }"
              @click="activeCaptionId = caption.id"
            />
            <button
              v-for="overlay in project.overlays"
              :key="overlay.id"
              type="button"
              class="track-item overlay-track"
              :style="{ left: `${(overlay.start / project.duration) * 100}%`, width: `${((overlay.end - overlay.start) / project.duration) * 100}%` }"
              @click="activeOverlayId = overlay.id"
            />
          </div>
        </div>
      </section>

      <aside class="right-panel">
        <section class="panel-block">
          <div class="section-title">
            <h2><Clapperboard :size="17" /> Cuts</h2>
            <span class="section-meta">{{ project.cuts.length }} selected</span>
          </div>
          <div class="list dense-list">
            <button v-for="cut in project.cuts" :key="cut.id" type="button" @click="jumpToCut(cut)">
              {{ cut.start.toFixed(1) }}s - {{ cut.end.toFixed(1) }}s · {{ cut.reason }}
            </button>
          </div>
        </section>

        <section class="panel-block">
          <div class="section-title">
            <h2><Captions :size="17" /> Captions</h2>
            <button type="button" @click="addCaption">Add</button>
          </div>
          <div class="list">
            <button
              v-for="caption in project.captions"
              :key="caption.id"
              type="button"
              :class="{ selected: selectedCaption?.id === caption.id }"
              @click="activeCaptionId = caption.id"
            >
              {{ caption.text }}
            </button>
          </div>
          <div v-if="selectedCaption" class="editor-grid">
            <label>
              <span>Text</span>
              <textarea v-model="selectedCaption.text" rows="3" />
            </label>
            <label><span>Start</span><input v-model.number="selectedCaption.start" type="number" step="0.1" /></label>
            <label><span>End</span><input v-model.number="selectedCaption.end" type="number" step="0.1" /></label>
            <label>
              <span>Style</span>
              <select v-model="selectedCaption.style">
                <option value="yellow-impact">Yellow impact</option>
                <option value="white-clean">White clean</option>
                <option value="cyan-bold">Cyan bold</option>
                <option value="mixed-highlight">Mixed highlight</option>
              </select>
            </label>
            <label>
              <span>Animation</span>
              <select v-model="selectedCaption.animation">
                <option value="pop">Pop</option>
                <option value="slide-up">Slide up</option>
                <option value="bounce">Bounce</option>
                <option value="type-in">Type in</option>
              </select>
            </label>
          </div>
        </section>

        <section class="panel-block">
          <div class="section-title">
            <h2><Layers :size="17" /> Overlays</h2>
            <button type="button" @click="addOverlay">Add</button>
          </div>
          <div class="list">
            <button
              v-for="overlay in project.overlays"
              :key="overlay.id"
              type="button"
              :class="{ selected: selectedOverlay?.id === overlay.id }"
              @click="activeOverlayId = overlay.id"
            >
              {{ overlay.text }}
            </button>
          </div>
          <div v-if="selectedOverlay" class="editor-grid">
            <label><span>Text</span><input v-model="selectedOverlay.text" /></label>
            <label><span>X</span><input v-model.number="selectedOverlay.x" type="number" /></label>
            <label><span>Y</span><input v-model.number="selectedOverlay.y" type="number" /></label>
            <label><span>Scale</span><input v-model.number="selectedOverlay.scale" type="number" step="0.1" /></label>
            <label><span>Rotate</span><input v-model.number="selectedOverlay.rotation" type="number" /></label>
            <label><span>Color</span><input v-model="selectedOverlay.color" type="color" /></label>
          </div>
        </section>
      </aside>
    </section>

    <p v-if="statusMessage" class="status">{{ statusMessage }}</p>
  </main>
</template>
