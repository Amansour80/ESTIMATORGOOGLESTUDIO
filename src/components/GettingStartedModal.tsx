import { X, BookOpen, Layers, Wrench, HardHat, Calendar, ClipboardList, Settings, Users, CheckCircle } from 'lucide-react';

interface GettingStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GettingStartedModal({ isOpen, onClose }: GettingStartedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Getting Started Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Smart Estimator</h2>
              <p className="text-lg text-gray-600 mb-4">
                A comprehensive project estimation and management platform for facilities management, housekeeping, and retrofit projects.
              </p>
            </section>

            <section className="mb-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Quick Start
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">1. Sign Up & Login</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Create an account with your email</li>
                    <li>Complete your profile by clicking your avatar in the sidebar</li>
                    <li>Set up your organization details</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">2. First-Time Setup</h4>
                  <div className="space-y-3 ml-4">
                    <div>
                      <p className="font-semibold text-gray-800">Update Organization Details (Settings → Organization)</p>
                      <ul className="list-disc list-inside text-gray-700 ml-4 text-sm">
                        <li>Add your company name and details</li>
                        <li>Upload your company logo</li>
                        <li>Configure color preferences</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Set Up Team Members (Settings → Team Management)</p>
                      <ul className="list-disc list-inside text-gray-700 ml-4 text-sm">
                        <li>Invite team members via email</li>
                        <li>Assign roles (Admin, Estimator, Viewer)</li>
                        <li>Configure module permissions</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Configure Pricing & Costs (Settings → Pricing Configuration)</p>
                      <ul className="list-disc list-inside text-gray-700 ml-4 text-sm">
                        <li>Set default labor rates</li>
                        <li>Configure material markups</li>
                        <li>Define overhead percentages</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">3. Create Your First Project</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Navigate to <strong>Home</strong> from the sidebar</li>
                    <li>Choose your project type:
                      <ul className="list-disc list-inside ml-6 text-sm mt-1">
                        <li><strong>HK Estimator</strong> - Housekeeping projects</li>
                        <li><strong>FM Estimator</strong> - Facilities Management contracts</li>
                        <li><strong>Retrofit Estimator</strong> - Building retrofit projects</li>
                      </ul>
                    </li>
                    <li>Fill in project details and start estimating</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Core Modules</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Layers className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Housekeeping (HK) Estimator</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Calculate staffing requirements for cleaning large facilities
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Area-based calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Productivity standards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Machine and equipment costing</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Wrench className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">FM MEP Estimator</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Price multi-year FM contracts with PPM schedules
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>
                      <span>Asset library with industry standards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>
                      <span>PPM task scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">✓</span>
                      <span>Technician deployment planning</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HardHat className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Retrofit Estimator</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Price HVAC upgrades, lighting retrofits, building improvements
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Two modes: Asset-based and BOQ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Labor library for different trades</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">✓</span>
                      <span>Material catalog & subcontractor management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-slate-700" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Retrofit PM</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Manage active retrofit projects from kickoff to completion
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✓</span>
                      <span>Activity scheduling with dependencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✓</span>
                      <span>Budget tracking & Gantt charts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 mt-0.5">✓</span>
                      <span>Document & issue management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <ClipboardList className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Inquiries</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Track incoming project requests and convert to estimates
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Quick Workflow:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      <span>Log client inquiries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      <span>Track inquiry status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      <span>One-click conversion to estimates</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Approvals</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Route projects through your organization's approval process
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Visual workflow builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Role-based approvals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">✓</span>
                      <span>Conditional routing & notifications</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">User Roles & Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Admin</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create and edit all projects</li>
                    <li>• Approve projects regardless of status</li>
                    <li>• Manage team members</li>
                    <li>• Access all modules</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Estimator</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create and edit draft projects</li>
                    <li>• Submit projects for approval</li>
                    <li>• View assigned projects</li>
                    <li>• Access estimation modules</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Viewer</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Read-only access to projects</li>
                    <li>• View reports and dashboards</li>
                    <li>• Cannot create or edit projects</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Custom Roles</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create role based on specific needs</li>
                    <li>• Customize module permissions</li>
                    <li>• Control approval capabilities</li>
                    <li>• Define access levels per role</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 italic">
                Note: Permissions can be customized per module in Settings → Roles & Permissions
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tips & Best Practices</h3>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-2">For Estimators</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Save Often</strong> - Projects auto-save on navigation, but manual saves ensure data security</li>
                    <li>• <strong>Use Templates</strong> - Set up common configurations in your libraries</li>
                    <li>• <strong>Validate Before Submit</strong> - Review all calculations before submitting for approval</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">For Admins</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Configure Workflows Early</strong> - Set up approval workflows before team starts estimating</li>
                    <li>• <strong>Define Clear Roles</strong> - Use role-based permissions to control access</li>
                    <li>• <strong>Monitor Usage</strong> - Use Dashboard to track team productivity</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-bold text-amber-900 mb-2">For Project Managers</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Set Realistic Baselines</strong> - Use approved estimates as budget baselines</li>
                    <li>• <strong>Track Costs Daily</strong> - Log costs as they occur, not at month-end</li>
                    <li>• <strong>Update Progress Weekly</strong> - Keep activity progress current</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8 bg-slate-100 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Common Questions</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-gray-900 mb-1">Q: Can I import existing data?</p>
                  <p className="text-sm text-gray-700">A: Yes! Most modules support Excel import. Use the import buttons in Asset Library, FM Estimator, and Retrofit BOQ mode.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Q: How do I add team members?</p>
                  <p className="text-sm text-gray-700">A: Go to Settings → Team Management → Click "Add Member" or use Complementary Users for free access.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Q: What happens when I submit for approval?</p>
                  <p className="text-sm text-gray-700">A: The system routes your project through the configured approval workflow. You'll receive notifications at each stage.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Q: Can I customize approval workflows?</p>
                  <p className="text-sm text-gray-700">A: Yes! Admins can create custom workflows with conditional routing in Settings → Approval Workflows.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
