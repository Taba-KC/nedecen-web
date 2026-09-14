import { api } from "./api";

export interface PersonName {
  title: string;
  firstName: string;
  surname: string;
}

export async function lookupLearner(data: {
  schoolCode: string;
  admissionNumber: string;
  initials: string;
}): Promise<PersonName> {
  return api.post<PersonName>("/learners/onboarding/lookup", data);
}

export async function lookupStaff(data: {
  schoolCode: string;
  staffNumber: string;
  initials: string;
}): Promise<PersonName> {
  return api.post<PersonName>("/people/onboarding/lookup", data);
}

export async function claimLearnerAccount(data: {
  schoolCode: string;
  admissionNumber: string;
  initials: string;
  username: string;
  password: string;
}): Promise<void> {
  await api.post("/learners/onboarding", data);
}

export async function claimStaffAccount(data: {
  schoolCode: string;
  staffNumber: string;
  initials: string;
  username: string;
  password: string;
}): Promise<void> {
  await api.post("/people/onboarding", data);
}
