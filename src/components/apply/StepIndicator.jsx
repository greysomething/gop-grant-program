import React from 'react';
import { Check } from 'lucide-react';

export default function StepIndicator({ currentStep, steps }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <li key={step.name} className="md:flex-1">
              <div
                className={`group flex flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                  isCompleted
                    ? 'border-rose-600'
                    : isCurrent
                    ? 'border-rose-600'
                    : 'border-gray-200 group-hover:border-gray-300'
                }`}
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'text-rose-600'
                      : isCurrent
                      ? 'text-rose-600'
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {`Step ${stepNumber}`}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}