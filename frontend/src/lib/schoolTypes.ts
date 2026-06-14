export type SchoolTypeCode =
  | "PRESCHOOL"
  | "PRIMARY"
  | "MIDDLE"
  | "SECONDARY"
  | "SENIOR_SECONDARY"
  | "ELEMENTARY"
  | "HIGH_SCHOOL"
  | "K12"
  | "JUNIOR_COLLEGE";

export type SchoolType = {
  code: SchoolTypeCode;
  name: string;
  classes: string;
  classOptions: string[];
};

export const schoolSubjectOptions = [
  "English",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Studies",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Physical Education",
  "Art",
  "Music",
];

export const schoolTypes: SchoolType[] = [
  {
    code: "PRESCHOOL",
    name: "Pre-School",
    classes: "Playgroup - UKG",
    classOptions: ["Playgroup", "Nursery", "LKG", "UKG"],
  },
  {
    code: "PRIMARY",
    name: "Primary School",
    classes: "Class 1 - 5",
    classOptions: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"],
  },
  {
    code: "MIDDLE",
    name: "Middle School",
    classes: "Class 6 - 8",
    classOptions: ["Class 6", "Class 7", "Class 8"],
  },
  {
    code: "SECONDARY",
    name: "Secondary School",
    classes: "Class 9 - 10",
    classOptions: ["Class 9", "Class 10"],
  },
  {
    code: "SENIOR_SECONDARY",
    name: "Senior Secondary School",
    classes: "Class 11 - 12",
    classOptions: ["Class 11", "Class 12"],
  },
  {
    code: "ELEMENTARY",
    name: "Elementary School",
    classes: "Class 1 - 8",
    classOptions: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"],
  },
  {
    code: "HIGH_SCHOOL",
    name: "High School",
    classes: "Class 1 - 10",
    classOptions: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
  },
  {
    code: "K12",
    name: "K-12 School",
    classes: "Playgroup - Class 12",
    classOptions: ["Playgroup", "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
  },
  {
    code: "JUNIOR_COLLEGE",
    name: "Junior College",
    classes: "Class 11 - 12",
    classOptions: ["Class 11", "Class 12"],
  },
];

export const defaultSchoolType = schoolTypes.find((type) => type.code === "K12") || schoolTypes[0];

export const getSchoolTypeByCode = (code: unknown) => {
  return schoolTypes.find((type) => type.code === code) || defaultSchoolType;
};

export const getSchoolTypeClassOptions = (code: unknown) => getSchoolTypeByCode(code).classOptions;

export const getRegisteredSchoolClassOptions = (schoolTypeCode: unknown, settings?: Record<string, unknown> | null) => {
  const registeredOptions = settings?.school_type_class_options;
  if (Array.isArray(registeredOptions) && registeredOptions.every((item) => typeof item === "string")) {
    return registeredOptions;
  }
  return getSchoolTypeClassOptions(schoolTypeCode || getSchoolTypeCodeFromSettings(settings));
};

export const getSchoolTypeCodeFromSettings = (settings?: Record<string, unknown> | null) => {
  return settings?.school_type_code || settings?.schoolTypeCode || settings?.school_type;
};
