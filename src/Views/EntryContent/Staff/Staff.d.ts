interface StaffConfig {
  department: Department;
  occupation: Occupation;
  status: Status;
}

interface StaffData {
  id: string;
  name: string;
  gender?: string;
  department: "CEO" | "Technical" | "RMD" | "Finance" | "Product";
  occupation: "CEO" | "ACT" | "FD" | "BD" | "FSD" | "QA" | "DevOps" | "HR" | "HRBP" | "PM" | "UI";
  status: "Active" | "Probation" | "Inactive";
  service_date: string;
}

interface Department {
  CEO: GeneralMap;
  Technical: GeneralMap;
  RMD: GeneralMap;
  Finance: GeneralMap;
  Product: GeneralMap;
}

interface Occupation {
  CEO: GeneralMap;
  ACT: GeneralMap;
  FD: GeneralMap;
  BD: GeneralMap;
  FSD: GeneralMap;
  QA: GeneralMap;
  DevOps: GeneralMap;
  HR: GeneralMap;
  HRBP: GeneralMap;
  PM: GeneralMap;
  UI: GeneralMap;
}

interface Status {
  Active: GeneralMap;
  Probation: GeneralMap;
  Inactive: GeneralMap;
}

interface GeneralMap {
  name: string;
  color: string;
}
