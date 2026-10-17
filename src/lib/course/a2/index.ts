// The A2 course's content: its units in order, and their translation catalogs in the
// same order. Follows Krížom-krážom A2; lesson content is original. See
// ../AUTHORING.md, "More than one course", for where its files go and how its ids read.
// Add a unit here as it's written:
//
//   import { unit1 } from "./units/unit1";
//   import uk1 from "./translations/uk/unit1.json";  (and ru1, uz1, ka1)
//   export const units: Unit[] = [unit1];
//   export const catalogs = { uk: [uk1], ru: [ru1], uz: [uz1], ka: [ka1] } as …;
import type { Catalog } from "../translatable";
import type { Unit } from "../types";

export const units: Unit[] = [];

export const catalogs: Record<"uk" | "ru" | "uz" | "ka", Catalog[]> = { uk: [], ru: [], uz: [], ka: [] };
