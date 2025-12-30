import type { EstimatorState } from '../types';

export function getDefaultState(): EstimatorState {
  return {
    projectInfo: {
      projectName: '',
      projectLocation: '',
      projectType: '',
    },
    site: {
      estimationMode: 'output_base',
      totalCoverageDaysPerYear: 365,
      annualLeaveDays: 30,
      sickLeaveDays: 10,
      publicHolidayDays: 10,
      weeklyOffDays: 52,
      shiftLengthHours: 12,
      inputBaseCleaners: 0,
    },
    productivity: {
      manualDetailSqmPerShift: 200,
      manualGeneralSqmPerShift: 300,
    },
    areas: [
      { id: '1', name: 'Corridors', sqm: 0, frequency: 'Daily', bucket: 'Machine' },
      { id: '2', name: 'Kitchens', sqm: 0, frequency: 'Daily', bucket: 'Manual-Detail' },
      { id: '3', name: 'Laundries', sqm: 0, frequency: 'Daily', bucket: 'Manual-Detail' },
      { id: '4', name: 'Lift Lobbies', sqm: 0, frequency: 'Daily', bucket: 'Manual-General' },
      { id: '5', name: 'Staircases', sqm: 0, frequency: 'Daily', bucket: 'Manual-General' },
      { id: '6', name: 'Rooftop / Interlock', sqm: 0, frequency: 'Monthly', bucket: 'Manual-General' },
      { id: '7', name: 'Garbage Rooms', sqm: 0, frequency: 'Daily', bucket: 'Manual-Detail' },
      { id: '8', name: 'Building Circumference', sqm: 0, frequency: 'Weekly', bucket: 'Manual-General' },
    ],
    costs: {
      cleanerSalary: 1200,
      benefitsAllowances: 300,
      supervisorSalary: 3000,
      supervisorCount: 0,
      consumablesPerCleanerPerMonth: 150,
      ppePerCleanerPerYear: 250,
      overheadsPercent: 10,
      profitMarkupPercent: 15,
    },
    machines: [
      {
        id: '1',
        name: 'Scrubber',
        quantity: 1,
        cost: 15000,
        lifeYears: 5,
        maintenancePercent: 10,
        sqmPerHour: 1500,
        effectiveHoursPerShift: 6,
      },
      {
        id: '2',
        name: 'Wet/Dry Vac',
        quantity: 1,
        cost: 2500,
        lifeYears: 4,
        maintenancePercent: 8,
        sqmPerHour: 800,
        effectiveHoursPerShift: 6,
      },
      {
        id: '3',
        name: 'Pressure Washer',
        quantity: 1,
        cost: 3000,
        lifeYears: 4,
        maintenancePercent: 8,
        sqmPerHour: 1000,
        effectiveHoursPerShift: 6,
      },
    ],
  };
}
