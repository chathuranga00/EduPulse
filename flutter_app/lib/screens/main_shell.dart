import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../core/theme.dart";
import "../providers/auth_provider.dart";
import "../providers/theme_provider.dart";
import "dashboard/dashboard_screen.dart";
import "tutor/tutor_screen.dart";
import "pdf/pdf_screen.dart";
import "planner/planner_screen.dart";
import "quizzes/quizzes_screen.dart";
import "community/community_screen.dart";
import "settings/settings_screen.dart";

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;
  final _screens = const [
    DashboardScreen(), TutorScreen(), PdfScreen(),
    PlannerScreen(), QuizzesScreen(), CommunityScreen(), SettingsScreen(),
  ];
  final _labels = ["Dashboard","AI Tutor","PDF","Planner","Quizzes","Community","Settings"];
  final _icons  = [Icons.dashboard_outlined, Icons.chat_bubble_outline, Icons.picture_as_pdf_outlined,
    Icons.calendar_today_outlined, Icons.quiz_outlined, Icons.people_outline, Icons.settings_outlined];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        destinations: List.generate(_labels.length, (i) =>
          NavigationDestination(icon: Icon(_icons[i]), label: _labels[i])),
      ),
    );
  }
}
