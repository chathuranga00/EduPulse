import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:supabase_flutter/supabase_flutter.dart";
import "../../core/api_service.dart";
import "../../core/theme.dart";
import "../../providers/auth_provider.dart";

const _quizzes = [
  {"id":1,"title":"Organic Chemistry Reactions","subject":"Chemistry","questions":20,"duration":"30 min","difficulty":"Hard"},
  {"id":2,"title":"Atomic Structure","subject":"Chemistry","questions":20,"duration":"30 min","difficulty":"Medium"},
  {"id":3,"title":"Newton Laws","subject":"Physics","questions":25,"duration":"35 min","difficulty":"Medium"},
  {"id":4,"title":"Waves and Light","subject":"Physics","questions":20,"duration":"30 min","difficulty":"Medium"},
  {"id":5,"title":"Cell Structure","subject":"Biology","questions":18,"duration":"25 min","difficulty":"Medium"},
  {"id":6,"title":"Genetics","subject":"Biology","questions":20,"duration":"30 min","difficulty":"Hard"},
  {"id":7,"title":"Integration & Differentiation","subject":"Combined Mathematics","questions":22,"duration":"35 min","difficulty":"Hard"},
  {"id":8,"title":"Algebra & Functions","subject":"Combined Mathematics","questions":20,"duration":"30 min","difficulty":"Medium"},
  {"id":9,"title":"Double Entry Bookkeeping","subject":"Accounting","questions":20,"duration":"30 min","difficulty":"Medium"},
  {"id":10,"title":"Supply & Demand","subject":"Economics","questions":18,"duration":"25 min","difficulty":"Medium"},
  {"id":11,"title":"English Grammar","subject":"English","questions":20,"duration":"25 min","difficulty":"Easy"},
  {"id":12,"title":"Buddhist Philosophy","subject":"Buddhism","questions":15,"duration":"20 min","difficulty":"Easy"},
  {"id":13,"title":"GIT Spreadsheets","subject":"General Information Technology","questions":20,"duration":"30 min","difficulty":"Easy"},
  {"id":14,"title":"Marketing Strategy","subject":"Business Studies","questions":15,"duration":"20 min","difficulty":"Easy"},
  {"id":15,"title":"Sri Lankan History","subject":"History","questions":20,"duration":"30 min","difficulty":"Medium"},
];

class QuizzesScreen extends StatefulWidget {
  const QuizzesScreen({super.key});
  @override State<QuizzesScreen> createState() => _QuizzesScreenState();
}

class _QuizzesScreenState extends State<QuizzesScreen> {
  final _sb = Supabase.instance.client;
  Map<String, double> _scores = {};
  String _diff = "All", _search = "";
  RealtimeChannel? _ch;

  @override void initState() { super.initState(); _loadScores(); }
  @override void dispose() { if (_ch != null) _sb.removeChannel(_ch!); super.dispose(); }

