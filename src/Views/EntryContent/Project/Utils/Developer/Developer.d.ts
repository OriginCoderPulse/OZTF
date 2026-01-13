declare global {
  interface ProjectMember {
    staff_id: string;
    name: string;
    department: string;
    occupation: string;
    role: string;
    join_date: string;
  }

  interface ProjectDetail {
    id: string;
    name: string;
    status: string;
    manager_id: string;
    manager_name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    priority: string;
    members: ProjectMember[];
    progress: number;
    user_role?: string;
    is_tester?: boolean;
    project_feature_role?: "M" | "D";
    project_qa_role?: "M" | "D";
  }

  interface ProjectData {
    id: string;
    name: string;
    status: string;
    manager_id: string;
    manager_name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    priority: string;
    progress: number;
  }

  interface FeatureData {
    id: string;
    name: string;
    module: string;
    description?: string;
    priority: string;
    assignee_id: string;
    assignee_name: string;
    status: string;
    project_id: string;
    created_date: string;
    estimated_hours?: number;
    actual_hours?: number;
    start_date?: string;
    due_date?: string;
    completed_date?: string;
  }

  interface BugData {
    id: string;
    name: string;
    module: string;
    description?: string;
    severity: string;
    assignee_id: string;
    assignee_name: string;
    status: string;
    project_id: string;
    feature_id?: string;
    feature_name?: string;
    created_date: string;
    reported_by: string;
    reported_by_name: string;
    estimated_hours?: number;
    actual_hours?: number;
    due_date?: string;
    resolved_date?: string;
    closed_date?: string;
    steps_to_reproduce?: string;
    expected_result?: string;
    actual_result?: string;
  }
}

export {};
