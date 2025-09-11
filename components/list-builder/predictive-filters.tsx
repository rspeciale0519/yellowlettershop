'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Info,
  TrendingUp,
  Target,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import type { PredictiveCriteria } from '@/types/list-builder';

interface PredictiveFiltersProps {
  criteria: PredictiveCriteria;
  onUpdate: (values: Partial<PredictiveCriteria>) => void;
}

const PREDICTIVE_CRITERIA_OPTIONS = [
  {
    id: 'lifestyle-predictors',
    name: 'Lifestyle Predictors',
    description: 'Target based on predicted lifestyle behaviors and interests',
    icon: TrendingUp,
  },
  {
    id: 'financial-behavior',
    name: 'Financial Behavior',
    description: 'Target based on predicted financial and purchasing patterns',
    icon: DollarSign,
  },
  {
    id: 'property-behavior',
    name: 'Property Behavior',
    description: 'Target based on predicted real estate actions',
    icon: Target,
  },
  {
    id: 'communication-preferences',
    name: 'Communication Preferences',
    description: 'Target based on predicted response patterns to different channels',
    icon: MessageSquare,
  },
];

const PREFERENCE_OPTIONS = [
  { value: 'likely', label: 'Likely' },
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'no-preference', label: 'No Preference' },
];

const ADOPTION_OPTIONS = [
  { value: 'early', label: 'Early Adopter' },
  { value: 'late', label: 'Late Adopter' },
  { value: 'no-preference', label: 'No Preference' },
];

