export class FeedBackModel {
  // General Information
  name?: string; // Optional field for the user's name
  examDetails!: string; // Required field for the exam model name or code
  userId?: string; // Optional field for the user's ID

  // Overall ExamModel Experience
  difficultyLevel!: 'easy' | 'moderate' | 'difficult'; // Difficulty level options
  timeManagement!: 'yes' | 'no' | 'neutral'; // Time management feedback options

  // Suggestions and Comments
  suggestions?: string; // Optional field for suggestions
  additionalComments?: string; // Optional field for additional comments

  constructor(data?: Partial<FeedBackModel>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
