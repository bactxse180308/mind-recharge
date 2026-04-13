// Enum xu hướng phục hồi
export type HealingTrend = 'IMPROVING' | 'STABLE' | 'DECLINING';

// Định nghĩa 1 điểm trên biểu đồ
export interface TimelineDataPoint {
  date: string;          // Định dạng YYYY-MM-DD
  score: number;         // Thang điểm 0 - 6
  moodLabel: string;     // Enum text: "awesome" | "good" | "okay" | "bad" | "terrible"
  message: string;       // Text hiển thị cho UX
}

// Định nghĩa Milestone (Cột mốc)
export interface TimelineMilestone {
  day: number;           // Số ngày cần đạt mốc
  achieved: boolean;     // Đã đạt được chưa
}

// Response đầy đủ của API Healing Timeline
export interface HealingTimelineResponse {
  streak: number;                  // Chuỗi ngày hiện tại
  trend: HealingTrend;             // Mũi tên trend
  avgScore: number;                // Điểm trung bình tổng quan
  timeline: TimelineDataPoint[];   // Dữ liệu mảng chính vẽ Chart
  milestones: TimelineMilestone[]; // Mảng mốc đạt được
}
