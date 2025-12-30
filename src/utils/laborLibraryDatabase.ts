import { supabase } from '../lib/supabase';

export interface OrgFMTechnician {
  id: string;
  organization_id: string;
  name: string;
  skill_tags: string[];
  monthly_salary: number;
  additional_cost: number;
  hourly_rate?: number;
  expected_overtime_hours_per_month: number;
  is_active: boolean;
  can_supervise: boolean;
  input_base_count: number;
  notes: string;
}

export interface OrgRetrofitLabor {
  id: string;
  organization_id: string;
  name: string;
  role: string;
  skill_tags: string[];
  monthly_salary: number;
  additional_cost: number;
  hourly_rate?: number;
  is_active: boolean;
}

export interface OrgCleaner {
  id: string;
  organization_id: string;
  name: string;
  skill_tags: string[];
  monthly_salary: number;
  additional_cost: number;
  hourly_rate?: number;
  is_active: boolean;
}

export const loadFMTechnicians = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('org_fm_technicians')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as OrgFMTechnician[];
};

export const saveFMTechnician = async (tech: Omit<OrgFMTechnician, 'id'>) => {
  const { data, error } = await supabase
    .from('org_fm_technicians')
    .insert(tech)
    .select()
    .single();

  if (error) throw error;
  return data as OrgFMTechnician;
};

export const updateFMTechnician = async (id: string, tech: Partial<OrgFMTechnician>) => {
  const { data, error } = await supabase
    .from('org_fm_technicians')
    .update({ ...tech, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OrgFMTechnician;
};

export const deleteFMTechnician = async (id: string) => {
  const { error } = await supabase
    .from('org_fm_technicians')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

export const loadRetrofitLabor = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('org_retrofit_labor')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as OrgRetrofitLabor[];
};

export const saveRetrofitLabor = async (labor: Omit<OrgRetrofitLabor, 'id'>) => {
  const { data, error } = await supabase
    .from('org_retrofit_labor')
    .insert(labor)
    .select()
    .single();

  if (error) throw error;
  return data as OrgRetrofitLabor;
};

export const updateRetrofitLabor = async (id: string, labor: Partial<OrgRetrofitLabor>) => {
  const { data, error } = await supabase
    .from('org_retrofit_labor')
    .update({ ...labor, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OrgRetrofitLabor;
};

export const deleteRetrofitLabor = async (id: string) => {
  const { error } = await supabase
    .from('org_retrofit_labor')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};

export const loadCleaners = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('org_cleaners')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as OrgCleaner[];
};

export const saveCleaner = async (cleaner: Omit<OrgCleaner, 'id'>) => {
  const { data, error } = await supabase
    .from('org_cleaners')
    .insert(cleaner)
    .select()
    .single();

  if (error) throw error;
  return data as OrgCleaner;
};

export const updateCleaner = async (id: string, cleaner: Partial<OrgCleaner>) => {
  const { data, error } = await supabase
    .from('org_cleaners')
    .update({ ...cleaner, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OrgCleaner;
};

export const deleteCleaner = async (id: string) => {
  const { error } = await supabase
    .from('org_cleaners')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
};
