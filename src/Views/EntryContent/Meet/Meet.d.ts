interface MeetList {
  meetId: string; // 字符串格式：xxx-xxxx-xxxx
  topic: string;
  description: string;
  startTime: string;
  duration: number;
  status: "InProgress" | "Concluded" | "Cancelled" | "Pending";
  organizer: {
    id: string;
    name: string;
    occupation: string;
  };
}

interface MeetConfig {
  status: MeetStatus;
}

interface MeetStatus {
  InProgress: StatusMap;
  Concluded: StatusMap;
  Cancelled: StatusMap;
  Pending: StatusMap;
}

interface StatusMap {
  name: string;
  bg: string;
}