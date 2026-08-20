/**
 * Curated "why this place matters" notes for biblical geography.
 *
 * Keys are the exact place names used by the OpenBible.info geocoding
 * dataset (including its disambiguating suffixes, e.g. "Bethel 1"), so the
 * build script (scripts/build-bible-places.mjs) can join them by name.
 *
 *   note   — one or two sentences on the place's biblical significance
 *   modern — present-day name / country, when it helps orient the reader
 *
 * Places without an entry here still appear on the map; they simply fall back
 * to a note generated from the dataset (mention counts + OpenBible's comment).
 */

export const PLACE_NOTES = {
  // ── The land of Israel / Judah ──────────────────────────────────────────
  "Jerusalem": {
    note: "The city God chose for his name to dwell. Site of Solomon's temple, the crucifixion and resurrection, and Pentecost — and the city the prophets say will be made new.",
    modern: "Jerusalem",
  },
  "Zion": {
    note: "Originally the Jebusite stronghold David captured; the name widens through Scripture to mean the temple mount, the city, and finally the people of God themselves.",
    modern: "Jerusalem",
  },
  "Mount Zion": {
    note: "The hill of the Lord — where the psalms locate God's dwelling, and where Hebrews says believers have already come by faith.",
    modern: "Jerusalem",
  },
  "Mount of Olives": {
    note: "The ridge east of Jerusalem where Jesus taught the Olivet Discourse, wept over the city, prayed in Gethsemane, and ascended.",
    modern: "Jerusalem",
  },
  "Gethsemane": {
    note: "The olive grove where Jesus prayed 'not my will, but yours' and was betrayed and arrested.",
    modern: "Jerusalem",
  },
  "Golgotha": {
    note: "'The place of a skull' — the site of the crucifixion, just outside the city wall.",
    modern: "Jerusalem",
  },
  "Bethany 1": {
    note: "Home of Mary, Martha, and Lazarus, and Jesus' lodging during Passion Week. Here he raised Lazarus and was anointed for burial.",
    modern: "al-Eizariya",
  },
  "Bethphage": {
    note: "The village on the Mount of Olives where Jesus sent for the colt before riding into Jerusalem.",
  },
  "Siloam": {
    note: "The pool fed by Hezekiah's tunnel, where Jesus sent the man born blind to wash and receive sight.",
    modern: "Jerusalem",
  },
  "Bethesda": {
    note: "The pool by the Sheep Gate where Jesus healed a man paralyzed for thirty-eight years — on a Sabbath.",
    modern: "Jerusalem",
  },
  "Kidron": {
    note: "The valley between Jerusalem and the Mount of Olives. Kings burned idols here; David fled across it, and so did Jesus on the night he was betrayed.",
  },
  "Valley of Hinnom": {
    note: "The ravine south of Jerusalem where children were sacrificed to Molech. Its name (Gehenna) became the New Testament's word for hell.",
  },
  "Valley of the Son of Hinnom": {
    note: "Where Judah's kings burned their children in the fire — the defilement Josiah destroyed and Jeremiah renamed 'the Valley of Slaughter.'",
  },
  "Topheth": {
    note: "The high place in the Valley of Hinnom used for child sacrifice, defiled by King Josiah in his reform.",
  },
  "Bethlehem 1": {
    note: "The 'house of bread' — where Ruth gleaned, David was anointed, and Micah said the ruler of Israel would be born.",
    modern: "Bethlehem, West Bank",
  },
  "Hebron": {
    note: "Abraham's long home and the burial cave of the patriarchs. David reigned here seven years before taking Jerusalem.",
    modern: "Hebron, West Bank",
  },
  "Kiriath-arba": {
    note: "The older name of Hebron, the city of Arba the Anakite, given to Caleb for his faith.",
  },
  "Beersheba": {
    note: "The southern edge of the land — 'from Dan to Beersheba.' Abraham, Isaac, and Jacob all dug wells and met God here.",
    modern: "Be'er Sheva, Israel",
  },
  "Shechem": {
    note: "Abraham's first stop in Canaan and Joshua's covenant-renewal site between Ebal and Gerizim. Later the first capital of the northern kingdom.",
    modern: "Nablus, West Bank",
  },
  "Bethel 1": {
    note: "Where Jacob dreamed of the ladder and said 'surely the LORD is in this place.' Jeroboam later set a golden calf here.",
  },
  "Shiloh": {
    note: "Israel's first central sanctuary — the tabernacle stood here through the judges, and Samuel heard God's voice as a boy.",
  },
  "Gilgal 1": {
    note: "Israel's first camp west of the Jordan, where twelve memorial stones were set up and the reproach of Egypt was rolled away.",
  },
  "Jericho": {
    note: "The first city taken in Canaan, whose walls fell after seven days. Later, where Jesus healed Bartimaeus and called Zacchaeus down.",
    modern: "Jericho, West Bank",
  },
  "Ai 1": {
    note: "The city that defeated Israel because of Achan's sin, then fell once the sin was dealt with — a lesson in covenant seriousness.",
  },
  "Gibeon": {
    note: "The city that tricked Israel into a treaty, later where the sun stood still and where Solomon asked God for wisdom.",
  },
  "Gibeah 1": {
    note: "Saul's hometown and capital, and the site of the atrocity in Judges 19 that nearly destroyed the tribe of Benjamin.",
  },
  "Ramah 1": {
    note: "Samuel's home, where he judged Israel and anointed Saul. Jeremiah heard Rachel weeping here for her children.",
  },
  "Mizpah 3": {
    note: "Where Samuel gathered Israel to repent and raised the stone Ebenezer — 'till now the LORD has helped us.'",
  },
  "Nazareth": {
    note: "The obscure Galilean village where Jesus grew up — 'can anything good come out of Nazareth?' — and where his own town tried to throw him off a cliff.",
    modern: "Nazareth, Israel",
  },
  "Capernaum": {
    note: "Jesus' home base in Galilee. He taught in its synagogue, healed Peter's mother-in-law here, and pronounced woe on it for unbelief.",
  },
  "Sea of Galilee": {
    note: "The freshwater lake where Jesus called fishermen, calmed the storm, walked on the water, and cooked breakfast for Peter after the resurrection.",
    modern: "Lake Kinneret, Israel",
  },
  "Bethsaida": {
    note: "Hometown of Peter, Andrew, and Philip, and where Jesus fed the five thousand and healed a blind man in two stages.",
  },
  "Chorazin": {
    note: "One of the three Galilean towns Jesus rebuked: they saw the most miracles and repented least.",
  },
  "Cana": {
    note: "Where Jesus turned water into wine — the first of his signs — and later healed an official's son from a distance.",
  },
  "Nain": {
    note: "Where Jesus stopped a funeral procession and raised a widow's only son.",
  },
  "Caesarea Philippi": {
    note: "At the foot of Mount Hermon, near a cave sacred to pagan gods, Peter confessed 'You are the Christ' and Jesus spoke of building his church.",
    modern: "Banias, Golan Heights",
  },
  "Mount Tabor": {
    note: "Where Deborah and Barak mustered against Sisera; a long tradition also places the Transfiguration here.",
  },
  "Mount Carmel": {
    note: "Where Elijah faced 450 prophets of Baal and fire fell from heaven — 'the LORD, he is God.'",
  },
  "Carmel": {
    note: "The wooded ridge over the Mediterranean, symbol of fruitfulness in the prophets and the stage for Elijah's contest with Baal.",
  },
  "Jezreel 2": {
    note: "Ahab and Jezebel's royal city — Naboth's vineyard, Jezebel's death, and Hosea's sign-name for God's judgment and mercy.",
  },
  "Megiddo": {
    note: "The fortress guarding the pass into the Jezreel Valley, fought over for millennia. Revelation's 'Armageddon' takes its name from this hill.",
    modern: "Tel Megiddo, Israel",
  },
  "Samaria": {
    note: "Capital of the northern kingdom, built by Omri. Its fall in 722 BC scattered the ten tribes; by Jesus' day 'Samaritan' was a slur he deliberately overturned.",
  },
  "Sychar": {
    note: "The Samaritan village by Jacob's well where Jesus asked a woman for a drink and revealed himself as Messiah.",
  },
  "Dan": {
    note: "Israel's northern boundary marker, and the site of Jeroboam's second golden calf.",
  },
  "Shunem": {
    note: "Home of the woman who built a room for Elisha and whose son he raised from the dead.",
  },
  "En-dor": {
    note: "Where Saul, abandoned by God, consulted a medium the night before his death on Gilboa.",
  },
  "Mount Gilboa": {
    note: "Where Saul and Jonathan fell to the Philistines, prompting David's lament: 'How the mighty have fallen.'",
  },
  "Aphek 2": {
    note: "Where the Philistines captured the ark and the glory departed from Israel.",
  },
  "Ebenezer": {
    note: "The 'stone of help' Samuel set up after the Lord routed the Philistines.",
  },
  "Beth-shemesh 1": {
    note: "Where the ark returned from Philistine hands on a new cart drawn by lowing cows.",
  },
  "Kiriath-jearim": {
    note: "Where the ark rested twenty years until David brought it up to Jerusalem.",
  },
  "Adullam": {
    note: "The cave where David hid from Saul and gathered the distressed, indebted, and discontented into an army.",
  },
  "Engedi": {
    note: "The desert oasis by the Dead Sea where David spared Saul's life in a cave.",
  },
  "Ziklag": {
    note: "The Philistine town given to David, raided and burned by the Amalekites — where he 'strengthened himself in the LORD his God.'",
  },
  "Mahanaim": {
    note: "Where Jacob met the angels of God, and where David sheltered during Absalom's revolt.",
  },
  "Peniel": {
    note: "Where Jacob wrestled with God all night, was renamed Israel, and walked away limping.",
  },
  "Succoth 1": {
    note: "Jacob's stopping place after Peniel, later where Gideon's exhausted men were refused bread.",
  },
  "Jabbok": {
    note: "The river Jacob crossed the night he wrestled with God.",
    modern: "Zarqa River, Jordan",
  },
  "Jordan": {
    note: "The river Israel crossed into the promised land, where Naaman was cleansed, Elijah was taken up, and Jesus was baptized.",
    modern: "Jordan River",
  },
  "Lachish": {
    note: "Judah's second city, besieged by Sennacherib — a siege carved in stone on the walls of Nineveh.",
  },
  "Azekah": {
    note: "Overlooking the Valley of Elah where David faced Goliath; one of the last two forts standing when Babylon came.",
  },
  "Tekoa": {
    note: "The shepherd town of Amos the prophet, and home of the wise woman Joab sent to King David.",
  },
  "Anathoth": {
    note: "Jeremiah's hometown — where his own family plotted against him, and where he bought a field as a sign of return from exile.",
  },
  "Gath": {
    note: "The Philistine city of Goliath, where David once feigned madness to escape.",
  },
  "Ashdod": {
    note: "The Philistine city where the captured ark left Dagon broken before it.",
  },
  "Ashkelon": {
    note: "A Philistine coastal city, repeatedly named in the prophets' oracles against the nations.",
  },
  "Ekron": {
    note: "Philistine city whose god Baal-zebub Ahaziah consulted instead of the Lord.",
  },
  "Gaza": {
    note: "The Philistine city where Samson carried off the gates and later brought down the temple of Dagon.",
  },
  "Gezer": {
    note: "A Canaanite fortress city given to Solomon as a dowry and rebuilt by him.",
  },
  "Joppa": {
    note: "The port where Jonah boarded a ship away from Nineveh, and where Peter saw the sheet lowered from heaven.",
    modern: "Jaffa, Israel",
  },
  "Caesarea": {
    note: "Herod's Roman harbor city — where Cornelius was baptized, Philip settled, and Paul was imprisoned two years before sailing to Rome.",
  },
  "Emmaus": {
    note: "The village on the road where the risen Jesus opened the Scriptures to two disciples and was known in the breaking of bread.",
  },
  "Bethany 2": {
    note: "'Bethany beyond the Jordan,' where John was baptizing when he pointed to Jesus as the Lamb of God.",
  },
  "Aenon": {
    note: "Where John baptized 'because water was plentiful there,' and where he said Christ must increase and he must decrease.",
  },
  "Hazor 1": {
    note: "'The head of all those kingdoms' — the Canaanite superpower Joshua burned.",
  },
  "Ramoth-gilead": {
    note: "The frontier city Ahab died trying to retake, after ignoring the prophet Micaiah.",
  },
  "Jabesh-gilead": {
    note: "The city Saul rescued in his first act as king; its men later risked everything to bury his body honorably.",
  },
  "Shephelah": {
    note: "The rolling foothills between the coast and Judah's hills — the buffer zone where Israel and Philistia collided.",
  },
  "Negeb": {
    note: "The dry southern region where the patriarchs pastured flocks and Israel wandered before entering Canaan.",
  },
  "Arabah": {
    note: "The rift valley running from Galilee to the Gulf of Aqaba — desert country in the prophets' images of restoration.",
  },
  "Salt Sea": {
    note: "The Dead Sea, lowest place on earth, near the ruin of Sodom. Ezekiel saw its waters healed and teeming with fish.",
    modern: "Dead Sea",
  },
  "Valley of Rephaim": {
    note: "Southwest of Jerusalem, where David twice defeated the Philistines — once waiting for the sound of marching in the balsam trees.",
  },
  "Zorah": {
    note: "Samson's birthplace, where the angel of the Lord appeared to his parents.",
  },
  "Eshtaol": {
    note: "Where the Spirit of the Lord first stirred Samson, and where he was buried.",
  },
  "Timnah 1": {
    note: "Where Samson took a Philistine wife and killed a lion with his bare hands.",
  },
  "Michmash": {
    note: "Where Jonathan and his armor-bearer climbed a cliff and routed a Philistine garrison, saying 'nothing can hinder the LORD.'",
  },
  "Tirzah": {
    note: "An early capital of the northern kingdom before Omri moved to Samaria; praised in Song of Solomon for its beauty.",
  },

  // ── Egypt, Sinai, and the wilderness ────────────────────────────────────
  "Egypt": {
    note: "Refuge in famine, then house of slavery — the place God brought Israel out of, the exodus that defines the rest of Scripture.",
  },
  "Goshen 1": {
    note: "The fertile delta region Pharaoh gave to Jacob's family, where Israel grew into a nation and where the plagues did not fall.",
  },
  "Nile": {
    note: "Egypt's lifeline — turned to blood in the first plague, and the river Moses was drawn out of as an infant.",
  },
  "Memphis": {
    note: "Ancient capital of Lower Egypt, named in the prophets' judgments against Egypt's idols.",
  },
  "Red Sea": {
    note: "Where the waters parted for Israel and closed over Pharaoh's army — the Old Testament's great picture of salvation.",
  },
  "Mount Sinai": {
    note: "Where God descended in fire and smoke, gave the Ten Commandments, and made covenant with Israel.",
  },
  "Horeb": {
    note: "'The mountain of God' — the burning bush, water from the rock, and where Elijah heard the low whisper.",
  },
  "Marah": {
    note: "Where the bitter water was made sweet and the Lord named himself Israel's healer.",
  },
  "Elim": {
    note: "The oasis of twelve springs and seventy palms after the bitterness of Marah.",
  },
  "Rephidim": {
    note: "Where water came from the rock and where Israel defeated Amalek while Aaron and Hur held up Moses' hands.",
  },
  "Kadesh-barnea": {
    note: "Where the twelve spies returned and Israel refused to enter the land — costing a generation forty years in the wilderness.",
  },
  "Paran": {
    note: "The wilderness where Israel camped and from which the spies were sent into Canaan.",
  },
  "Mount Hor 1": {
    note: "Where Aaron died and the high priesthood passed to his son Eleazar.",
  },
  "Pisgah": {
    note: "The ridge from which Moses saw the promised land he would not enter.",
  },
  "Mount Nebo": {
    note: "Where Moses died in sight of Canaan, and where the Lord himself buried him.",
    modern: "Jordan",
  },
  "Ezion-geber": {
    note: "Solomon's Red Sea port for the fleet that sailed to Ophir.",
  },
  "Sinai": {
    note: "The peninsula and wilderness of Israel's forty years — testing, manna, and the giving of the law.",
  },
  "Midian": {
    note: "Where Moses fled from Pharaoh, married Zipporah, kept sheep for forty years, and met God in the bush.",
  },

  // ── Neighbors and empires ───────────────────────────────────────────────
  "Babylon": {
    note: "From the tower of Babel to the empire that burned the temple and carried Judah into exile — Scripture's enduring symbol of proud human civilization.",
    modern: "Iraq",
  },
  "Babylonia": {
    note: "The empire that destroyed Jerusalem in 586 BC and held Judah captive seventy years, until Cyrus let them go home.",
  },
  "Shinar": {
    note: "The plain where humanity built the tower of Babel and God confused their language.",
  },
  "Ur": {
    note: "Abraham's birthplace in Mesopotamia — the city he left when God called him to a land he had not seen.",
    modern: "Tell el-Muqayyar, Iraq",
  },
  "Haran": {
    note: "Where Terah's family settled on the way to Canaan, where Abraham was called out, and where Jacob served Laban twenty years.",
  },
  "Paddan-aram": {
    note: "The region around Haran where both Isaac and Jacob found their wives among Abraham's kin.",
  },
  "Euphrates": {
    note: "The great river marking the promised land's ideal northern boundary, and the road Israel's conquerors traveled.",
  },
  "Chebar": {
    note: "The canal in Babylon where Ezekiel, among the exiles, saw the heavens open and the glory of God.",
  },
  "Assyria": {
    note: "The empire that destroyed Samaria and deported the northern tribes, then besieged Jerusalem — and was stopped by an angel in one night.",
  },
  "Nineveh": {
    note: "Assyria's capital, the city Jonah fled from preaching to and that repented at his message — and that Nahum later saw fall.",
    modern: "Mosul, Iraq",
  },
  "Persia": {
    note: "The empire of Cyrus, who decreed the exiles' return, and of Ahasuerus, whose queen Esther saved her people.",
  },
  "Susa": {
    note: "The Persian winter capital — Esther's palace, Nehemiah's post before he asked to rebuild Jerusalem, and where Daniel saw visions.",
  },
  "Media": {
    note: "Persia's partner empire; Daniel's 'law of the Medes and Persians' that could not be changed.",
  },
  "Elam": {
    note: "An ancient kingdom east of Babylon, present at Pentecost among the nations hearing the gospel in their own tongue.",
  },
  "Syria": {
    note: "Israel's persistent northern rival (Aram). Naaman its commander was healed; its capital Damascus became the road of Paul's conversion.",
  },
  "Damascus": {
    note: "Ancient capital of Syria — where Paul was struck blind, baptized, and lowered over the wall in a basket to escape.",
    modern: "Damascus, Syria",
  },
  "Moab": {
    note: "Lot's descendants east of the Dead Sea. Balaam prophesied here, Israel camped here — and Ruth the Moabite became David's great-grandmother.",
  },
  "Ammon": {
    note: "Israel's eastern neighbor and frequent adversary; its god Molech drew Solomon's heart away.",
  },
  "Edom": {
    note: "Esau's descendants, who refused Israel passage and later cheered Jerusalem's fall — the subject of Obadiah's whole prophecy.",
  },
  "Seir": {
    note: "The mountainous land God gave to Esau, and the highlands Edom held.",
  },
  "Bozrah 1": {
    note: "Edom's stronghold, pictured in Isaiah as the place of God's crimson-stained judgment.",
  },
  "Amalek": {
    note: "The desert people who attacked Israel's stragglers after the exodus and became the type of unrelenting enmity against God's people.",
  },
  "Philistia": {
    note: "The coastal confederation of five cities that dominated Israel through the judges and Saul's reign.",
  },
  "Tyre": {
    note: "The Phoenician sea power that supplied cedar for the temple, then drew Ezekiel's oracle against its pride. Jesus healed a woman's daughter in its region.",
    modern: "Sour, Lebanon",
  },
  "Sidon": {
    note: "Phoenician port and home of Jezebel; where Elijah was fed by a widow, and a region Jesus visited.",
    modern: "Saida, Lebanon",
  },
  "Zarephath": {
    note: "Where a starving widow fed Elijah first and her jar of flour never ran out — the story Jesus used to explain God's mercy to outsiders.",
  },
  "Lebanon": {
    note: "The cedar-covered mountains that supplied Solomon's temple and became the prophets' image of strength and glory.",
  },
  "Bashan": {
    note: "The rich northeastern grazing land of Og's kingdom — its bulls and oaks are proverbs for arrogant strength.",
  },
  "Gilead": {
    note: "The wooded highlands east of the Jordan, known for its healing balm — 'is there no balm in Gilead?'",
  },
  "Mount Hermon": {
    note: "The snow-capped peak at Israel's northern edge; its dew is the psalmist's picture of blessing, and many locate the Transfiguration here.",
  },
  "Canaan": {
    note: "The land promised to Abraham and his offspring — the whole hinge of the Pentateuch and Joshua.",
  },
  "Sodom": {
    note: "Destroyed with fire from heaven for its wickedness; the Bible's standing warning, and the city Abraham bargained for.",
  },
  "Gomorrah": {
    note: "Sodom's twin city, destroyed with it — named together throughout Scripture as the pattern of judgment.",
  },
  "Zoar": {
    note: "The small town Lot fled to and begged to be spared when Sodom burned.",
  },
  "Ararat": {
    note: "The mountains where the ark came to rest as the flood receded.",
  },
  "Cush": {
    note: "The land south of Egypt (Nubia/Ethiopia); its eunuch was baptized by Philip on the Gaza road.",
  },
  "Sheba": {
    note: "The Arabian kingdom whose queen traveled to test Solomon's wisdom and left overwhelmed.",
  },
  "Ophir": {
    note: "The distant source of Solomon's gold, proverbial in Scripture for the finest wealth.",
  },
  "Tarshish": {
    note: "The far western port Jonah bought passage to when he fled from the Lord.",
  },
  "Arabia": {
    note: "The desert region where Paul withdrew after his conversion before returning to Damascus.",
  },
  "Hamath": {
    note: "The northern city marking the ideal boundary of Israel's territory.",
  },
  "Riblah 1": {
    note: "Where Nebuchadnezzar killed Zedekiah's sons before his eyes and then blinded him.",
  },

  // ── The world of the apostles ───────────────────────────────────────────
  "Rome": {
    note: "Capital of the empire and the destination of Paul's appeal to Caesar, where he preached under house arrest 'with all boldness.'",
    modern: "Rome, Italy",
  },
  "Antioch 1": {
    note: "The Syrian city where the gospel first went to Greeks in force, where believers were first called Christians, and where Paul's missions were launched.",
    modern: "Antakya, Turkey",
  },
  "Antioch 2": {
    note: "Pisidian Antioch, where Paul preached in the synagogue and then turned to the Gentiles.",
  },
  "Tarsus": {
    note: "Paul's home city — 'no obscure city' — where Barnabas went to find him and bring him to Antioch.",
    modern: "Tarsus, Turkey",
  },
  "Ephesus": {
    note: "Paul taught here two years, magic books burned, and the silversmiths rioted for Artemis. Later the church that lost its first love.",
    modern: "Selçuk, Turkey",
  },
  "Corinth": {
    note: "The wealthy, immoral port where Paul stayed eighteen months and to whose fractious church he wrote about love, order, and resurrection.",
    modern: "Korinthos, Greece",
  },
  "Athens": {
    note: "Where Paul, provoked by the idols, preached the unknown God to philosophers on the Areopagus.",
    modern: "Athens, Greece",
  },
  "Philippi": {
    note: "The first church in Europe — Lydia's conversion, the jailer's midnight baptism, and the letter that says 'rejoice in the Lord always.'",
  },
  "Thessalonica": {
    note: "Where Paul reasoned from the Scriptures three Sabbaths and left a young church he wrote to twice about Christ's return.",
    modern: "Thessaloniki, Greece",
  },
  "Berea": {
    note: "Whose people were 'more noble' because they examined the Scriptures daily to check what Paul said.",
  },
  "Troas": {
    note: "Where Paul saw the vision of the man of Macedonia, and where Eutychus fell from the window during a long sermon.",
  },
  "Iconium": {
    note: "Where Paul and Barnabas spoke boldly for a long time until a plot drove them out.",
    modern: "Konya, Turkey",
  },
  "Lystra": {
    note: "Where a lame man was healed, the crowd tried to sacrifice to Paul and Barnabas as gods, then stoned Paul and left him for dead. Timothy's hometown.",
  },
  "Derbe": {
    note: "Where Paul preached after being stoned at Lystra and made many disciples.",
  },
  "Colossae": {
    note: "The church Paul had not visited but wrote to about the supremacy of Christ over every power.",
  },
  "Laodicea": {
    note: "The wealthy church Christ calls lukewarm — 'I wish you were either cold or hot' — and stands at the door and knocks.",
  },
  "Smyrna": {
    note: "The poor, persecuted church Christ had no rebuke for, promised the crown of life.",
    modern: "Izmir, Turkey",
  },
  "Pergamum": {
    note: "The church living 'where Satan's throne is,' holding fast to Christ's name under pressure.",
  },
  "Thyatira": {
    note: "The church of growing love and works, warned about tolerating false teaching. Lydia sold its purple cloth.",
  },
  "Sardis": {
    note: "The church with a reputation for being alive but was dead — told to wake up and strengthen what remained.",
  },
  "Philadelphia": {
    note: "The church with little power that kept Christ's word, given an open door no one can shut.",
  },
  "Patmos": {
    note: "The Aegean island where John was exiled 'on account of the word of God' and received the Revelation.",
    modern: "Patmos, Greece",
  },
  "Cyprus": {
    note: "Barnabas's home island and the first stop of the first missionary journey.",
  },
  "Salamis": {
    note: "The Cypriot port where Paul and Barnabas first proclaimed the word in the synagogues.",
  },
  "Malta": {
    note: "The island where Paul was shipwrecked, survived a viper's bite, and healed the sick for three months.",
  },
  "Macedonia": {
    note: "The region Paul was called to in a vision — the gospel's bridgehead into Europe.",
  },
  "Achaia": {
    note: "The Roman province of southern Greece, including Corinth and Athens, where Paul labored and gathered relief for Jerusalem.",
  },
  "Asia": {
    note: "The Roman province of western Asia Minor where 'all the residents heard the word' during Paul's Ephesian years; home of the seven churches.",
  },
  "Galatia": {
    note: "The region whose churches Paul wrote to in alarm — 'you foolish Galatians' — defending justification by faith alone.",
  },
  "Cilicia": {
    note: "Paul's home province, where he preached in the years between his conversion and Antioch.",
  },
  "Crete": {
    note: "Where Paul left Titus to appoint elders and set in order what remained.",
  },
  "Galilee": {
    note: "The northern region of Jesus' ministry — despised by Judeans, and where 'the people dwelling in darkness have seen a great light.'",
  },
  "Judea": {
    note: "The southern region around Jerusalem, heartland of the temple and the Sanhedrin.",
  },
  "Decapolis": {
    note: "The ten Greek cities east of Galilee where the healed demoniac went home and told everyone what Jesus had done.",
  },
  "Idumea": {
    note: "The Hellenistic name for Edom, part of the region crowds came from to hear Jesus.",
  },
  "Ephraim": {
    note: "The town near the wilderness where Jesus withdrew with his disciples after raising Lazarus, as the plot against him hardened.",
  },
};

export default PLACE_NOTES;
