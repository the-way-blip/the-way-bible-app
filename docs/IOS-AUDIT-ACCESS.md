# Completing the iOS audit

The public App Store listing was located and audited:
https://apps.apple.com/us/app/theway-bible-kjv-study/id6762105782

## Access already available

- Full repository, including Capacitor configuration, Swift entry point, entitlements, privacy manifest, and Xcode project.
- Xcode installed at `/Applications/Xcode.app/Contents/Developer`.
- iOS 26.5 simulator runtime installed.
- The current Capacitor configuration sets `appId: app.theway.bible` and loads `https://thewaybible.app`. Web releases can therefore affect native behavior even without a new App Store binary.

This session can inspect source and run build checks. It currently has browser control but no callable native-app or simulator UI control. Installing TestFlight alone does not grant that capability. No additional computer-use plugin is required for the web changes already completed.

## Easiest next input

Provide a screen recording from the installed TestFlight or App Store app, with the device model, iOS version, and app version/build. A TestFlight invitation link is useful for identifying the exact beta, but cannot substitute for native control or a recording in this session.

Record these flows in short separate clips:

1. **First launch and onboarding:** launch from a fresh test install, examine guest access, complete or skip the introduction, rotate the device, use the keyboard in signup, and show errors with an invalid email. Use a designated test account for account flows.
2. **Reading and study:** open John 3:16, switch Read/Study, open “loved” and “Nicodemus,” close the sheet, highlight a verse, add a note, change font size/theme, and move chapters.
3. **Search and navigation:** search a phrase and a reference, open a result, go Back, visit Dictionary/People/Library, and resume after closing/reopening the app.
4. **Native behavior:** start narration, lock the device and unlock it, background/resume the app, open a shared Bible link from Safari/Messages, and open the share sheet.
5. **Offline:** load a chapter online, enable airplane mode, reopen that chapter, try an unread chapter, and record how recovery behaves after reconnecting.
6. **Accessibility:** enable VoiceOver and navigate reader controls, the word-study dialog, signup, and tabs. Increase system text size and check that labels, keyboard, and buttons remain visible. Check Reduce Motion.
7. **Account lifecycle:** verify confirmation/reset links with a test inbox, sync a highlight on another device, sign out and switch test accounts, inspect export, and test deletion only with a disposable account.

A recording supports UI/flow findings. VoiceOver usability, audio while locked, offline persistence, notifications, universal links, and account isolation should be labelled unverified unless actually tested. Screenshots alone cannot prove those behaviors.

## Route to direct testing

Use a session with native/simulator control enabled, or have a person operate the installed simulator/device while collecting screenshots, recordings, and logs. The existing repository and Xcode runtime are sufficient starting points for a simulator build; TestFlight distributes the actual device build and is the better final release check. App Store Connect access is separately required to revise screenshots, privacy disclosures, or accessibility claims.
