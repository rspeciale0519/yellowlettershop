'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface DraggableSliderProps {
  label: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export function DraggableSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue = (val) => val.toString(),
}: DraggableSliderProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="px-2">
        <Slider
          value={value}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{formatValue(value[0] || min)}</span>
        <span>{formatValue(value[1] || max)}</span>
      </div>
    </div>
  );
}