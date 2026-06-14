'use strict';

// App state and element templates

const STORAGE_KEY = 'struktogrammer-web-project-v2';
const PROJECT_FORMAT = 'struktogrammer-web';
const LOOP_TYPES = new Set(['while', 'for']);
const ALLOWED_TYPES = new Set(['sequence', 'input', 'output', 'if', 'while', 'for', 'subroutine']);

const ELEMENT_TYPES = {
  sequence: {
    label: 'Sequenz / Anweisung',
    shortLabel: 'Sequenz',
    summary: 'Zuweisung, Initialisierung oder allgemeine Anweisung',
    defaultText: 'Zuweisung: zahl = zahl - 1',
    help: 'Eine Sequenz ist eine einfache Anweisung, die der Reihe nach ausgeführt wird.',
    icon: 'sequence'
  },
  input: {
    label: 'Eingabe',
    shortLabel: 'Eingabe',
    summary: 'Einen Wert einlesen',
    defaultText: 'Einlesen: zahl als Ganzzahl',
    help: 'Eine Eingabe liest einen Wert ein, zum Beispiel über input() im Python-Unterricht.',
    icon: 'input'
  },
  output: {
    label: 'Ausgabe',
    shortLabel: 'Ausgabe',
    summary: 'Text oder Werte ausgeben',
    defaultText: 'Ausgabe: "Ergebnis: " + ergebnis',
    help: 'Eine Ausgabe entspricht im Python-Unterricht häufig einem print()-Befehl.',
    icon: 'output'
  },
  if: {
    label: 'Entscheidung',
    shortLabel: 'Entscheidung',
    summary: 'Wenn / dann / sonst',
    defaultText: 'Wenn zahl > 0',
    help: 'Eine Entscheidung führt abhängig von einer Bedingung den Dann- oder den Sonst-Zweig aus.',
    icon: 'decision'
  },
  while: {
    label: 'Wiederholung solange',
    shortLabel: 'While-Schleife',
    summary: 'Kopfgesteuerte Schleife',
    defaultText: 'Wiederhole solange zahl > 1',
    help: 'Diese Schleife prüft zuerst die Bedingung. Nur wenn sie wahr ist, wird der Schleifenkörper ausgeführt.',
    icon: 'while'
  },
  for: {
    label: 'Zählschleife / FOR',
    shortLabel: 'Zählschleife',
    summary: 'Wiederholung mit Zählvariable',
    defaultText: 'Zähle i von 0 bis 4, Schrittweite 1',
    help: 'Diese Schleife eignet sich, wenn die Anzahl der Wiederholungen über eine Zählvariable gesteuert wird.',
    icon: 'for'
  },
  subroutine: {
    label: 'Subroutine / Funktion',
    shortLabel: 'Subroutine',
    summary: 'Funktion aufrufen oder Wert zurückgeben',
    defaultText: 'Aufruf: berechneSumme()',
    help: 'Eine Subroutine ist ein Unterprogramm. In Python entspricht dies häufig einem Funktionsaufruf.',
    icon: 'subroutine'
  }
};

const LEGACY_TYPE_MAP = {
  assignment: 'sequence',
  declaration: 'sequence',
  initialization: 'sequence',
  declarationInitialization: 'sequence',
  arrayDeclaration: 'sequence',
  arrayAssignment: 'sequence',
  arrayAppend: 'sequence',
  arrayLength: 'sequence',
  lineOutput: 'output',
  arrayOutput: 'output',
  returnValue: 'subroutine',
  call: 'subroutine',
  countFor: 'for',
  forWhile: 'for'
};

const state = {
  diagram: createEmptyDiagram(),
  selectedElementId: null,
  editingElementId: null,
  pendingElementType: null,
  draggingElementType: null,
  dirty: false,
  savedSnapshot: ''
};

const dom = {};
let toastTimer = null;

window.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDom();
  buildPalette();
  bindEvents();
  restoreAutosaveOrExample();
  renderApp();
  dom.printDate.textContent = new Intl.DateTimeFormat('de-DE').format(new Date());
}

function cacheDom() {
  Object.assign(dom, {
    blockList: document.getElementById('blockList'),
    diagram: document.getElementById('diagram'),
    diagramTitle: document.getElementById('diagramTitle'),
    elementCount: document.getElementById('elementCount'),
    selectionBar: document.getElementById('selectionBar'),
    selectionLabel: document.getElementById('selectionLabel'),
    guidanceText: document.getElementById('guidanceText'),
    cancelPlacementButton: document.getElementById('cancelPlacementButton'),
    fileInput: document.getElementById('fileInput'),
    helpDialog: document.getElementById('helpDialog'),
    exportDialog: document.getElementById('exportDialog'),
    validationDialog: document.getElementById('validationDialog'),
    validationResults: document.getElementById('validationResults'),
    exampleSelect: document.getElementById('exampleSelect'),
    toast: document.getElementById('toast'),
    printDate: document.getElementById('printDate'),
    stageScroll: document.getElementById('stageScroll')
  });
}

