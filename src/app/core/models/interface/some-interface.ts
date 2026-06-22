export interface AvailableFilterOption {
  key: string;
  label: string;
  isDynamic: boolean;
  type?: 'TEXT' | 'ENUM_SELECT' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  options?: string[];
}

export interface FilterDialogData {
  existing?: MatchFilter;
  mode: 'instant' | 'scheduled';
}

export interface FilterChip {
  key: string;
  label: string;
  value: string | boolean | number;
  displayValue: string;
  /**
   * Tracks which sub-category this chip belongs to.
   * Used for cascade removal: when a sub-category chip is removed,
   * all chips with the same ownerSubCategory are also removed.
   */
  ownerSubCategory?: string;
}

export interface MatchFilter {
  id?: number;
  cognitoSub?: string;

  // Base filters
  minAge?: number;
  maxAge?: number;
  preferredGender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  preferredIndustries?: string[];
  sameCompanyAllowed?: boolean;
  preferredCompany?: string;
  preferredCollege?: string;
  preferredZip?: string;
  preferredCity?: string;
  preferredState?: string;
  preferredCountry?: string;
  maxTimezoneOffsetHours?: number;

  // Category / sub-category
  parentCategory?: string;
  childCategory?: string;

  // Matrimonial attributes
  religion?: string;
  caste?: string;
  subCaste?: string;
  gotram?: string;
  motherTongue?: string;
  dietaryHabits?: string;
  highestEducation?: string;
  profession?: string;
  employmentType?: string;
  annualIncomeInr?: number;
  nativeCity?: string;
  nativeState?: string;
  familyType?: string;
  familyValues?: string;
  familyStatus?: string;
  heightCm?: number;
  maritalStatus?: string;
  bodyType?: string;
  smokingHabit?: string;
  drinkingHabit?: string;
  manglikStatus?: string;
  horoscopeMatchRequired?: boolean;
  ageMin?: number;
  ageMax?: number;
  heightMinCm?: number;
  heightMaxCm?: number;
  religionPref?: string;
  incomeMinInr?: number;
  incomeMaxInr?: number;
  openToRelocation?: boolean;

  // Dating attributes
  relationshipGoal?: string;
  sexualOrientation?: string;
  loveLanguage?: string;
  personalityType?: string;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  prefHeightMinCm?: number;

  // Fitness attributes
  fitnessActivities?: string;
  fitnessLevel?: string;
  workoutDays?: string;
  preferredWorkoutTime?: string;
  gymName?: string;
  isOkWithMixedGender?: boolean;
  sportsLeagueLevel?: string;
  fitnessGoal?: string;
  dietPreference?: string;

  // Flatmate attributes
  lookingIn?: string;
  budgetRangeInr?: string;
  moveInDate?: string;
  preferredFlatmateGender?: string;
  occupationType?: string;
  isVegetarianHousehold?: boolean;
  allowsSmoking?: boolean;
  hasPets?: boolean;
  allowsPets?: boolean;
  sleepSchedule?: string;
  cleanlinessLevel?: string;
  guestsPolicy?: string;
  hasCurrentFlat?: boolean;

  // Gaming attributes
  platforms?: string;
  favoriteGames?: string;
  favoriteGenres?: string;
  gamingSchedule?: string;
  skillLevel?: string;
  communicationStyle?: string;
  isOkWithNewbies?: boolean;

  // Professional attributes
  currentRole?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  industryDomain?: string;
  techStack?: string;
  skillsOffering?: string;
  skillsSeeking?: string;
  mentorshipRole?: string;
  openToCoFounder?: boolean;
  preferredCollabMode?: string;

  // Travel attributes
  travelStyle?: string;
  preferredDestinations?: string;
  tripsPerYear?: number;
  preferredTripDuration?: string;
  hasTraveledAbroad?: boolean;
  countriesVisited?: number;
  dietaryNeeds?: string;
  isOkWithBudgetStays?: boolean;
  isOkWithCamping?: boolean;
  preferredGroupSize?: string;
}
