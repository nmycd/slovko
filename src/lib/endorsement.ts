// PLACEHOLDER: a fictional teacher, for layout only. "Mrkvička" is the
// Slovak "John Doe". Before launch, replace with a real teacher who has given
// written permission to use their name, photo and affiliation.

export type Endorsement = {
  quote: string;
  name: string;
  role: string;
  affiliation: string;
  /** Image under /public, e.g. "/people/jana.jpg". Without one, initials are shown. */
  photo?: string;
};

export const featuredEndorsement: Endorsement = {
  quote:
    "Hear it, say it, use it: that's how I teach my first-year students. Slovko gives them the daily practice between our classes, and you can hear it in their pronunciation.",
  name: "Mgr. Jana Mrkvičková",
  role: "Lecturer of Slovak as a foreign language",
  affiliation: "University language centre",
};