function bindEvents() {
  document.getElementById('newButton').addEventListener('click', createNewProject);
  document.getElementById('openButton').addEventListener('click', () => dom.fileInput.click());
  document.getElementById('saveButton').addEventListener('click', exportDiagramAsJson);
  document.getElementById('imageButton').addEventListener('click', openExportDialog);
  document.getElementById('printButton').addEventListener('click', printDiagram);
  document.getElementById('helpButton').addEventListener('click', () => dom.helpDialog.showModal());
  document.getElementById('validateButton').addEventListener('click', showValidation);
  document.getElementById('exportSvgButton').addEventListener('click', exportDiagramAsSvg);
  document.getElementById('exportPngButton').addEventListener('click', exportDiagramAsPng);
  document.getElementById('brandLink').addEventListener('click', event => {
    event.preventDefault();
    dom.stageScroll.scrollTo({ top: 0, behavior: 'smooth' });
  });

  dom.diagramTitle.addEventListener('change', updateDiagramTitle);
  dom.fileInput.addEventListener('change', importDiagramFromJson);
  dom.exampleSelect.addEventListener('change', loadSelectedExample);
  dom.cancelPlacementButton.addEventListener('click', clearPendingPlacement);

  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById(button.dataset.closeDialog).close();
    });
  });

  document.querySelectorAll('[data-selection-action]').forEach(button => {
    button.addEventListener('click', () => handleSelectionAction(button.dataset.selectionAction));
  });

  dom.stageScroll.addEventListener('click', event => {
    if (event.target === dom.stageScroll || event.target.classList.contains('paper') || event.target.classList.contains('diagram-wrap')) {
      clearSelection();
    }
  });

  document.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('beforeunload', event => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

// Palette

function buildPalette() {
  Object.entries(ELEMENT_TYPES).forEach(([type, definition]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'block-card';
    card.draggable = true;
    card.dataset.elementType = type;
    card.setAttribute('aria-pressed', 'false');

    const icon = document.createElement('span');
    icon.className = 'block-icon';
    icon.innerHTML = getElementIcon(definition.icon);

    const copy = document.createElement('span');
    copy.className = 'block-card-copy';
    const title = document.createElement('strong');
    title.textContent = definition.label;
    const summary = document.createElement('small');
    summary.textContent = definition.summary;
    copy.append(title, summary);

    const grip = document.createElement('span');
    grip.className = 'drag-grip';
    grip.textContent = '⠿';
    grip.setAttribute('aria-hidden', 'true');

    card.append(icon, copy, grip);
    card.addEventListener('click', () => selectPaletteType(type));
    card.addEventListener('dragstart', event => startPaletteDrag(event, type, card));
    card.addEventListener('dragend', finishPaletteDrag);
    dom.blockList.appendChild(card);
  });
}

function selectPaletteType(type) {
  state.pendingElementType = state.pendingElementType === type ? null : type;
  document.body.classList.toggle('placement-active', Boolean(state.pendingElementType));
  updatePaletteSelection();
  updateGuidance();
}

function clearPendingPlacement() {
  state.pendingElementType = null;
  state.draggingElementType = null;
  document.body.classList.remove('placement-active', 'drag-active');
  updatePaletteSelection();
  updateGuidance();
}

function updatePaletteSelection() {
  document.querySelectorAll('.block-card').forEach(card => {
    const selected = card.dataset.elementType === state.pendingElementType;
    card.classList.toggle('is-pending', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
}

function startPaletteDrag(event, type, card) {
  state.draggingElementType = type;
  card.classList.add('is-dragging');
  document.body.classList.add('drag-active');
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/x-struktogrammer-element', type);
  event.dataTransfer.setData('text/plain', type);
}

function finishPaletteDrag() {
  document.querySelectorAll('.block-card').forEach(card => card.classList.remove('is-dragging'));
  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));
  state.draggingElementType = null;
  document.body.classList.remove('drag-active');
}

// Rendering

function renderApp() {
  dom.diagramTitle.value = state.diagram.title;
  dom.elementCount.textContent = formatElementCount(countElements(state.diagram.elements));
  renderDiagram();
  renderSelectionBar();
  updatePaletteSelection();
  updateGuidance();
}

function renderDiagram() {
  dom.diagram.replaceChildren();

  const root = document.createElement('section');
  root.className = 'ns-root';

  const title = document.createElement('div');
  title.className = 'ns-title';
  title.textContent = state.diagram.title;
  root.append(title);
  root.append(renderList(state.diagram.elements, { kind: 'root' }, 'Noch keine Bausteine'));
  dom.diagram.append(root);

  requestAnimationFrame(focusActiveEditor);
}

function renderList(list, containerTarget, emptyText) {
  const holder = document.createElement('div');
  holder.className = 'ns-list';
  holder.append(createDropZone({ ...containerTarget, index: 0 }));

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-list';
    empty.textContent = emptyText;
    holder.append(empty);
  }

  list.forEach((element, index) => {
    holder.append(renderElement(element, index === list.length - 1));
    holder.append(createDropZone({ ...containerTarget, index: index + 1 }));
  });

  return holder;
}

function renderElement(element, isLast) {
  const node = document.createElement('div');
  node.className = `ns-element ns-type-${element.type}`;
  node.dataset.elementId = element.id;
  node.classList.toggle('selected', element.id === state.selectedElementId);
  node.classList.toggle('is-last', isLast);

  node.addEventListener('click', event => {
    if (event.target.closest('.inline-editor')) return;
    event.stopPropagation();
    selectElement(element.id);
  });

  if (element.type === 'if') {
    node.append(renderDecision(element));
  } else if (LOOP_TYPES.has(element.type)) {
    node.append(renderLoop(element));
  } else {
    node.append(renderSimpleElement(element));
  }

  return node;
}

function renderSimpleElement(element) {
  const block = document.createElement('div');
  block.className = 'ns-simple';

  const icon = document.createElement('span');
  icon.className = 'ns-block-icon';
  icon.innerHTML = getElementIcon(ELEMENT_TYPES[element.type].icon);

  block.append(icon, createEditableText(element));
  return block;
}

function renderLoop(element) {
  const loop = document.createElement('div');
  loop.className = 'ns-loop';

  const header = document.createElement('div');
  header.className = 'ns-loop-header';
  const icon = document.createElement('span');
  icon.className = 'ns-block-icon';
  icon.innerHTML = getElementIcon(ELEMENT_TYPES[element.type].icon);
  header.append(icon, createEditableText(element));

  const body = document.createElement('div');
  body.className = 'ns-loop-body';
  const rail = document.createElement('div');
  rail.className = 'ns-loop-rail';
  const content = document.createElement('div');
  content.className = 'ns-loop-content';
  content.append(renderList(
    element.children,
    { kind: 'children', ownerId: element.id },
    'Schleifenkörper ist noch leer'
  ));
  body.append(rail, content);
  loop.append(header, body);
  return loop;
}

function renderDecision(element) {
  const decision = document.createElement('div');
  decision.className = 'ns-decision';

  const header = document.createElement('div');
  header.className = 'ns-decision-head';
  const thenMarker = document.createElement('span');
  thenMarker.className = 'branch-marker then';
  thenMarker.textContent = 'J';
  const elseMarker = document.createElement('span');
  elseMarker.className = 'branch-marker else';
  elseMarker.textContent = 'N';
  header.append(thenMarker, createEditableText(element), elseMarker);

  const branches = document.createElement('div');
  branches.className = 'ns-branches';
  branches.append(
    renderBranch(element, 'thenBranch', 'Dann'),
    renderBranch(element, 'elseBranch', 'Sonst')
  );
  decision.append(header, branches);
  return decision;
}

function renderBranch(element, branchName, title) {
  const branch = document.createElement('div');
  branch.className = 'ns-branch';

  const caption = document.createElement('div');
  caption.className = 'branch-title';
  caption.textContent = title;
  branch.append(caption);
  branch.append(renderList(
    element[branchName],
    { kind: branchName, ownerId: element.id },
    `${title}-Zweig ist noch leer`
  ));
  return branch;
}

function createEditableText(element) {
  if (state.editingElementId === element.id) {
    const editor = document.createElement('textarea');
    editor.className = 'inline-editor';
    editor.value = element.text;
    editor.dataset.editorId = element.id;
    editor.setAttribute('aria-label', `${ELEMENT_TYPES[element.type].label} bearbeiten`);
    editor.addEventListener('click', event => event.stopPropagation());
    editor.addEventListener('dblclick', event => event.stopPropagation());
    editor.addEventListener('keydown', event => handleEditorKeydown(event, element.id));
    editor.addEventListener('blur', () => finishEditing(element.id, editor.value));
    return editor;
  }

  const text = document.createElement('span');
  text.className = 'ns-text';
  text.textContent = element.text;
  text.tabIndex = 0;
  text.setAttribute('role', 'button');
  text.title = 'Doppelklick zum Bearbeiten';
  text.addEventListener('dblclick', event => {
    event.stopPropagation();
    startEditing(element.id);
  });
  text.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      startEditing(element.id);
    }
  });
  return text;
}

