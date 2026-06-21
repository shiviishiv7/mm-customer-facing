import { AvailableFilterOption } from '../models/interface/some-interface';

export enum CommonConstant {}

// ── Base filters — always shown, never auto-removed ───────────────────────────
export const baseOptions: AvailableFilterOption[] = [
  { key: 'preferredGender:MALE',   label: 'Gender: Male',   isDynamic: false },
  { key: 'preferredGender:FEMALE', label: 'Gender: Female', isDynamic: false },
  { key: 'preferredGender:OTHER',  label: 'Gender: Other',  isDynamic: false },
  { key: 'preferredCity',    label: 'City...',    isDynamic: true, type: 'TEXT' },
  { key: 'preferredState',   label: 'State...',   isDynamic: true, type: 'TEXT' },
  { key: 'preferredCountry', label: 'Country...', isDynamic: true, type: 'TEXT' },
  { key: 'preferredZip',     label: 'Zip Code...', isDynamic: true, type: 'TEXT' },
];

// ── Category group options — shown until one is selected ──────────────────────
export const categoryGroupOptions: AvailableFilterOption[] = [
  { key: 'Professional & Career Growth',       label: 'Category: Professional & Career Growth',       isDynamic: true, type: 'ENUM_SELECT' },
  { key: 'Shared Activities & Daily Routines', label: 'Category: Shared Activities & Daily Routines', isDynamic: true, type: 'ENUM_SELECT' },
  { key: 'Travel & Exploration',               label: 'Category: Travel & Exploration',               isDynamic: true, type: 'ENUM_SELECT' },
  { key: 'Personal & Lifestyle Connections',   label: 'Category: Personal & Lifestyle Connections',   isDynamic: true, type: 'ENUM_SELECT' },
  { key: 'Health & Wellness',                  label: 'Category: Health & Wellness',                  isDynamic: true, type: 'ENUM_SELECT' },
];

// ── Master list — only 7 sub-categories that have dedicated VOs ───────────────
export const matchCategoriesMaster = [
  { enumValue: 'PROFESSIONAL_MATRIMONY', parentGroup: 'Personal & Lifestyle Connections', displayName: 'Matrimonial (Verified)' },
  { enumValue: 'CASUAL_DATING',          parentGroup: 'Personal & Lifestyle Connections', displayName: 'High-Intent Dating' },
  { enumValue: 'FITNESS_SPORTS',         parentGroup: 'Health & Wellness',                displayName: 'Fitness & Sports Partners' },
  { enumValue: 'FLATMATE_FINDER',        parentGroup: 'Travel & Exploration',             displayName: 'Flatmate / PG Finder' },
  { enumValue: 'GAMING_BUDDIES',         parentGroup: 'Shared Activities & Daily Routines', displayName: 'Gaming & Online Play' },
  { enumValue: 'MENTORSHIP',             parentGroup: 'Professional & Career Growth',     displayName: 'Leadership & Mentorship' },
  { enumValue: 'TRAVEL_TREKKING',        parentGroup: 'Travel & Exploration',             displayName: 'Travel & Trekking Partners' },
];

// ── Attribute options per sub-category ────────────────────────────────────────

