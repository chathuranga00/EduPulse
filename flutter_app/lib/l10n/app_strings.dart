// ── App Strings — English, Sinhala, Tamil ────────────────────────────────────

class AppStrings {
  final String locale;
  AppStrings(this.locale);

  static AppStrings of(String locale) => AppStrings(locale);

  // ── Auth ──────────────────────────────────────────────────────────────────
  String get appName        => _t('EduPulse AI',        'EduPulse AI',        'EduPulse AI');
  String get signIn         => _t('Sign In',             'පිවිසෙන්',            'உள்நுழைக');
  String get signUp         => _t('Sign Up',             'ලියාපදිංචි වන්න',    'பதிவு செய்க');
  String get createAccount  => _t('Create Account',      'ගිණුමක් සාදන්න',     'கணக்கு உருவாக்கு');
  String get email          => _t('Email address',       'විද්‍යුත් තැපෑල',     'மின்னஞ்சல்');
  String get password       => _t('Password',            'මුරපදය',             'கடவுச்சொல்');
  String get fullName       => _t('Full Name',            'සම්පූර්ණ නම',        'முழு பெயர்');
  String get confirmPass    => _t('Confirm Password',    'මුරපදය තහවුරු කරන්න','கடவுச்சொல் உறுதிப்படுத்து');
  String get noAccount      => _t("Don't have an account? ", 'ගිණුමක් නැද්ද? ', 'கணக்கு இல்லையா? ');
  String get haveAccount    => _t('Already have an account? ', 'දැනටමත් ගිණුමක් තිබේද? ', 'ஏற்கனவே கணக்கு உள்ளதா? ');
  String get createOne      => _t('Create one',          'සාදන්න',             'உருவாக்கு');
  String get required       => _t('Required',            'අවශ්‍යයි',            'தேவை');
  String get minSix         => _t('Min 6 characters',    'අවම අකුරු 6ක්',      'குறைந்தது 6 எழுத்துக்கள்');
  String get noMatch        => _t('Passwords do not match', 'මුරපද නොගැලපේ',  'கடவுச்சொற்கள் பொருந்தவில்லை');

  // ── Navigation ────────────────────────────────────────────────────────────
  String get dashboard      => _t('Dashboard',           'ඩෑෂ්බෝඩ්',          'டாஷ்போர்டு');
  String get aiTutor        => _t('AI Tutor',            'AI ගුරු',            'AI ஆசிரியர்');
  String get pdfAnalysis    => _t('PDF Analysis',        'PDF විශ්ලේෂණය',      'PDF பகுப்பாய்வு');
  String get studyPlanner   => _t('Study Planner',       'අධ්‍යයන සැලසුම',    'படிப்பு திட்டமிடல்');
  String get quizzes        => _t('Quizzes',             'ප්‍රශ්නාවලිය',       'வினாடி வினா');
  String get community      => _t('Community',           'ප්‍රජාව',            'சமூகம்');
  String get settings       => _t('Settings',            'සැකසුම්',            'அமைப்புகள்');

  // ── Dashboard ─────────────────────────────────────────────────────────────
  String get welcomeBack    => _t('Welcome back',        'ආපසු සාදරයෙන් පිළිගනිමු', 'மீண்டும் வரவேற்கிறோம்');
  String get quizzesDone    => _t('Quizzes Done',        'ප්‍රශ්නාවලිය කළා',   'வினாடி வினா முடிந்தது');
  String get avgScore       => _t('Avg Score',           'සාමාන්‍ය ලකුණු',     'சராசரி மதிப்பெண்');
  String get tasksDone      => _t('Tasks Done',          'කාර්යයන් කළා',       'பணிகள் முடிந்தன');
  String get pending        => _t('Pending',             'අපේක්ෂිත',           'நிலுவையில்');
  String get quickActions   => _t('Quick Actions',       'ශ්‍රීඝ්‍ර ක්‍රියා',  'விரைவு செயல்கள்');
  String get recentQuizzes  => _t('Recent Quizzes',      'මෑත ප්‍රශ්නාවලිය',   'சமீபத்திய வினாடி வினா');
  String get takeQuiz       => _t('Take Quiz',           'ප්‍රශ්නාවලිය කරන්න', 'வினாடி வினா எடு');
  String get viewTasks      => _t('View Tasks',          'කාර්යයන් බලන්න',     'பணிகளை பார்');
  String get analysePdf     => _t('Analyse PDF',         'PDF විශ්ලේෂණය',      'PDF பகுப்பாய்');

