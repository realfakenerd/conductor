import { existsSync } from "node:fs";
import { join } from "node:path";

export interface ResumptionStep {
  step: string;
  file: string;
}

export interface ResumptionResult {
  setup_complete: boolean;
  checklist: Record<string, boolean>;
  next_step: ResumptionStep | null;
}

export function determineResumption(rootDir: string = "."): ResumptionResult {
  const conductorDir = join(rootDir, "conductor");
  const files = [
    "product.md",
    "product-guidelines.md",
    "tech-stack.md",
    "code_styleguides",
    "workflow.md",
  ];

  const checklist: Record<string, boolean> = {};
  for (const filename of files) {
    checklist[filename] = existsSync(join(conductorDir, filename));
  }

  const setupComplete = existsSync(join(conductorDir, "index.md"));
  let nextStep: ResumptionStep | null = null;

  const chain: [string, string][] = [
    ["product.md", "Product Definition"],
    ["product-guidelines.md", "Product Guidelines"],
    ["tech-stack.md", "Technology Stack"],
    ["code_styleguides", "Code Style Guides"],
    ["workflow.md", "Workflow Configuration"],
  ];

  for (const [filename, stepName] of chain) {
    if (!checklist[filename]) {
      nextStep = {
        step: stepName,
        file: filename,
      };
      break;
    }
  }

  return {
    setup_complete: setupComplete,
    checklist,
    next_step: nextStep,
  };
}
