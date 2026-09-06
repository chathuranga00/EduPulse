import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  bool _dark = false;
  bool get isDark => _dark;
  ThemeMode get themeMode => _dark ? ThemeMode.dark : ThemeMode.light;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _dark = prefs.getBool("dark_mode") ?? false;
    notifyListeners();
  }

  Future<void> toggle() async {
    _dark = !_dark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool("dark_mode", _dark);
    notifyListeners();
  }
}
