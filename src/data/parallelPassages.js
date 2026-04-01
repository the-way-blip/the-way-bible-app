// Parallel passages — same events told in multiple Gospels
const parallels = [
  {
    title: "Birth of Jesus",
    passages: [
      { book: "Matthew", chapter: 1, verses: "18-25" },
      { book: "Luke", chapter: 2, verses: "1-20" },
    ],
  },
  {
    title: "Baptism of Jesus",
    passages: [
      { book: "Matthew", chapter: 3, verses: "13-17" },
      { book: "Mark", chapter: 1, verses: "9-11" },
      { book: "Luke", chapter: 3, verses: "21-22" },
    ],
  },
  {
    title: "Temptation in the Wilderness",
    passages: [
      { book: "Matthew", chapter: 4, verses: "1-11" },
      { book: "Mark", chapter: 1, verses: "12-13" },
      { book: "Luke", chapter: 4, verses: "1-13" },
    ],
  },
  {
    title: "Sermon on the Mount / Plain",
    passages: [
      { book: "Matthew", chapter: 5, verses: "1-48" },
      { book: "Luke", chapter: 6, verses: "17-49" },
    ],
  },
  {
    title: "Feeding the 5,000",
    passages: [
      { book: "Matthew", chapter: 14, verses: "13-21" },
      { book: "Mark", chapter: 6, verses: "30-44" },
      { book: "Luke", chapter: 9, verses: "10-17" },
      { book: "John", chapter: 6, verses: "1-14" },
    ],
  },
  {
    title: "Walking on Water",
    passages: [
      { book: "Matthew", chapter: 14, verses: "22-33" },
      { book: "Mark", chapter: 6, verses: "45-52" },
      { book: "John", chapter: 6, verses: "16-21" },
    ],
  },
  {
    title: "Peter's Confession",
    passages: [
      { book: "Matthew", chapter: 16, verses: "13-20" },
      { book: "Mark", chapter: 8, verses: "27-30" },
      { book: "Luke", chapter: 9, verses: "18-20" },
    ],
  },
  {
    title: "Transfiguration",
    passages: [
      { book: "Matthew", chapter: 17, verses: "1-13" },
      { book: "Mark", chapter: 9, verses: "2-13" },
      { book: "Luke", chapter: 9, verses: "28-36" },
    ],
  },
  {
    title: "Triumphal Entry",
    passages: [
      { book: "Matthew", chapter: 21, verses: "1-11" },
      { book: "Mark", chapter: 11, verses: "1-11" },
      { book: "Luke", chapter: 19, verses: "28-44" },
      { book: "John", chapter: 12, verses: "12-19" },
    ],
  },
  {
    title: "Last Supper",
    passages: [
      { book: "Matthew", chapter: 26, verses: "17-30" },
      { book: "Mark", chapter: 14, verses: "12-26" },
      { book: "Luke", chapter: 22, verses: "7-38" },
      { book: "John", chapter: 13, verses: "1-30" },
    ],
  },
  {
    title: "Crucifixion",
    passages: [
      { book: "Matthew", chapter: 27, verses: "32-56" },
      { book: "Mark", chapter: 15, verses: "21-41" },
      { book: "Luke", chapter: 23, verses: "26-49" },
      { book: "John", chapter: 19, verses: "16-37" },
    ],
  },
  {
    title: "Resurrection",
    passages: [
      { book: "Matthew", chapter: 28, verses: "1-10" },
      { book: "Mark", chapter: 16, verses: "1-8" },
      { book: "Luke", chapter: 24, verses: "1-12" },
      { book: "John", chapter: 20, verses: "1-18" },
    ],
  },
  {
    title: "Great Commission",
    passages: [
      { book: "Matthew", chapter: 28, verses: "16-20" },
      { book: "Mark", chapter: 16, verses: "15-18" },
      { book: "Acts", chapter: 1, verses: "8" },
    ],
  },
];

export function getParallelPassages(book, chapter) {
  return parallels.filter((p) =>
    p.passages.some((pp) => pp.book === book && pp.chapter === chapter)
  );
}

export default parallels;
