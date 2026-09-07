import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../main_shell.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _sb = Supabase.instance.client;
  List _quizResults = [], _tasks = [], _posts = [];
  bool _loading = true;
  final List<RealtimeChannel> _channels = [];

  @override
  void initState() {
    super.initState();
    _loadCached().then((_) => _loadFresh());
  }

  @override
  void dispose() {
    for (final ch in _channels) _sb.removeChannel(ch);
    super.dispose();
  }

  // Load from local cache instantly
  Future<void> _loadCached() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final qr = prefs.getString('dash_quiz');
      final tk = prefs.getString('dash_tasks');
      final po = prefs.getString('dash_posts');
      if (qr != null && tk != null && po != null && mounted) {
        setState(() {
          _quizResults = jsonDecode(qr) as List;
          _tasks       = jsonDecode(tk) as List;
          _posts       = jsonDecode(po) as List;
          _loading     = false; // Show UI immediately
        });
      }
    } catch (_) {}
  }

  // Fetch fresh data in background
  Future<void> _loadFresh() async {
    final user = context.read<AuthProvider>().user!;
    try {
      final r = await Future.wait([
        _sb.from('quiz_results').select().eq('user_id', user.id).order('taken_at', ascending: false).limit(50),
        _sb.from('study_tasks').select().eq('user_id', user.id),
        _sb.from('posts').select().order('created_at', ascending: false).limit(3),
      ]);
      if (!mounted) return;
      final qr = List.from(r[0] as List);
      final tk = List.from(r[1] as List);
      final po = List.from(r[2] as List);
      setState(() {
        _quizResults = qr;
        _tasks       = tk;
        _posts       = po;
        _loading     = false;
      });
      // Cache for next time
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('dash_quiz',  jsonEncode(qr));
      await prefs.setString('dash_tasks', jsonEncode(tk));
      await prefs.setString('dash_posts', jsonEncode(po));
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
    _subscribeRealtime(user.id);
  }

  void _subscribeRealtime(String uid) {
    final q = _sb.channel('dash-quiz-$uid')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert, schema: 'public', table: 'quiz_results',
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: 'user_id', value: uid),
        callback: (p) => setState(() => _quizResults = [p.newRecord, ..._quizResults]))
      .subscribe();
    final p = _sb.channel('dash-posts')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert, schema: 'public', table: 'posts',
        callback: (ev) => setState(() => _posts = [ev.newRecord, ..._posts].take(3).toList()))
      .subscribe();
    _channels.addAll([q, p]);
  }

  String _ago(String d) {
    final diff = DateTime.now().difference(DateTime.parse(d));
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours  < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays   < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final user   = context.watch<AuthProvider>().user!;
    final qCount = _quizResults.length;
    final avg    = qCount == 0 ? 0 : (_quizResults.fold<double>(0, (s, r) => s + ((r['score_pct'] as num?) ?? 0)) / qCount).round();
    final done   = _tasks.where((t) => t['done'] == true).length;
    final total  = _tasks.length;

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.asset('assets/images/logo.png', width: 32, height: 32, fit: BoxFit.cover),
          ),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('EduPulse AI', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text('Hi, ${user.name.split(' ').first}!',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.normal)),
          ]),
        ]),
        actions: [
          CircleAvatar(
            backgroundColor: kPrimary, radius: 17,
            child: Text(user.initials,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 14),
        ],
      ),
      body: _loading && _quizResults.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async { await _loadFresh(); },
              child: ListView(padding: const EdgeInsets.all(16), children: [
                // Stats
                GridView.count(
                  shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.6,
                  children: [
                    _stat('Quizzes', '$qCount', Icons.quiz_outlined, Colors.green.shade100, Colors.green.shade700),
                    _stat('Avg Score', qCount > 0 ? '$avg%' : '--', Icons.trending_up, Colors.amber.shade100, Colors.amber.shade700),
                    _stat('Tasks Done', '$done/$total', Icons.check_circle_outline, Colors.indigo.shade100, kPrimary),
                    _stat('Pending', '${total - done}', Icons.pending_outlined, Colors.purple.shade100, Colors.purple.shade700),
                  ],
                ),
                const SizedBox(height: 20),

                // Quick actions
                Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                GridView.count(
                  shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.4,
                  children: [
                    _action('AI Tutor',   Icons.auto_awesome,          kPrimary,        context, 1),
                    _action('Take Quiz',  Icons.play_circle_outline,   Colors.green,    context, 4),
                    _action('Tasks',      Icons.list_alt,              Colors.orange,   context, 3),
                    _action('PDF',        Icons.picture_as_pdf_outlined, Colors.purple, context, 2),
                  ],
                ),
                const SizedBox(height: 20),

                // Recent quizzes
                if (_quizResults.isNotEmpty) ...[
                  Text('Recent Quizzes', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(child: Column(children: _quizResults.take(3).map((r) {
                    final pct = (r['score_pct'] as num?) ?? 0;
                    final c   = pct >= 75 ? Colors.green : pct >= 55 ? Colors.blue : Colors.red;
                    final g   = pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 55 ? 'C' : 'F';
                    return ListTile(
                      leading: CircleAvatar(backgroundColor: c.withAlpha(30), radius: 16,
                        child: Text(g, style: TextStyle(color: c, fontWeight: FontWeight.bold, fontSize: 12))),
                      title: Text(r['title'] ?? '', style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
                      subtitle: Text('${r['subject']} · ${_ago(r['taken_at'])}', style: const TextStyle(fontSize: 11)),
                      trailing: Text('$pct%', style: TextStyle(color: kPrimary, fontWeight: FontWeight.bold)),
                      dense: true,
                    );
                  }).toList())),
                  const SizedBox(height: 20),
                ],

                // Community
                if (_posts.isNotEmpty) ...[
                  Text('Community', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Card(child: Column(children: _posts.map((p) => ListTile(
                    leading: CircleAvatar(backgroundColor: kPrimary, radius: 14,
                      child: Text(p['author_initials'] ?? '?', style: const TextStyle(color: Colors.white, fontSize: 10))),
                    title: Text(
                      p['content']?.toString().substring(0, (p['content'].toString().length).clamp(0, 60)) ?? '',
                      style: const TextStyle(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text('${p['author_name']} · ${_ago(p['created_at'])}', style: const TextStyle(fontSize: 10)),
                    dense: true,
                  )).toList())),
                ],
                const SizedBox(height: 80),
              ]),
            ),
    );
  }

  Widget _stat(String label, String value, IconData icon, Color bg, Color fg) => Card(
    child: Padding(padding: const EdgeInsets.all(12), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: fg, size: 16)),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: fg)),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ]),
      ],
    )));

  Widget _action(String label, IconData icon, Color c, BuildContext ctx, int tab) =>
    InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => MainShell.switchTab(tab),
      child: Container(
        decoration: BoxDecoration(
          color: c.withAlpha(20),
          border: Border.all(color: c.withAlpha(50)),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(children: [
          Icon(icon, color: c, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w600, fontSize: 12))),
        ]),
      ));
}
