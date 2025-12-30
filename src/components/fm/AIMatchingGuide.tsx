import { Sparkles, Target, TrendingUp, DollarSign, Zap, Brain } from 'lucide-react';

export default function AIMatchingGuide() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI-Powered Technician Matching
          </h3>
          <p className="text-xs text-gray-700 mb-3">
            Our intelligent system automatically suggests the best technician for each task based on multiple factors:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Skill Matching</div>
                <div className="text-xs text-gray-600">
                  Analyzes asset type, category, and task requirements to match with technician specializations
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Experience Level</div>
                <div className="text-xs text-gray-600">
                  Matches task complexity with technician expertise to ensure quality and efficiency
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Workload Balance</div>
                <div className="text-xs text-gray-600">
                  Considers current task assignments to prevent overloading and maintain balanced distribution
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-gray-900">Cost Optimization</div>
                <div className="text-xs text-gray-600">
                  Recommends cost-effective matches by aligning technician rates with task requirements
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              <span className="font-medium">Look for highlighted suggestions when selecting technicians:</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded">
                <Sparkles className="w-3 h-3" />
                Best Match (70%+)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                Good Match (50-69%)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300">
                <DollarSign className="w-3 h-3" />
                Cost-effective
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-300">
                <Zap className="w-3 h-3" />
                Available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