export const matrimonialOptions: AvailableFilterOption[] = [
  { key: 'religion',      label: 'Religion...',       isDynamic: true, type: 'ENUM_SELECT', options: ['HINDU','MUSLIM','CHRISTIAN','SIKH','JAIN','BUDDHIST','PARSI','NO_RELIGION','OTHER'] },
  { key: 'caste',         label: 'Caste...',           isDynamic: true, type: 'TEXT' },
  { key: 'subCaste',      label: 'Sub-caste...',       isDynamic: true, type: 'TEXT' },
  { key: 'gotram',        label: 'Gotram...',          isDynamic: true, type: 'TEXT' },
  { key: 'motherTongue',  label: 'Mother tongue...',   isDynamic: true, type: 'TEXT' },
  { key: 'dietaryHabits', label: 'Dietary habits...', isDynamic: true, type: 'ENUM_SELECT', options: ['VEGETARIAN','NON_VEGETARIAN','EGGETARIAN','VEGAN','JAIN_VEGETARIAN','PESCATARIAN'] },
  { key: 'highestEducation', label: 'Education...',   isDynamic: true, type: 'ENUM_SELECT', options: ['PhD','MBA','M.Tech','MBBS','MD','B.Tech','BE','BSc','BA','Diploma'] },
  { key: 'profession',    label: 'Profession...',      isDynamic: true, type: 'TEXT' },
  { key: 'employmentType', label: 'Employment type...', isDynamic: true, type: 'ENUM_SELECT', options: ['PRIVATE_SECTOR','GOVERNMENT_PUBLIC_SECTOR','SELF_EMPLOYED_BUSINESS','FREELANCER','DEFENCE_FORCES','NOT_WORKING','STUDENT'] },
  { key: 'annualIncomeInr', label: 'Annual income (INR)...', isDynamic: true, type: 'NUMBER' },
  { key: 'nativeCity',    label: 'Native city...',     isDynamic: true, type: 'TEXT' },
  { key: 'nativeState',   label: 'Native state...',    isDynamic: true, type: 'TEXT' },
  { key: 'familyType',    label: 'Family type...',     isDynamic: true, type: 'ENUM_SELECT', options: ['NUCLEAR','JOINT','EXTENDED'] },
  { key: 'familyValues',  label: 'Family values...',   isDynamic: true, type: 'ENUM_SELECT', options: ['TRADITIONAL','MODERATE','LIBERAL'] },
  { key: 'familyStatus',  label: 'Family status...',   isDynamic: true, type: 'ENUM_SELECT', options: ['MIDDLE_CLASS','UPPER_MIDDLE_CLASS','AFFLUENT','HIGH_NET_WORTH'] },
  { key: 'heightCm',      label: 'Exact height (cm)...', isDynamic: true, type: 'NUMBER' },
  { key: 'maritalStatus', label: 'Marital status...',  isDynamic: true, type: 'ENUM_SELECT', options: ['NEVER_MARRIED','DIVORCED','WIDOWED','AWAITING_DIVORCE','ANNULLED'] },
  { key: 'bodyType',      label: 'Body type...',       isDynamic: true, type: 'ENUM_SELECT', options: ['SLIM','ATHLETIC','AVERAGE','HEAVY_SET'] },
  { key: 'smokingHabit',  label: 'Smoking habit...',   isDynamic: true, type: 'ENUM_SELECT', options: ['NEVER','OCCASIONALLY','REGULARLY'] },
  { key: 'drinkingHabit', label: 'Drinking habit...',  isDynamic: true, type: 'ENUM_SELECT', options: ['NEVER','OCCASIONALLY','REGULARLY'] },
  { key: 'manglikStatus', label: 'Manglik status...',  isDynamic: true, type: 'ENUM_SELECT', options: ['YES','NO','PARTIAL','DOES_NOT_BELIEVE'] },
  { key: 'horoscopeMatchRequired', label: 'Horoscope match required?', isDynamic: true, type: 'BOOLEAN' },
  { key: 'ageMin',        label: 'Min age...',         isDynamic: true, type: 'NUMBER' },
  { key: 'ageMax',        label: 'Max age...',         isDynamic: true, type: 'NUMBER' },
  { key: 'heightMinCm',   label: 'Min height (cm)...', isDynamic: true, type: 'NUMBER' },
  { key: 'heightMaxCm',   label: 'Max height (cm)...', isDynamic: true, type: 'NUMBER' },
  { key: 'openToRelocation', label: 'Open to relocation?', isDynamic: true, type: 'BOOLEAN' },
];

export const datingOptions: AvailableFilterOption[] = [
  { key: 'dietaryHabits',    label: 'Dietary habits...',        isDynamic: true, type: 'ENUM_SELECT', options: ['VEGETARIAN','VEGAN','NON_VEGETARIAN','EGGETARIAN','HALAL','KOSHER'] },
  { key: 'smokingHabit',     label: 'Smoking habit...',         isDynamic: true, type: 'ENUM_SELECT', options: ['NEVER','OCCASIONALLY','REGULARLY','TRYING_TO_QUIT'] },
  { key: 'drinkingHabit',    label: 'Drinking habit...',        isDynamic: true, type: 'ENUM_SELECT', options: ['TEETOTALER','SOCIAL_DRINKER','REGULARLY'] },
  { key: 'relationshipGoal', label: 'Relationship goal...',     isDynamic: true, type: 'ENUM_SELECT', options: ['LONG_TERM','SHORT_TERM','MARRIAGE','FRIENDSHIP','NOT_SURE'] },
  { key: 'bodyType',         label: 'Body type...',             isDynamic: true, type: 'ENUM_SELECT', options: ['SLIM','ATHLETIC','AVERAGE','CURVY','HEAVY'] },
  { key: 'sexualOrientation', label: 'Sexual orientation...',   isDynamic: true, type: 'ENUM_SELECT', options: ['STRAIGHT','GAY','LESBIAN','BISEXUAL','PANSEXUAL','ASEXUAL'] },
  { key: 'personalityType',  label: 'Personality type (MBTI)...', isDynamic: true, type: 'TEXT' },
  { key: 'loveLanguage',     label: 'Love language...',         isDynamic: true, type: 'ENUM_SELECT', options: ['WORDS_OF_AFFIRMATION','QUALITY_TIME','RECEIVING_GIFTS','ACTS_OF_SERVICE','PHYSICAL_TOUCH'] },
  { key: 'hasChildren',      label: 'Has children?',            isDynamic: true, type: 'BOOLEAN' },
  { key: 'wantsChildren',    label: 'Wants children?',          isDynamic: true, type: 'BOOLEAN' },
  { key: 'heightCm',         label: 'Exact height (cm)...',     isDynamic: true, type: 'NUMBER' },
  { key: 'prefHeightMinCm',  label: 'Match min height (cm)...', isDynamic: true, type: 'NUMBER' },
];

