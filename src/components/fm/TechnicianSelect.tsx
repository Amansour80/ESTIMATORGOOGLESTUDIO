import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Settings, ExternalLink, Sparkles, TrendingUp, DollarSign, Zap } from 'lucide-react';
import type { TechnicianType } from '../../types/fm';
import { formatCurrency } from '../../utils/currencyFormatter';
import { suggestTechniciansForTask, type TaskRequirements, type TechnicianMatch } from '../../utils/technicianMatcher';

interface Props {
  technicians: TechnicianType[];
  value: string;
  onChange: (technicianId: string) => void;
  currency: string;
  className?: string;
  placeholder?: string;
  taskContext?: {
    assetCategory: string;
    assetName: string;
    taskName?: string;
    hoursPerVisit: number;
    isReactive: boolean;
    frequency?: string;
  };
  existingWorkload?: Map<string, number>;
  showAISuggestions?: boolean;
}

export default function TechnicianSelect({
  technicians,
  value,
  onChange,
  currency,
  className = '',
  placeholder = 'Select technician...',
  taskContext,
  existingWorkload,
  showAISuggestions = true
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTechnician = technicians.find(t => t.id === value);

  const aiSuggestions = useMemo(() => {
    if (!showAISuggestions || !taskContext || technicians.length === 0) return [];

    const requirements: TaskRequirements = {
      assetCategory: taskContext.assetCategory,
      assetName: taskContext.assetName,
      taskName: taskContext.taskName,
      hoursPerVisit: taskContext.hoursPerVisit,
      isReactive: taskContext.isReactive,
      frequency: taskContext.frequency,
    };

    return suggestTechniciansForTask(requirements, technicians, existingWorkload);
  }, [taskContext, technicians, existingWorkload, showAISuggestions]);

  const getSuggestionForTech = (techId: string): TechnicianMatch | undefined => {
    return aiSuggestions.find(s => s.technicianId === techId);
  };

  const filteredTechnicians = technicians
    .filter(tech => tech.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!showAISuggestions || aiSuggestions.length === 0) return 0;

      const aMatch = getSuggestionForTech(a.id);
      const bMatch = getSuggestionForTech(b.id);

      if (!aMatch && !bMatch) return 0;
      if (!aMatch) return 1;
      if (!bMatch) return -1;

      return bMatch.confidence - aMatch.confidence;
    });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (technicianId: string) => {
    onChange(technicianId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatTotalCompensation = (tech: TechnicianType) => {
    const total = tech.monthlySalary + tech.additionalCost;
    return formatCurrency(total, currency, { decimals: 0, showCode: true });
  };

  if (technicians.length === 0) {
    return (
      <div className="relative">
        <div className={`px-2 py-1 border border-red-300 rounded bg-red-50 text-red-700 text-xs flex items-center justify-between ${className}`}>
          <span>No technicians available - add them in Labor Library</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${className}`}
      >
        <span className={selectedTechnician ? 'text-gray-900' : 'text-gray-500'}>
          {selectedTechnician ? selectedTechnician.name : placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed z-[9999] mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden" style={{
          top: containerRef.current?.getBoundingClientRect().bottom,
          left: containerRef.current?.getBoundingClientRect().left,
          width: containerRef.current?.getBoundingClientRect().width
        }}>
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search technicians..."
                className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredTechnicians.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                No technicians found
              </div>
            ) : (
              <>
                {showAISuggestions && aiSuggestions.length > 0 && aiSuggestions[0].confidence >= 50 && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI Recommendations</span>
                    </div>
                  </div>
                )}
                {filteredTechnicians.map((tech) => {
                  const suggestion = getSuggestionForTech(tech.id);
                  const isTopSuggestion = showAISuggestions && suggestion && suggestion.confidence >= 50;
                  const isGoodMatch = showAISuggestions && suggestion && suggestion.confidence >= 70;

                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => handleSelect(tech.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-l-2 ${
                        tech.id === value
                          ? 'bg-blue-100 border-blue-500'
                          : isGoodMatch
                          ? 'border-green-400 bg-green-50'
                          : isTopSuggestion
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-900">{tech.name}</span>
                          {isGoodMatch && (
                            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Best Match
                            </span>
                          )}
                          {isTopSuggestion && !isGoodMatch && (
                            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                              {suggestion.confidence}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{formatTotalCompensation(tech)}/mo</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 capitalize">{tech.deploymentModel}</span>
                        {tech.canSupervise && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Supervisor</span>
                        )}
                        {suggestion && suggestion.costEfficiency === 'optimal' && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <DollarSign className="w-2.5 h-2.5" />
                            Cost-effective
                          </span>
                        )}
                        {suggestion && suggestion.workloadScore > 80 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            Available
                          </span>
                        )}
                      </div>
                      {suggestion && isTopSuggestion && suggestion.reasons.length > 0 && (
                        <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                          {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-2">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Settings className="w-3 h-3" />
              <span>Manage technicians in Labor Library page</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