function createDropZone(target) {
  const zone = document.createElement('div');
  zone.className = 'drop-zone';
  zone.dataset.target = JSON.stringify(target);
  zone.tabIndex = -1;
  zone.setAttribute('aria-label', 'Baustein hier einfügen');

  const label = document.createElement('span');
  label.textContent = 'Hier einfügen';
  zone.append(label);

  zone.addEventListener('dragenter', event => {
    event.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragover', event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  zone.addEventListener('dragleave', event => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    zone.classList.remove('drag-over');
    const type = event.dataTransfer.getData('application/x-struktogrammer-element') ||
      event.dataTransfer.getData('text/plain') ||
      state.draggingElementType;
    if (ALLOWED_TYPES.has(type)) insertElementAt(type, target);
    finishPaletteDrag();
  });
  zone.addEventListener('click', event => {
    event.stopPropagation();
    if (!state.pendingElementType) return;
    insertElementAt(state.pendingElementType, target);
    clearPendingPlacement();
  });

  return zone;
}

function renderSelectionBar() {
  const info = state.selectedElementId ? findElementById(state.diagram.elements, state.selectedElementId) : null;
  if (!info) {
    dom.selectionBar.hidden = true;
    return;
  }

  dom.selectionBar.hidden = false;
  dom.selectionLabel.textContent = `${ELEMENT_TYPES[info.element.type].shortLabel}: ${shorten(info.element.text, 46)}`;

  const upButton = document.querySelector('[data-selection-action="up"]');
  const downButton = document.querySelector('[data-selection-action="down"]');
  upButton.disabled = info.index === 0;
  downButton.disabled = info.index === info.list.length - 1;
}

function updateGuidance() {
  if (state.pendingElementType) {
    const definition = ELEMENT_TYPES[state.pendingElementType];
    dom.guidanceText.textContent = `${definition.label} gewählt: Tippe eine blaue Einfügestelle im Struktogramm an.`;
    dom.cancelPlacementButton.hidden = false;
    return;
  }

  const selected = state.selectedElementId
    ? findElementById(state.diagram.elements, state.selectedElementId)?.element
    : null;
  if (selected) {
    dom.guidanceText.textContent = ELEMENT_TYPES[selected.type].help;
  } else {
    dom.guidanceText.textContent = 'Ziehe einen Baustein aus der Palette an die gewünschte Stelle.';
  }
  dom.cancelPlacementButton.hidden = true;
}

