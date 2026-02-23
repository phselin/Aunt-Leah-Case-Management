export type Person = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  email?: string;
  phone?: string;
  referralDate?: string | null;
  /** @deprecated use referralDate (camelCase) - API returns camelCase */
  referraldate?: string | null;
  [key: string]: any;
};
