// PLACEHOLDER: a fictional teacher, for layout only. "Mrkvička" is the
// Slovak "John Doe". Before launch, replace with a real teacher who has given
// written permission to use their name, photo and affiliation.

// The quote, role and affiliation are translated in src/lib/i18n/messages
// ("endorsement.*"); edit them there.
export type Endorsement = {
  name: string;
  /** Image under /public, e.g. "/people/jana.jpg". Without one, initials are shown. */
  photo?: string;
};

export const featuredEndorsement: Endorsement = {
  name: "Mgr. Jana Mrkvičková",
};