// Diagram operations

function createEmptyDiagram() {
  return {
    format: PROJECT_FORMAT,
    version: 2,
    title: 'Neues Struktogramm',
    elements: []
  };
}

function createElement(type) {
  const definition = ELEMENT_TYPES[type];
  const element = {
    id: createId(),
    type,
    text: definition.defaultText
  };

  if (type === 'if') {
    element.thenBranch = [];
    element.elseBranch = [];
  }
  if (LOOP_TYPES.has(type)) {
    element.children = [];
  }
  return element;
}

function insertElementAt(type, target) {
  const list = resolveTargetList(target);
  if (!list) {
    showToast('Diese Einfügestelle ist nicht mehr verfügbar.');
    return;
  }

  const element = createElement(type);
  const index = clamp(Number(target.index), 0, list.length);
  list.splice(index, 0, element);
  state.selectedElementId = element.id;
  state.editingElementId = null;
  markDiagramChanged(`${ELEMENT_TYPES[type].shortLabel} eingefügt.`);
}

function selectElement(id) {
  state.selectedElementId = id;
  state.editingElementId = null;
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function clearSelection() {
  if (!state.selectedElementId && !state.editingElementId) return;
  state.selectedElementId = null;
  state.editingElementId = null;
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function startEditing(id) {
  state.selectedElementId = id;
  state.editingElementId = id;
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function finishEditing(id, value, cancel = false) {
  if (state.editingElementId !== id) return;
  const info = findElementById(state.diagram.elements, id);
  if (!info) return;

  if (cancel) {
    state.editingElementId = null;
    renderDiagram();
    return;
  }

  const cleanText = String(value).trim();
  if (!cleanText) {
    showToast('Der Text darf nicht leer sein.');
    state.editingElementId = null;
    renderDiagram();
    return;
  }

  state.editingElementId = null;
  if (cleanText === info.element.text) {
    renderDiagram();
    return;
  }

  info.element.text = cleanText;
  markDiagramChanged('Text aktualisiert.');
}

function handleEditorKeydown(event, id) {
  if (event.key === 'Escape') {
    event.preventDefault();
    finishEditing(id, '', true);
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    finishEditing(id, event.currentTarget.value);
  }
}

function focusActiveEditor() {
  const editor = document.querySelector('.inline-editor');
  if (!editor) return;
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
}

function handleSelectionAction(action) {
  if (!state.selectedElementId) return;
  if (action === 'edit') startEditing(state.selectedElementId);
  if (action === 'duplicate') duplicateSelectedElement();
  if (action === 'delete') removeElementById(state.selectedElementId);
  if (action === 'up') moveSelectedElement(-1);
  if (action === 'down') moveSelectedElement(1);
}

function duplicateSelectedElement() {
  const info = findElementById(state.diagram.elements, state.selectedElementId);
  if (!info) return;

  const copy = deepCloneElement(info.element);
  info.list.splice(info.index + 1, 0, copy);
  state.selectedElementId = copy.id;
  state.editingElementId = null;
  markDiagramChanged('Baustein dupliziert.');
}

function removeElementById(id) {
  const info = findElementById(state.diagram.elements, id);
  if (!info) return;
  info.list.splice(info.index, 1);
  state.selectedElementId = null;
  state.editingElementId = null;
  markDiagramChanged('Baustein gelöscht.');
}

function moveSelectedElement(direction) {
  const info = findElementById(state.diagram.elements, state.selectedElementId);
  if (!info) return;
  const newIndex = info.index + direction;
  if (newIndex < 0 || newIndex >= info.list.length) return;

  const [element] = info.list.splice(info.index, 1);
  info.list.splice(newIndex, 0, element);
  markDiagramChanged(direction < 0 ? 'Baustein nach oben verschoben.' : 'Baustein nach unten verschoben.');
}

function findElementById(list, id, container = { kind: 'root' }) {
  for (let index = 0; index < list.length; index += 1) {
    const element = list[index];
    if (element.id === id) {
      return { element, list, index, container };
    }

    if (element.type === 'if') {
      const inThen = findElementById(element.thenBranch, id, { kind: 'thenBranch', ownerId: element.id });
      if (inThen) return inThen;
      const inElse = findElementById(element.elseBranch, id, { kind: 'elseBranch', ownerId: element.id });
      if (inElse) return inElse;
    }

    if (LOOP_TYPES.has(element.type)) {
      const inChildren = findElementById(element.children, id, { kind: 'children', ownerId: element.id });
      if (inChildren) return inChildren;
    }
  }
  return null;
}

function resolveTargetList(target) {
  if (!target || target.kind === 'root') return state.diagram.elements;
  const owner = findElementById(state.diagram.elements, target.ownerId)?.element;
  if (!owner) return null;
  if (target.kind === 'children' && LOOP_TYPES.has(owner.type)) return owner.children;
  if (target.kind === 'thenBranch' && owner.type === 'if') return owner.thenBranch;
  if (target.kind === 'elseBranch' && owner.type === 'if') return owner.elseBranch;
  return null;
}

function updateDiagramTitle() {
  const title = dom.diagramTitle.value.trim();
  if (!title) {
    dom.diagramTitle.value = state.diagram.title;
    showToast('Der Titel darf nicht leer sein.');
    return;
  }
  if (title === state.diagram.title) return;
  state.diagram.title = title;
  markDiagramChanged('Titel aktualisiert.');
}

function markDiagramChanged(message = '') {
  autoSave();
  state.dirty = JSON.stringify(state.diagram) !== state.savedSnapshot;
  renderApp();
  if (message) showToast(message);
}

function autoSave() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.diagram));
  } catch (error) {
    console.warn('Automatische Speicherung nicht verfügbar.', error);
  }
}

