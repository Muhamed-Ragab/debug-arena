import type { Challenge } from "../../lib/types";
import { CATEGORY_CONFIG } from "../../data/categories";
import { useChallengeWorkspace } from "../../hooks/useChallengeWorkspace";
import ChallengeScenario from "./ChallengeScenario";
import CodeViewer from "./CodeViewer";
import ChallengeTabs from "./ChallengeTabs";
import SubmitBar from "./SubmitBar";

interface Props {
  challenge: Challenge;
  onSubmit: () => void;
}

export default function ChallengeScreen({ challenge, onSubmit }: Props) {
  const cfg = CATEGORY_CONFIG[challenge.category];
  const ws = useChallengeWorkspace(onSubmit);

  return (
    <div className="flex h-full overflow-hidden">
      <ChallengeScenario
        challenge={challenge}
        cfg={cfg}
        treeOpen={ws.treeOpen}
        setTreeOpen={ws.setTreeOpen}
      />
      <CodeViewer cfg={cfg} selectedLine={ws.selectedLine} onToggleLine={ws.toggleLine} />
      <div
        className="w-[308px] shrink-0 flex flex-col border-l"
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
  );
}
