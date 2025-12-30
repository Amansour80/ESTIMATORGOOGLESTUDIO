import type { SavedHKProject } from './hkDatabase';
import type { SavedProject } from './fmDatabase';
import type { SavedRetrofitProject } from './retrofitDatabase';
import type { ProjectStatus } from '../types/projectStatus';
import {
  calculateDailyTotalsByBucket,
  calculateMachineDailyTotals,
  calcActiveCleaners,
  calculateMachineryCosts,
  calculateManpowerCosts,
  calculateConsumables,
  calculatePricing,
  calculateWorkingDaysPerYear,
  calculateCoverageFactor,
  calculateRelievers,
} from './calculations';
import { calculateFMResults } from './fmCalculations';
import { calculateRetrofitResults } from './retrofitCalculations';

export interface DashboardMetrics {
  totalProjectsCount: number;
  totalProjectsValue: number;

  draftCount: number;
  draftValue: number;

  submittedCount: number;
  submittedValue: number;

  awardedCount: number;
  awardedValue: number;

  lostCount: number;
  lostValue: number;

  cancelledCount: number;
  cancelledValue: number;

  winRate: number;

  hkCount: number;
  hkValue: number;
  hkWinRate: number;
  hkDecidedCount: number;
  hkAwardedCount: number;

  fmCount: number;
  fmValue: number;
  fmWinRate: number;
  fmDecidedCount: number;
  fmAwardedCount: number;

  retrofitCount: number;
  retrofitValue: number;
  retrofitWinRate: number;
  retrofitDecidedCount: number;
  retrofitAwardedCount: number;

  avgHKValue: number;
  avgFMValue: number;
  avgRetrofitValue: number;

  recentProjects: Array<{
    id: string;
    name: string;
    type: 'hk' | 'fm' | 'retrofit';
    value: number;
    status: ProjectStatus;
    updatedAt: string;
  }>;
}

export interface MonthlyTrend {
  month: string;
  created: number;
  submitted: number;
  awarded: number;
  value: number;
}

const getHKProjectValue = (project: SavedHKProject): number => {
  try {
    if (!project.project_data) return 0;

    const state = project.project_data;
    const workingDaysPerYear = calculateWorkingDaysPerYear(
      state.site.annualLeaveDays,
      state.site.sickLeaveDays,
      state.site.publicHolidayDays,
      state.site.weeklyOffDays
    );

    const coverageFactor = calculateCoverageFactor(workingDaysPerYear);

    const dailyTotals = calculateDailyTotalsByBucket(state.areas);
    const machineDailyTotals = calculateMachineDailyTotals(state.areas);

    let activeCleanersTotal: number;
    if (state.site.estimationMode === 'input_base') {
      activeCleanersTotal = state.site.inputBaseCleaners || 0;
    } else {
      const activeCleaners = calcActiveCleaners(
        dailyTotals,
        state.productivity,
        machineDailyTotals,
        state.machines
      );
      activeCleanersTotal = activeCleaners.total;
    }

    const relieversCount = calculateRelievers(activeCleanersTotal, coverageFactor);
    const totalCleanersInclRelievers = activeCleanersTotal + relieversCount;

    const activeCleaners = calcActiveCleaners(
      dailyTotals,
      state.productivity,
      machineDailyTotals,
      state.machines
    );

    const machineryCosts = calculateMachineryCosts(activeCleaners.machineCleaners, state.machines);
    const manpowerCosts = calculateManpowerCosts(totalCleanersInclRelievers, state.costs);
    const consumablesCost = calculateConsumables(totalCleanersInclRelievers, state.costs);

    const pricing = calculatePricing(
      manpowerCosts.totalAnnualManpower,
      machineryCosts.totalAnnualMachineryCost,
      consumablesCost,
      state.costs
    );

    return pricing.finalPriceAnnual;
  } catch (error) {
    console.error('Error calculating HK project value:', error);
    return 0;
  }
};

const getFMProjectValue = (project: SavedProject): number => {
  try {
    if (!project.project_data) return 0;

    const results = calculateFMResults(project.project_data);
    return results.grandTotal;
  } catch (error) {
    console.error('Error calculating FM project value:', error);
    return 0;
  }
};

const getRetrofitProjectValue = (project: SavedRetrofitProject): number => {
  try {
    if (!project.project_data) return 0;

    const results = calculateRetrofitResults(project.project_data);
    return results.grandTotal;
  } catch (error) {
    console.error('Error calculating Retrofit project value:', error);
    return 0;
  }
};

