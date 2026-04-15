import { useState } from "react";
import { X, ArrowLeft } from "lucide-react";
import {
  GeneratedContent,
  Flashcard,
  TestQuestion,
  StructuredSummary,
  InteractiveMindmap,
} from "@/types";
import { useNotebookXP } from "@/hooks/useNotebookXP";
import TestViewer from "./TestViewer";
import FlashcardViewer from "./FlashcardViewer";
import SummaryViewer from "./SummaryViewer";
import PodcastViewer from "./PodcastViewer";
import EsquemaInteractivo from "./EsquemaInteractivo";
import XPBar from "./XPBar";
import PomodoroTimer from "./PomodoroTimer";
import StudyChat from "./StudyChat";
import AchievementPopup from "./AchievementPopup";

interface ContentModalProps {
  content: GeneratedContent;
  notebookId: string;
  onClose: () => void;
  onAddToSRS?: () => void;
}

export default function ContentModal({
  content,
  notebookId,
  onClose,
  onAddToSRS,
}: ContentModalProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);

  const {
    notebookXP,
    currentSessionXP,
    recentAchievement,
    showAchievement,
    addXP,
    recordTestAnswer,
    completeTest,
    dismissAchievement,
    XP_AWARDS,
  } = useNotebookXP(notebookId);

  const handleTestAnswer = () => {
    recordTestAnswer(true);
    addXP(XP_AWARDS.TEST_CORRECT);
  };

  const handleTestComplete = (correct: number, total: number) => {
    completeTest(correct, total);
  };

  const handleSummaryRead = () => {
    addXP(XP_AWARDS.SUMMARY_READ, "summary_read");
  };

  const handleFlashcardComplete = () => {
    addXP(XP_AWARDS.TEST_COMPLETE, "flashcard_complete");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Achievement Popup */}
      <AchievementPopup
        achievement={recentAchievement}
        show={showAchievement}
        onDismiss={dismissAchievement}
      />

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </button>

          <div className="h-6 w-px bg-border" />

          <h2 className="text-lg font-semibold text-foreground">
            {content.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Pomodoro */}
          <PomodoroTimer compact />

          {/* XP Bar */}
          <XPBar
            level={notebookXP.level}
            xp={notebookXP.xp}
            currentSessionXP={currentSessionXP}
            showSession
            compact
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Area - Scroll horizontal e independiente */}
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            {/* Type-specific viewer */}
            {content.type === "test" && (
              <div className="p-6">
                <div className="max-w-3xl mx-auto">
                  <TestViewer
                    title={content.title}
                    questions={content.content as TestQuestion[]}
                    onAnswerCorrect={handleTestAnswer}
                    onComplete={handleTestComplete}
                    onXPChange={xp => addXP(xp)}
                  />
                </div>
              </div>
            )}

            {content.type === "flashcards" && (
              <div className="p-6">
                <div className="max-w-3xl mx-auto">
                  <FlashcardViewer
                    title={content.title}
                    flashcards={content.content as Flashcard[]}
                    onComplete={handleFlashcardComplete}
                    onAddToSRS={onAddToSRS}
                  />
                </div>
              </div>
            )}

            {content.type === "summary" && (
              <div className="p-6">
                <div className="max-w-3xl mx-auto">
                  <SummaryViewer
                    title={content.title}
                    content={content.content as string | StructuredSummary}
                    onRead={handleSummaryRead}
                  />
                </div>
              </div>
            )}

            {content.type === "mindmap" && (
              <div className="h-full min-h-0">
                <EsquemaInteractivo
                  mindmap={content.content as InteractiveMindmap}
                  notebookName={content.title.replace("Esquema: ", "")}
                />
              </div>
            )}

            {content.type === "podcast" && (
              <div className="p-6">
                <div className="max-w-3xl mx-auto">
                  <PodcastViewer
                    title={content.title}
                    podcastData={content.content as any}
                    onComplete={() => addXP(XP_AWARDS.SUMMARY_READ)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar - Collapsible */}
        <div
          className={`border-l border-border transition-all duration-300 ${
            chatExpanded ? (chatMaximized ? "w-[60%]" : "w-[40%]") : "w-16"
          }`}
        >
          {/* Chat Header */}
          <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            {!chatExpanded ? (
              <button
                onClick={() => setChatExpanded(true)}
                className="w-full flex items-center justify-center"
              >
                <span className="text-xl">💬</span>
              </button>
            ) : (
              <>
                <span className="text-sm font-medium text-foreground">
                  Chat de Estudio
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setChatMaximized(!chatMaximized)}
                    className="p-1.5 hover:bg-secondary rounded transition-colors"
                    title={chatMaximized ? "Minimizar" : "Maximizar"}
                  >
                    {chatMaximized ? (
                      <span className="text-xs">🔽</span>
                    ) : (
                      <span className="text-xs">🔼</span>
                    )}
                  </button>
                  <button
                    onClick={() => setChatExpanded(false)}
                    className="p-1.5 hover:bg-secondary rounded transition-colors"
                    title="Cerrar"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Chat Content */}
          {chatExpanded && (
            <div className="h-[calc(100%-52px)]">
              <StudyChat context={content.title} isMaximized={chatMaximized} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
