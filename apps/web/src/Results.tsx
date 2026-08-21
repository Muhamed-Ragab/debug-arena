import { useNavigate } from "react-router-dom";
import ResultsScreen from "./components/results/ResultsScreen";

export default function Results() {
  const navigate = useNavigate();
  return <ResultsScreen onNext={() => navigate("/")} />;
}
