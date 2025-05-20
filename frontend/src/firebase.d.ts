import { User } from 'firebase/auth';

export function signInWithGoogle(): Promise<User>;
export function signOutUser(): Promise<void>; 