// Bible topic index — popular topics with key verse references
const topics = [
  {
    name: "Salvation",
    verses: ["John 3:16", "Romans 10:9", "Ephesians 2:8-9", "Acts 16:31", "Romans 6:23", "Titus 3:5", "John 14:6", "Acts 4:12", "Romans 5:8", "2 Corinthians 5:17"],
  },
  {
    name: "Faith",
    verses: ["Hebrews 11:1", "Romans 10:17", "Hebrews 11:6", "James 2:17", "2 Corinthians 5:7", "Mark 11:24", "Matthew 17:20", "Galatians 2:20", "Romans 1:17", "1 Peter 1:8-9"],
  },
  {
    name: "Love",
    verses: ["1 Corinthians 13:4-7", "John 3:16", "Romans 8:38-39", "1 John 4:8", "John 15:13", "1 John 4:19", "Romans 5:8", "Ephesians 5:25", "1 Peter 4:8", "Colossians 3:14"],
  },
  {
    name: "Prayer",
    verses: ["Philippians 4:6-7", "1 Thessalonians 5:17", "Matthew 6:9-13", "James 5:16", "Jeremiah 33:3", "Matthew 7:7", "Mark 11:24", "1 John 5:14", "Psalm 145:18", "Romans 8:26"],
  },
  {
    name: "Hope",
    verses: ["Jeremiah 29:11", "Romans 15:13", "Romans 8:28", "Psalm 42:11", "Isaiah 40:31", "Lamentations 3:22-23", "Hebrews 6:19", "1 Peter 1:3", "Psalm 130:5", "Romans 5:3-5"],
  },
  {
    name: "Peace",
    verses: ["Philippians 4:6-7", "John 14:27", "Isaiah 26:3", "Romans 8:6", "Colossians 3:15", "Psalm 29:11", "John 16:33", "2 Thessalonians 3:16", "Romans 15:33", "Numbers 6:26"],
  },
  {
    name: "Strength",
    verses: ["Philippians 4:13", "Isaiah 40:31", "2 Corinthians 12:9-10", "Psalm 46:1", "Joshua 1:9", "Deuteronomy 31:6", "Nehemiah 8:10", "Psalm 27:1", "Ephesians 6:10", "Isaiah 41:10"],
  },
  {
    name: "Forgiveness",
    verses: ["1 John 1:9", "Ephesians 4:32", "Colossians 3:13", "Matthew 6:14-15", "Psalm 103:12", "Acts 3:19", "Isaiah 1:18", "Micah 7:18-19", "Luke 6:37", "Matthew 18:21-22"],
  },
  {
    name: "Wisdom",
    verses: ["James 1:5", "Proverbs 3:5-6", "Proverbs 1:7", "Proverbs 9:10", "Colossians 2:3", "Proverbs 2:6", "Psalm 111:10", "Ecclesiastes 7:12", "Proverbs 4:7", "1 Corinthians 1:30"],
  },
  {
    name: "Fear & Anxiety",
    verses: ["Isaiah 41:10", "Psalm 23:4", "2 Timothy 1:7", "Philippians 4:6-7", "1 Peter 5:7", "Psalm 56:3", "Psalm 34:4", "Joshua 1:9", "Matthew 6:34", "Deuteronomy 31:8"],
  },
  {
    name: "God's Promises",
    verses: ["2 Corinthians 1:20", "Romans 8:28", "Philippians 1:6", "Jeremiah 29:11", "Isaiah 40:31", "Psalm 37:4", "Proverbs 3:5-6", "Matthew 11:28", "Romans 8:38-39", "Revelation 21:4"],
  },
  {
    name: "Holy Spirit",
    verses: ["Acts 1:8", "John 14:26", "Romans 8:26", "Galatians 5:22-23", "1 Corinthians 6:19", "Ephesians 5:18", "John 16:13", "Acts 2:38", "Romans 8:14", "2 Corinthians 3:17"],
  },
  {
    name: "Marriage",
    verses: ["Ephesians 5:25", "Genesis 2:24", "1 Corinthians 13:4-7", "Proverbs 18:22", "Hebrews 13:4", "Colossians 3:19", "1 Peter 3:7", "Ecclesiastes 4:9-12", "Mark 10:9", "Proverbs 31:10"],
  },
  {
    name: "Suffering",
    verses: ["Romans 8:18", "2 Corinthians 4:17", "James 1:2-4", "1 Peter 4:12-13", "Romans 5:3-5", "Psalm 34:18", "2 Corinthians 1:3-4", "Revelation 21:4", "Isaiah 53:3-5", "John 16:33"],
  },
  {
    name: "Eternal Life",
    verses: ["John 3:16", "John 11:25-26", "Romans 6:23", "John 10:28", "1 John 5:11-13", "John 5:24", "Revelation 21:4", "2 Corinthians 5:1", "Philippians 3:20-21", "1 Thessalonians 4:17"],
  },
  {
    name: "The Blood of Christ",
    verses: ["Hebrews 9:22", "1 Peter 1:18-19", "Ephesians 1:7", "Revelation 1:5", "Colossians 1:20", "Romans 5:9", "Hebrews 9:12", "1 John 1:7", "Revelation 12:11", "Hebrews 10:19"],
  },
  {
    name: "The Resurrection",
    verses: ["1 Corinthians 15:3-4", "Romans 6:9", "John 11:25", "1 Peter 1:3", "Philippians 3:10-11", "1 Corinthians 15:20", "Romans 8:11", "Acts 2:32", "1 Corinthians 15:55-57", "2 Corinthians 4:14"],
  },
  {
    name: "The Return of Christ",
    verses: ["Acts 1:11", "1 Thessalonians 4:16-17", "Revelation 22:12", "Matthew 24:30", "Titus 2:13", "James 5:8", "2 Peter 3:10", "1 John 3:2", "Revelation 1:7", "Philippians 3:20"],
  },
  {
    name: "Scripture & God's Word",
    verses: ["2 Timothy 3:16-17", "Hebrews 4:12", "Psalm 119:105", "Isaiah 40:8", "Romans 15:4", "Psalm 119:11", "Joshua 1:8", "Matthew 4:4", "John 17:17", "Psalm 19:7-8"],
  },
  {
    name: "Worship & Praise",
    verses: ["Psalm 150:6", "John 4:24", "Psalm 95:1-2", "Romans 12:1", "Hebrews 13:15", "Psalm 100:1-2", "Revelation 4:11", "Psalm 34:1", "Colossians 3:16", "Psalm 63:3-4"],
  },
  {
    name: "Patience & Endurance",
    verses: ["James 1:2-4", "Romans 5:3-4", "Hebrews 12:1", "Galatians 6:9", "Isaiah 40:31", "Psalm 27:14", "Romans 12:12", "2 Peter 3:9", "Colossians 1:11", "Hebrews 10:36"],
  },
  {
    name: "Grace & Mercy",
    verses: ["Ephesians 2:8-9", "2 Corinthians 12:9", "Romans 3:23-24", "Titus 2:11", "Hebrews 4:16", "Lamentations 3:22-23", "Psalm 103:8", "Romans 9:16", "James 4:6", "2 Corinthians 9:8"],
  },
  {
    name: "Obedience",
    verses: ["John 14:15", "1 Samuel 15:22", "James 1:22", "Deuteronomy 11:1", "Acts 5:29", "John 15:10", "Romans 6:16", "1 John 5:3", "Hebrews 5:8", "Luke 6:46"],
  },
  {
    name: "The Armor of God",
    verses: ["Ephesians 6:10-11", "Ephesians 6:13", "Ephesians 6:14", "Ephesians 6:15", "Ephesians 6:16", "Ephesians 6:17", "Ephesians 6:18", "2 Corinthians 10:4", "Romans 13:12", "1 Thessalonians 5:8"],
  },
  {
    name: "Humility",
    verses: ["Philippians 2:3-4", "James 4:6", "1 Peter 5:5-6", "Proverbs 11:2", "Micah 6:8", "Matthew 23:12", "Colossians 3:12", "Proverbs 22:4", "James 4:10", "Isaiah 66:2"],
  },
  {
    name: "Heaven & Eternity",
    verses: ["John 14:2-3", "Revelation 21:1-4", "2 Corinthians 5:8", "Philippians 1:21", "1 Corinthians 2:9", "Revelation 22:1-5", "Matthew 6:20", "Colossians 3:2", "1 Peter 1:4", "Hebrews 11:16"],
  },
  {
    name: "Giving & Generosity",
    verses: ["2 Corinthians 9:7", "Proverbs 11:25", "Luke 6:38", "Acts 20:35", "Malachi 3:10", "Matthew 6:3-4", "1 Timothy 6:18", "Proverbs 19:17", "Hebrews 13:16", "2 Corinthians 8:9"],
  },
  {
    name: "Identity in Christ",
    verses: ["2 Corinthians 5:17", "Galatians 2:20", "Ephesians 2:10", "1 Peter 2:9", "Romans 8:17", "John 1:12", "Colossians 3:3", "Philippians 4:13", "Romans 8:37", "Ephesians 1:4-5"],
  },
];

export default topics;
