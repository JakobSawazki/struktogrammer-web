# Struktogrammer Web

Eine browserbasierte Lern-App zum Erstellen von Nassi-Shneiderman-Struktogrammen.
Die Oberfläche ist bewusst auf die wichtigsten Bausteine für Informatikunterricht,
Python-Einstieg und Abiturvorbereitung reduziert.

## Funktionen

- Fachlich getrennte Bausteine für Zuweisung, Deklaration und Initialisierung,
  Deklaration und Einlesen, Einlesen und Ausgabe
- Verzweigung, Mehrfachverzweigung, While-Schleife, Zählschleife und Subroutine
- Drag-and-drop in Hauptbereich, Schleifen und Dann-/Sonst-Zweige
- Touch-Alternative durch Antippen von Baustein und Einfügeposition
- Direkte Textbearbeitung sowie Duplizieren, Löschen und Verschieben
- JSON-Dateien öffnen und speichern
- Automatische Zwischenspeicherung im Browser
- SVG- und PNG-Export
- Saubere Druckansicht
- Leerer Start ohne vorgegebene Musterlösung
- Direkter Verweis auf die offizielle Operatorenliste und eine einfache Grundprüfung

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
