/**
 * seo/help.js — TheWay Help (thewayhelp.com) pages that match a topic, where one does.
 *
 * thewayhelp.com is TheWay's help site: pregnancy help first (honest answers and
 * free local pregnancy centers in Michigan), with marriage, parenting and money
 * sections growing. A reader on a topic page here who is living that topic gets
 * one plain link to real help.
 *
 * Rules for adding one:
 *   - Only when the help page is squarely about the topic. A loose overlap is not a match.
 *   - Point only at pages thewayhelp.com lets search engines index (not /marriage/,
 *     /parenting/ or /money/ while they are still noindex).
 *   - Check the URL still resolves before committing; thewayhelp.com is a separate repo.
 */
export const HELP_SITE = "https://thewayhelp.com";

export const HELP = {
  "pregnancy": {
    path: "/pregnancy/",
    text: "Pregnant and not sure what to do? TheWay Help has honest answers and free, confidential local support:",
    label: "pregnancy help from TheWay Help",
  },
  "adoption": {
    path: "/pregnancy/options/adoption/",
    text: "If you're pregnant and thinking about adoption, TheWay Help explains how it works in Michigan:",
    label: "adoption: how it works if you're pregnant",
  },
};

export function helpFor(slug) {
  return HELP[slug];
}
