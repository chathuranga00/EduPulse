import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_service.dart';

class AppUser {
  final String id, name, email, plan;
  final String? university, bio, avatar;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.plan,
    this.university,
    this.bio,
    this.avatar,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id:         j['id']         ?? '',
        name:       j['name']       ?? '',
        email:      j['email']      ?? '',
        plan:       j['plan']       ?? 'free',
        university: j['university'],
        bio:        j['bio'],
        avatar:     j['avatar'],
      );

  Map<String, dynamic> toJson() => {
        'id':         id,
        'name':       name,
        'email':      email,
        'plan':       plan,
        'university': university,
        'bio':        bio,
        'avatar':     avatar,
      };

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }
}

class AuthProvider extends ChangeNotifier {
  AppUser? _user;
  bool _loading = true;

  AppUser? get user    => _user;
  bool get loading     => _loading;
  bool get isAuthenticated => _user != null;

  // ── Init: load cached user instantly, verify in background ───────────────
  Future<void> init() async {
    // 1. Load cached user from local storage — instant, no network
    final cached = await _loadCachedUser();
    if (cached != null) {
      _user    = cached;
      _loading = false;
      notifyListeners(); // App shows immediately with cached data

      // 2. Verify token in background silently
      _verifyInBackground();
    } else {
      // No cache — must hit network
      await _verifyFromNetwork();
    }
  }

  Future<void> _verifyInBackground() async {
    try {
      final d = await ApiService.getMe();
      _user = AppUser.fromJson(d['user']);
      await _cacheUser(_user!);
      notifyListeners();
    } catch (_) {
      // Token expired — log out silently
      _user = null;
      await _clearCache();
      notifyListeners();
    }
  }

  Future<void> _verifyFromNetwork() async {
    try {
      final d = await ApiService.getMe();
      _user = AppUser.fromJson(d['user']);
      await _cacheUser(_user!);
    } catch (_) {
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final d = await ApiService.login(email: email, password: password);
    _user = AppUser.fromJson(d['user']);
    await _cacheUser(_user!);
    notifyListeners();
  }

  Future<void> register(String name, String email, String password) async {
    final d = await ApiService.register(name: name, email: email, password: password);
    _user = AppUser.fromJson(d['user']);
    await _cacheUser(_user!);
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.logout();
    _user = null;
    await _clearCache();
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      final d = await ApiService.getMe();
      _user = AppUser.fromJson(d['user']);
      await _cacheUser(_user!);
      notifyListeners();
    } catch (_) {}
  }

  // ── Local cache helpers ───────────────────────────────────────────────────
  static const _userKey = 'cached_user';

  Future<AppUser?> _loadCachedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('ep_token');
      final json  = prefs.getString(_userKey);
      if (token == null || json == null) return null;
      return AppUser.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> _cacheUser(AppUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> _clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove('ep_token');
  }
}
