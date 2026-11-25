// config.js — where the app's live data lives.
//
// The publishable key is meant to ship in the app: it only grants what the
// database's row level security allows (read questions and leaderboards,
// write your own profile, runs and answers). Never put a secret key here.
export const SUPABASE_URL = 'https://mvsyneqcohupycyehsvp.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_GVRwoz9k7DvOfjzEPn2LzA_ENHOlp7r';

// Sign-in providers switched on in Supabase (Authentication › Sign In / Providers).
// Flip one to true once it is configured there; until then its button explains.
export const PROVIDERS = { google: false, apple: false };
