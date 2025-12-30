import { RetrofitState } from '../types/retrofit';

export function getDefaultRetrofitState(): RetrofitState {
  return {
    projectInfo: {
      projectName: '',
      projectLocation: '',
      clientName: '',
      projectDescription: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    projectPhases: [
      {
        id: crypto.randomUUID(),
        name: 'Design & Engineering',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationDays: 14,
      },
      {
        id: crypto.randomUUID(),
        name: 'Procurement',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationDays: 30,
      },
      {
        id: crypto.randomUUID(),
        name: 'Installation',
        startDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationDays: 30,
      },
      {
        id: crypto.randomUUID(),
        name: 'Testing & Commissioning',
        startDate: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationDays: 14,
      },
      {
        id: crypto.randomUUID(),
        name: 'Warranty Period',
        startDate: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 453 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        durationDays: 365,
      },
    ],
    laborLibrary: [
      {
        id: crypto.randomUUID(),
        role: 'HVAC Technician',
        hourlyRate: 50,
        notes: '',
      },
      {
        id: crypto.randomUUID(),
        role: 'Electrician',
        hourlyRate: 55,
        notes: '',
      },
      {
        id: crypto.randomUUID(),
        role: 'Site Supervisor',
        hourlyRate: 75,
        notes: '',
      },
      {
        id: crypto.randomUUID(),
        role: 'General Helper',
        hourlyRate: 30,
        notes: '',
      },
    ],
    manpowerItems: [],
    assets: [],
    materialsCatalog: [],
    subcontractors: [],
    supervisionRoles: [],
    logisticsItems: [],
    costConfig: {
      overheadsPercent: 15,
      profitPercent: 10,
      performanceBondPercent: 5,
      insurancePercent: 2,
      warrantyPercent: 3,
      riskContingencyPercent: 5,
      pmGeneralsPercent: 10,
    },
  };
}
