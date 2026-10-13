/**
 * seo/churches.js — the church directory behind /churches and /churches/<slug>.
 *
 * One object per church. Everything here is factual and comes from the church's
 * own website (or from the pastor directly) — never guess an address, a time, or
 * a name. Fields:
 *   slug        URL slug (lowercase, hyphens). Changing it needs a redirect.
 *   name        Full church name as the church writes it.
 *   website     Their homepage — the outbound link the page exists to give. Optional: when a church has
 *               no site, set `sermons` (their SermonAudio page) and the page links there instead.
 *   source/checked  Where the details came from and when (defaults: the church's website, October 2026).
 *   city/state/stateName/county
 *   address     { street, city, state, zip } — omit when the church has no building yet.
 *   phone, email, pastor, founded (year), affiliation (their own label)
 *   kjv         true only when the church itself says it uses the King James Bible.
 *   tagline     One line in their own words (from their homepage).
 *   about       One or two factual sentences. Their wording, not ours.
 *   services    [{ day, label, time }] in the order they list them.
 *   ministries  Optional short list in their words.
 *   social      { facebook, instagram, youtube }
 *   planting    true for a church that is gathering but has no building or schedule yet.
 */
export const CHURCHES = [
  {
    slug: "rogers-city-baptist-church",
    name: "Rogers City Baptist Church",
    website: "https://rogerscitybaptistchurch.com",
    city: "Rogers City", state: "MI", stateName: "Michigan", county: "Presque Isle County",
    address: { street: "2946 M-68", city: "Rogers City", state: "MI", zip: "49779" },
    phone: "(989) 306-2615",
    email: "rogerscitybaptist@gmail.com",
    pastor: "Pastor Drew Rogers",
    founded: 1987,
    affiliation: "Independent Baptist",
    kjv: true,
    tagline: "A church family on the shore of Lake Huron where the Bible is preached plainly.",
    about: "Rogers City Baptist Church has served Rogers City and Presque Isle County since 1987. The church holds that the King James Bible is God's providentially preserved Word for English-speaking people, and it preaches it plainly. Wednesday nights include a teen group and Master Clubs for kids.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "9:45 am" },
      { day: "Sunday", label: "Morning Worship", time: "11:00 am" },
      { day: "Sunday", label: "Evening Service", time: "6:00 pm" },
      { day: "Wednesday", label: "Wednesday Night (Teen Group & Kids' Master Clubs)", time: "7:00 pm" },
    ],
    social: { facebook: "https://facebook.com/rogerscitybaptist", youtube: "https://youtube.com/channel/UCqPpZQmThG58c9uVMTs_xZQ" },
  },
  {
    slug: "lakeview-baptist-church",
    name: "Lakeview Baptist Church",
    website: "https://mylakeviewbaptist.org",
    city: "Lakeview", state: "MI", stateName: "Michigan", county: "Montcalm County",
    address: { street: "9580 Howard City-Edmore Rd", city: "Lakeview", state: "MI", zip: "48850" },
    phone: "(989) 352-6796",
    pastor: "Pastor Tim Baker",
    affiliation: "Baptist",
    tagline: "Loving people and honoring Christ.",
    about: "Lakeview Baptist Church meets on Howard City-Edmore Road in Lakeview, Michigan. Services include singing, Bible teaching and preaching, fellowship, and prayer, with classes and activities for every age: nurseries for ages 0–2, age-specific Sunday School classes, Junior Church for children through age 12, and monthly activities for couples and teens. Services are also streamed live on Facebook.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "10:00 am" },
      { day: "Sunday", label: "Morning Service", time: "11:00 am" },
      { day: "Sunday", label: "Evening Service", time: "6:00 pm" },
      { day: "Wednesday", label: "Wednesday Night", time: "7:00 pm" },
    ],
    ministries: ["Children's ministries and nurseries", "Junior Church (through age 12)", "Teen church", "Couples' activities", "Ride the Bus", "Annual Trunk or Treat"],
    social: { facebook: "https://www.facebook.com/lakeviewbaptistchurchmi" },
    links: [["Lakeview Teen Church", "https://lakeviewteenchurch.com"], ["Trunk or Treat", "https://lakeviewtrunkortreat.com"]],
  },
  {
    slug: "tower-baptist-church",
    name: "Tower Baptist Church",
    website: "https://towerbaptistonaway.com",
    city: "Onaway", state: "MI", stateName: "Michigan", county: "Presque Isle County",
    address: { street: "7119 Black River Ave", city: "Onaway", state: "MI", zip: "49765" },
    phone: "(989) 733-2315",
    pastor: "Pastor Kurtis Rogers",
    affiliation: "Baptist",
    tagline: "A loving church focused on developing a relationship with God and furthering the Gospel.",
    about: "Tower Baptist Church meets on Black River Avenue in Onaway, Michigan, in Presque Isle County. The church describes itself as a loving church focused on developing a relationship with God and furthering the Gospel, with Sunday School, morning worship, Sunday evening prayer, and a Wednesday Bible study.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "9:45 am" },
      { day: "Sunday", label: "Morning Worship", time: "11:00 am" },
      { day: "Sunday", label: "Sunday Prayer", time: "6:00 pm" },
      { day: "Wednesday", label: "Wednesday Bible Study", time: "6:00 pm" },
    ],
    social: { facebook: "https://www.facebook.com/p/Tower-Baptist-Church-61577601627562/" },
  },
  {
    slug: "theway-big-rapids",
    name: "TheWay",
    nameLong: "TheWay — Big Rapids",
    website: "https://bigrapids.church",
    city: "Big Rapids", state: "MI", stateName: "Michigan", county: "Mecosta County",
    phone: "(231) 279-1900",
    email: "dillon@bigrapids.church",
    affiliation: "Independent, self-governed church",
    planting: true,
    tagline: "A new church forming in Big Rapids, Michigan.",
    about: "TheWay is a new church being formed in Big Rapids, Michigan, serving Mecosta County and the towns around it. It is gathering people first — meeting in homes and coffee shops — before holding regular Sunday services. The church aims to preach the Bible book by book, sing together, help every believer use their spiritual gifts, and say the gospel clearly at every gathering. Its stated purposes are to exhort, equip, and exalt Christ. Join the interest list on the website to hear the location and service times first.",
    services: [],
    social: { facebook: "https://facebook.com/thewaybigrapids", instagram: "https://instagram.com/theway_bigrapids", youtube: "https://youtube.com/@theway_bigrapids" },
  },
  {
    slug: "bible-believers-baptist-church",
    name: "Bible Believers Baptist Church",
    sermons: "https://sermonaudio.com/solo/bbbctawascity/",
    source: "the church's SermonAudio profile",
    city: "Tawas City", state: "MI", stateName: "Michigan", county: "Iosco County",
    address: { street: "21 South Chambers Road", city: "Tawas City", state: "MI", zip: "48763" },
    pastor: "Pastor Jeremy Evans",
    affiliation: "Independent Baptist",
    kjv: true,
    about: "Bible Believers Baptist Church is an independent, Bible-believing Baptist church in Tawas City, Michigan. The church aims to please the Lord by preaching from the Authorized Version King James Bible. Pastor Jeremy Evans has served as pastor since May 2015.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "9:45 am" },
      { day: "Sunday", label: "Sunday Morning", time: "11:00 am" },
      { day: "Sunday", label: "Sunday Evening", time: "5:00 pm" },
      { day: "Wednesday", label: "Wednesday Night", time: "7:00 pm" },
    ],
  },
  {
    slug: "liberty-baptist-church-greenville",
    name: "Liberty Baptist Church",
    sermons: "https://sermonaudio.com/solo/jesusdied4u/",
    source: "the church's SermonAudio profile",
    city: "Greenville", state: "MI", stateName: "Michigan", county: "Montcalm County",
    address: { street: "11845 W. Carson City Road", city: "Greenville", state: "MI", zip: "48838" },
    kjv: true,
    about: "Liberty Baptist Church in Greenville, Michigan uses the King James Bible. The church also runs a printing ministry, Liberty Gospel Tracts.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "10:00 am" },
      { day: "Sunday", label: "Sunday Morning Service", time: "11:00 am" },
      { day: "Sunday", label: "Sunday Evening Service", time: "6:00 pm" },
      { day: "Wednesday", label: "Wednesday Prayer Meeting", time: "7:00 pm" },
    ],
    ministries: ["Gospel tract printing ministry"],
  },
  {
    slug: "beth-haven-baptist-church",
    name: "Beth Haven Baptist Church",
    sermons: "https://www.sermonaudio.com/broadcasters/bethhavenbaptist/",
    source: "the church's SermonAudio profile",
    city: "Sheridan", state: "MI", stateName: "Michigan", county: "Montcalm County",
    address: { street: "1158 W Carson City Rd", city: "Sheridan", state: "MI", zip: "48884" },
    kjv: true,
    about: "Beth Haven Baptist Church in Sheridan, Michigan preaches from the King James Bible. There is a Spanish service at 11:00 am on Sundays, the church holds back-to-back services on the last Sunday of each month, and services are broadcast live online.",
    services: [
      { day: "Sunday", label: "Sunday School", time: "10:00 am" },
      { day: "Sunday", label: "Sunday Morning Service", time: "11:00 am" },
      { day: "Sunday", label: "Spanish Service", time: "11:00 am" },
      { day: "Sunday", label: "Sunday Evening Service", time: "6:00 pm" },
      { day: "Wednesday", label: "Wednesday Service", time: "7:00 pm" },
    ],
    ministries: ["Spanish service", "Addictions Program (7:00 pm)"],
  },
];

export const CHURCH_BY_SLUG = new Map(CHURCHES.map((c) => [c.slug, c]));

/** Churches grouped by state, states alphabetical, churches by city then name. */
export function churchesByState() {
  const m = new Map();
  for (const c of CHURCHES) {
    if (!m.has(c.state)) m.set(c.state, { state: c.state, stateName: c.stateName, churches: [] });
    m.get(c.state).churches.push(c);
  }
  for (const g of m.values()) g.churches.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
  return [...m.values()].sort((a, b) => a.stateName.localeCompare(b.stateName));
}
