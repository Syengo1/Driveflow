"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { STEPS } from "@/lib/constants";

interface StepIndicatorProps {
  currentStep: string;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
      {STEPS.map((step, i) => {
        if (step.id === 'success') return null; // Don't show success step in indicator
        const isActive = currentStepIndex === i;
        const isPast = currentStepIndex > i;
        
        return (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
              isActive ? "bg-yellow-500 text-black" : isPast ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
            )}>
              {isPast ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={cn(
              "text-sm font-medium pr-4",
              isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"
            )}>
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
