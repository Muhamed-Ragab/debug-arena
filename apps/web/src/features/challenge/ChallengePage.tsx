import { useNavigate, useParams } from "react-router-dom";
import { useChallenge } from "./hooks/useChallenge";
import ChallengeScreen from "./components/ChallengeScreen";

export default function ChallengePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const challenge = useChallenge(id);

  return (
    <ChallengeScreen
      challenge={challenge}
      onSubmit={() => navigate(`/submissions/${challenge.id}/results`)}
    />
  );
}