export function PredictiveFilters({
  criteria,
  onUpdate,
}: PredictiveFiltersProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>('');
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  const addCriterion = useCallback(() => {
    const currentCriteria = criteria?.selectedCriteria || [];
    if (
      selectedCriterion &&
      !currentCriteria.includes(selectedCriterion)
    ) {
      onUpdate({
        selectedCriteria: [...currentCriteria, selectedCriterion],
      });
      setExpandedPanels((prev) => [...prev, selectedCriterion]);
      setSelectedCriterion('');
    }
  }, [selectedCriterion, criteria?.selectedCriteria, onUpdate]);

  const removeCriterion = useCallback(
    (criterion: string) => {
      const currentCriteria = criteria?.selectedCriteria || [];
      onUpdate({
        selectedCriteria: currentCriteria.filter(
          (c) => c !== criterion
        ),
      });
      setExpandedPanels((prev) => prev.filter((p) => p !== criterion));
    },
    [criteria?.selectedCriteria, onUpdate]
  );

  const togglePanel = useCallback((criterion: string) => {
    setExpandedPanels((prev) =>
      prev.includes(criterion)
        ? prev.filter((p) => p !== criterion)
        : [...prev, criterion]
    );
  }, []);

  const updateLifestylePredictors = useCallback(
    (field: string, value: string) => {
      onUpdate({
        lifestylePredictors: {
          ...criteria.lifestylePredictors,
          [field]: value,
        },
      });
    },
    [criteria.lifestylePredictors, onUpdate]
  );

  const updateFinancialBehavior = useCallback(
    (field: string, value: string) => {
      onUpdate({
        financialBehavior: {
          ...criteria.financialBehavior,
          [field]: value,
        },
      });
    },
    [criteria.financialBehavior, onUpdate]
  );

  const updatePropertyBehavior = useCallback(
    (field: string, value: string) => {
      onUpdate({
        propertyBehavior: {
          ...criteria.propertyBehavior,
          [field]: value,
        },
      });
    },
    [criteria.propertyBehavior, onUpdate]
  );

  const updateCommunicationPreferences = useCallback(
    (field: string, value: string) => {
      onUpdate({
        communicationPreferences: {
          ...criteria.communicationPreferences,
          [field]: value,
        },
      });
    },
    [criteria.communicationPreferences, onUpdate]
  );

  const selectedCriteria = criteria?.selectedCriteria || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-500" />
            Predictive Targeting
          </CardTitle>
          <CardDescription>
            Use AI-powered predictive models to target prospects based on their likely behaviors, 
            interests, and responsiveness patterns. These models analyze thousands of data points 
            to predict consumer behavior.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Predictive Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a predictive criteria..." />
              </SelectTrigger>
              <SelectContent>
                {PREDICTIVE_CRITERIA_OPTIONS.filter(
                  (option) => !selectedCriteria.includes(option.id)
                ).map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addCriterion}
              disabled={!selectedCriterion}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Criteria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Criteria */}
      {selectedCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Predictive Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCriteria.map((criterion) => {
              const option = PREDICTIVE_CRITERIA_OPTIONS.find(
                (opt) => opt.id === criterion
              );
              if (!option) return null;

              return (
                <Collapsible
                  key={criterion}
                  open={expandedPanels.includes(criterion)}
                  onOpenChange={() => togglePanel(criterion)}
                >
                  <div className="border rounded-lg p-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                      <div className="flex items-center gap-3">
                        <option.icon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{option.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCriterion(criterion);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {expandedPanels.includes(criterion) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4 pt-4 border-t">
                      {criterion === 'lifestyle-predictors' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Home Improvement Interest</Label>
                            <Select
                              value={criteria.lifestylePredictors?.homeImprovement || 'no-preference'}
                              onValueChange={(value) => updateLifestylePredictors('homeImprovement', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Auto Shopping Interest</Label>
                            <Select
                              value={criteria.lifestylePredictors?.autoShopping || 'no-preference'}
                              onValueChange={(value) => updateLifestylePredictors('autoShopping', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Investment Interest</Label>
                            <Select
                              value={criteria.lifestylePredictors?.investmentInterest || 'no-preference'}
                              onValueChange={(value) => updateLifestylePredictors('investmentInterest', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Health Consciousness</Label>
                            <Select
                              value={criteria.lifestylePredictors?.healthConsciousness || 'no-preference'}
                              onValueChange={(value) => updateLifestylePredictors('healthConsciousness', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Technology Adoption</Label>
                            <Select
                              value={criteria.lifestylePredictors?.technologyAdoption || 'no-preference'}
                              onValueChange={(value) => updateLifestylePredictors('technologyAdoption', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ADOPTION_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {criterion === 'financial-behavior' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Credit Seeking Behavior</Label>
                            <Select
                              value={criteria.financialBehavior?.creditSeeker || 'no-preference'}
                              onValueChange={(value) => updateFinancialBehavior('creditSeeker', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Big Ticket Shopping</Label>
                            <Select
                              value={criteria.financialBehavior?.bigTicketShopper || 'no-preference'}
                              onValueChange={(value) => updateFinancialBehavior('bigTicketShopper', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Online Shopping Preference</Label>
                            <Select
                              value={criteria.financialBehavior?.onlineShopper || 'no-preference'}
                              onValueChange={(value) => updateFinancialBehavior('onlineShopper', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Brand Loyalty</Label>
                            <Select
                              value={criteria.financialBehavior?.brandLoyal || 'no-preference'}
                              onValueChange={(value) => updateFinancialBehavior('brandLoyal', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {criterion === 'property-behavior' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Likely to Move</Label>
                            <Select
                              value={criteria.propertyBehavior?.likelyToMove || 'no-preference'}
                              onValueChange={(value) => updatePropertyBehavior('likelyToMove', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Likely to Refinance</Label>
                            <Select
                              value={criteria.propertyBehavior?.likelyToRefinance || 'no-preference'}
                              onValueChange={(value) => updatePropertyBehavior('likelyToRefinance', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Likely to Sell</Label>
                            <Select
                              value={criteria.propertyBehavior?.likelyToSell || 'no-preference'}
                              onValueChange={(value) => updatePropertyBehavior('likelyToSell', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Home Equity Usage</Label>
                            <Select
                              value={criteria.propertyBehavior?.homeEquityUser || 'no-preference'}
                              onValueChange={(value) => updatePropertyBehavior('homeEquityUser', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {criterion === 'communication-preferences' && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Responsive to Direct Mail</Label>
                            <Select
                              value={criteria.communicationPreferences?.responsiveToDirectMail || 'no-preference'}
                              onValueChange={(value) => updateCommunicationPreferences('responsiveToDirectMail', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Responsive to Email</Label>
                            <Select
                              value={criteria.communicationPreferences?.responsiveToEmail || 'no-preference'}
                              onValueChange={(value) => updateCommunicationPreferences('responsiveToEmail', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Responsive to Phone</Label>
                            <Select
                              value={criteria.communicationPreferences?.responsiveToPhone || 'no-preference'}
                              onValueChange={(value) => updateCommunicationPreferences('responsiveToPhone', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Social Media Active</Label>
                            <Select
                              value={criteria.communicationPreferences?.socialMediaActive || 'no-preference'}
                              onValueChange={(value) => updateCommunicationPreferences('socialMediaActive', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PREFERENCE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Predictive models are based on statistical analysis of consumer behavior patterns. 
          Results are probabilistic and should be combined with other targeting criteria for best results.
        </AlertDescription>
      </Alert>
    </div>
  );
}