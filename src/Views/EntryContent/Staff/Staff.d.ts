interface StaffConfig {
  department: Department;
  status: Status;
}

interface StaffData {
  id: string;
  name: string;
  department: "Technology" | "RMD" | "Finance" | "Product";
  occupation: string;
  status: "Active" | "Probation" | "Inactive";
  service_date: string;
}

interface Department {
  Technology: GeneralMap;
  RMD: GeneralMap;
  Finance: GeneralMap;
  Product: GeneralMap;
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
