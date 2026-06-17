# TASKS.md - Struktogrammer Web

Arbeitsstand und Fahrplan fuer die Web-App zum Erstellen von Nassi-Shneiderman-Struktogrammen.

## Versionen und erledigte Aufgaben

### v0.1 - Grundlegende Vereinfachung

- App auf Vanilla HTML, CSS und JavaScript fokussiert.
- Oberflaeche auf Toolbar, Baustein-Palette und Zeichenflaeche reduziert.
- Start mit leerem Struktogramm statt Beispiel-Loesung.
- Projektstruktur mit `index.html`, `style.css` und `script.js` beibehalten.

### v0.2 - Fachliche Bausteine und Datenmodell

- JSON-Baum als internes Datenmodell stabilisiert.
- Kernbausteine fuer Struktogramme umgesetzt:
  Sequenz/Zuweisung, Deklaration und Initialisierung, Deklaration und Einlesen,
  Einlesen, Ausgabe, Verzweigung, Mehrfachverzweigung, Wiederholung solange,
  Zaehlschleife/FOR und Subroutine/Funktion.
- Verschachtelungen in Schleifen, Verzweigungen und Mehrfachverzweigungen ermoeglicht.
- Beispiele als feste Startinhalte entfernt, damit die App als moegliches Hilfsmittel neutral bleibt.

### v0.3 - Bedienung und Export

- Drag-and-drop und Touch-Alternative fuer Einfuegezonen umgesetzt.
- Elemente koennen bearbeitet, dupliziert, geloescht und verschoben werden.
- JSON-Speichern und JSON-Oeffnen umgesetzt.
- SVG- und PNG-Export fuer das reine Struktogramm umgesetzt.
- Saubere Druckansicht ohne Toolbar und Palette umgesetzt.
- Grundpruefung fuer leere Struktogramme, leere Zweige, leere Schleifen und einfache Bedingungshinweise umgesetzt.

### v0.4 - Klassisches Struktogramm-Design

- Struktogramm visuell an klassische HUS-Struktogramme angelehnt.
- Icons aus dem Struktogramm selbst entfernt.
- Verzweigung mit exakt mittig treffenden Diagonalen umgesetzt.
- Toolbar- und Baustein-Icons in einheitlichem blauen Design gestaltet.
- Hell-/Dunkelmodus mit lokaler Speicherung hinzugefuegt.

### v0.5 - Branding, Dokumentation und Offline-Download

- Neues Struktogrammer-Logo generiert und als App-Bildmarke eingebunden.
- Favicon und Apple-Touch-Icon aus der Bildmarke erstellt.
- Programminfo mit direktem Link zu Sawazki Electronics ergaenzt.
- Offline-Download als eigenstaendige HTML-Datei hinzugefuegt.
- Markdown-artige Platzhalter mit `*...*` wieder entfernt, damit die Vorlagen fuer Schuelerinnen und Schueler einfacher bleiben.
- `TASKS.md` als laufende Projekt- und Versionsdokumentation angelegt.

### v0.6 - Operatorenblatt und Symbolhilfen

- Operatoren-Schaltflaeche oeffnet ein scrollbares Blatt in der App statt direkt das PDF zu verlassen.
- Kompakte Operatorenuebersicht nach der offiziellen Operatorenliste Baden-Wuerttemberg, Version 2.2 vom 01.09.2024, ergaenzt.
- Link zur offiziellen PDF-Operatorenliste unten im Operatorenblatt platziert.
- Offline-Download in die obere Symbolleiste verschoben.
- Programminfo bewusst auf "Designed by Sawazki Electronics" reduziert.
- Hover-Hinweise fuer zentrale Symbolbuttons ergaenzt.

## Offen / Naechste Schritte

### v0.7 - Offline und Installation verbessern

- Optional eine echte PWA mit `manifest.webmanifest` und Service Worker erstellen.
- Offline-Download um ZIP-Variante mit Einzeldateien ergaenzen.
- Eindeutige Versionsnummer in der Programminfo anzeigen.

### v0.8 - Unterrichtstauglichkeit verfeinern

- Schreibweisen der Operatorenliste nochmals fachlich gegenpruefen.
- Kurze Lehrkraft-Notizen fuer typische Python-Uebersetzungen ergaenzen.
- Optionale, neutrale Mini-Hilfe fuer Mehrfachverzweigungen verbessern.
- Export-Dateinamen und Drucklayout fuer Arbeitsblaetter weiter verfeinern.

### v0.9 - Bedienkomfort

- Rueckgaengig/Wiederholen einfuehren.
- Zoom fuer grosse Struktogramme ergaenzen.
- Mehrere Elemente markieren und gemeinsam verschieben pruefen.
- Bessere Tastaturbedienung fuer Einfuegezonen und Zweige ergaenzen.

### v0.10 - Qualitaetssicherung

- Kleine automatisierte Smoke-Tests fuer Rendern, Export, Import und Offline-Download aufsetzen.
- GitHub Actions fuer Syntaxcheck und statische Pruefungen einrichten.
- Accessibility-Pruefung fuer Fokusreihenfolge, Kontraste und Dialoge durchfuehren.

### v1.0 - Stabiler Unterrichtsstand

- Funktionsumfang einfrieren.
- Finale Kurzanleitung pruefen.
- Release-Tag setzen und Download-Hinweise in README und Programminfo klar ausweisen.