  // ── AI Tutor ──────────────────────────────────────────────────────────────
  String get askAnything    => _t('Ask anything about your studies', 'ඔබගේ අධ්‍යයනය ගැන ඕනෑම දෙයක් අසන්න', 'உங்கள் படிப்பைப் பற்றி எதையும் கேளுங்கள்');
  String get askAnythingHint=> _t('Ask anything...',     'ඕනෑම දෙයක් අසන්න...', 'எதையும் கேளுங்கள்...');
  String get thinking       => _t('Thinking...',         'සිතමින්...',          'யோசிக்கிறது...');

  // ── Quizzes ───────────────────────────────────────────────────────────────
  String get searchQuizzes  => _t('Search quizzes...',   'ප්‍රශ්නාවලිය සොයන්...', 'வினாடி வினா தேடு...');
  String get generateAI     => _t('Generate AI Quiz',    'AI ප්‍රශ්නාවලිය',    'AI வினாடி வினா உருவாக்கு');
  String get startQuiz      => _t('Start Quiz',          'ප්‍රශ්නාවලිය ආරම්භ කරන්න', 'வினாடி வினா தொடங்கு');
  String get finish         => _t('Finish',              'නිම කරන්න',          'முடி');
  String get next           => _t('Next',                'ඊළඟ',               'அடுத்து');
  String get tryAgain       => _t('Try Again',           'නැවත උත්සාහ කරන්න', 'மீண்டும் முயற்சி');
  String get backToQuizzes  => _t('Back to Quizzes',     'ප්‍රශ්නාවලියට ආපසු', 'வினாடி வினாவுக்கு திரும்பு');
  String get result         => _t('Result',              'ප්‍රතිඵලය',           'முடிவு');
  String get subject        => _t('Subject',             'විෂය',              'பாடம்');
  String get topic          => _t('Topic (optional)',    'මාතෘකාව (අමතර)',     'தலைப்பு (விரும்பினால்)');
  String get questions      => _t('Questions',           'ප්‍රශ්න',            'கேள்விகள்');
  String get difficulty     => _t('Difficulty',          'දුෂ්කරතාව',          'சிரமம்');
  String get generating     => _t('Generating...',       'සාදමින්...',         'உருவாக்குகிறது...');

  // ── Community ─────────────────────────────────────────────────────────────
  String get newPost        => _t('New Post',            'නව පළකිරීම',        'புதிய இடுகை');
  String get whatsOnMind    => _t("What's on your mind?", 'ඔබ සිතන දේ කුමක්ද?', 'என்ன நினைக்கிறீர்கள்?');
  String get courseTag      => _t('Course / Subject tag', 'විෂය ටැගය',        'பாட குறிச்சொல்');
  String get post           => _t('Post',                'පළ කරන්න',          'இடுகை');
  String get noPostsYet     => _t('No posts yet. Be the first!', 'තවම පළකිරීම් නැත. පළමු වෙන්න!', 'இன்னும் இடுகைகள் இல்லை. முதலில் இருங்கள்!');
  String get live           => _t('Live',                'සජීවී',             'நேரடி');

  // ── Planner ───────────────────────────────────────────────────────────────
  String get addTask        => _t('Add Task',            'කාර්ය එකතු කරන්න', 'பணி சேர்க்கவும்');
  String get addEvent       => _t('Add Event',           'සිදුවීම එකතු කරන්න', 'நிகழ்வு சேர்க்கவும்');
  String get taskTitle      => _t('Task Title *',        'කාර්ය මාතෘකාව *',   'பணி தலைப்பு *');
  String get priority       => _t('Priority',            'ප්‍රමුඛතාව',         'முன்னுரிமை');
  String get progress       => _t('Progress',            'ප්‍රගතිය',           'முன்னேற்றம்');
  String get tasks          => _t('Tasks',               'කාර්යයන්',           'பணிகள்');
  String get events         => _t('Events',              'සිදුවීම්',           'நிகழ்வுகள்');