export const fitnessOptions: AvailableFilterOption[] = [
  { key: 'fitnessActivities',   label: 'Fitness activities...',    isDynamic: true, type: 'ENUM_SELECT', options: ['GYM','YOGA','CYCLING','RUNNING','CRICKET','FOOTBALL','SWIMMING','HIKING','BOXING','ZUMBA'] },
  { key: 'fitnessLevel',        label: 'Fitness level...',         isDynamic: true, type: 'ENUM_SELECT', options: ['BEGINNER','INTERMEDIATE','ADVANCED'] },
  { key: 'workoutDays',         label: 'Workout days...',          isDynamic: true, type: 'ENUM_SELECT', options: ['MON','TUE','WED','THU','FRI','SAT','SUN'] },
  { key: 'preferredWorkoutTime', label: 'Workout time...',         isDynamic: true, type: 'ENUM_SELECT', options: ['EARLY_MORNING','MORNING','AFTERNOON','EVENING','NIGHT'] },
  { key: 'gymName',             label: 'Gym name...',              isDynamic: true, type: 'TEXT' },
  { key: 'isOkWithMixedGender', label: 'Ok with mixed gender?',   isDynamic: true, type: 'BOOLEAN' },
  { key: 'sportsLeagueLevel',   label: 'League level...',          isDynamic: true, type: 'ENUM_SELECT', options: ['CASUAL','AMATEUR','COMPETITIVE'] },
  { key: 'fitnessGoal',         label: 'Fitness goal...',          isDynamic: true, type: 'ENUM_SELECT', options: ['WEIGHT_LOSS','MUSCLE_GAIN','ENDURANCE','FLEXIBILITY','GENERAL_FITNESS'] },
  { key: 'dietPreference',      label: 'Diet preference...',       isDynamic: true, type: 'ENUM_SELECT', options: ['VEGETARIAN','NON_VEGETARIAN','VEGAN','KETO','NO_PREFERENCE'] },
];

export const flatmateOptions: AvailableFilterOption[] = [
  { key: 'lookingIn',              label: 'Looking in area...',        isDynamic: true, type: 'TEXT' },
  { key: 'budgetRangeInr',         label: 'Budget range (INR)...',     isDynamic: true, type: 'TEXT' },
  { key: 'moveInDate',             label: 'Move-in date...',           isDynamic: true, type: 'DATE' },
  { key: 'preferredFlatmateGender', label: 'Flatmate gender...',       isDynamic: true, type: 'ENUM_SELECT', options: ['MALE','FEMALE','ANY'] },
  { key: 'occupationType',         label: 'Occupation type...',        isDynamic: true, type: 'ENUM_SELECT', options: ['WORKING_PROFESSIONAL','STUDENT','ANY'] },
  { key: 'isVegetarianHousehold',  label: 'Vegetarian household?',     isDynamic: true, type: 'BOOLEAN' },
  { key: 'allowsSmoking',          label: 'Smoking allowed?',          isDynamic: true, type: 'BOOLEAN' },
  { key: 'hasPets',                label: 'Has pets?',                 isDynamic: true, type: 'BOOLEAN' },
  { key: 'allowsPets',             label: 'Pets allowed?',             isDynamic: true, type: 'BOOLEAN' },
  { key: 'sleepSchedule',          label: 'Sleep schedule...',         isDynamic: true, type: 'ENUM_SELECT', options: ['EARLY_BIRD','NIGHT_OWL','FLEXIBLE'] },
  { key: 'cleanlinessLevel',       label: 'Cleanliness level...',      isDynamic: true, type: 'ENUM_SELECT', options: ['VERY_CLEAN','AVERAGE','RELAXED'] },
  { key: 'guestsPolicy',           label: 'Guests policy...',          isDynamic: true, type: 'ENUM_SELECT', options: ['NO_GUESTS','OCCASIONAL','OPEN'] },
  { key: 'hasCurrentFlat',         label: 'Has current flat?',         isDynamic: true, type: 'BOOLEAN' },
];

