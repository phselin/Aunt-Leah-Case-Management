export type SelectionWithDetails = {
  value: string;
  details?: string;
};

export type Address = {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

export type Housing = {
  address?: Address;
  preferredAuntLeahLocation?: string;
  status?: string;
  statusDetails?: string;
  emergencyContact?: string;
};

export type Referral = {
  source?: string;
  referralDate?: string;
  connection?: string;
  notes?: string;
};

export type IntakeBackground = {
  personal?: SelectionWithDetails[];
  areasOfNeed?: SelectionWithDetails[];
  existingId?: SelectionWithDetails[];
};

export type IntakeCollateral = {
  row1Organization?: string;
  row1WorkerRole?: string;
  row2Organization?: string;
  row2WorkerRole?: string;
  row3Organization?: string;
  row3WorkerRole?: string;
  noOtherSupports?: boolean;
};

export type IntakeDepartmentReferral = {
  lifeSkills?: SelectionWithDetails[];
  employment?: SelectionWithDetails[];
  education?: SelectionWithDetails[];
  housing?: SelectionWithDetails[];
};

export type IntakeDepartmentSpecific = {
  lifeSajeParticipant?: string;
  lifeSajeKindAndWorker?: string;
  lifeSajeApplicationCompleted?: string;
  empCurrentStatus?: string;
  empAge15to30?: string;
  empLegallyEntitledWork?: string;
  eduEnrolledInSchool?: string;
  eduHighSchoolCompletedWhere?: string;
  eduLastGradeWhere?: string;
  eduReportCardsAccess?: string;
  deptHousingAge19to30?: string;
  deptHousingRentalSubsidy?: string;
  deptHousingReachingHomeEligible?: string;
};

export type ClientIntake = {
  background?: IntakeBackground;
  collateral?: IntakeCollateral;
  departmentReferral?: IntakeDepartmentReferral;
  departmentSpecific?: IntakeDepartmentSpecific;
};

export type Person = {
  _id?: string;
  firstname: string;
  lastname: string;
  active: boolean;
  dob?: string;
  gender?: string;
  pronouns?: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: string;
  programs?: string[];
  housing?: Housing;
  referral?: Referral;
  intake?: ClientIntake;
  programMilestones?: Record<string, Record<string, any>>;
};

export type FormFieldConfig = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[] | { value: string; label: string; hasDetails?: boolean }[];
};

export type FormGroupConfig = {
  key: string;
  type: "group";
  label?: string;
  fields: FormFieldConfig[];
};

export type FormSectionConfig = {
  key?: string;
  label: string;
  type: "section";
  layout?: string;
  description?: string;
  descriptionTone?: string;
  fields?: FormFieldConfig[];
  groups?: FormGroupConfig[];
};

export type IntakeFormConfig = {
  sections: FormSectionConfig[];
};