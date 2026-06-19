import { Heart, Share2, X as CloseX, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Footer() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const linkedinDraft =
    'Linking my last post to a carousel using Link2Slide by Cintara Surya Elidanto. Pretty smooth experience.\n\nTry it here: https://link2slide.vercel.app';
  const xDraft =
    'Just tried Link2Slide by @suryaelidanto to turn my links into carousels. Really clean tool.\n\nCheck it out: https://link2slide.vercel.app';

  const shareLinks = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(xDraft)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=https://link2slide.vercel.app`,
  };

  const handleLinkedInShare = async () => {
    try {
      await navigator.clipboard.writeText(linkedinDraft);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        window.open(shareLinks.linkedin, '_blank');
      }, 1000);
    } catch {
      window.open(shareLinks.linkedin, '_blank');
    }
  };

  return (
    <footer className="mt-auto flex flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-[13px] font-black tracking-[0.2em] text-white/80 uppercase">
          Love the results?
        </h3>
        <p className="max-w-[300px] text-[11px] leading-relaxed text-white/30">
          Built with passion, no ads, no VC. <br />
          Help keep this tool free for everyone.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Support Button */}
        <a
          href="https://ko-fi.com/suryaelidanto"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-3.5 transition-all hover:scale-[1.02] hover:border-rose-500/40 hover:bg-rose-500/10 active:scale-[0.98]"
        >
          <Heart className="h-4 w-4 text-rose-500 transition-all group-hover:scale-110 group-hover:fill-rose-500" />
          <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase">
            Fuel the project
          </span>
        </a>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="group relative flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3.5 transition-all hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-emerald-500/10 active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4 text-emerald-500 transition-all group-hover:rotate-12" />
          <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
            Spread the magic
          </span>
        </button>
      </div>

      {/* Social Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 shadow-2xl"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 text-white/20 transition-colors hover:text-white"
              >
                <CloseX className="h-5 w-5" />
              </button>

              <div className="mb-8">
                <h3 className="mb-2 text-xl font-bold text-white">
                  Share the Love
                </h3>
                <p className="text-sm leading-relaxed text-white/40">
                  Support this independent tool by sharing it with your network.
                  It helps more than you think.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLinkedInShare}
                  className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2]">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white">
                        {copied ? 'Draft Copied!' : 'Share on LinkedIn'}
                      </span>
                      <span className="text-[10px] text-white/20">
                        Copies draft to paste on post
                      </span>
                    </div>
                  </div>
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-white/10 group-hover:text-white/40" />
                  )}
                </button>

                <a
                  href={shareLinks.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-white/80 group-hover:text-white">
                      Post on X (Twitter)
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/10 group-hover:text-white/40" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}
