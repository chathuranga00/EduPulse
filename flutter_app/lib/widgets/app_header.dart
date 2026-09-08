import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../screens/auth/login_screen.dart';

// Quiz data for search
const _quizTitles = [
  {'title': 'Organic Chemistry Reactions', 'subject': 'Chemistry'},
  {'title': 'Newton Laws', 'subject': 'Physics'},
  {'title': 'Cell Structure', 'subject': 'Biology'},
  {'title': 'Integration & Differentiation', 'subject': 'Combined Mathematics'},
  {'title': 'English Grammar', 'subject': 'English'},
  {'title': 'Double Entry Bookkeeping', 'subject': 'Accounting'},
  {'title': 'Supply & Demand', 'subject': 'Economics'},
  {'title': 'Buddhist Philosophy', 'subject': 'Buddhism'},
  {'title': 'GIT Spreadsheets', 'subject': 'General IT'},
  {'title': 'Sri Lankan History', 'subject': 'History'},
];

const _pages = [
  {'label': 'Dashboard',     'sub': 'Overview & stats',           'tab': 0, 'icon': Icons.dashboard_outlined},
  {'label': 'AI Tutor',      'sub': 'Chat with AI assistant',     'tab': 1, 'icon': Icons.chat_bubble_outline},
  {'label': 'PDF Analysis',  'sub': 'Analyse documents with AI',  'tab': 2, 'icon': Icons.picture_as_pdf_outlined},
  {'label': 'Study Planner', 'sub': 'Tasks, calendar & events',   'tab': 3, 'icon': Icons.calendar_today_outlined},
  {'label': 'Quizzes',       'sub': 'Practice & test yourself',   'tab': 4, 'icon': Icons.quiz_outlined},
  {'label': 'Community',     'sub': 'Posts & discussions',        'tab': 5, 'icon': Icons.people_outline},
  {'label': 'Settings',      'sub': 'Account & preferences',      'tab': 6, 'icon': Icons.settings_outlined},
];

class AppHeader extends StatefulWidget implements PreferredSizeWidget {
  final int currentTab;
  final Function(int) onTabSwitch;

  const AppHeader({super.key, required this.currentTab, required this.onTabSwitch});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  State<AppHeader> createState() => _AppHeaderState();
}

class _AppHeaderState extends State<AppHeader> {
  bool _searching = false;
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();
  List<Map<String, dynamic>> _results = [];
  bool _loadingPosts = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onSearch(String q) {
    if (q.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }
    final term = q.toLowerCase();

    // Pages — instant
    final pages = _pages.where((p) =>
      (p['label'] as String).toLowerCase().contains(term) ||
      (p['sub'] as String).toLowerCase().contains(term)).toList();

    // Quizzes — instant
    final quizzes = _quizTitles.where((q) =>
      (q['title']!).toLowerCase().contains(term) ||
      (q['subject']!).toLowerCase().contains(term)).take(3).toList();

    final combined = [
      ...pages.map((p) => {'type': 'page',  ...p}),
      ...quizzes.map((q) => {'type': 'quiz', 'label': q['title'], 'sub': q['subject'], 'tab': 4, 'icon': Icons.quiz_outlined}),
    ];

    setState(() => _results = combined);

    // Community posts — async
    _searchPosts(term);
  }

