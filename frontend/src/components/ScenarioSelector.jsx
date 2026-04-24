import { practiceScenarios } from "../state/learningOptions";
import { Button } from "./ui/button";

export default function ScenarioSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {practiceScenarios.map((scenario) => (
        <Button
          key={scenario}
          type="button"
          variant={scenario === value ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange(scenario)}
        >
          {scenario}
        </Button>
      ))}
    </div>
  );
}
