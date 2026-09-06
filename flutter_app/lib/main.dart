import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(url: kSupabaseUrl, anonKey: kSupabaseAnonKey);

  final auth  = AuthProvider();
  final theme = ThemeProvider();

  // Load theme instantly from local prefs
  await theme.init();

  // Start auth init but don't await — app starts immediately
  auth.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: theme),
      ],
      child: const EduPulseApp(),
    ),
  );
}

class EduPulseApp extends StatelessWidget {
  const EduPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    final auth  = context.watch<AuthProvider>();

    return MaterialApp(
      title: kAppName,
      debugShowCheckedModeBanner: false,
      theme:     lightTheme(),
      darkTheme: darkTheme(),
      themeMode: theme.themeMode,
      home: auth.loading
          ? const _SplashScreen()
          : auth.isAuthenticated
              ? const MainShell()
              : const LoginScreen(),
    );
  }
}

// ── Splash screen shown only on first load (no cached user) ──────────────────
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6366F1),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset('assets/images/logo.png', width: 90, height: 90),
            ),
            const SizedBox(height: 24),
            const Text(
              'EduPulse AI',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Smart Study Assistant',
              style: TextStyle(fontSize: 14, color: Colors.white70),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
