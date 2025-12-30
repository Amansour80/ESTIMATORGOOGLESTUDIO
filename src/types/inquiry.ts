export type InquiryStatus = 'new' | 'in_review' | 'converted' | 'lost' | 'expired';
export type InquiryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InquiryProjectType = 'hk' | 'fm' | 'retrofit';

export interface Inquiry {
  id: string;
  organization_id: string;
  inquiry_number: string;
  client_inquiry_reference?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  project_name: string;
  project_location?: string;
  project_type: InquiryProjectType;
  description?: string;
  deadline: string;
  estimated_value?: number;
  status: InquiryStatus;
  priority: InquiryPriority;
  source?: string;
  assigned_to?: string;
  notes?: string;
  converted_to_project_id?: string;
  converted_to_project_type?: InquiryProjectType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInquiryInput {
  client_inquiry_reference?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  project_name: string;
  project_location?: string;
  project_type: InquiryProjectType;
  description?: string;
  deadline: string;
  estimated_value?: number;
  priority?: InquiryPriority;
  source?: string;
  assigned_to?: string;
  notes?: string;
}

export interface UpdateInquiryInput {
  client_inquiry_reference?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  project_name?: string;
  project_location?: string;
  project_type?: InquiryProjectType;
  description?: string;
  deadline?: string;
  estimated_value?: number;
  status?: InquiryStatus;
  priority?: InquiryPriority;
  source?: string;
  assigned_to?: string;
  notes?: string;
}

export interface InquiryStats {
  total: number;
  new: number;
  in_review: number;
  converted: number;
  lost: number;
  expired: number;
  overdue: number;
  due_this_week: number;
}
