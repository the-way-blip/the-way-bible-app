/**
 * What a place was called at the time the passage is set.
 *
 * Only genuine renamings go here — places Scripture itself tells us changed
 * name ("Luz, but the name of the city was called Bethel at the first"), or
 * that history records changing under a later empire. Translation spelling
 * variants (Zidon/Sidon, Pergamos/Pergamum) are handled as aliases in the
 * dataset build, not here.
 *
 * Keyed by the OpenBible display name. Each entry lists naming periods; the
 * first whose `eras` include the current era wins, otherwise the place keeps
 * its dataset name.
 */

export const PLACE_ERA_NAMES = {
  Jerusalem: [
    { eras: ["primeval", "patriarchs"], name: "Salem", note: "Melchizedek's city in Genesis 14." },
    { eras: ["egypt-exodus", "conquest", "judges"], name: "Jebus", note: "The Jebusite stronghold, until David took it." },
  ],
  Bethel: [
    { eras: ["primeval", "patriarchs"], name: "Luz", note: "Renamed by Jacob after his dream — 'house of God'." },
  ],
  Hebron: [
    { eras: ["primeval", "patriarchs", "egypt-exodus", "conquest"], name: "Kiriath-arba", note: "Named for Arba, greatest of the Anakim." },
  ],
  Dan: [
    { eras: ["primeval", "patriarchs", "egypt-exodus", "conquest"], name: "Laish", note: "A quiet Sidonian town until the tribe of Dan took it." },
  ],
  Babylon: [
    { eras: ["primeval"], name: "Babel", note: "Where the languages were confused and the nations scattered." },
  ],
  Bethlehem: [
    { eras: ["primeval", "patriarchs"], name: "Ephrath", note: "Where Rachel died and was buried on the way." },
  ],
  "Kiriath-jearim": [
    { eras: ["conquest"], name: "Baalah", note: "A Canaanite high-place name before Israel settled it." },
  ],
  Debir: [
    { eras: ["conquest"], name: "Kiriath-sepher", note: "'City of books' — taken by Othniel to win Caleb's daughter." },
  ],
  Hormah: [
    { eras: ["egypt-exodus", "conquest"], name: "Zephath", note: "Renamed Hormah, 'destruction', after Israel devoted it." },
  ],
  Zoar: [
    { eras: ["primeval", "patriarchs"], name: "Bela", note: "The little city Lot begged to flee to." },
  ],
  "Kadesh-barnea": [
    { eras: ["primeval", "patriarchs"], name: "En-mishpat", note: "'Spring of judgment', in the days of Abraham." },
  ],
  "Sea of Galilee": [
    {
      eras: ["egypt-exodus", "conquest", "judges", "united-monarchy", "divided-kingdom", "judah-alone", "exile", "return"],
      name: "Sea of Chinnereth",
      note: "The Old Testament name — from kinnor, a harp, for its shape.",
    },
  ],
  "Salt Sea": [
    { eras: ["gospels", "apostolic"], name: "The Dead Sea", note: "Called the Salt Sea and the Sea of the Arabah in the Old Testament." },
  ],
  Susa: [
    { eras: ["exile", "return"], name: "Shushan", note: "The Persian winter capital of Esther and Nehemiah." },
  ],
  Caesarea: [
    { eras: ["return"], name: "Strato's Tower", note: "A modest Hellenistic anchorage before Herod rebuilt it." },
  ],
  "Caesarea Philippi": [
    { eras: ["return"], name: "Paneas", note: "Named for the grotto of Pan at the spring." },
  ],
  "Beth-shan": [
    { eras: ["gospels", "apostolic"], name: "Scythopolis", note: "Renamed under Greek rule; chief city of the Decapolis." },
  ],
  Acco: [
    { eras: ["gospels", "apostolic"], name: "Ptolemais", note: "Renamed by the Ptolemies; a port Paul called at." },
  ],
  Ashdod: [
    { eras: ["gospels", "apostolic"], name: "Azotus", note: "Where Philip was found after baptizing the Ethiopian." },
  ],
  Rabbah: [
    { eras: ["gospels", "apostolic"], name: "Philadelphia", note: "Rebuilt by Ptolemy Philadelphus; a Decapolis city." },
  ],
  Canaan: [
    { eras: ["united-monarchy"], name: "Israel", note: "One kingdom under Saul, David, and Solomon." },
    { eras: ["gospels", "apostolic"], name: "Judea & Galilee", note: "Divided into Roman provinces and tetrarchies." },
  ],
};

/**
 * The name in use during `era`, or null if the place kept its usual name.
 * Returns { name, note } so the panel can explain the change.
 */
export function eraNameFor(placeName, eraId) {
  const periods = PLACE_ERA_NAMES[placeName];
  if (!periods || !eraId) return null;
  const match = periods.find((period) => period.eras.includes(eraId));
  return match ? { name: match.name, note: match.note } : null;
}
