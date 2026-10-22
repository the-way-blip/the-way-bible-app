import WidgetKit
import SwiftUI

// Verse of the Day widget: home screen (small, medium) and lock screen.
// Works offline — the verse pool ships inside the widget (DailyVerses.swift)
// and rotates by day of year, like the app. Tapping opens the verse in TheWay.

struct VerseEntry: TimelineEntry {
    let date: Date
    let verse: DailyVerse
}

func verse(for date: Date) -> DailyVerse {
    let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
    return dailyVerses[day % dailyVerses.count]
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> VerseEntry { VerseEntry(date: Date(), verse: dailyVerses[0]) }
    func getSnapshot(in context: Context, completion: @escaping (VerseEntry) -> Void) {
        completion(VerseEntry(date: Date(), verse: verse(for: Date())))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<VerseEntry>) -> Void) {
        // Today plus the next six midnights, so the verse changes even if the app isn't opened
        let cal = Calendar.current
        let start = cal.startOfDay(for: Date())
        var entries = [VerseEntry(date: Date(), verse: verse(for: Date()))]
        for d in 1...6 {
            if let day = cal.date(byAdding: .day, value: d, to: start) { entries.append(VerseEntry(date: day, verse: verse(for: day))) }
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

let gold = Color(red: 0.79, green: 0.66, blue: 0.30)
let ink = Color(red: 0.36, green: 0.25, blue: 0.20)
let parchment = Color(red: 0.98, green: 0.97, blue: 0.95)

func link(_ v: DailyVerse) -> URL {
    let book = v.book.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? v.book
    return URL(string: "https://thewaybible.app/read/\(book)/\(v.chapter)?verse=\(v.verse)")!
}

struct VerseView: View {
    @Environment(\.widgetFamily) var family
    let entry: VerseEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            Text("\(entry.verse.ref) · \(entry.verse.text)")
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.verse.ref).font(.caption2).bold()
                Text(entry.verse.text).font(.caption2).lineLimit(3)
            }
        default:
            VStack(alignment: .leading, spacing: 6) {
                Text("VERSE OF THE DAY")
                    .font(.system(size: 9, weight: .semibold)).tracking(1).foregroundColor(gold)
                Text(entry.verse.text)
                    .font(.system(size: family == .systemSmall ? 13 : 15, design: .serif))
                    .foregroundColor(ink)
                    .lineLimit(family == .systemSmall ? 6 : 5)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 0)
                Text("\(entry.verse.ref) · KJV")
                    .font(.system(size: 11, weight: .semibold)).foregroundColor(gold)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(family == .systemSmall ? 0 : 2)
        }
    }
}

struct TheWayWidget: Widget {
    let kind = "TheWayVerseOfTheDay"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                VerseView(entry: entry).containerBackground(parchment, for: .widget).widgetURL(link(entry.verse))
            } else {
                VerseView(entry: entry).padding().background(parchment).widgetURL(link(entry.verse))
            }
        }
        .configurationDisplayName("Verse of the Day")
        .description("A King James verse each day from TheWay.")
        .supportedFamilies(supported)
    }
    private var supported: [WidgetFamily] {
        if #available(iOSApplicationExtension 16.0, *) {
            return [.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline]
        }
        return [.systemSmall, .systemMedium]
    }
}

@main
struct TheWayWidgetBundle: WidgetBundle {
    var body: some Widget { TheWayWidget() }
}
