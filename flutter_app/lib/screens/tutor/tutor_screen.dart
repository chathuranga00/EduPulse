import "package:flutter/material.dart";
import "package:flutter_markdown/flutter_markdown.dart";
import "../../core/api_service.dart";
import "../../core/theme.dart";

class TutorScreen extends StatefulWidget {
  const TutorScreen({super.key});
  @override State<TutorScreen> createState() => _TutorScreenState();
}

class _TutorScreenState extends State<TutorScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<Map<String, String>> _msgs = [];
  bool _loading = false;

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _loading) return;
    _ctrl.clear();
    setState(() { _msgs.add({"role": "user", "content": text}); _loading = true; });
    _down();
    try {
      final history = _msgs.take(_msgs.length - 1).toList();
      final reply = await ApiService.chat(message: text, history: history);
      if (mounted) setState(() => _msgs.add({"role": "assistant", "content": reply}));
    } catch (e) {
      if (mounted) setState(() => _msgs.add({"role": "assistant", "content": "Error: ${e.toString().replaceFirst("Exception: ", "")}"}));
    } finally { if (mounted) setState(() => _loading = false); _down(); }
  }

  void _down() => Future.delayed(const Duration(milliseconds: 150), () {
    if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("AI Tutor", style: TextStyle(fontWeight: FontWeight.bold))),
      body: Column(children: [
        Expanded(child: _msgs.isEmpty ? _empty() : ListView.builder(
          controller: _scroll, padding: const EdgeInsets.all(16),
          itemCount: _msgs.length + (_loading ? 1 : 0),
          itemBuilder: (_, i) {
            if (i == _msgs.length) return _typing();
            final m = _msgs[i];
            final isUser = m["role"] == "user";
            return Align(
              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .82),
                decoration: BoxDecoration(
                  color: isUser ? kPrimary : Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(16).copyWith(
                    bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(16),
                    bottomLeft:  isUser ? const Radius.circular(16) : const Radius.circular(4)),
                  border: isUser ? null : Border.all(color: Colors.grey.shade200),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: isUser
                    ? Text(m["content"]!, style: const TextStyle(color: Colors.white, fontSize: 14))
                    : MarkdownBody(data: m["content"]!),
              ),
            );
          },
        )),
        _bar(),
      ]),
    );
  }

  Widget _empty() => Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(
    mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 64, height: 64, decoration: BoxDecoration(color: kPrimary.withAlpha(25), borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.auto_awesome, color: kPrimary, size: 32)),
      const SizedBox(height: 14),
      Text("AI Tutor", style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
      const SizedBox(height: 6),
      Text("Ask anything about your studies", style: TextStyle(color: Colors.grey.shade500)),
      const SizedBox(height: 20),
      Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center,
        children: ["Explain Newton Laws", "What is photosynthesis?", "Help with integration", "French Revolution summary"]
          .map((s) => ActionChip(label: Text(s, style: const TextStyle(fontSize: 12)),
            onPressed: () { _ctrl.text = s; _send(); },
            backgroundColor: kPrimary.withAlpha(15), side: BorderSide(color: kPrimary.withAlpha(60)))).toList()),
    ])));

  Widget _typing() => Align(alignment: Alignment.centerLeft, child: Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(16).copyWith(bottomLeft: const Radius.circular(4)), border: Border.all(color: Colors.grey.shade200)),
    child: const Row(mainAxisSize: MainAxisSize.min, children: [SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)), SizedBox(width: 8), Text("Thinking...", style: TextStyle(color: Colors.grey, fontSize: 13))])));

  Widget _bar() => Container(
    padding: EdgeInsets.only(left: 16, right: 12, top: 10, bottom: MediaQuery.of(context).viewInsets.bottom + 10),
    decoration: BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor, border: Border(top: BorderSide(color: Colors.grey.shade200))),
    child: Row(children: [
      Expanded(child: TextField(controller: _ctrl,
        decoration: InputDecoration(hintText: "Ask anything...", isDense: true,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: Colors.grey.shade300))),
        maxLines: 4, minLines: 1, onSubmitted: (_) => _send())),
      const SizedBox(width: 8),
      CircleAvatar(backgroundColor: _loading ? Colors.grey : kPrimary, radius: 22,
        child: _loading
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : IconButton(icon: const Icon(Icons.send, color: Colors.white, size: 18), onPressed: _send)),
    ]));
}
