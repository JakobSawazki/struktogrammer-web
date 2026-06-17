# Struktogrammer Web

Eine browserbasierte Lern-App zum Erstellen von Nassi-Shneiderman-Struktogrammen.
Die Oberfläche ist bewusst auf die wichtigsten Bausteine für Informatikunterricht,
Python-Einstieg und Abiturvorbereitung reduziert.

## Funktionen

- Fachlich getrennte Bausteine für Zuweisung, Deklaration und Initialisierung,
  Deklaration und Einlesen sowie Ausgabe
- Verzweigung, Mehrfachverzweigung, While-Schleife, Zählschleife und Subroutine
- Drag-and-drop in Hauptbereich, Schleifen und Dann-/Sonst-Zweige
- Direktes Umordnen vorhandener Bausteine per Drag-and-drop im Struktogramm
- Touch-Alternative durch Antippen von Baustein und Einfügeposition
- Direkte Textbearbeitung sowie Duplizieren, Löschen und Verschieben
- JSON-Dateien öffnen und speichern
- Automatische Zwischenspeicherung im Browser
- SVG- und PNG-Export
- Saubere Druckansicht
- Leerer Start ohne vorgegebene Musterlösung
- Direkter Verweis auf die offizielle Operatorenliste und eine einfache Grundprüfung
- Umschaltbarer, lokal gespeicherter Hell- und Dunkelmodus
- Programminfo mit Verweis auf Sawazki Electronics
- Offline-Download als eigenständige HTML-Datei
- Scrollbares Operatoren-Blatt direkt in der App
- Kurze Hover-Hinweise für die Symbolleiste
- Tastenkürzel für Neu, Öffnen, Speichern, Bildexport, Drucken, Prüfen, Hilfe und Modus
- Dezenter Design- und Copyright-Hinweis mit Link zu Sawazki Electronics

## Start

Es ist kein Build-Schritt erforderlich. `index.html` kann direkt geöffnet oder von
einem beliebigen statischen Webserver bereitgestellt werden.

Beispiel mit Python:

```powershell
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## Fachliche Orientierung

Die Schreibweisen orientieren sich an der
[Operatorenliste für Struktogramme, Version 2.2 vom 01.09.2024](https://www.schule-bw.de/faecher-und-schularten/mathematisch-naturwissenschaftliche-faecher/informatik/material/materialien-zum-neuen-bildungsplan-informatik-an-den-nichtgewerblichen-beruflichen-gymnasien/operatorenliste-fuer-struktogramme-v2-2.pdf)
des Landesbildungsservers Baden-Württemberg.

## Technik

Die App verwendet ausschließlich HTML, CSS und Vanilla JavaScript. Projekte werden
als JSON-Baum gespeichert; Kontrollstrukturen können beliebig verschachtelt werden.
