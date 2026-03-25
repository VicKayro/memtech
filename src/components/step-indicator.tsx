'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Upload', optional: false },
  { id: 2, label: 'Analyse', optional: false },
  { id: 3, label: 'Trame', optional: false },
  { id: 4, label: 'Chiffrage', optional: true },
  { id: 5, label: 'Brouillon', optional: false },
];

interface StepIndicatorProps {
  current: number;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step.id < current
                  ? 'bg-blue-600 text-white'
                  : step.id === current
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : step.optional
                      ? 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                      : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.id < current ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium leading-tight ${
                  step.id <= current ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {step.optional && step.id > current && (
                <span className="text-[10px] text-gray-400 leading-tight">optionnel</span>
              )}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 mx-3 ${
                step.id < current ? 'bg-blue-600' : 'bg-gray-200'
              } ${
                step.optional || STEPS[i + 1]?.optional ? 'w-8 border-t-2 border-dashed border-gray-300 bg-transparent' : 'w-12'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