  Future<void> _loadScores() async {
    final user = context.read<AuthProvider>().user; if (user == null) return;
    final rows = await _sb.from("quiz_results").select("quiz_key, score_pct").eq("user_id", user.id);
    final map = <String, double>{};
    for (final r in (rows as List)) {
      final k = r["quiz_key"] as String; final pct = (r["score_pct"] as num).toDouble();
      if (!map.containsKey(k) || pct > map[k]!) map[k] = pct;
    }
    if (mounted) setState(() => _scores = map);
    _ch = _sb.channel("qr-${user.id}").onPostgresChanges(event: PostgresChangeEvent.insert, schema: "public", table: "quiz_results",
      filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: user.id),
      callback: (p) { final k = p.newRecord["quiz_key"] as String; final pct = (p.newRecord["score_pct"] as num).toDouble();
        if (mounted) setState(() { if (!_scores.containsKey(k) || pct > _scores[k]!) _scores = {..._scores, k: pct}; });
      }).subscribe();
  }

  List get _filtered => _quizzes.where((q) {
    final md = _diff == "All" || q["difficulty"] == _diff;
    final ms = _search.isEmpty || (q["title"] as String).toLowerCase().contains(_search.toLowerCase()) || (q["subject"] as String).toLowerCase().contains(_search.toLowerCase());
    return md && ms;
  }).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Quizzes", style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [IconButton(icon: const Icon(Icons.auto_awesome, color: kPrimary), onPressed: _showGenerate)],
        bottom: PreferredSize(preferredSize: const Size.fromHeight(52),
          child: Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(hintText: "Search quizzes...", prefixIcon: const Icon(Icons.search, size: 18), isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: Colors.grey.shade300)))))),
      ),
      body: Column(children: [
        SizedBox(height: 44, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          children: ["All","Easy","Medium","Hard"].map((d) => Padding(padding: const EdgeInsets.only(right: 8),
            child: FilterChip(label: Text(d), selected: _diff == d, onSelected: (_) => setState(() => _diff = d),
              selectedColor: kPrimary.withAlpha(40), checkmarkColor: kPrimary))).toList())),
        Expanded(child: ListView.separated(padding: const EdgeInsets.all(14), itemCount: _filtered.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final q = _filtered[i];
            final key = "${q["subject"]}::${q["title"]}";
            final score = _scores[key];
            final diff = q["difficulty"] as String;
            final dc = diff == "Hard" ? Colors.red : diff == "Medium" ? Colors.orange : Colors.green;
            return Card(child: InkWell(borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _QuizPage(quiz: q))),
              child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(q["title"] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 4),
                  Row(children: [
                    Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: kPrimary.withAlpha(20), borderRadius: BorderRadius.circular(20)),
                      child: Text(q["subject"] as String, style: const TextStyle(fontSize: 9, color: kPrimary, fontWeight: FontWeight.w500))),
                    const SizedBox(width: 6),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: dc.withAlpha(25), borderRadius: BorderRadius.circular(20)),
                      child: Text(diff, style: TextStyle(fontSize: 9, color: dc, fontWeight: FontWeight.w500))),
                  ]),
                  const SizedBox(height: 3),
                  Text("${q["questions"]} questions · ${q["duration"]}", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                ])),
                if (score != null)
                  Column(children: [Text("${score.toStringAsFixed(0)}%", style: const TextStyle(color: kPrimary, fontWeight: FontWeight.bold, fontSize: 18)), const Text("Best", style: TextStyle(fontSize: 10, color: Colors.grey))])
                else
                  const Icon(Icons.play_circle_outline, color: kPrimary, size: 30),
              ]))));
          })),
      ]),
    );
  }

  void _showGenerate() {
    final subCtrl = TextEditingController(), topicCtrl = TextEditingController();
    int count = 10; String diff = "Medium"; bool loading = false; String? err;
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text("Generate AI Quiz", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx))]),
          const SizedBox(height: 14),
          if (err != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(err!, style: const TextStyle(color: Colors.red, fontSize: 13))),
          TextField(controller: subCtrl, decoration: const InputDecoration(labelText: "Subject *")),
          const SizedBox(height: 10),
          TextField(controller: topicCtrl, decoration: const InputDecoration(labelText: "Topic (optional)")),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: DropdownButtonFormField<int>(value: count, decoration: const InputDecoration(labelText: "Questions"),
              items: [5,10,15,20].map((n) => DropdownMenuItem(value: n, child: Text("$n"))).toList(), onChanged: (v) => setSt(() => count = v!))),
            const SizedBox(width: 10),
            Expanded(child: DropdownButtonFormField<String>(value: diff, decoration: const InputDecoration(labelText: "Difficulty"),
              items: ["Easy","Medium","Hard"].map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(), onChanged: (v) => setSt(() => diff = v!))),
          ]),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: loading ? null : () async {
              if (subCtrl.text.trim().isEmpty) return;
              setSt(() { loading = true; err = null; });
              try {
                final res = await ApiService.generateQuiz(subject: subCtrl.text.trim(), topic: topicCtrl.text.trim(), questionCount: count, difficulty: diff);
                final quiz = {"title": topicCtrl.text.trim().isNotEmpty ? topicCtrl.text.trim() : "${subCtrl.text.trim()} Model Paper",
                  "subject": subCtrl.text.trim(), "questions": count, "duration": "${(count * 1.5).round()} min", "difficulty": diff, ...res};
                if (mounted) { Navigator.pop(ctx); Navigator.push(context, MaterialPageRoute(builder: (_) => _QuizPage(quiz: quiz))); }
              } catch (e) { setSt(() => err = e.toString().replaceFirst("Exception: ", "")); }
              finally { setSt(() => loading = false); }
            },
            icon: loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.auto_awesome, size: 18),
            label: Text(loading ? "Generating..." : "Generate Quiz")),
        ]))));
  }
}

class _QuizPage extends StatefulWidget {
  final Map quiz;
  const _QuizPage({required this.quiz});
  @override State<_QuizPage> createState() => _QuizPageState();
}

class _QuizPageState extends State<_QuizPage> {
  final _sb = Supabase.instance.client;
  List<Map<String, dynamic>>? _qs;
  int _cur = 0; int? _sel; List<int?> _ans = []; bool _loading = false, _done = false; int _score = 0;