  Future<void> _searchPosts(String term) async {
    if (_loadingPosts) return;
    setState(() => _loadingPosts = true);
    try {
      final posts = await Supabase.instance.client
          .from('posts')
          .select('id, content, author_name, course')
          .or('content.ilike.%$term%,course.ilike.%$term%,author_name.ilike.%$term%')
          .limit(3);
      if (mounted) {
        setState(() {
          _results = [
            ..._results.where((r) => r['type'] != 'post'),
            ...(posts as List).map((p) => {
              'type': 'post',
              'label': (p['content'] as String).substring(0, (p['content'] as String).length.clamp(0, 50)),
              'sub': '${p['author_name']} · ${p['course']}',
              'tab': 5,
              'icon': Icons.people_outline,
            }),
          ];
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingPosts = false);
  }

  void _openSearch() {
    setState(() { _searching = true; _results = []; });
    Future.delayed(const Duration(milliseconds: 100), () => _searchFocus.requestFocus());
  }

  void _closeSearch() {
    setState(() { _searching = false; _results = []; _searchCtrl.clear(); });
    _searchFocus.unfocus();
  }

  void _navigate(int tab) {
    widget.onTabSwitch(tab);
    _closeSearch();
  }

  @override
  Widget build(BuildContext context) {
    final user  = context.watch<AuthProvider>().user;
    final theme = context.watch<ThemeProvider>();
    final isDark = theme.isDark;

    return AppBar(
      elevation: 0,
      backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
      surfaceTintColor: Colors.transparent,
      title: _searching
          ? _SearchField(
              ctrl: _searchCtrl,
              focus: _searchFocus,
              onChanged: _onSearch,
              onClose: _closeSearch,
              results: _results,
              onNavigate: _navigate,
            )
          : Row(children: [
              // Logo
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.asset('assets/images/logo.png', width: 32, height: 32, fit: BoxFit.cover),
              ),
              const SizedBox(width: 10),
              Text('EduPulse AI',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF111827),
                )),
            ]),
      actions: _searching ? [] : [
        // Search icon
        IconButton(
          icon: Icon(Icons.search, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
          onPressed: _openSearch,
        ),
        // Dark mode toggle
        IconButton(
          icon: Icon(
            isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
          onPressed: theme.toggle,
        ),
        // Avatar
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => widget.onTabSwitch(6), // go to settings
            child: CircleAvatar(
              backgroundColor: kPrimary,
              radius: 17,
              child: Text(
                user?.initials ?? 'U',
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: isDark ? const Color(0xFF1F2937) : const Color(0xFFE5E7EB)),
      ),
    );
  }
}

// ── Search field widget ───────────────────────────────────────────────────────
class _SearchField extends StatelessWidget {
  final TextEditingController ctrl;
  final FocusNode focus;
  final Function(String) onChanged;
  final VoidCallback onClose;
  final List<Map<String, dynamic>> results;
  final Function(int) onNavigate;

  const _SearchField({
    required this.ctrl, required this.focus,
    required this.onChanged, required this.onClose,
    required this.results, required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        TextField(
          controller: ctrl,
          focusNode: focus,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: 'Search or jump to…',
            hintStyle: const TextStyle(fontSize: 14),
            prefixIcon: const Icon(Icons.search, size: 20),
            suffixIcon: IconButton(icon: const Icon(Icons.close, size: 20), onPressed: onClose),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(24),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
          ),
        ),
        if (results.isNotEmpty)
          Positioned(
            top: 44, left: 0, right: 0,
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                constraints: const BoxConstraints(maxHeight: 320),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color ?? Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: ListView(
                  shrinkWrap: true,
                  padding: const EdgeInsets.all(8),
                  children: results.map((r) => _ResultRow(result: r, onTap: () => onNavigate(r['tab'] as int))).toList(),
                ),
              ),
            ),
          ),
        if (ctrl.text.isNotEmpty && results.isEmpty)
          Positioned(
            top: 44, left: 0, right: 0,
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color ?? Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Text(
                  'No results for "${ctrl.text}"',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ResultRow extends StatelessWidget {
  final Map<String, dynamic> result;
  final VoidCallback onTap;
  const _ResultRow({required this.result, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final type = result['type'] as String;
    final icon = result['icon'] as IconData;
    final accent = type == 'page';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Row(children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: accent ? kPrimary.withAlpha(20) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: accent ? kPrimary : Colors.grey.shade600),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(result['label'] as String,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis),
            if (result['sub'] != null)
              Text(result['sub'] as String,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                overflow: TextOverflow.ellipsis),
          ])),
          Icon(Icons.chevron_right, size: 16, color: Colors.grey.shade400),
        ]),
      ),
    );
  }
}
