import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'constants.dart';

class ApiService {
  static String? _token;

  static Future<String?> get token async {
    _token ??= (await SharedPreferences.getInstance()).getString(kTokenKey);
    return _token;
  }

  static Future<void> saveToken(String t) async {
    _token = t;
    (await SharedPreferences.getInstance()).setString(kTokenKey, t);
  }

  static Future<void> clearToken() async {
    _token = null;
    (await SharedPreferences.getInstance()).remove(kTokenKey);
  }

  static Future<Map<String, String>> _headers() async {
    final t = await token;
    return {'Content-Type': 'application/json', if (t != null) 'Cookie': 'ep_token=$t'};
  }

  static void _saveTokenFromResponse(http.Response res) {
    final cookie = res.headers['set-cookie'] ?? '';
    final match = RegExp(r'ep_token=([^;]+)').firstMatch(cookie);
    if (match != null) saveToken(match.group(1)!);
  }

  static Future<Map<String, dynamic>> register({required String name, required String email, required String password}) async {
    final res = await http.post(Uri.parse('$kApiBaseUrl/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': name, 'email': email, 'password': password}));
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 201) { _saveTokenFromResponse(res); return data; }
    throw Exception(data['error'] ?? 'Registration failed');
  }

  static Future<Map<String, dynamic>> login({required String email, required String password}) async {
    final res = await http.post(Uri.parse('$kApiBaseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}));
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) { _saveTokenFromResponse(res); return data; }
    throw Exception(data['error'] ?? 'Login failed');
  }

  static Future<void> logout() async {
    await http.post(Uri.parse('$kApiBaseUrl/api/auth/logout'), headers: await _headers());
    await clearToken();
  }

  static Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(Uri.parse('$kApiBaseUrl/api/auth/me'), headers: await _headers());
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return data;
    throw Exception(data['error'] ?? 'Not authenticated');
  }

  static Future<String> chat({required String message, required List<Map<String, String>> history}) async {
    final res = await http.post(Uri.parse('$kApiBaseUrl/api/tutor'),
        headers: await _headers(), body: jsonEncode({'message': message, 'history': history}));
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return data['text'] as String;
    throw Exception(data['error'] ?? 'Tutor failed');
  }

  static Future<Map<String, dynamic>> analyzePdf({required String text, required String fileName}) async {
    final res = await http.post(Uri.parse('$kApiBaseUrl/api/analyze-pdf'),
        headers: await _headers(), body: jsonEncode({'text': text, 'fileName': fileName}));
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return data;
    throw Exception(data['error'] ?? 'Analysis failed');
  }

  static Future<Map<String, dynamic>> generateQuiz({required String subject, required String topic, required int questionCount, required String difficulty}) async {
    final res = await http.post(Uri.parse('$kApiBaseUrl/api/generate-quiz'),
        headers: await _headers(),
        body: jsonEncode({'subject': subject, 'topic': topic, 'questionCount': questionCount, 'difficulty': difficulty}));
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) return data;
    throw Exception(data['error'] ?? 'Quiz generation failed');
  }

  static Future<void> updateProfile(Map<String, dynamic> body) async {
    final res = await http.put(Uri.parse('$kApiBaseUrl/api/users/profile'),
        headers: await _headers(), body: jsonEncode(body));
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(data['error'] ?? 'Update failed');
    }
  }

  static Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    final res = await http.put(Uri.parse('$kApiBaseUrl/api/users/password'),
        headers: await _headers(),
        body: jsonEncode({'currentPassword': currentPassword, 'newPassword': newPassword}));
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(data['error'] ?? 'Password change failed');
    }
  }
}
