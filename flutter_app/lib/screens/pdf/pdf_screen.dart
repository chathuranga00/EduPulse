import "package:flutter/material.dart";
import "package:file_picker/file_picker.dart";
import "package:flutter_markdown/flutter_markdown.dart";
import "../../core/api_service.dart";
import "../../core/theme.dart";

class PdfScreen extends StatefulWidget {
  const PdfScreen({super.key});
  @override State<PdfScreen> createState() => _PdfScreenState();
}

class _PdfScreenState extends State<PdfScreen> {
  String? _fileName, _text;
  Map<String, dynamic>? _result;
  bool _picking = false, _analysing = false;
  String? _error;

  Future<void> _pick() async {
    setState(() { _picking = true; _error = null; });
    try {
      final picked = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ["pdf","txt"], withData: true);
      if (picked == null) return;
      final f = picked.files.first;
      setState(() {
        _fileName = f.name;
        _text = f.extension == "txt" && f.bytes != null ? String.fromCharCodes(f.bytes!) : "Content of ${f.name} (${(f.size/1024).toStringAsFixed(1)} KB)";
        _result = null;
      });
    } catch (e) { setState(() => _error = "Pick failed: $e"); }
    finally { setState(() => _picking = false); }
  }

  Future<void> _analyse() async {
    if (_text == null) return;
    setState(() { _analysing = true; _error = null; });
    try {
      final res = await ApiService.analyzePdf(text: _text!, fileName: _fileName ?? "document");
      setState(() => _result = res);
    } catch (e) { setState(() => _error = e.toString().replaceFirst("Exception: ","")); }
    finally { setState(() => _analysing = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("PDF Analysis", style: TextStyle(fontWeight: FontWeight.bold))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        InkWell(onTap: _picking ? null : _pick, borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(border: Border.all(color: kPrimary.withAlpha(100), width: 2), borderRadius: BorderRadius.circular(16), color: kPrimary.withAlpha(10)),
            child: Column(children: [
              Icon(_fileName != null ? Icons.picture_as_pdf : Icons.cloud_upload_outlined, size: 48, color: kPrimary),
              const SizedBox(height: 10),
              Text(_fileName ?? "Tap to select a PDF or TXT file", textAlign: TextAlign.center,
                style: TextStyle(color: _fileName != null ? kPrimary : Colors.grey.shade500, fontWeight: FontWeight.w500)),
              if (_fileName != null) Text("Tap to change", style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
            ]),
          )),
        if (_error != null) ...[const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.red.shade200)),
            child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)))],
        if (_text != null && _result == null) ...[const SizedBox(height: 14),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _analysing ? null : _analyse,
            icon: _analysing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.auto_awesome, size: 18),
            label: Text(_analysing ? "Analysing..." : "Analyse Document")))],
        if (_result != null) ...[
          const SizedBox(height: 20),
          if (_result!["summary"] != null) ...[
            Text("Summary", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(child: Padding(padding: const EdgeInsets.all(14), child: MarkdownBody(data: _result!["summary"].toString()))),
            const SizedBox(height: 14),
          ],
          if (_result!["keyPoints"] != null) ...[
            Text("Key Points", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              children: (_result!["keyPoints"] as List).map<Widget>((p) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(margin: const EdgeInsets.only(top: 6, right: 8), width: 5, height: 5, decoration: const BoxDecoration(shape: BoxShape.circle, color: kPrimary)),
                  Expanded(child: Text(p.toString(), style: const TextStyle(fontSize: 13))),
                ]))).toList()))),
          ],
          if (_result!["topics"] != null) ...[
            const SizedBox(height: 14),
            Text("Topics", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: (_result!["topics"] as List).map<Widget>((t) =>
              Chip(label: Text(t.toString(), style: const TextStyle(fontSize: 12)), backgroundColor: kPrimary.withAlpha(20))).toList()),
          ],
        ],
      ]),
    );
  }
}
