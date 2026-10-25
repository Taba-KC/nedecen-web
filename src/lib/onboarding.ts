/**
 * Typed requests for finding an existing school account and claiming it with login details.
 * AccountClaimPage owns the form; these helpers only exchange data with the backend.
 */
import { api } from "./api";

export interface PersonName {
  title?: string;
  firstName: string;
  surname: string;
}

/**
 * Look up an unclaimed learner account using the supplied school/account details; this does
 * not claim it yet.
 */
export async function lookupLearner(data: {
  schoolCode: string;
  admissionNumber: string;
  initials: string;
}): Promise<PersonName> {
  return api.post<PersonName>("/learners/onboarding/lookup", data);
}

/**
 * Look up an existing staff roster record before showing credential setup.
 */
export async function lookupStaff(data: {
  schoolCode: string;
  staffNumber: string;
  initials: string;
}): Promise<PersonName> {
  return api.post<PersonName>("/people/onboarding/lookup", data);
}

/**
 * Submit chosen credentials to claim the learner record after lookup.
 */
export async function claimLearnerAccount(data: {
  schoolCode: string;
  admissionNumber: string;
  initials: string;
  username: string;
  password: string;
}): Promise<void> {
  await api.post("/learners/onboarding", data);
}

/**
 * Submit staff claim details to the backend; the server validates and saves the password
 * hash.
 */
export async function claimStaffAccount(data: {
  schoolCode: string;
  staffNumber: string;
  initials: string;
  username: string;
  password: string;
}): Promise<void> {
  await api.post("/people/onboarding", data);
}