  Future<void> _start() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.generateQuiz(subject: widget.quiz["subject"] ?? "", topic: widget.quiz["title"] ?? "", questionCount: (widget.quiz["questions"] as int? ?? 10).clamp(5, 20), difficulty: widget.quiz["difficulty"] ?? "Medium");
      final qs = ((res["questions"] as List?) ?? []).cast<Map<String, dynamic>>();
      setState(() { _qs = qs; _ans = List.filled(qs.length, null); });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("$e")));
    } finally { setState(() => _loading = false); }
  }

  void _next() {
    if (_sel == null) return;
    _ans[_cur] = _sel;
    if (_cur + 1 < (_qs?.length ?? 0)) { setState(() { _cur++; _sel = null; }); }
    else { _finish(); }
  }

  Future<void> _finish() async {
    final qs = _qs!;
    int correct = 0;
    for (int i = 0; i < qs.length; i++) { if (_ans[i] == qs[i]["correctIndex"]) correct++; }
    final pct = ((correct / qs.length) * 100).round();
    setState(() { _score = pct; _done = true; });
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      await _sb.from("quiz_results").insert({"user_id": user.id, "quiz_key": "${widget.quiz["subject"]}::${widget.quiz["title"]}", "title": widget.quiz["title"], "subject": widget.quiz["subject"], "score_pct": pct, "taken_at": DateTime.now().toIso8601String()});
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_done) {
      final c = _score >= 75 ? Colors.green : _score >= 55 ? Colors.blue : Colors.red;
      final g = _score >= 75 ? "A" : _score >= 65 ? "B" : _score >= 55 ? "C" : _score >= 35 ? "S" : "F";
      return Scaffold(appBar: AppBar(title: const Text("Result"), leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))),
        body: Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          CircleAvatar(backgroundColor: c.withAlpha(25), radius: 56, child: Text(g, style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: c))),
          const SizedBox(height: 16),
          Text("$_score%", style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: c)),
          const SizedBox(height: 8),
          Text(widget.quiz["title"] ?? "", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
          const SizedBox(height: 32),
          SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: () => setState(() { _done = false; _cur = 0; _sel = null; _qs = null; }), icon: const Icon(Icons.refresh), label: const Text("Try Again"))),
          const SizedBox(height: 10),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text("Back to Quizzes"))),
        ]))));
    }
    if (_qs == null) {
      return Scaffold(appBar: AppBar(title: Text(widget.quiz["title"] ?? "")),
        body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.quiz_outlined, size: 64, color: kPrimary),
          const SizedBox(height: 14),
          Text(widget.quiz["title"] ?? "", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text("${widget.quiz["questions"]} questions · ${widget.quiz["duration"]} · ${widget.quiz["difficulty"]}", style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 28),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(onPressed: _loading ? null : _start,
            icon: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.play_arrow),
            label: Text(_loading ? "Loading..." : "Start Quiz"))),
        ]))));
    }
    final qs = _qs!; final q = qs[_cur];
    final opts = ((q["options"] as List?) ?? []).cast<String>();
    return Scaffold(
      appBar: AppBar(title: Text("${_cur + 1} / ${qs.length}"),
        bottom: PreferredSize(preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: (_cur + 1) / qs.length, backgroundColor: Colors.grey.shade200, color: kPrimary))),
      body: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(q["question"] ?? "", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, height: 1.5)))),
        const SizedBox(height: 16),
        ...opts.asMap().entries.map((e) {
          final sel = _sel == e.key;
          return Padding(padding: const EdgeInsets.only(bottom: 10), child: InkWell(onTap: () => setState(() => _sel = e.key), borderRadius: BorderRadius.circular(12),
            child: AnimatedContainer(duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: sel ? kPrimary.withAlpha(20) : null, border: Border.all(color: sel ? kPrimary : Colors.grey.shade300, width: sel ? 2 : 1), borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Container(width: 26, height: 26, decoration: BoxDecoration(shape: BoxShape.circle, color: sel ? kPrimary : Colors.grey.shade100, border: Border.all(color: sel ? kPrimary : Colors.grey.shade300)),
                  child: Center(child: Text(String.fromCharCode(65 + e.key), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: sel ? Colors.white : Colors.grey.shade600)))),
                const SizedBox(width: 12),
                Expanded(child: Text(e.value, style: const TextStyle(fontSize: 14))),
              ]))));
        }),
        const Spacer(),
        SizedBox(width: double.infinity, child: ElevatedButton.icon(
          onPressed: _sel != null ? _next : null,
          icon: Icon(_cur + 1 == qs.length ? Icons.check : Icons.arrow_forward, size: 18),
          label: Text(_cur + 1 == qs.length ? "Finish" : "Next"))),
      ])),
    );
  }
}
