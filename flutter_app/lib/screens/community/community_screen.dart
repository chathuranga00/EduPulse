import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:supabase_flutter/supabase_flutter.dart";
import "../../core/theme.dart";
import "../../providers/auth_provider.dart";

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});
  @override State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final _sb = Supabase.instance.client;
  List _posts = [];
  Set<String> _liked = {};
  bool _loading = true, _live = false;
  RealtimeChannel? _ch;

  @override void initState() { super.initState(); _load(); }
  @override void dispose() { if (_ch != null) _sb.removeChannel(_ch!); super.dispose(); }

  Future<void> _load() async {
    final posts = await _sb.from("posts").select().order("created_at", ascending: false).limit(50);
    final user = context.read<AuthProvider>().user;
    Set<String> liked = {};
    if (user != null) {
      final l = await _sb.from("post_likes").select("post_id").eq("user_id", user.id);
      liked = Set<String>.from((l as List).map((x) => x["post_id"].toString()));
    }
    if (!mounted) return;
    setState(() { _posts = posts as List; _liked = liked; _loading = false; });
    _ch = _sb.channel("posts-feed")
      .onPostgresChanges(event: PostgresChangeEvent.insert, schema: "public", table: "posts",
        callback: (p) { if (mounted) setState(() { if (!_posts.any((x) => x["id"] == p.newRecord["id"])) _posts.insert(0, p.newRecord); }); })
      .onPostgresChanges(event: PostgresChangeEvent.update, schema: "public", table: "posts",
        callback: (p) { if (mounted) setState(() => _posts = _posts.map((x) => x["id"] == p.newRecord["id"] ? p.newRecord : x).toList()); })
      .subscribe((status, [_]) { if (mounted) setState(() => _live = status == RealtimeSubscribeStatus.subscribed); });
  }

  Future<void> _like(String postId) async {
    final user = context.read<AuthProvider>().user; if (user == null) return;
    final liked = _liked.contains(postId);
    setState(() {
      if (liked) _liked.remove(postId); else _liked.add(postId);
      _posts = _posts.map((p) => p["id"].toString() == postId ? {...p, "likes_count": ((p["likes_count"] as int?) ?? 0) + (liked ? -1 : 1)} : p).toList();
    });
    if (liked) await _sb.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
    else await _sb.from("post_likes").insert({"user_id": user.id, "post_id": postId});
  }

  void _newPost() {
    final user = context.read<AuthProvider>().user; if (user == null) return;
    final courseCtrl = TextEditingController(), contentCtrl = TextEditingController();
    bool posting = false;
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text("New Post", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx))]),
          const SizedBox(height: 14),
          TextField(controller: courseCtrl, decoration: const InputDecoration(labelText: "Subject / Course tag")),
          const SizedBox(height: 10),
          TextField(controller: contentCtrl, decoration: const InputDecoration(labelText: "What's on your mind?"), maxLines: 4, minLines: 3),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: posting ? null : () async {
              if (contentCtrl.text.trim().isEmpty) return;
              setSt(() => posting = true);
              await _sb.from("posts").insert({"user_id": user.id, "author_name": user.name, "author_initials": user.initials,
                "course": courseCtrl.text.trim().isEmpty ? "General" : courseCtrl.text.trim(),
                "content": contentCtrl.text.trim(), "likes_count": 0, "comments_count": 0});
              if (mounted) { Navigator.pop(ctx); _load(); }
            },
            child: posting ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Post")),
        ]))));
  }

  String _ago(String d) {
    final diff = DateTime.now().difference(DateTime.parse(d));
    if (diff.inMinutes < 1) return "Just now";
    if (diff.inHours < 1) return "${diff.inMinutes}m ago";
    if (diff.inDays < 1) return "${diff.inHours}h ago";
    return "${diff.inDays}d ago";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Text("Community", style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(width: 8),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: _live ? Colors.green.shade100 : Colors.grey.shade100, borderRadius: BorderRadius.circular(20)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: _live ? Colors.green : Colors.grey)),
              const SizedBox(width: 4),
              Text(_live ? "Live" : "Connecting", style: TextStyle(fontSize: 10, color: _live ? Colors.green.shade700 : Colors.grey.shade500)),
            ])),
        ]),
        actions: [IconButton(icon: const Icon(Icons.add_circle_outline, color: kPrimary), onPressed: _newPost)],
      ),
      floatingActionButton: FloatingActionButton(onPressed: _newPost, backgroundColor: kPrimary, child: const Icon(Icons.add, color: Colors.white)),
      body: _loading ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(onRefresh: _load, child: _posts.isEmpty
              ? const Center(child: Text("No posts yet. Be the first!"))
              : ListView.separated(padding: const EdgeInsets.all(14), itemCount: _posts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final p = _posts[i];
                    final liked = _liked.contains(p["id"].toString());
                    return Card(child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        CircleAvatar(backgroundColor: kPrimary, radius: 16, child: Text(p["author_initials"] ?? "?", style: const TextStyle(color: Colors.white, fontSize: 11))),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(p["author_name"] ?? "", style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Row(children: [
                            Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(color: kPrimary.withAlpha(20), borderRadius: BorderRadius.circular(20)),
                              child: Text(p["course"] ?? "", style: const TextStyle(fontSize: 9, color: kPrimary, fontWeight: FontWeight.w500))),
                            const SizedBox(width: 6),
                            Text(_ago(p["created_at"]), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                          ]),
                        ])),
                      ]),
                      const SizedBox(height: 10),
                      Text(p["content"] ?? "", style: const TextStyle(fontSize: 13, height: 1.5)),
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 8),
                      Row(children: [
                        GestureDetector(onTap: () => _like(p["id"].toString()), child: Row(children: [
                          Icon(liked ? Icons.favorite : Icons.favorite_border, size: 16, color: liked ? Colors.red : Colors.grey),
                          const SizedBox(width: 4),
                          Text("${p["likes_count"] ?? 0}", style: TextStyle(fontSize: 12, color: liked ? Colors.red : Colors.grey)),
                        ])),
                        const SizedBox(width: 16),
                        Row(children: [
                          const Icon(Icons.chat_bubble_outline, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text("${p["comments_count"] ?? 0}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ]),
                      ]),
                    ])));
                  })),
    );
  }
}
