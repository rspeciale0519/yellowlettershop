'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PredictiveModel } from './types';

type ModelId = PredictiveModel['id'];

interface ModelSelectorProps {
  models: ReadonlyArray<PredictiveModel>;
  selectedModel?: ModelId | null;
  onModelSelect: (modelId: ModelId) => void;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Select Predictive Model</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='sm'>
                <Info className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Choose a model to predict recipient behavior and optimize your
                mailing list
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='grid gap-4'>
        {models.map((model) => (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedModel === model.id ? 'ring-2 ring-primary' : ''
            } ${!model.isActive ? 'opacity-60' : ''}`}
            onClick={() => model.isActive && onModelSelect(model.id)}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {model.features.map((feature, i) => (
                    <Badge
                      key={`${model.id}-${i}`}
                      variant='outline'
                      className='text-xs'
                    >
                      {feature}
                    </Badge>
                  ))}
                  <CardTitle className='text-base'>{model.name}</CardTitle>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge variant={model.isActive ? 'default' : 'secondary'}>
                    {Math.round(model.accuracy * 100)}% accuracy
                  </Badge>
                  {!model.isActive && (
                    <Badge variant='outline'>Coming Soon</Badge>
                  )}
                </div>
              </div>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='flex flex-wrap gap-1'>
                {model.features.map((feature) => (
                  <Badge key={feature} variant='outline' className='text-xs'>
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
