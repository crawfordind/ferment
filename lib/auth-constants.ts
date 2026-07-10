/**
 * Stable identity for the app's original owner. All data that existed before
 * accounts were introduced is backfilled to this user in migration 0003, and
 * `upsertUserByEmail` maps this email back onto this id so the owner keeps that
 * history when they sign in. Kept as plain constants (no imports) so the SQL
 * migration and the tests can hardcode the same literals.
 */
export const SEED_USER_ID = "00000000-0000-7000-8000-00000000da01";
export const SEED_USER_EMAIL = "dcrawford.hoeminc@gmail.com";
