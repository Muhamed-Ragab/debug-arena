import type { Challenge } from "../../../lib/types";
import { CATEGORY_CONFIG } from "../../../lib/categories";
import { useChallengeWorkspace } from "../hooks/useChallengeWorkspace";
import ChallengeScenario from "./ChallengeScenario";
import CodeViewer from "./CodeViewer";
import ChallengeTabs from "./ChallengeTabs";
import SubmitBar from "./SubmitBar";
import TopBar from "../../../components/layout/TopBar";

interface Props {
  challenge: Challenge;
  onSubmit: () => void;
}

export default function ChallengeScreen({ challenge, onSubmit }: Props) {
  const cfg = CATEGORY_CONFIG[challenge.category];
  const ws = useChallengeWorkspace(onSubmit);

  return (
    <div className="flex h-full w-full flex-col">
      <TopBar
        crumbs={[
          { label: "Challenges", to: "/challenges" },
          { label: challenge.title },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <ChallengeScenario
        challenge={challenge}
        cfg={cfg}
        treeOpen={ws.treeOpen}
        setTreeOpen={ws.setTreeOpen}
      />
      <CodeViewer cfg={cfg} selectedLine={ws.selectedLine} onToggleLine={ws.toggleLine} />
      <div
        className="w-full shrink-0 flex flex-col border-t border-s lg:w-[308px] lg:border-t-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <ChallengeTabs
          rightTab={ws.rightTab}
          setRightTab={ws.setRightTab}
          explanation={ws.explanation}
          setExplanation={ws.setExplanation}
          hintsOpen={ws.hintsOpen}
          toggleHint={ws.toggleHint}
        />
        <SubmitBar
          selectedLine={ws.selectedLine}
          isSubmitting={ws.isSubmitting}
          onSubmit={ws.submit}
        />
      </div>
    </div>
    </div>
  );
}