// Project files and examples

function createNewProject() {
  if (state.dirty && !window.confirm('Neues Struktogramm erstellen? Nicht als Datei gespeicherte Änderungen gehen verloren.')) {
    return;
  }
  setDiagram(createEmptyDiagram(), false);
  showToast('Neues Struktogramm erstellt.');
}

function restoreAutosaveOrExample() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const restored = normalizeDiagram(JSON.parse(raw));
      setDiagram(restored, false, false);
      showToast('Zuletzt bearbeitetes Struktogramm wiederhergestellt.');
      return;
    } catch (error) {
      console.warn('Zwischenspeicher konnte nicht gelesen werden.', error);
    }
  }
  setDiagram(createExampleDiagram('factorial'), false, false);
}

function loadSelectedExample() {
  const name = dom.exampleSelect.value;
  dom.exampleSelect.value = '';
  if (!name) return;
  if (state.dirty && !window.confirm('Beispiel laden? Nicht als Datei gespeicherte Änderungen gehen verloren.')) {
    return;
  }
  setDiagram(createExampleDiagram(name), true);
  showToast('Beispiel geladen.');
}

function setDiagram(diagram, dirty, saveToLocalStorage = true) {
  state.diagram = diagram;
  state.selectedElementId = null;
  state.editingElementId = null;
  state.pendingElementType = null;
  state.draggingElementType = null;
  document.body.classList.remove('placement-active', 'drag-active');
  state.savedSnapshot = dirty ? '' : JSON.stringify(diagram);
  state.dirty = dirty;
  if (saveToLocalStorage) autoSave();
  renderApp();
}

function exportDiagramAsJson() {
  const json = JSON.stringify(state.diagram, null, 2);
  downloadBlob(json, `${safeFileName(state.diagram.title)}.json`, 'application/json');
  state.savedSnapshot = JSON.stringify(state.diagram);
  state.dirty = false;
  autoSave();
  showToast('Projekt als JSON-Datei gespeichert.');
}

function importDiagramFromJson(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (state.dirty && !window.confirm('Projekt öffnen? Nicht als Datei gespeicherte Änderungen gehen verloren.')) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const imported = normalizeDiagram(parsed);
      setDiagram(imported, false);
      showToast('Projekt erfolgreich geöffnet.');
    } catch (error) {
      console.error(error);
      showToast('Die Datei ist kein gültiges Struktogrammer-Projekt.');
    }
  };
  reader.onerror = () => showToast('Die Datei konnte nicht gelesen werden.');
  reader.readAsText(file, 'utf-8');
}

function normalizeDiagram(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Projektwurzel fehlt.');
  }
  if (!Array.isArray(raw.elements)) {
    throw new Error('Elementliste fehlt.');
  }

  const seenIds = new Set();
  return {
    format: PROJECT_FORMAT,
    version: 2,
    title: cleanRequiredText(raw.title || 'Unbenanntes Struktogramm', 120),
    elements: raw.elements.map(element => normalizeElement(element, 0, seenIds))
  };
}

function normalizeElement(raw, depth, seenIds) {
  if (depth > 24 || !raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Ungültige oder zu tiefe Verschachtelung.');
  }

  const mappedType = LEGACY_TYPE_MAP[raw.type] || raw.type;
  if (!ALLOWED_TYPES.has(mappedType)) {
    throw new Error(`Unbekannter Bausteintyp: ${raw.type}`);
  }

  let id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : createId();
  if (seenIds.has(id)) id = createId();
  seenIds.add(id);

  const element = {
    id,
    type: mappedType,
    text: cleanRequiredText(raw.text || ELEMENT_TYPES[mappedType].defaultText, 1000)
  };

  if (mappedType === 'if') {
    const thenBranch = Array.isArray(raw.thenBranch) ? raw.thenBranch : [];
    const elseBranch = Array.isArray(raw.elseBranch) ? raw.elseBranch : [];
    element.thenBranch = thenBranch.map(child => normalizeElement(child, depth + 1, seenIds));
    element.elseBranch = elseBranch.map(child => normalizeElement(child, depth + 1, seenIds));
  }

  if (LOOP_TYPES.has(mappedType)) {
    const children = Array.isArray(raw.children)
      ? raw.children
      : (Array.isArray(raw.body) ? raw.body : []);
    element.children = children.map(child => normalizeElement(child, depth + 1, seenIds));
  }

  return element;
}

function createExampleDiagram(name) {
  if (name === 'maximum') return createMaximumExample();
  if (name === 'counting') return createCountingExample();
  return createFactorialExample();
}

function createFactorialExample() {
  const input = createElement('input');
  input.text = 'Einlesen: zahl als Ganzzahl';

  const initialize = createElement('sequence');
  initialize.text = 'Deklaration und Initialisierung: fakultaet als Ganzzahl = 1';

  const loop = createElement('while');
  loop.text = 'Wiederhole solange zahl > 1';
  const multiply = createElement('sequence');
  multiply.text = 'Zuweisung: fakultaet = fakultaet * zahl';
  const decrement = createElement('sequence');
  decrement.text = 'Zuweisung: zahl = zahl - 1';
  loop.children = [multiply, decrement];

  const output = createElement('output');
  output.text = 'Ausgabe: "Die Fakultät beträgt " + fakultaet';

  return {
    format: PROJECT_FORMAT,
    version: 2,
    title: 'Fakultät berechnen',
    elements: [input, initialize, loop, output]
  };
}

