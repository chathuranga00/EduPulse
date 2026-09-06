import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:supabase_flutter/supabase_flutter.dart";
import "package:intl/intl.dart";
import "../../core/theme.dart";
import "../../providers/auth_provider.dart";

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});
  @override State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> with SingleTickerProviderStateMixin {
  final _sb = Supabase.instance.client;
  List _tasks = [], _events = [];
  bool _loading = true;
  late TabController _tabs;
  final List<RealtimeChannel> _chs = [];

  @override void initState() { super.initState(); _tabs = TabController(length: 2, vsync: this); _load(); }
  @override void dispose() { for (final ch in _chs) _sb.removeChannel(ch); _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    final uid = context.read<AuthProvider>().user!.id;
    final r = await Future.wait([
      _sb.from("study_tasks").select().eq("user_id", uid).order("created_at", ascending: true),
      _sb.from("calendar_events").select().eq("user_id", uid).order("event_date", ascending: true),
    ]);
    if (!mounted) return;
    setState(() { _tasks = r[0] as List; _events = r[1] as List; _loading = false; });
    final tc = _sb.channel("planner-tasks-$uid")
      .onPostgresChanges(event: PostgresChangeEvent.insert, schema: "public", table: "study_tasks",
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: uid),
        callback: (p) { if (mounted) setState(() { if (!_tasks.any((x) => x["id"] == p.newRecord["id"])) _tasks.add(p.newRecord); }); })
      .onPostgresChanges(event: PostgresChangeEvent.update, schema: "public", table: "study_tasks",
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: uid),
        callback: (p) { if (mounted) setState(() => _tasks = _tasks.map((x) => x["id"] == p.newRecord["id"] ? p.newRecord : x).toList()); })
      .onPostgresChanges(event: PostgresChangeEvent.delete, schema: "public", table: "study_tasks",
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: uid),
        callback: (p) { if (mounted) setState(() => _tasks = _tasks.where((x) => x["id"] != p.oldRecord["id"]).toList()); })
      .subscribe();
    final ec = _sb.channel("planner-events-$uid")
      .onPostgresChanges(event: PostgresChangeEvent.insert, schema: "public", table: "calendar_events",
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: uid),
        callback: (p) { if (mounted) setState(() { if (!_events.any((x) => x["id"] == p.newRecord["id"])) _events.add(p.newRecord); }); })
      .onPostgresChanges(event: PostgresChangeEvent.delete, schema: "public", table: "calendar_events",
        filter: PostgresChangeFilter(type: PostgresChangeFilterType.eq, column: "user_id", value: uid),
        callback: (p) { if (mounted) setState(() => _events = _events.where((x) => x["id"] != p.oldRecord["id"]).toList()); })
      .subscribe();
    _chs.addAll([tc, ec]);
  }

  void _addTask() {
    final uid = context.read<AuthProvider>().user!.id;
    final titleCtrl = TextEditingController(), dueCtrl = TextEditingController();
    String priority = "Medium"; bool saving = false;
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text("Add Task", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx))]),
          const SizedBox(height: 14),
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: "Task Title *")),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: DropdownButtonFormField<String>(value: priority, decoration: const InputDecoration(labelText: "Priority"),
              items: ["High","Medium","Low"].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
              onChanged: (v) => setSt(() => priority = v!))),
            const SizedBox(width: 10),
            Expanded(child: TextField(controller: dueCtrl, decoration: const InputDecoration(labelText: "Due (optional)"))),
          ]),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: saving ? null : () async {
              if (titleCtrl.text.trim().isEmpty) return;
              setSt(() => saving = true);
              await _sb.from("study_tasks").insert({"user_id": uid, "title": titleCtrl.text.trim(), "subject": "General", "priority": priority, "due_time": dueCtrl.text.trim().isEmpty ? null : dueCtrl.text.trim(), "done": false});
              if (mounted) Navigator.pop(ctx);
            },
            child: saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Add Task")),
        ]))));
  }

  @override
  Widget build(BuildContext context) {
    final pending = _tasks.where((t) => t["done"] != true).length;
    final done    = _tasks.where((t) => t["done"] == true).length;
    final total   = _tasks.length;
    final pct     = total == 0 ? 0.0 : done / total;

    return Scaffold(
      appBar: AppBar(title: const Text("Study Planner", style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(controller: _tabs, labelColor: kPrimary, indicatorColor: kPrimary,
          tabs: [Tab(text: "Tasks ($pending pending)"), const Tab(text: "Events")])),
      floatingActionButton: FloatingActionButton.extended(onPressed: _addTask, backgroundColor: kPrimary,
        icon: const Icon(Icons.add, color: Colors.white), label: const Text("Add Task", style: TextStyle(color: Colors.white))),
      body: _loading ? const Center(child: CircularProgressIndicator())
          : TabBarView(controller: _tabs, children: [
        // Tasks
        ListView(padding: const EdgeInsets.all(16), children: [
          if (total > 0) ...[
            Card(child: Padding(padding: const EdgeInsets.all(14), child: Column(children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text("Progress", style: TextStyle(fontWeight: FontWeight.bold)),
                Text("${(pct * 100).round()}%", style: const TextStyle(color: kPrimary, fontWeight: FontWeight.bold))]),
              const SizedBox(height: 8),
              ClipRRect(borderRadius: BorderRadius.circular(6), child: LinearProgressIndicator(value: pct, minHeight: 8, backgroundColor: Colors.grey.shade200, color: kPrimary)),
              const SizedBox(height: 6),
              Text("$done of $total complete", style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ]))),
            const SizedBox(height: 14),
          ],
          if (_tasks.isEmpty) const Center(child: Padding(padding: EdgeInsets.all(32), child: Text("No tasks yet!", style: TextStyle(color: Colors.grey))))
          else ..._tasks.map((t) {
            final isDone = t["done"] == true;
            final priority = t["priority"] as String? ?? "Medium";
            final pc = priority == "High" ? Colors.red : priority == "Medium" ? Colors.orange : Colors.grey;
            return Dismissible(
              key: Key(t["id"].toString()),
              direction: DismissDirection.endToStart,
              background: Container(decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)), alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 16), child: const Icon(Icons.delete_outline, color: Colors.white)),
              onDismissed: (_) => _sb.from("study_tasks").delete().eq("id", t["id"]),
              child: Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
                leading: Checkbox(value: isDone, activeColor: kPrimary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
                  onChanged: (_) => _sb.from("study_tasks").update({"done": !isDone}).eq("id", t["id"])),
                title: Text(t["title"] ?? "", style: TextStyle(decoration: isDone ? TextDecoration.lineThrough : null, color: isDone ? Colors.grey : null, fontWeight: FontWeight.w500, fontSize: 14)),
                subtitle: Row(children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1), decoration: BoxDecoration(color: pc.withAlpha(25), borderRadius: BorderRadius.circular(6)),
                    child: Text(priority, style: TextStyle(fontSize: 10, color: pc, fontWeight: FontWeight.w600))),
                  if (t["due_time"] != null) ...[const SizedBox(width: 6), Text(t["due_time"], style: const TextStyle(fontSize: 11, color: Colors.grey))],
                ]),
                trailing: isDone ? const Icon(Icons.check_circle, color: kPrimary, size: 18) : null,
                dense: true,
              )));
          }),
          const SizedBox(height: 80),
        ]),
        // Events
        _events.isEmpty ? const Center(child: Text("No events yet.", style: TextStyle(color: Colors.grey)))
            : ListView.separated(padding: const EdgeInsets.all(16), itemCount: _events.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final ev = _events[i];
                  final date = DateTime.tryParse(ev["event_date"] ?? "");
                  return Card(child: ListTile(
                    leading: date != null ? Container(width: 44, padding: const EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(color: kPrimary.withAlpha(20), borderRadius: BorderRadius.circular(10)),
                      child: Column(children: [
                        Text("${date.day}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kPrimary)),
                        Text(DateFormat("MMM").format(date), style: const TextStyle(fontSize: 9, color: Colors.grey)),
                      ])) : null,
                    title: Text(ev["title"] ?? "", style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: date != null ? Text(DateFormat("EEEE, MMM d").format(date), style: const TextStyle(fontSize: 11, color: Colors.grey)) : null,
                  ));
                }),
      ]),
    );
  }
}