export const gamingOptions: AvailableFilterOption[] = [
  { key: 'platforms',        label: 'Platform...',             isDynamic: true, type: 'ENUM_SELECT', options: ['PC','PS5','XBOX','MOBILE','SWITCH','PS4'] },
  { key: 'favoriteGames',    label: 'Favourite games...',      isDynamic: true, type: 'TEXT' },
  { key: 'favoriteGenres',   label: 'Favourite genres...',     isDynamic: true, type: 'ENUM_SELECT', options: ['FPS','RPG','MOBA','STRATEGY','SPORTS','BATTLE_ROYALE','SIMULATION','PUZZLE'] },
  { key: 'gamingSchedule',   label: 'Gaming schedule...',      isDynamic: true, type: 'ENUM_SELECT', options: ['WEEKDAY_NIGHTS','WEEKENDS','ANYTIME'] },
  { key: 'skillLevel',       label: 'Skill level...',          isDynamic: true, type: 'ENUM_SELECT', options: ['CASUAL','SEMI_PRO','COMPETITIVE'] },
  { key: 'communicationStyle', label: 'Communication style...', isDynamic: true, type: 'ENUM_SELECT', options: ['VOICE','TEXT','NO_PREFERENCE'] },
  { key: 'isOkWithNewbies',  label: 'Ok with newbies?',        isDynamic: true, type: 'BOOLEAN' },
];

export const professionalOptions: AvailableFilterOption[] = [
  { key: 'currentRole',       label: 'Current role...',         isDynamic: true, type: 'TEXT' },
  { key: 'currentCompany',    label: 'Current company...',      isDynamic: true, type: 'TEXT' },
  { key: 'yearsOfExperience', label: 'Years of experience...', isDynamic: true, type: 'NUMBER' },
  { key: 'industryDomain',    label: 'Industry domain...',      isDynamic: true, type: 'ENUM_SELECT', options: ['FINTECH','HEALTHTECH','EDTECH','ECOMMERCE','SAAS','CONSULTING','GOVERNMENT','MEDIA','MANUFACTURING','OTHER'] },
  { key: 'techStack',         label: 'Tech stack...',           isDynamic: true, type: 'TEXT' },
  { key: 'skillsOffering',    label: 'Skills offering...',      isDynamic: true, type: 'TEXT' },
  { key: 'skillsSeeking',     label: 'Skills seeking...',       isDynamic: true, type: 'TEXT' },
  { key: 'mentorshipRole',    label: 'Mentorship role...',      isDynamic: true, type: 'ENUM_SELECT', options: ['MENTOR','MENTEE','BOTH'] },
  { key: 'openToCoFounder',   label: 'Open to co-founder?',    isDynamic: true, type: 'BOOLEAN' },
  { key: 'preferredCollabMode', label: 'Collab mode...',        isDynamic: true, type: 'ENUM_SELECT', options: ['ONLINE','IN_PERSON','BOTH'] },
];

export const travelOptions: AvailableFilterOption[] = [
  { key: 'travelStyle',          label: 'Travel style...',          isDynamic: true, type: 'ENUM_SELECT', options: ['BACKPACKER','LUXURY','FLASHPACKER','ADVENTURE','CULTURAL'] },
  { key: 'preferredDestinations', label: 'Preferred destinations...', isDynamic: true, type: 'TEXT' },
  { key: 'tripsPerYear',         label: 'Trips per year...',         isDynamic: true, type: 'NUMBER' },
  { key: 'preferredTripDuration', label: 'Trip duration...',         isDynamic: true, type: 'ENUM_SELECT', options: ['WEEKEND','WEEK','TWO_PLUS_WEEKS'] },
  { key: 'hasTraveledAbroad',    label: 'Travelled abroad?',         isDynamic: true, type: 'BOOLEAN' },
  { key: 'countriesVisited',     label: 'Countries visited...',      isDynamic: true, type: 'NUMBER' },
  { key: 'dietaryNeeds',         label: 'Dietary needs...',          isDynamic: true, type: 'ENUM_SELECT', options: ['VEGETARIAN_ONLY','HALAL','NO_RESTRICTION'] },
  { key: 'isOkWithBudgetStays',  label: 'Ok with budget stays?',     isDynamic: true, type: 'BOOLEAN' },
  { key: 'isOkWithCamping',      label: 'Ok with camping?',          isDynamic: true, type: 'BOOLEAN' },
  { key: 'preferredGroupSize',   label: 'Group size...',             isDynamic: true, type: 'ENUM_SELECT', options: ['SOLO','DUO','SMALL','LARGE'] },
];

/**
 * Master lookup — given a sub-category enumValue, returns its attribute options.
 * Used by the filter dialog to know which attrs to unlock and which to clean up on removal.
 */
export const subCategoryAttributeMap: Record<string, AvailableFilterOption[]> = {
  PROFESSIONAL_MATRIMONY: matrimonialOptions,
  CASUAL_DATING:          datingOptions,
  FITNESS_SPORTS:         fitnessOptions,
  FLATMATE_FINDER:        flatmateOptions,
  GAMING_BUDDIES:         gamingOptions,
  MENTORSHIP:             professionalOptions,
  TRAVEL_TREKKING:        travelOptions,
};