function createMaximumExample() {
  const inputA = createElement('input');
  inputA.text = 'Einlesen: a als Ganzzahl';
  const inputB = createElement('input');
  inputB.text = 'Einlesen: b als Ganzzahl';

  const decision = createElement('if');
  decision.text = 'Wenn a > b';
  const outputA = createElement('output');
  outputA.text = 'Ausgabe: a';
  const outputB = createElement('output');
  outputB.text = 'Ausgabe: b';
  decision.thenBranch = [outputA];
  decision.elseBranch = [outputB];

  return {
    format: PROJECT_FORMAT,
    version: 2,
    title: 'Maximum zweier Zahlen',
    elements: [inputA, inputB, decision]
  };
}

function createCountingExample() {
  const loop = createElement('for');
  loop.text = 'Zähle i von 1 bis 10, Schrittweite 1';
  const output = createElement('output');
  output.text = 'Ausgabe: i';
  loop.children = [output];

  return {
    format: PROJECT_FORMAT,
    version: 2,
    title: 'Zahlen von 1 bis 10 ausgeben',
    elements: [loop]
  };
}

// Validation

function showValidation() {
  const results = validateDiagram(state.diagram);
  dom.validationResults.replaceChildren();

  results.forEach(result => {
    const item = document.createElement('div');
    item.className = `validation-item ${result.level}`;
    const text = document.createElement('span');
    text.textContent = result.text;
    item.append(text);
    dom.validationResults.append(item);
  });

  dom.validationDialog.showModal();
}

function validateDiagram(diagram) {
  const results = [];
  const elements = flattenElements(diagram.elements);

  if (elements.length === 0) {
    return [{ level: 'warning', text: 'Das Struktogramm ist leer.' }];
  }

  const emptyTexts = elements.filter(element => !String(element.text).trim());
  if (emptyTexts.length) {
    results.push({ level: 'warning', text: `${emptyTexts.length} Baustein(e) haben keinen Text.` });
  }

  elements.filter(element => element.type === 'if').forEach(element => {
    if (element.thenBranch.length === 0) {
      results.push({ level: 'warning', text: `Der Dann-Zweig von „${shorten(element.text, 44)}“ ist leer.` });
    }
    if (!containsComparisonOperator(element.text)) {
      results.push({ level: 'warning', text: `Die Entscheidung „${shorten(element.text, 44)}“ enthält möglicherweise keinen Vergleichsoperator.` });
    }
  });

  elements.filter(element => LOOP_TYPES.has(element.type)).forEach(element => {
    if (element.children.length === 0) {
      results.push({ level: 'warning', text: `Die Schleife „${shorten(element.text, 44)}“ hat keinen Inhalt.` });
    }
    if (element.type === 'while' && !containsComparisonOperator(element.text)) {
      results.push({ level: 'warning', text: `Die Bedingung „${shorten(element.text, 44)}“ enthält möglicherweise keinen Vergleichsoperator.` });
    }
  });

  const hasInput = elements.some(element => element.type === 'input');
  const hasOutput = elements.some(element => element.type === 'output' || element.type === 'subroutine' && /^Rückgabe:/i.test(element.text));
  if (hasInput && !hasOutput) {
    results.push({ level: 'warning', text: 'Es gibt Eingaben, aber noch keine Ausgabe oder Rückgabe.' });
  }

  if (results.length === 0) {
    results.push({ level: 'ok', text: 'Die Grundprüfung hat keine auffälligen Stellen gefunden.' });
  } else {
    results.unshift({ level: 'ok', text: `${elements.length} Baustein(e) wurden geprüft. Die Hinweise sind didaktische Hilfen, keine automatische Bewertung.` });
  }
  return results;
}

function containsComparisonOperator(text) {
  return /(==|!=|<=|>=|<|>)/.test(String(text));
}

// SVG, PNG and print export

function openExportDialog() {
  state.editingElementId = null;
  renderDiagram();
  dom.exportDialog.showModal();
}

function exportDiagramAsSvg() {
  try {
    const { svg } = createExportSvg();
    downloadBlob(svg, `${safeFileName(state.diagram.title)}.svg`, 'image/svg+xml');
    dom.exportDialog.close();
    showToast('SVG-Datei erstellt.');
  } catch (error) {
    console.error(error);
    showToast('SVG-Export konnte nicht erstellt werden.');
  }
}

