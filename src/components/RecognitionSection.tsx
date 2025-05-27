"use client";
import GiveKudosForm from "./GiveKudosForm";
import RecognitionFeed from "./RecognitionFeed";

export default function RecognitionSection({ companyId }: { companyId?: string }) {
  return (
    <section
      className="
        max-w-2xl w-full mx-auto
        bg-white/90 rounded-3xl shadow-xl border border-accent-100 my-12
        overflow-hidden glass-card
        animate-fade-in
      "
      aria-label="Employee Recognition Feed"
    >
      <div className="px-6 pt-7 pb-4 border-b border-accent-100 bg-gradient-to-br from-white via-accent-50 to-accent-100">
        <h2 className="text-2xl font-bold text-accent-700 flex items-center gap-2 mb-2">
          <span className="text-pink-500">💖</span>
          Employee Recognition Feed
        </h2>
        <GiveKudosForm companyId={companyId} />
      </div>
      <div className="p-6 pt-5">
        <RecognitionFeed companyId={companyId} />
      </div>
    </section>
  );
}
