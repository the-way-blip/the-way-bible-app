/**
 * Journeys — the routes Scripture actually traces across the map.
 *
 * A journey is an ordered list of waypoints, each naming a place in the
 * OpenBible dataset (by its exact id where the name is ambiguous, e.g.
 * "Antioch 1" for Syrian Antioch). The atlas draws the route over the terrain
 * and can fly the camera along it, stopping at each waypoint.
 *
 * `chapters` lists the passages the journey belongs to, so the reader can
 * offer it when you're reading them. Routes are straight-line approximations
 * between known points — ancient roads and sea lanes rarely ran straight, and
 * several of these waypoints are themselves uncertain.
 */

const R = (book, from, to) => ({ book, from, to: to ?? from });

export const JOURNEYS = [
  {
    id: "abraham",
    title: "Abraham's Journey of Faith",
    era: "patriarchs",
    mode: "land",
    summary: "Called out of a great city to live in tents in a land he did not own.",
    chapters: [R("Genesis", 11, 13), R("Genesis", 20, 23)],
    waypoints: [
      { place: "Ur", label: "Ur of the Chaldees", verse: "Gen 11:31", note: "Terah takes the family out of Ur toward Canaan." },
      { place: "Haran", verse: "Gen 11:31", note: "They settle here, and Abram's father dies." },
      { place: "Shechem", verse: "Gen 12:6", note: "First stop in Canaan — 'to your offspring I will give this land.'" },
      { place: "Bethel 1", label: "Bethel", verse: "Gen 12:8", note: "He builds an altar and calls on the name of the LORD." },
      { place: "Egypt", verse: "Gen 12:10", note: "Famine drives him south, where he passes Sarai off as his sister." },
      { place: "Bethel 1", label: "Bethel (return)", verse: "Gen 13:3", note: "Back to the altar he made at the first." },
      { place: "Hebron", verse: "Gen 13:18", note: "He settles by the oaks of Mamre — and buys a burial cave." },
    ],
  },
  {
    id: "jacob",
    title: "Jacob's Flight and Return",
    era: "patriarchs",
    mode: "land",
    summary: "Twenty years away from home, bracketed by two encounters with God.",
    chapters: [R("Genesis", 28, 33)],
    waypoints: [
      { place: "Beersheba", verse: "Gen 28:10", note: "He leaves with nothing but a staff." },
      { place: "Bethel 1", label: "Bethel", verse: "Gen 28:19", note: "The ladder, the promise, the stone pillow." },
      { place: "Haran", verse: "Gen 29:4", note: "Twenty years serving Laban for Leah and Rachel." },
      { place: "Mahanaim", verse: "Gen 32:2", note: "'This is God's camp' — angels meet him on the way home." },
      { place: "Peniel", verse: "Gen 32:30", note: "He wrestles till daybreak and limps away renamed Israel." },
      { place: "Succoth 1", label: "Succoth", verse: "Gen 33:17", note: "He builds a house and booths for his livestock." },
      { place: "Shechem", verse: "Gen 33:18", note: "He comes safely to the city and buys a piece of the field." },
    ],
  },
  {
    id: "exodus",
    title: "The Exodus",
    era: "egypt-exodus",
    mode: "land",
    summary: "Out of Egypt, through the sea, and forty years in the wilderness.",
    chapters: [R("Exodus", 12, 19), R("Numbers", 20, 21), R("Numbers", 33, 33), R("Deuteronomy", 34, 34)],
    waypoints: [
      { place: "Goshen 1", label: "Goshen", verse: "Ex 12:37", note: "Israel leaves after the last plague — about six hundred thousand men." },
      { place: "Succoth 2", label: "Succoth", verse: "Ex 12:37", note: "The first stage out of Egypt." },
      { place: "Red Sea", verse: "Ex 14:21", note: "The waters divide and Pharaoh's army does not come up again." },
      { place: "Marah", verse: "Ex 15:23", note: "Bitter water made sweet; the LORD names himself their healer." },
      { place: "Elim", verse: "Ex 15:27", note: "Twelve springs and seventy palms." },
      { place: "Rephidim", verse: "Ex 17:6", note: "Water from the rock, and Amalek defeated while Moses' hands are held up." },
      { place: "Mount Sinai", verse: "Ex 19:20", note: "The mountain smokes and the covenant is given." },
      { place: "Kadesh-barnea", verse: "Num 13:26", note: "The spies return; the people refuse to go up. Forty years begin here." },
      { place: "Mount Hor 1", label: "Mount Hor", verse: "Num 20:28", note: "Aaron dies and the priesthood passes to Eleazar." },
      { place: "Pisgah", verse: "Deut 34:1", note: "Moses sees the land from the top of Pisgah, and dies there." },
    ],
  },
  {
    id: "conquest",
    title: "Joshua's Campaign",
    era: "conquest",
    mode: "land",
    summary: "Across the Jordan and through the land, city by city.",
    chapters: [R("Joshua", 3, 12)],
    waypoints: [
      { place: "Jordan", label: "The Jordan crossing", verse: "Josh 3:17", note: "The priests stand in the riverbed until all Israel passes over." },
      { place: "Gilgal 1", label: "Gilgal", verse: "Josh 4:19", note: "Twelve stones set up; the reproach of Egypt rolled away." },
      { place: "Jericho", verse: "Josh 6:20", note: "Seven days, seven priests, and the wall falls down flat." },
      { place: "Ai 1", label: "Ai", verse: "Josh 8:1", note: "Defeat, then victory once Achan's sin is dealt with." },
      { place: "Gibeon", verse: "Josh 10:12", note: "The sun stands still while Israel defends its treaty partner." },
      { place: "Makkedah", verse: "Josh 10:16", note: "Five kings hide in a cave and are sealed in." },
      { place: "Lachish", verse: "Josh 10:32", note: "Taken on the second day." },
      { place: "Hebron", verse: "Josh 10:36", note: "The city of the Anakim falls to Caleb." },
      { place: "Debir 1", label: "Debir", verse: "Josh 10:38", note: "The last of the southern campaign." },
      { place: "Hazor 1", label: "Hazor", verse: "Josh 11:10", note: "'The head of all those kingdoms' — burned with fire." },
    ],
  },
  {
    id: "nativity",
    title: "From Nazareth to Bethlehem",
    era: "gospels",
    mode: "land",
    summary: "A census, a stable, a flight by night, and a quiet return.",
    chapters: [R("Matthew", 2, 2), R("Luke", 2, 2)],
    waypoints: [
      { place: "Nazareth", verse: "Luke 2:4", note: "Joseph goes up from Galilee because he is of the house of David." },
      { place: "Bethlehem 1", label: "Bethlehem", verse: "Luke 2:7", note: "She laid him in a manger, because there was no room." },
      { place: "Jerusalem", verse: "Luke 2:22", note: "Presented at the temple, where Simeon and Anna are waiting." },
      { place: "Egypt", verse: "Matt 2:14", note: "'Out of Egypt I called my son' — the flight from Herod." },
      { place: "Nazareth", label: "Nazareth (return)", verse: "Matt 2:23", note: "He shall be called a Nazarene." },
    ],
  },
  {
    id: "passion-journey",
    title: "The Road to Jerusalem",
    era: "gospels",
    mode: "land",
    summary: "Jesus sets his face to go to Jerusalem, and does not turn aside.",
    chapters: [R("Luke", 9, 19), R("Matthew", 19, 21), R("Mark", 10, 11)],
    waypoints: [
      { place: "Capernaum", verse: "Matt 17:24", note: "The Galilean ministry ends; he turns south." },
      { place: "Samaria", verse: "Luke 9:52", note: "A village refuses him because his face is set toward Jerusalem." },
      { place: "Jericho", verse: "Luke 19:1", note: "Blind Bartimaeus receives sight; Zacchaeus comes down from the tree." },
      { place: "Bethany 1", label: "Bethany", verse: "John 12:1", note: "Six days before the Passover, anointed for burial." },
      { place: "Jerusalem", verse: "Matt 21:10", note: "He enters on a colt and the whole city is stirred." },
    ],
  },
  {
    id: "paul-1",
    title: "Paul's First Missionary Journey",
    era: "apostolic",
    mode: "mixed",
    summary: "Sent out from Antioch by the Holy Spirit, and stoned before they got home.",
    chapters: [R("Acts", 13, 14)],
    waypoints: [
      { place: "Antioch 1", label: "Antioch in Syria", verse: "Acts 13:2", note: "'Set apart for me Barnabas and Saul.'" },
      { place: "Salamis", verse: "Acts 13:5", note: "They proclaim the word in the synagogues of Cyprus." },
      { place: "Paphos", verse: "Acts 13:6", note: "Elymas the magician is struck blind; the proconsul believes." },
      { place: "Perga", verse: "Acts 13:13", note: "John Mark leaves them and returns to Jerusalem." },
      { place: "Antioch 2", label: "Antioch in Pisidia", verse: "Acts 13:14", note: "A synagogue sermon, then a turn to the Gentiles." },
      { place: "Iconium", verse: "Acts 14:1", note: "They speak boldly for a long time until a plot drives them out." },
      { place: "Lystra", verse: "Acts 14:8", note: "Hailed as gods, then Paul is stoned and left for dead." },
      { place: "Derbe", verse: "Acts 14:20", note: "They preach and make many disciples." },
      { place: "Antioch 1", label: "Antioch (return)", verse: "Acts 14:27", note: "They report how God had opened a door of faith to the Gentiles." },
    ],
  },
  {
    id: "paul-2",
    title: "Paul's Second Missionary Journey",
    era: "apostolic",
    mode: "mixed",
    summary: "A vision at Troas carries the gospel into Europe.",
    chapters: [R("Acts", 15, 18)],
    waypoints: [
      { place: "Antioch 1", label: "Antioch in Syria", verse: "Acts 15:36", note: "Paul and Barnabas part ways; Silas goes instead." },
      { place: "Derbe", verse: "Acts 16:1", note: "Then to Lystra, where Timothy joins them." },
      { place: "Troas", verse: "Acts 16:9", note: "'Come over to Macedonia and help us.'" },
      { place: "Philippi", verse: "Acts 16:12", note: "Lydia believes; an earthquake opens the jail at midnight." },
      { place: "Thessalonica", verse: "Acts 17:1", note: "Three Sabbaths reasoning from the Scriptures." },
      { place: "Berea", verse: "Acts 17:10", note: "They examined the Scriptures daily to see if it was so." },
      { place: "Athens", verse: "Acts 17:22", note: "The unknown god, declared on the Areopagus." },
      { place: "Corinth", verse: "Acts 18:1", note: "Eighteen months with Aquila and Priscilla." },
      { place: "Ephesus", verse: "Acts 18:19", note: "A brief stop, with a promise to return." },
      { place: "Caesarea", verse: "Acts 18:22", note: "He lands, greets the church, and goes down to Antioch." },
    ],
  },
  {
    id: "paul-3",
    title: "Paul's Third Missionary Journey",
    era: "apostolic",
    mode: "mixed",
    summary: "Three years in Ephesus, a riot, and a farewell he knew was final.",
    chapters: [R("Acts", 18, 21)],
    waypoints: [
      { place: "Antioch 1", label: "Antioch in Syria", verse: "Acts 18:23", note: "He sets out again, strengthening the disciples." },
      { place: "Ephesus", verse: "Acts 19:10", note: "Two years, so that all Asia heard the word — then the silversmiths riot." },
      { place: "Philippi", label: "Macedonia", verse: "Acts 20:1", note: "He encourages the churches on his way through." },
      { place: "Corinth", label: "Greece", verse: "Acts 20:3", note: "Three months, cut short by a plot against him." },
      { place: "Troas", verse: "Acts 20:9", note: "Eutychus falls from the window during the long sermon." },
      { place: "Miletus", verse: "Acts 20:17", note: "He tells the Ephesian elders they will not see his face again." },
      { place: "Tyre", verse: "Acts 21:3", note: "Disciples urge him through the Spirit not to go on." },
      { place: "Caesarea", verse: "Acts 21:8", note: "Agabus binds his own hands with Paul's belt." },
      { place: "Jerusalem", verse: "Acts 21:17", note: "The brothers receive him gladly — and within days he is arrested." },
    ],
  },
  {
    id: "rome-voyage",
    title: "The Voyage to Rome",
    era: "apostolic",
    mode: "sea",
    summary: "A prisoner's appeal to Caesar, a fortnight in a storm, and a shipwreck on Malta.",
    chapters: [R("Acts", 27, 28)],
    waypoints: [
      { place: "Caesarea", verse: "Acts 27:2", note: "They put to sea with Julius the centurion and Luke aboard." },
      { place: "Sidon", verse: "Acts 27:3", note: "Julius treats Paul kindly and lets him visit friends." },
      { place: "Myra", verse: "Acts 27:5", note: "They transfer to an Alexandrian grain ship bound for Italy." },
      { place: "Cnidus", verse: "Acts 27:7", note: "The wind will not allow them to hold their course." },
      { place: "Salmone", verse: "Acts 27:7", note: "They run under the lee of Crete." },
      { place: "Fair Havens", verse: "Acts 27:8", note: "Paul warns them the voyage will bring loss — they sail anyway." },
      { place: "Malta", verse: "Acts 28:1", note: "Fourteen days driven in the storm; all 276 reach shore alive." },
      { place: "Syracuse", verse: "Acts 28:12", note: "Three days in Sicily." },
      { place: "Rhegium", verse: "Acts 28:13", note: "A south wind carries them up the Italian coast." },
      { place: "Puteoli", verse: "Acts 28:13", note: "They find brothers there and stay seven days." },
      { place: "Rome", verse: "Acts 28:16", note: "Two years under guard, preaching with all boldness and without hindrance." },
    ],
  },
];

/** Journeys whose passages include this chapter. */
export function journeysForChapter(book, chapter) {
  const num = Number(chapter) || 0;
  return JOURNEYS.filter((journey) =>
    journey.chapters.some((r) => r.book === book && num >= r.from && num <= r.to)
  );
}

/** Journeys belonging to an era, for the timeline view. */
export function journeysForEra(eraId) {
  return JOURNEYS.filter((journey) => journey.era === eraId);
}

export function getJourney(id) {
  return JOURNEYS.find((journey) => journey.id === id) || null;
}