function exportDiagramAsPng() {
  try {
    const { svg, width, height } = createExportSvg();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      try {
        canvas.toBlob(pngBlob => {
          URL.revokeObjectURL(url);
          if (!pngBlob) {
            showToast('PNG-Export fehlgeschlagen. SVG steht weiterhin zur Verfügung.');
            return;
          }
          downloadBlob(pngBlob, `${safeFileName(state.diagram.title)}.png`, 'image/png');
          dom.exportDialog.close();
          showToast('PNG-Datei erstellt.');
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        console.error(error);
        showToast('PNG-Export fehlgeschlagen. SVG steht weiterhin zur Verfügung.');
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('PNG-Export fehlgeschlagen. SVG steht weiterhin zur Verfügung.');
    };
    image.src = url;
  } catch (error) {
    console.error(error);
    showToast('PNG-Export konnte nicht erstellt werden.');
  }
}

function createExportSvg() {
  const width = 1000;
  const outerX = 2;
  const outerWidth = width - 4;
  const titleLines = wrapSvgText(state.diagram.title, Math.floor((outerWidth - 32) / 9));
  const titleHeight = Math.max(64, titleLines.length * 22 + 24);
  const listLayout = layoutSvgList(state.diagram.elements, outerX, titleHeight + 2, outerWidth);
  const height = Math.max(130, Math.ceil(titleHeight + listLayout.height + 4));

  const titleText = renderSvgText(titleLines, outerX + 16, 27, {
    size: 18,
    lineHeight: 22,
    weight: 700
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <rect x="${outerX}" y="2" width="${outerWidth}" height="${height - 4}" fill="#ffffff" stroke="#182230" stroke-width="2"/>
  <rect x="${outerX}" y="2" width="${outerWidth}" height="${titleHeight}" fill="#f0f3f7"/>
  <line x1="${outerX}" y1="${titleHeight + 2}" x2="${outerX + outerWidth}" y2="${titleHeight + 2}" stroke="#182230" stroke-width="2"/>
  ${titleText}
  ${listLayout.markup}
</svg>`;

  return { svg, width, height };
}

function layoutSvgList(elements, x, y, width) {
  if (elements.length === 0) {
    return {
      height: 62,
      markup: `<rect x="${x}" y="${y}" width="${width}" height="62" fill="#ffffff" stroke="#182230" stroke-width="2"/>`
    };
  }

  let currentY = y;
  const markup = [];
  elements.forEach(element => {
    const layout = layoutSvgElement(element, x, currentY, width);
    markup.push(layout.markup);
    currentY += layout.height;
  });
  return { height: currentY - y, markup: markup.join('') };
}

function layoutSvgElement(element, x, y, width) {
  if (element.type === 'if') return layoutSvgDecision(element, x, y, width);
  if (LOOP_TYPES.has(element.type)) return layoutSvgLoop(element, x, y, width);
  return layoutSvgSimple(element, x, y, width);
}

function layoutSvgSimple(element, x, y, width) {
  const lines = wrapSvgText(element.text, Math.max(12, Math.floor((width - 32) / 8.4)));
  const height = Math.max(58, lines.length * 21 + 24);
  const fill = element.type === 'input'
    ? '#f7faff'
    : (element.type === 'output' ? '#f6fbf8' : '#ffffff');
  const text = renderSvgText(lines, x + 16, y + 28, {
    size: 16,
    lineHeight: 21,
    weight: 400
  });
  const sideLines = element.type === 'subroutine'
    ? `<line x1="${x + 11}" y1="${y}" x2="${x + 11}" y2="${y + height}" stroke="#182230" stroke-width="2"/>
       <line x1="${x + width - 11}" y1="${y}" x2="${x + width - 11}" y2="${y + height}" stroke="#182230" stroke-width="2"/>`
    : '';

  return {
    height,
    markup: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="#182230" stroke-width="2"/>
      ${sideLines}
      ${text}
    </g>`
  };
}

function layoutSvgLoop(element, x, y, width) {
  const headerLines = wrapSvgText(element.text, Math.max(12, Math.floor((width - 32) / 8.4)));
  const headerHeight = Math.max(58, headerLines.length * 21 + 24);
  const railWidth = Math.min(46, Math.max(30, width * 0.07));
  const childLayout = layoutSvgList(element.children, x + railWidth, y + headerHeight, width - railWidth);
  const bodyHeight = Math.max(78, childLayout.height);
  const totalHeight = headerHeight + bodyHeight;
  const headerText = renderSvgText(headerLines, x + 16, y + 28, {
    size: 16,
    lineHeight: 21,
    weight: 700
  });

  return {
    height: totalHeight,
    markup: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${totalHeight}" fill="#ffffff" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#eef2f6"/>
      <line x1="${x}" y1="${y + headerHeight}" x2="${x + width}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y + headerHeight}" width="${railWidth}" height="${bodyHeight}" fill="#f4f6f8"/>
      <line x1="${x + railWidth}" y1="${y + headerHeight}" x2="${x + railWidth}" y2="${y + totalHeight}" stroke="#182230" stroke-width="2"/>
      ${headerText}
      ${childLayout.markup}
    </g>`
  };
}

function layoutSvgDecision(element, x, y, width) {
  const headerLines = wrapSvgText(element.text, Math.max(12, Math.floor((width - 140) / 8.4)));
  const headerHeight = Math.max(92, headerLines.length * 21 + 48);
  const captionHeight = 26;
  const branchWidth = width / 2;
  const branchY = y + headerHeight + captionHeight;
  const thenLayout = layoutSvgList(element.thenBranch, x, branchY, branchWidth);
  const elseLayout = layoutSvgList(element.elseBranch, x + branchWidth, branchY, branchWidth);
  const branchContentHeight = Math.max(62, thenLayout.height, elseLayout.height);
  const totalHeight = headerHeight + captionHeight + branchContentHeight;
  const centerX = x + branchWidth;
  const headerText = renderSvgText(headerLines, centerX, y + 28, {
    anchor: 'middle',
    size: 16,
    lineHeight: 21,
    weight: 700
  });

  return {
    height: totalHeight,
    markup: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${totalHeight}" fill="#ffffff" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#eef2f6"/>
      <line x1="${x}" y1="${y + headerHeight}" x2="${x + width}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <line x1="${x}" y1="${y + headerHeight - 30}" x2="${centerX}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <line x1="${x + width}" y1="${y + headerHeight - 30}" x2="${centerX}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <text x="${x + 12}" y="${y + headerHeight - 8}" font-family="Arial, Segoe UI, sans-serif" font-size="12" font-weight="700" fill="#344054">J</text>
      <text x="${x + width - 12}" y="${y + headerHeight - 8}" text-anchor="end" font-family="Arial, Segoe UI, sans-serif" font-size="12" font-weight="700" fill="#344054">N</text>
      <rect x="${x}" y="${y + headerHeight}" width="${width}" height="${captionHeight}" fill="#fafbfc"/>
      <line x1="${x}" y1="${branchY}" x2="${x + width}" y2="${branchY}" stroke="#aeb7c4" stroke-width="1"/>
      <line x1="${centerX}" y1="${y + headerHeight}" x2="${centerX}" y2="${y + totalHeight}" stroke="#182230" stroke-width="2"/>
      <text x="${x + branchWidth / 2}" y="${y + headerHeight + 18}" text-anchor="middle" font-family="Arial, Segoe UI, sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#5f6b7c">DANN</text>
      <text x="${x + branchWidth + branchWidth / 2}" y="${y + headerHeight + 18}" text-anchor="middle" font-family="Arial, Segoe UI, sans-serif" font-size="11" font-weight="700" letter-spacing="1" fill="#5f6b7c">SONST</text>
      ${headerText}
      ${thenLayout.markup}
      ${elseLayout.markup}
    </g>`
  };
}

function renderSvgText(lines, x, y, options = {}) {
  const anchor = options.anchor || 'start';
  const size = options.size || 16;
  const lineHeight = options.lineHeight || 21;
  const weight = options.weight || 400;
  const spans = lines.map((line, index) =>
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" fill="#121926">${spans}</text>`;
}

function wrapSvgText(value, maxCharacters) {
  const sourceLines = String(value).split(/\r?\n/);
  const result = [];

  sourceLines.forEach(sourceLine => {
    const words = sourceLine.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      result.push('');
      return;
    }

    let line = '';
    words.forEach(word => {
      if (word.length > maxCharacters) {
        if (line) {
          result.push(line);
          line = '';
        }
        for (let index = 0; index < word.length; index += maxCharacters) {
          result.push(word.slice(index, index + maxCharacters));
        }
        return;
      }

      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxCharacters && line) {
        result.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) result.push(line);
  });

  return result.length ? result : [''];
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function printDiagram() {
  state.editingElementId = null;
  renderDiagram();
  dom.printDate.textContent = new Intl.DateTimeFormat('de-DE').format(new Date());
  window.print();
}

// Helpers

function handleGlobalKeydown(event) {
  const activeTag = document.activeElement?.tagName;
  const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

  if (event.key === 'Escape') {
    if (state.editingElementId) {
      event.preventDefault();
      finishEditing(state.editingElementId, '', true);
      return;
    }
    if (state.pendingElementType) {
      clearPendingPlacement();
      return;
    }
    if (state.selectedElementId) clearSelection();
  }

  if (!isTyping && event.key === 'Delete' && state.selectedElementId) {
    event.preventDefault();
    removeElementById(state.selectedElementId);
  }
}

function flattenElements(list) {
  const result = [];
  list.forEach(element => {
    result.push(element);
    if (element.type === 'if') {
      result.push(...flattenElements(element.thenBranch));
      result.push(...flattenElements(element.elseBranch));
    }
    if (LOOP_TYPES.has(element.type)) {
      result.push(...flattenElements(element.children));
    }
  });
  return result;
}

function countElements(list) {
  return flattenElements(list).length;
}

function formatElementCount(count) {
  return `${count} ${count === 1 ? 'Baustein' : 'Bausteine'}`;
}

function deepCloneElement(element) {
  const copy = JSON.parse(JSON.stringify(element));
  assignNewIds(copy);
  return copy;
}

function assignNewIds(element) {
  element.id = createId();
  if (element.type === 'if') {
    element.thenBranch.forEach(assignNewIds);
    element.elseBranch.forEach(assignNewIds);
  }
  if (LOOP_TYPES.has(element.type)) {
    element.children.forEach(assignNewIds);
  }
}

function cleanRequiredText(value, maxLength) {
  const text = String(value).trim().slice(0, maxLength);
  if (!text) throw new Error('Pflichttext fehlt.');
  return text;
}

function downloadBlob(content, fileName, mimeType) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(value) {
  return String(value || 'struktogramm')
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'struktogramm';
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => dom.toast.classList.remove('visible'), 2600);
}

function shorten(value, maxLength) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function createId() {
  if (window.crypto?.randomUUID) return `el_${window.crypto.randomUUID()}`;
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : max));
}

function getElementIcon(name) {
  const icons = {
    sequence: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="5" width="20" height="18"></rect><path d="M8 10h12M8 14h8M8 18h10"></path></svg>',
    input: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 14h15M14 9l5 5-5 5"></path><path d="M21 5h3v18h-3"></path></svg>',
    output: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M24 14H9M14 9l-5 5 5 5"></path><path d="M7 5H4v18h3"></path></svg>',
    decision: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="m14 4 10 10-10 10L4 14z"></path><path d="M9 14h10"></path></svg>',
    while: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M21.5 10A8.5 8.5 0 1 0 22 17"></path><path d="M17 6h5v5"></path></svg>',
    for: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 7h16M6 14h16M6 21h16"></path><path d="M9 4v6M16 11v6M21 18v6"></path></svg>',
    subroutine: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="5" y="5" width="18" height="18"></rect><path d="M9 5v18M19 5v18"></path></svg>'
  };
  return icons[name] || icons.sequence;
}
