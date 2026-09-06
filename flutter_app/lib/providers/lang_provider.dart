import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_strings.dart';

class LangProvider extends ChangeNotifier {
  String _locale = 'en';

  String get locale => _locale;
  AppStrings get strings => AppStrings(_locale);

  Locale get flutterLocale {
    switch (_locale) {
      case 'si': return const Locale('si', 'LK');
      case 'ta': return const Locale('ta', 'LK');
      default:   return const Locale('en', 'US');
    }
  }

  String get localeName {
    switch (_locale) {
      case 'si': return 'සිංහල';
      case 'ta': return 'தமிழ்';
      default:   return 'English';
    }
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _locale = prefs.getString('app_locale') ?? 'en';
    notifyListeners();
  }

  Future<void> setLocale(String locale) async {
    _locale = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_locale', locale);
    notifyListeners();
  }
}
