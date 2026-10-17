// The A2 course's content: its units in order, and their translation catalogs in the
// same order. Follows Krížom-krážom A2; lesson content is original. See
// ../AUTHORING.md, "More than one course", for where its files go and how its ids read.
import type { Catalog } from "../translatable";
import type { Unit } from "../types";
import { unit1 } from "./units/unit1";
import { unit2 } from "./units/unit2";
import { unit3 } from "./units/unit3";
import { unit4 } from "./units/unit4";
import { unit5 } from "./units/unit5";
import { unit6 } from "./units/unit6";
import { unit7 } from "./units/unit7";
import { unit8 } from "./units/unit8";
import { unit9 } from "./units/unit9";
import { unit10 } from "./units/unit10";
import uk1 from "./translations/uk/unit1.json";
import uk2 from "./translations/uk/unit2.json";
import uk3 from "./translations/uk/unit3.json";
import uk4 from "./translations/uk/unit4.json";
import uk5 from "./translations/uk/unit5.json";
import uk6 from "./translations/uk/unit6.json";
import uk7 from "./translations/uk/unit7.json";
import uk8 from "./translations/uk/unit8.json";
import uk9 from "./translations/uk/unit9.json";
import uk10 from "./translations/uk/unit10.json";
import ru1 from "./translations/ru/unit1.json";
import ru2 from "./translations/ru/unit2.json";
import ru3 from "./translations/ru/unit3.json";
import ru4 from "./translations/ru/unit4.json";
import ru5 from "./translations/ru/unit5.json";
import ru6 from "./translations/ru/unit6.json";
import ru7 from "./translations/ru/unit7.json";
import ru8 from "./translations/ru/unit8.json";
import ru9 from "./translations/ru/unit9.json";
import ru10 from "./translations/ru/unit10.json";
import uz1 from "./translations/uz/unit1.json";
import uz2 from "./translations/uz/unit2.json";
import uz3 from "./translations/uz/unit3.json";
import uz4 from "./translations/uz/unit4.json";
import uz5 from "./translations/uz/unit5.json";
import uz6 from "./translations/uz/unit6.json";
import uz7 from "./translations/uz/unit7.json";
import uz8 from "./translations/uz/unit8.json";
import uz9 from "./translations/uz/unit9.json";
import uz10 from "./translations/uz/unit10.json";
import ka1 from "./translations/ka/unit1.json";
import ka2 from "./translations/ka/unit2.json";
import ka3 from "./translations/ka/unit3.json";
import ka4 from "./translations/ka/unit4.json";
import ka5 from "./translations/ka/unit5.json";
import ka6 from "./translations/ka/unit6.json";
import ka7 from "./translations/ka/unit7.json";
import ka8 from "./translations/ka/unit8.json";
import ka9 from "./translations/ka/unit9.json";
import ka10 from "./translations/ka/unit10.json";

export const units: Unit[] = [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10];

export const catalogs: Record<"uk" | "ru" | "uz" | "ka", Catalog[]> = {
  uk: [uk1, uk2, uk3, uk4, uk5, uk6, uk7, uk8, uk9, uk10] as Catalog[],
  ru: [ru1, ru2, ru3, ru4, ru5, ru6, ru7, ru8, ru9, ru10] as Catalog[],
  uz: [uz1, uz2, uz3, uz4, uz5, uz6, uz7, uz8, uz9, uz10] as Catalog[],
  ka: [ka1, ka2, ka3, ka4, ka5, ka6, ka7, ka8, ka9, ka10] as Catalog[],
};