export const calculateDashboardMetrics = (
  hkProjects: SavedHKProject[],
  fmProjects: SavedProject[],
  retrofitProjects: SavedRetrofitProject[]
): DashboardMetrics => {
  const allProjects = [
    ...hkProjects.map(p => ({ ...p, type: 'hk' as const, value: getHKProjectValue(p) })),
    ...fmProjects.map(p => ({ ...p, type: 'fm' as const, value: getFMProjectValue(p) })),
    ...retrofitProjects.map(p => ({ ...p, type: 'retrofit' as const, value: getRetrofitProjectValue(p) })),
  ];

  const totalProjectsCount = allProjects.length;
  const totalProjectsValue = allProjects.reduce((sum, p) => sum + p.value, 0);

  const draftProjects = allProjects.filter(p => p.status === 'DRAFT');
  const submittedProjects = allProjects.filter(p => p.status === 'SUBMITTED');
  const awardedProjects = allProjects.filter(p => p.status === 'AWARDED');
  const lostProjects = allProjects.filter(p => p.status === 'LOST');
  const cancelledProjects = allProjects.filter(p => p.status === 'CANCELLED');

  const draftCount = draftProjects.length;
  const draftValue = draftProjects.reduce((sum, p) => sum + p.value, 0);

  const submittedCount = submittedProjects.length;
  const submittedValue = submittedProjects.reduce((sum, p) => sum + p.value, 0);

  const awardedCount = awardedProjects.length;
  const awardedValue = awardedProjects.reduce((sum, p) => sum + p.value, 0);

  const lostCount = lostProjects.length;
  const lostValue = lostProjects.reduce((sum, p) => sum + p.value, 0);

  const cancelledCount = cancelledProjects.length;
  const cancelledValue = cancelledProjects.reduce((sum, p) => sum + p.value, 0);

  const decidedProjects = awardedCount + lostCount;
  const winRate = decidedProjects > 0 ? (awardedCount / decidedProjects) * 100 : 0;

  const hkProjectsWithValues = hkProjects.map(p => ({ ...p, value: getHKProjectValue(p) }));
  const fmProjectsWithValues = fmProjects.map(p => ({ ...p, value: getFMProjectValue(p) }));
  const retrofitProjectsWithValues = retrofitProjects.map(p => ({ ...p, value: getRetrofitProjectValue(p) }));

  const hkCount = hkProjectsWithValues.length;
  const hkValue = hkProjectsWithValues.reduce((sum, p) => sum + p.value, 0);
  const hkAwardedCount = hkProjectsWithValues.filter(p => p.status === 'AWARDED').length;
  const hkDecidedCount = hkProjectsWithValues.filter(p => p.status === 'AWARDED' || p.status === 'LOST').length;
  const hkWinRate = hkDecidedCount > 0 ? (hkAwardedCount / hkDecidedCount) * 100 : 0;

  const fmCount = fmProjectsWithValues.length;
  const fmValue = fmProjectsWithValues.reduce((sum, p) => sum + p.value, 0);
  const fmAwardedCount = fmProjectsWithValues.filter(p => p.status === 'AWARDED').length;
  const fmDecidedCount = fmProjectsWithValues.filter(p => p.status === 'AWARDED' || p.status === 'LOST').length;
  const fmWinRate = fmDecidedCount > 0 ? (fmAwardedCount / fmDecidedCount) * 100 : 0;

  const retrofitCount = retrofitProjectsWithValues.length;
  const retrofitValue = retrofitProjectsWithValues.reduce((sum, p) => sum + p.value, 0);
  const retrofitAwardedCount = retrofitProjectsWithValues.filter(p => p.status === 'AWARDED').length;
  const retrofitDecidedCount = retrofitProjectsWithValues.filter(p => p.status === 'AWARDED' || p.status === 'LOST').length;
  const retrofitWinRate = retrofitDecidedCount > 0 ? (retrofitAwardedCount / retrofitDecidedCount) * 100 : 0;

  const avgHKValue = hkCount > 0 ? hkValue / hkCount : 0;
  const avgFMValue = fmCount > 0 ? fmValue / fmCount : 0;
  const avgRetrofitValue = retrofitCount > 0 ? retrofitValue / retrofitCount : 0;

  const recentProjects = allProjects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      name: p.project_name,
      type: p.type,
      value: p.value,
      status: p.status || 'DRAFT',
      updatedAt: p.updated_at,
    }));

  return {
    totalProjectsCount,
    totalProjectsValue,
    draftCount,
    draftValue,
    submittedCount,
    submittedValue,
    awardedCount,
    awardedValue,
    lostCount,
    lostValue,
    cancelledCount,
    cancelledValue,
    winRate,
    hkCount,
    hkValue,
    hkWinRate,
    hkDecidedCount,
    hkAwardedCount,
    fmCount,
    fmValue,
    fmWinRate,
    fmDecidedCount,
    fmAwardedCount,
    retrofitCount,
    retrofitValue,
    retrofitWinRate,
    retrofitDecidedCount,
    retrofitAwardedCount,
    avgHKValue,
    avgFMValue,
    avgRetrofitValue,
    recentProjects,
  };
};

export const calculateMonthlyTrends = (
  hkProjects: SavedHKProject[],
  fmProjects: SavedProject[],
  retrofitProjects: SavedRetrofitProject[],
  months: number = 6
): MonthlyTrend[] => {
  const allProjects = [
    ...hkProjects.map(p => ({ ...p, type: 'hk' as const, value: getHKProjectValue(p) })),
    ...fmProjects.map(p => ({ ...p, type: 'fm' as const, value: getFMProjectValue(p) })),
    ...retrofitProjects.map(p => ({ ...p, type: 'retrofit' as const, value: getRetrofitProjectValue(p) })),
  ];

  const now = new Date();
  const trends: MonthlyTrend[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthProjects = allProjects.filter(p => {
      const createdDate = new Date(p.created_at);
      return createdDate.getFullYear() === year && createdDate.getMonth() === month;
    });

    const created = monthProjects.length;
    const submitted = monthProjects.filter(p =>
      p.status === 'SUBMITTED' || p.status === 'AWARDED' || p.status === 'LOST'
    ).length;
    const awarded = monthProjects.filter(p => p.status === 'AWARDED').length;
    const value = monthProjects.reduce((sum, p) => sum + p.value, 0);

    trends.push({
      month: monthName,
      created,
      submitted,
      awarded,
      value,
    });
  }

  return trends;
};
