import { useNavigate } from "react-router-dom";
import ResultsScreen from "./components/ResultsScreen";

export default function ResultsPage() {
  const navigate = useNavigate();
  return <ResultsScreen onNext={() => navigate("/")} />;
}
