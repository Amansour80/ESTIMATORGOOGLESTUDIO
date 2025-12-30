import { supabase } from '../lib/supabase';

export interface BDMetrics {
  totalInquiries: number;
  newInquiries: number;
  inReviewInquiries: number;
  convertedInquiries: number;
  lostInquiries: number;
  conversionRate: number;
  averageResponseTime: number;
  averageConversionTime: number;
  estimatedPipelineValue: number;
  convertedValue: number;
  monthlyInquiryTrend: Array<{ month: string; count: number }>;
  topClientsByInquiries: Array<{ clientName: string; count: number; totalValue: number }>;
  inquiryStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
  conversionByProjectType: Array<{ type: string; total: number; converted: number; rate: number }>;
  lostInquiryReasons: Array<{ reason: string; count: number }>;
  averageInquiryValue: number;
  pendingInquiriesCount: number;
}

export async function calculateBDMetrics(organizationId: string): Promise<BDMetrics> {
  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching inquiries:', error);
    throw error;
  }

  const inquiryList = inquiries || [];

  const totalInquiries = inquiryList.length;
  const newInquiries = inquiryList.filter(i => i.status === 'new').length;
  const inReviewInquiries = inquiryList.filter(i => i.status === 'in_review').length;
  const convertedInquiries = inquiryList.filter(i => i.status === 'converted').length;
  const lostInquiries = inquiryList.filter(i => i.status === 'lost').length;

  const conversionRate = totalInquiries > 0
    ? (convertedInquiries / totalInquiries) * 100
    : 0;

  const inquiriesWithResponseTime = inquiryList.filter(i => i.response_date && i.created_at);
  const averageResponseTime = inquiriesWithResponseTime.length > 0
    ? inquiriesWithResponseTime.reduce((sum, i) => {
        const createdDate = new Date(i.created_at);
        const responseDate = new Date(i.response_date);
        const diffDays = Math.floor((responseDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / inquiriesWithResponseTime.length
    : 0;

  const inquiriesWithConversionTime = inquiryList.filter(i => i.conversion_date && i.created_at);
  const averageConversionTime = inquiriesWithConversionTime.length > 0
    ? inquiriesWithConversionTime.reduce((sum, i) => {
        const createdDate = new Date(i.created_at);
        const conversionDate = new Date(i.conversion_date);
        const diffDays = Math.floor((conversionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0) / inquiriesWithConversionTime.length
    : 0;

  const estimatedPipelineValue = inquiryList
    .filter(i => i.status !== 'lost' && i.status !== 'expired')
    .reduce((sum, i) => sum + (i.estimated_value || 0), 0);

  const convertedValue = inquiryList
    .filter(i => i.status === 'converted')
    .reduce((sum, i) => sum + (i.estimated_value || 0), 0);

  const averageInquiryValue = totalInquiries > 0
    ? inquiryList.reduce((sum, i) => sum + (i.estimated_value || 0), 0) / totalInquiries
    : 0;

  const pendingInquiriesCount = newInquiries + inReviewInquiries;

  const monthlyTrendMap = new Map<string, number>();
  inquiryList.forEach(i => {
    const date = new Date(i.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTrendMap.set(monthKey, (monthlyTrendMap.get(monthKey) || 0) + 1);
  });

  const monthlyInquiryTrend = Array.from(monthlyTrendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count
    }));

  const clientMap = new Map<string, { count: number; totalValue: number }>();
  inquiryList.forEach(i => {
    if (!i.client_name) return;
    const existing = clientMap.get(i.client_name) || { count: 0, totalValue: 0 };
    clientMap.set(i.client_name, {
      count: existing.count + 1,
      totalValue: existing.totalValue + (i.estimated_value || 0)
    });
  });

  const topClientsByInquiries = Array.from(clientMap.entries())
    .map(([clientName, data]) => ({ clientName, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statusMap = new Map<string, number>();
  inquiryList.forEach(i => {
    if (!i.status) return;
    statusMap.set(i.status, (statusMap.get(i.status) || 0) + 1);
  });

  const inquiryStatusDistribution = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalInquiries > 0 ? (count / totalInquiries) * 100 : 0
    }));

  const typeMap = new Map<string, { total: number; converted: number }>();
  inquiryList.forEach(i => {
    if (!i.project_type) return;
    const existing = typeMap.get(i.project_type) || { total: 0, converted: 0 };
    typeMap.set(i.project_type, {
      total: existing.total + 1,
      converted: existing.converted + (i.status === 'converted' ? 1 : 0)
    });
  });

  const conversionByProjectType = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type: type?.toUpperCase() || 'Unknown',
      total: data.total,
      converted: data.converted,
      rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    }));

  const reasonMap = new Map<string, number>();
  inquiryList
    .filter(i => i.status === 'lost' && i.decline_reason)
    .forEach(i => {
      reasonMap.set(i.decline_reason, (reasonMap.get(i.decline_reason) || 0) + 1);
    });

  const lostInquiryReasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalInquiries,
    newInquiries,
    inReviewInquiries,
    convertedInquiries,
    lostInquiries,
    conversionRate,
    averageResponseTime,
    averageConversionTime,
    estimatedPipelineValue,
    convertedValue,
    monthlyInquiryTrend,
    topClientsByInquiries,
    inquiryStatusDistribution,
    conversionByProjectType,
    lostInquiryReasons,
    averageInquiryValue,
    pendingInquiriesCount
  };
}