  // ── PDF ───────────────────────────────────────────────────────────────────
  String get selectFile     => _t('Tap to select a PDF or TXT file', 'PDF හෝ TXT ගොනුවක් තෝරන්න', 'PDF அல்லது TXT கோப்பை தேர்ந்தெடுக்கவும்');
  String get analyseDoc     => _t('Analyse Document',    'ලේඛනය විශ්ලේෂණය',   'ஆவணத்தை பகுப்பாய்வு');
  String get analysing      => _t('Analysing...',        'විශ්ලේෂණය...',       'பகுப்பாய்வு...');
  String get summary        => _t('Summary',             'සාරාංශය',            'சுருக்கம்');
  String get keyPoints      => _t('Key Points',          'ප්‍රධාන කරුණු',      'முக்கிய புள்ளிகள்');
  String get topics         => _t('Topics',              'මාතෘකා',             'தலைப்புகள்');

  // ── Settings ──────────────────────────────────────────────────────────────
  String get editProfile    => _t('Edit Profile',        'පැතිකඩ සංස්කරණය',   'சுயவிவரத்தை திருத்து');
  String get saveProfile    => _t('Save Profile',        'පැතිකඩ සුරකින්න',   'சுயவிவரம் சேமி');
  String get appearance     => _t('Appearance',          'පෙනුම',              'தோற்றம்');
  String get darkMode       => _t('Dark Mode',           'අඳුරු ප්‍රකාරය',    'இருண்ட பயன்முறை');
  String get security       => _t('Security',            'ආරක්ෂාව',           'பாதுகாப்பு');
  String get changePassword => _t('Change Password',     'මුරපදය වෙනස් කරන්න', 'கடவுச்சொல் மாற்று');
  String get signOut        => _t('Sign Out',            'ඉවත් වන්න',          'வெளியேறு');
  String get language       => _t('Language',            'භාෂාව',             'மொழி');
  String get university     => _t('University',          'විශ්වවිද්‍යාලය',     'பல்கலைக்கழகம்');
  String get bio            => _t('Bio',                 'පෞද්ගලික විස්තර',   'சுயவிவரம்');
  String get currentPass    => _t('Current Password',    'වත්මන් මුරපදය',     'தற்போதைய கடவுச்சொல்');
  String get newPass        => _t('New Password (min 6)', 'නව මුරපදය (අවම 6)', 'புதிய கடவுச்சொல் (குறைந்தது 6)');
  String get cancel         => _t('Cancel',              'අවලංගු',             'ரத்து செய்');
  String get save           => _t('Save',                'සුරකින්න',           'சேமி');

  // ── Search ────────────────────────────────────────────────────────────────
  String get searchOrJump   => _t('Search or jump to…', 'සෙවීම හෝ ඉදිරියට යන්න...', 'தேடு அல்லது செல்லவும்...');

  // ── General ───────────────────────────────────────────────────────────────
  String get loading        => _t('Loading...',          'පූරණය...',           'ஏற்றுகிறது...');
  String get error          => _t('Error',               'දෝෂය',              'பிழை');
  String get retry          => _t('Retry',               'නැවත උත්සාහ',       'மீண்டும் முயற்சி');
  String get justNow        => _t('Just now',            'දැන්ම',             'இப்போதே');
  String get best           => _t('Best',                'හොඳම',              'சிறந்த');
  String get all            => _t('All',                 'සියල්ල',            'அனைத்தும்');
  String get easy           => _t('Easy',                'පහසු',              'எளிது');
  String get medium         => _t('Medium',              'මධ්‍යම',             'நடுத்தரம்');
  String get hard           => _t('Hard',                'දුෂ්කර',            'கடினம்');
  String get high           => _t('High',                'ඉහළ',               'உயர்');
  String get low            => _t('Low',                 'පහළ',               'குறைவு');

  // ── Helper ────────────────────────────────────────────────────────────────
  String _t(String en, String si, String ta) {
    if (locale == 'si') return si;
    if (locale == 'ta') return ta;
    return en;
  }

  String timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return justNow;
    if (diff.inHours  < 1) {
      return _t('${diff.inMinutes}m ago', 'මිනිත්තු ${diff.inMinutes}කට පෙර', '${diff.inMinutes} நிமிடங்களுக்கு முன்பு');
    }
    if (diff.inDays   < 1) {
      return _t('${diff.inHours}h ago', 'පැය ${diff.inHours}කට පෙර', '${diff.inHours} மணி நேரத்திற்கு முன்பு');
    }
    return _t('${diff.inDays}d ago', 'දින ${diff.inDays}කට පෙර', '${diff.inDays} நாட்களுக்கு முன்பு');
  }
}
