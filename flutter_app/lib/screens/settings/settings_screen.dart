import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_service.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/lang_provider.dart';
import '../../l10n/app_strings.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nameCtrl = TextEditingController();
  final _uniCtrl  = TextEditingController();
  final _bioCtrl  = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) { _nameCtrl.text = user.name; _uniCtrl.text = user.university ?? ""; _bioCtrl.text = user.bio ?? ""; }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiService.updateProfile({"name": _nameCtrl.text.trim(), "university": _uniCtrl.text.trim(), "bio": _bioCtrl.text.trim()});
      await context.read<AuthProvider>().refreshUser();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Profile updated!")));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("$e")));
    } finally { if (mounted) setState(() => _saving = false); }
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  Widget _langTile(BuildContext context, String code, String label) {
    final lang = context.watch<LangProvider>();
    final selected = lang.locale == code;
    return ListTile(
      title: Text(label, style: const TextStyle(fontSize: 14)),
      trailing: selected
          ? const Icon(Icons.check_circle, color: kPrimary)
          : const Icon(Icons.circle_outlined, color: Colors.grey),
      onTap: () => context.read<LangProvider>().setLocale(code),
      dense: true,
    );
  }

  void _changePassword() {
    final curr = TextEditingController(), next = TextEditingController();
    bool saving = false;
    showDialog(context: context, builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) => AlertDialog(
      title: const Text("Change Password"),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: curr, obscureText: true, decoration: const InputDecoration(labelText: "Current Password")),
        const SizedBox(height: 10),
        TextField(controller: next, obscureText: true, decoration: const InputDecoration(labelText: "New Password (min 6)")),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
        ElevatedButton(onPressed: saving ? null : () async {
          setSt(() => saving = true);
          try {
            await ApiService.changePassword(currentPassword: curr.text, newPassword: next.text);
            if (mounted) { Navigator.pop(ctx); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Password changed!"))); }
          } catch (e) {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("$e")));
          } finally { setSt(() => saving = false); }
        },
          style: ElevatedButton.styleFrom(backgroundColor: kPrimary, foregroundColor: Colors.white),
          child: saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Save")),
      ])));
  }

  @override
  Widget build(BuildContext context) {
    final user  = context.watch<AuthProvider>().user;
    final theme = context.watch<ThemeProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          ClipRRect(borderRadius: BorderRadius.circular(8),
            child: Image.asset('assets/images/logo.png', width: 28, height: 28, fit: BoxFit.cover)),
          const SizedBox(width: 8),
          const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)),
        ]),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Profile card
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
          CircleAvatar(backgroundColor: kPrimary, radius: 30,
            child: Text(user?.initials ?? "U", style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(user?.name ?? "", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(user?.email ?? "", style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 4),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: kPrimary.withAlpha(20), borderRadius: BorderRadius.circular(20)),
              child: Text(user?.plan == "plus" ? "Plus Plan" : "Student Plan", style: const TextStyle(fontSize: 10, color: kPrimary, fontWeight: FontWeight.w600))),
          ])),
        ]))),
        const SizedBox(height: 18),

        // Edit profile
        Text("Edit Profile", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: "Full Name", prefixIcon: Icon(Icons.person_outline))),
          const SizedBox(height: 10),
          TextField(controller: _uniCtrl, decoration: const InputDecoration(labelText: "University", prefixIcon: Icon(Icons.school_outlined))),
          const SizedBox(height: 10),
          TextField(controller: _bioCtrl, maxLines: 3, decoration: const InputDecoration(labelText: "Bio", prefixIcon: Icon(Icons.info_outline))),
          const SizedBox(height: 14),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text("Save Profile"))),
        ]))),
        const SizedBox(height: 18),

        // Appearance
        Text("Appearance", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Card(child: SwitchListTile(
          title: const Text("Dark Mode"),
          secondary: Icon(theme.isDark ? Icons.dark_mode : Icons.light_mode_outlined, color: kPrimary),
          value: theme.isDark, onChanged: (_) => theme.toggle(), activeColor: kPrimary)),
        const SizedBox(height: 18),

        // Language
        Text("Language / භාෂාව / மொழி",
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Card(child: Column(children: [
          _langTile(context, 'en', '🇬🇧  English'),
          const Divider(height: 1, indent: 56),
          _langTile(context, 'si', '🇱🇰  සිංහල'),
          const Divider(height: 1, indent: 56),
          _langTile(context, 'ta', '🇱🇰  தமிழ்'),
        ])),
        const SizedBox(height: 18),

        // Security
        Text("Security", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Card(child: ListTile(leading: const Icon(Icons.lock_outline, color: kPrimary), title: const Text("Change Password"), trailing: const Icon(Icons.chevron_right), onTap: _changePassword)),
        const SizedBox(height: 24),

        // Sign out
        SizedBox(width: double.infinity, child: ElevatedButton.icon(
          onPressed: _logout,
          icon: const Icon(Icons.logout),
          label: const Text("Sign Out"),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade600, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), padding: const EdgeInsets.symmetric(vertical: 14)))),
        const SizedBox(height: 40),
      ]),
    );
  }
}
