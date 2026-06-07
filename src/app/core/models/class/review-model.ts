export class ReviewModel {
  id: number;
  courseId: number;
  userId: number;
  rating: number;
  reviewText?: string;
  institutionCode: string;
  createdBy: string;
  createdAt: string;

  constructor(data?: Partial<ReviewModel>) {
    if (data) {
      this.id = data.id || 0;
      this.courseId = data.courseId || 0;
      this.userId = data.userId || 0;
      this.rating = data.rating || 0;
      this.reviewText = data.reviewText || '';
      this.institutionCode = data.institutionCode || '';
      this.createdBy = data.createdBy || '';
      this.createdAt = data.createdAt || '';
    }
  }
}
