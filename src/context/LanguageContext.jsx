import { createContext, useContext, useState, useCallback } from 'react'

export const LANGUAGES = {
  en: { code: 'en', label: 'English',  nativeLabel: 'English',  flag: '🇬🇧' },
  si: { code: 'si', label: 'Sinhala',  nativeLabel: 'සිංහල',    flag: '🇱🇰' },
  ta: { code: 'ta', label: 'Tamil',    nativeLabel: 'தமிழ்',     flag: '🇱🇰' },
}

// ── All UI strings ─────────────────────────────────────────────────────────────
export const T = {
  en: {
    // Nav
    myLibrary:       'My Library',
    liveClasses:     'Live Classes',
    askAI:           'Ask AI',
    notifications:   'Notifications',
    noNotifications: 'No notifications yet',
    notifSubtitle:   'Complete quizzes or join the community to get started',
    markAllRead:     'Mark all read',
    settings:        'Settings',
    signOut:         'Sign Out',
    // AI Tutor
    tutorWelcome:    (name) => `Hi ${name || 'there'}! I'm your AI tutor. Ask me anything about your courses — I can explain concepts, help with homework, or quiz you on topics. 😊`,
    tutorPlaceholder:'Ask about any topic — chemistry, math, history...',
    tutorThinking:   'EduPulse is thinking…',
    newChat:         'New Chat',
    noConversations: 'No conversations yet',
    keyTerms:        'Key Terms',
    termsAppear:     'Terms appear as you chat',
    quickNotes:      'Quick Notes',
    noNotes:         'No notes yet',
    addNote:         'Add a note…',
    flashcard:       'Flashcard',
    sessionDepth:    'Session Depth',
    startChatting:   'Start chatting to build depth',
    questionAsked:   (n) => `${n} question${n !== 1 ? 's' : ''} asked`,
    attachPdf:       'Attach PDF/Docs',
    voice:           'Voice',
    couldNotCreate:  'Could not create chat',
    // Quiz
    generateQuiz:    'Generate MCQ Paper',
    subject:         'Subject',
    topic:           'Topic (optional)',
    numQuestions:    'Number of Questions',
    difficulty:      'Difficulty',
    generate:        'Generate',
    generating:      'Generating…',
    easy:            'Easy',
    medium:          'Medium',
    hard:            'Hard',
    // Settings
    profile:         'Profile',
    changePassword:  'Change Password',
    appearance:      'Appearance',
    darkMode:        'Dark mode',
    language:        'Language',
    languageDesc:    'Choose your preferred language for the app',
    saveProfile:     'Save Profile',
    // Notifications
    showing30:       (n) => `${n} notification${n !== 1 ? 's' : ''} · Showing last 30`,
  },
  si: {
    myLibrary:       'මගේ පුස්තකාලය',
    liveClasses:     'සජීවී පන්ති',
    askAI:           'AI අසන්න',
    notifications:   'දැනුම්දීම්',
    noNotifications: 'දැනුම්දීම් නොමැත',
    notifSubtitle:   'ප්‍රශ්නාවලිය සම්පූර්ණ කරන්න හෝ ප්‍රජාවට සම්බන්ධ වන්න',
    markAllRead:     'සියල්ල කියවූ ලෙස සලකුණු කරන්න',
    settings:        'සැකසීම්',
    signOut:         'ඉවත් වන්න',
    tutorWelcome:    (name) => `ආයුබෝවන් ${name || ''}! මම ඔබේ AI ගුරුවරයා. ඕනෑම විෂයයක් ගැන අසන්න — සංකල්ප පැහැදිලි කිරීම, ගෙදර වැඩ, හෝ ප්‍රශ්නාවලිය. 😊`,
    tutorPlaceholder:'ඕනෑම විෂයයක් ගැන අසන්න — රසායන, ගණිත, ඉතිහාස...',
    tutorThinking:   'EduPulse සිතමින්...',
    newChat:         'නව කතාබහ',
    noConversations: 'කතාබහ නොමැත',
    keyTerms:        'ප්‍රධාන පද',
    termsAppear:     'කතාකිරීමේදී පද දිස්වේ',
    quickNotes:      'ඉක්මන් සටහන්',
    noNotes:         'සටහන් නොමැත',
    addNote:         'සටහනක් එකතු කරන්න…',
    flashcard:       'ෆ්ලෑෂ් කාඩ්',
    sessionDepth:    'සැසි ගැඹුර',
    startChatting:   'ගැඹුර ගොඩනැගීමට කතා කරන්න',
    questionAsked:   (n) => `ප්‍රශ්න ${n}ක් අසන ලදී`,
    attachPdf:       'PDF/ලේඛන අමුණන්න',
    voice:           'හඬ',
    couldNotCreate:  'කතාබහ සෑදීමට නොහැකි විය',
    generateQuiz:    'MCQ ප්‍රශ්නාවලිය සාදන්න',
    subject:         'විෂය',
    topic:           'මාතෘකාව (විකල්ප)',
    numQuestions:    'ප්‍රශ්න ගණන',
    difficulty:      'දුෂ්කරතාව',
    generate:        'සාදන්න',
    generating:      'සාදමින්...',
    easy:            'පහසු',
    medium:          'මධ්‍යම',
    hard:            'දුෂ්කර',
    profile:         'පැතිකඩ',
    changePassword:  'මුරපදය වෙනස් කරන්න',
    appearance:      'පෙනුම',
    darkMode:        'අඳුරු ප්‍රකාරය',
    language:        'භාෂාව',
    languageDesc:    'යෙදුම සඳහා ඔබේ කැමති භාෂාව තෝරන්න',
    saveProfile:     'පැතිකඩ සුරකින්න',
    showing30:       (n) => `දැනුම්දීම් ${n}ක් · අවසාන 30 පෙන්වමින්`,
  },
  ta: {
    myLibrary:       'என் நூலகம்',
    liveClasses:     'நேரடி வகுப்புகள்',
    askAI:           'AI கேளுங்கள்',
    notifications:   'அறிவிப்புகள்',
    noNotifications: 'அறிவிப்புகள் இல்லை',
    notifSubtitle:   'வினாடிவினா முடித்து அல்லது சமூகத்தில் சேருங்கள்',
    markAllRead:     'அனைத்தும் படித்தவை என குறி',
    settings:        'அமைப்புகள்',
    signOut:         'வெளியேறு',
    tutorWelcome:    (name) => `வணக்கம் ${name || ''}! நான் உங்கள் AI ஆசிரியர். எந்த தலைப்பிலும் கேளுங்கள் — கருத்துகளை விளக்குவேன், வீட்டுப்பாடம் உதவுவேன். 😊`,
    tutorPlaceholder:'எந்த தலைப்பிலும் கேளுங்கள் — வேதியியல், கணிதம், வரலாறு...',
    tutorThinking:   'EduPulse சிந்திக்கிறது…',
    newChat:         'புதிய உரையாடல்',
    noConversations: 'உரையாடல்கள் இல்லை',
    keyTerms:        'முக்கிய சொற்கள்',
    termsAppear:     'உரையாடும்போது சொற்கள் தோன்றும்',
    quickNotes:      'விரைவு குறிப்புகள்',
    noNotes:         'குறிப்புகள் இல்லை',
    addNote:         'குறிப்பு சேர்க்கவும்…',
    flashcard:       'ஃபிளாஷ் கார்டு',
    sessionDepth:    'அமர்வு ஆழம்',
    startChatting:   'ஆழத்தை உருவாக்க உரையாடுங்கள்',
    questionAsked:   (n) => `${n} கேள்வி கேட்கப்பட்டது`,
    attachPdf:       'PDF/ஆவணங்கள் இணைக்கவும்',
    voice:           'குரல்',
    couldNotCreate:  'உரையாடலை உருவாக்க முடியவில்லை',
    generateQuiz:    'MCQ தாள் உருவாக்கு',
    subject:         'பாடம்',
    topic:           'தலைப்பு (விருப்பத்தேர்வு)',
    numQuestions:    'கேள்விகளின் எண்ணிக்கை',
    difficulty:      'சிரமம்',
    generate:        'உருவாக்கு',
    generating:      'உருவாக்குகிறது…',
    easy:            'எளிது',
    medium:          'நடுத்தர',
    hard:            'கடினம்',
    profile:         'சுயவிவரம்',
    changePassword:  'கடவுச்சொல் மாற்று',
    appearance:      'தோற்றம்',
    darkMode:        'இருண்ட முறை',
    language:        'மொழி',
    languageDesc:    'பயன்பாட்டிற்கான உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    saveProfile:     'சுயவிவரம் சேமி',
    showing30:       (n) => `${n} அறிவிப்புகள் · கடைசி 30 காட்டுகிறது`,
  },
}

// ── AI prompt language instruction ────────────────────────────────────────────
export function getLangInstruction(langCode) {
  if (langCode === 'si') return 'IMPORTANT: You MUST respond entirely in Sinhala (සිංහල) language only.'
  if (langCode === 'ta') return 'IMPORTANT: You MUST respond entirely in Tamil (தமிழ்) language only.'
  return ''
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ep_lang') || 'en')

  const switchLang = useCallback((code) => {
    if (!LANGUAGES[code]) return
    setLang(code)
    localStorage.setItem('ep_lang', code)
  }, [])

  const t = T[lang] || T.en

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
