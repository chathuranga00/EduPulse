import 'package:flutter/material.dart';
import 'dashboard/dashboard_screen.dart';
import 'tutor/tutor_screen.dart';
import 'pdf/pdf_screen.dart';
import 'planner/planner_screen.dart';
import 'quizzes/quizzes_screen.dart';
import 'community/community_screen.dart';
import 'settings/settings_screen.dart';

// Global key so any screen can switch tabs
final mainShellKey = GlobalKey<MainShellState>();

class MainShell extends StatefulWidget {
  MainShell() : super(key: mainShellKey);

  static void switchTab(int index) {
    mainShellKey.currentState?.switchTo(index);
  }

  @override
  State<MainShell> createState() => MainShellState();
}

class MainShellState extends State<MainShell> {
  int _idx = 0;

  void switchTo(int index) => setState(() => _idx = index);

  static const _labels = [
    'Dashboard', 'AI Tutor', 'PDF', 'Planner', 'Quizzes', 'Community', 'Settings'
  ];
  static const _icons = [
    Icons.dashboard_outlined,
    Icons.chat_bubble_outline,
    Icons.picture_as_pdf_outlined,
    Icons.calendar_today_outlined,
    Icons.quiz_outlined,
    Icons.people_outline,
    Icons.settings_outlined,
  ];

  static const _screens = [
    DashboardScreen(),
    TutorScreen(),
    PdfScreen(),
    PlannerScreen(),
    QuizzesScreen(),
    CommunityScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        height: 65,
        destinations: List.generate(_labels.length, (i) =>
          NavigationDestination(
            icon: Icon(_icons[i]),
            label: _labels[i],
          )),
      ),
    );
  }
}
