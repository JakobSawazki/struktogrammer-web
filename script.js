'use strict';

// App state and element templates

const STORAGE_KEY = 'struktogrammer-web-project-v2';
const PROJECT_FORMAT = 'struktogrammer-web';
const LOOP_TYPES = new Set(['while', 'for']);
const ALLOWED_TYPES = new Set([
  'sequence',
  'declarationInitialization',
  'declarationInput',
  'input',
  'output',
  'if',
  'switch',
  'while',
  'for',
  'subroutine'
]);

const ELEMENT_TYPES = {
  sequence: {
    label: 'Anweisung / Zuweisung',
    shortLabel: 'Anweisung',
    summary: 'Wert berechnen oder zuweisen',
    defaultText: 'Zuweisung: variable = wert',
    help: 'Eine Sequenz ist eine einfache Anweisung, die der Reihe nach ausgeführt wird.',
    icon: 'sequence'
  },
  declarationInitialization: {
    label: 'Deklaration + Initialisierung',
    shortLabel: 'Deklaration',
    summary: 'Variable anlegen und Startwert setzen',
    defaultText: 'Deklaration und Initialisierung: variable als Datentyp = wert',
    help: 'Eine Variable wird mit Datentyp deklariert und erhält direkt einen Anfangswert.',
    icon: 'declarationInitialization'
  },
  declarationInput: {
    label: 'Deklaration + Einlesen',
    shortLabel: 'Deklaration und Einlesen',
    summary: 'Variable anlegen und Wert einlesen',
    defaultText: 'Deklaration und Einlesen: variable als Datentyp',
    help: 'Eine Variable wird deklariert und ihr Wert anschließend eingelesen.',
    icon: 'declarationInput'
  },
  input: {
    label: 'Einlesen',
    shortLabel: 'Einlesen',
    summary: 'Wert in vorhandene Variable einlesen',
    defaultText: 'Einlesen: variable',
    help: 'Eine Eingabe liest einen Wert ein, zum Beispiel über input() im Python-Unterricht.',
    icon: 'input'
  },
  output: {
    label: 'Ausgabe',
    shortLabel: 'Ausgabe',
    summary: 'Text oder Werte ausgeben',
    defaultText: 'Ausgabe: inhalt',
    help: 'Eine Ausgabe entspricht im Python-Unterricht häufig einem print()-Befehl.',
    icon: 'output'
  },
  if: {
    label: 'Verzweigung / IF-ELSE',
    shortLabel: 'Verzweigung',
    summary: 'Bedingung mit Dann- und Sonst-Zweig',
    defaultText: 'Wenn bedingung',
    help: 'Eine Entscheidung führt abhängig von einer Bedingung den Dann- oder den Sonst-Zweig aus.',
    icon: 'decision'
  },
  switch: {
    label: 'Mehrfachverzweigung',
    shortLabel: 'Mehrfachverzweigung',
    summary: 'Mehrere Fälle einer Auswahl darstellen',
    defaultText: 'Fallunterscheidung nach ausdruck',
    help: 'Eine Mehrfachverzweigung wählt abhängig von einem Ausdruck genau einen von mehreren Fällen aus.',
    icon: 'switch'
  },
  while: {
    label: 'Wiederholung solange',
    shortLabel: 'While-Schleife',
    summary: 'Kopfgesteuerte Schleife',
    defaultText: 'Wiederhole solange bedingung',
    help: 'Diese Schleife prüft zuerst die Bedingung. Nur wenn sie wahr ist, wird der Schleifenkörper ausgeführt.',
    icon: 'while'
  },
  for: {
    label: 'Zählschleife / FOR',
    shortLabel: 'Zählschleife',
    summary: 'Wiederholung mit Zählvariable',
    defaultText: 'Zähle i von startwert bis endwert, Schrittweite schrittweite',
    help: 'Diese Schleife eignet sich, wenn die Anzahl der Wiederholungen über eine Zählvariable gesteuert wird.',
    icon: 'for'
  },
  subroutine: {
    label: 'Subroutine / Funktion',
    shortLabel: 'Subroutine',
    summary: 'Funktion aufrufen oder Wert zurückgeben',
    defaultText: 'Aufruf: funktion()',
    help: 'Eine Subroutine ist ein Unterprogramm. In Python entspricht dies häufig einem Funktionsaufruf.',
    icon: 'subroutine'
  }
};

const LEGACY_TYPE_MAP = {
  assignment: 'sequence',
  declaration: 'sequence',
  initialization: 'sequence',
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
  editingBranchKey: null,
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
  buildOperatorHelp();
  bindEvents();
  setDiagram(createEmptyDiagram(), false, false);
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
    operatorHelpList: document.getElementById('operatorHelpList'),
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
    grip.innerHTML = '<svg viewBox="0 0 12 20" aria-hidden="true"><circle cx="3" cy="4" r="1"/><circle cx="9" cy="4" r="1"/><circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/><circle cx="3" cy="16" r="1"/><circle cx="9" cy="16" r="1"/></svg>';
    grip.setAttribute('aria-hidden', 'true');

    card.append(icon, copy, grip);
    card.addEventListener('click', () => selectPaletteType(type));
    card.addEventListener('dragstart', event => startPaletteDrag(event, type, card));
    card.addEventListener('dragend', finishPaletteDrag);
    dom.blockList.appendChild(card);
  });
}

function buildOperatorHelp() {
  Object.values(ELEMENT_TYPES).forEach(definition => {
    const item = document.createElement('div');
    item.className = 'operator-help-item';
    const title = document.createElement('strong');
    title.textContent = definition.label;
    const text = document.createElement('span');
    text.textContent = definition.help;
    item.append(title, text);
    dom.operatorHelpList.append(item);
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
    if (event.target.closest('.inline-editor, .branch-label-editor')) return;
    event.stopPropagation();
    selectElement(element.id);
  });

  if (element.type === 'if') {
    node.append(renderDecision(element));
  } else if (element.type === 'switch') {
    node.append(renderMultipleDecision(element));
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
  block.append(createEditableText(element));
  return block;
}

function renderLoop(element) {
  const loop = document.createElement('div');
  loop.className = 'ns-loop';

  const header = document.createElement('div');
  header.className = 'ns-loop-header';
  header.append(createEditableText(element));

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

function renderMultipleDecision(element) {
  const decision = document.createElement('div');
  decision.className = 'ns-switch';

  const header = document.createElement('div');
  header.className = 'ns-switch-head';
  header.append(createEditableText(element));

  const branches = document.createElement('div');
  branches.className = 'ns-switch-branches';
  branches.style.setProperty('--branch-count', element.branches.length);
  element.branches.forEach(branch => {
    branches.append(renderSwitchBranch(element, branch));
  });

  decision.append(header, branches);
  return decision;
}

function renderSwitchBranch(element, branch) {
  const branchNode = document.createElement('div');
  branchNode.className = 'ns-switch-branch';
  branchNode.append(createEditableBranchLabel(element, branch));
  branchNode.append(renderList(
    branch.children,
    { kind: 'switchBranch', ownerId: element.id, branchId: branch.id },
    'Fall ist noch leer'
  ));
  return branchNode;
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

function createEditableBranchLabel(element, branch) {
  const key = createBranchKey(element.id, branch.id);
  if (state.editingBranchKey === key) {
    const editor = document.createElement('input');
    editor.className = 'branch-label-editor';
    editor.value = branch.label;
    editor.maxLength = 80;
    editor.setAttribute('aria-label', 'Fallbezeichnung bearbeiten');
    editor.addEventListener('click', event => event.stopPropagation());
    editor.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finishBranchEditing(element.id, branch.id, '', true);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        finishBranchEditing(element.id, branch.id, editor.value);
      }
    });
    editor.addEventListener('blur', () => finishBranchEditing(element.id, branch.id, editor.value));
    return editor;
  }

  const label = document.createElement('div');
  label.className = 'ns-switch-label';
  label.textContent = branch.label;
  label.tabIndex = 0;
  label.title = 'Doppelklick zum Bearbeiten';
  label.addEventListener('click', event => {
    event.stopPropagation();
    selectElement(element.id);
  });
  label.addEventListener('dblclick', event => {
    event.stopPropagation();
    startBranchEditing(element.id, branch.id);
  });
  label.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      startBranchEditing(element.id, branch.id);
    }
  });
  return label;
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
  const addCaseButton = document.querySelector('[data-selection-action="add-case"]');
  const removeCaseButton = document.querySelector('[data-selection-action="remove-case"]');
  upButton.disabled = info.index === 0;
  downButton.disabled = info.index === info.list.length - 1;
  addCaseButton.hidden = info.element.type !== 'switch';
  removeCaseButton.hidden = info.element.type !== 'switch';
  removeCaseButton.disabled = info.element.type !== 'switch' || info.element.branches.length <= 2;
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
    dom.guidanceText.textContent = 'Baustein ausgewählt: Bearbeiten, duplizieren, verschieben oder löschen.';
  } else {
    dom.guidanceText.textContent = 'Ziehe einen Baustein aus der Palette an die gewünschte Stelle.';
  }
  dom.cancelPlacementButton.hidden = true;
}

// Diagram operations

function createEmptyDiagram() {
  return {
    format: PROJECT_FORMAT,
    version: 3,
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
  if (type === 'switch') {
    element.branches = [
      createSwitchBranch('Fall 1'),
      createSwitchBranch('Fall 2'),
      createSwitchBranch('Sonst')
    ];
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
  state.editingBranchKey = null;
  markDiagramChanged(`${ELEMENT_TYPES[type].shortLabel} eingefügt.`);
}

function selectElement(id) {
  state.selectedElementId = id;
  state.editingElementId = null;
  state.editingBranchKey = null;
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function clearSelection() {
  if (!state.selectedElementId && !state.editingElementId && !state.editingBranchKey) return;
  state.selectedElementId = null;
  state.editingElementId = null;
  state.editingBranchKey = null;
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function startEditing(id) {
  state.selectedElementId = id;
  state.editingElementId = id;
  state.editingBranchKey = null;
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
  const editor = document.querySelector('.inline-editor, .branch-label-editor');
  if (!editor) return;
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
}

function startBranchEditing(elementId, branchId) {
  state.selectedElementId = elementId;
  state.editingElementId = null;
  state.editingBranchKey = createBranchKey(elementId, branchId);
  renderDiagram();
  renderSelectionBar();
  updateGuidance();
}

function finishBranchEditing(elementId, branchId, value, cancel = false) {
  const key = createBranchKey(elementId, branchId);
  if (state.editingBranchKey !== key) return;
  const element = findElementById(state.diagram.elements, elementId)?.element;
  const branch = element?.type === 'switch'
    ? element.branches.find(item => item.id === branchId)
    : null;
  if (!branch) return;

  state.editingBranchKey = null;
  if (cancel) {
    renderDiagram();
    return;
  }

  const cleanLabel = String(value).trim();
  if (!cleanLabel) {
    showToast('Die Fallbezeichnung darf nicht leer sein.');
    renderDiagram();
    return;
  }
  if (cleanLabel === branch.label) {
    renderDiagram();
    return;
  }

  branch.label = cleanLabel;
  markDiagramChanged('Fallbezeichnung aktualisiert.');
}

function handleSelectionAction(action) {
  if (!state.selectedElementId) return;
  if (action === 'edit') startEditing(state.selectedElementId);
  if (action === 'duplicate') duplicateSelectedElement();
  if (action === 'delete') removeElementById(state.selectedElementId);
  if (action === 'up') moveSelectedElement(-1);
  if (action === 'down') moveSelectedElement(1);
  if (action === 'add-case') addSwitchBranch();
  if (action === 'remove-case') removeSwitchBranch();
}

function addSwitchBranch() {
  const element = findElementById(state.diagram.elements, state.selectedElementId)?.element;
  if (!element || element.type !== 'switch') return;
  const defaultIndex = Math.max(0, element.branches.length - 1);
  const numberedCases = element.branches.filter(branch => branch.label !== 'Sonst').length;
  element.branches.splice(defaultIndex, 0, createSwitchBranch(`Fall ${numberedCases + 1}`));
  markDiagramChanged('Fall hinzugefügt.');
}

function removeSwitchBranch() {
  const element = findElementById(state.diagram.elements, state.selectedElementId)?.element;
  if (!element || element.type !== 'switch' || element.branches.length <= 2) return;
  element.branches.splice(element.branches.length - 2, 1);
  markDiagramChanged('Letzten Fall entfernt.');
}

function createSwitchBranch(label) {
  return {
    id: createBranchId(),
    label,
    children: []
  };
}

function duplicateSelectedElement() {
  const info = findElementById(state.diagram.elements, state.selectedElementId);
  if (!info) return;

  const copy = deepCloneElement(info.element);
  info.list.splice(info.index + 1, 0, copy);
  state.selectedElementId = copy.id;
  state.editingElementId = null;
  state.editingBranchKey = null;
  markDiagramChanged('Baustein dupliziert.');
}

function removeElementById(id) {
  const info = findElementById(state.diagram.elements, id);
  if (!info) return;
  info.list.splice(info.index, 1);
  state.selectedElementId = null;
  state.editingElementId = null;
  state.editingBranchKey = null;
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

    if (element.type === 'switch') {
      for (const branch of element.branches) {
        const inBranch = findElementById(branch.children, id, {
          kind: 'switchBranch',
          ownerId: element.id,
          branchId: branch.id
        });
        if (inBranch) return inBranch;
      }
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
  if (target.kind === 'switchBranch' && owner.type === 'switch') {
    return owner.branches.find(branch => branch.id === target.branchId)?.children || null;
  }
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

// Project files

function createNewProject() {
  if (state.dirty && !window.confirm('Neues Struktogramm erstellen? Nicht als Datei gespeicherte Änderungen gehen verloren.')) {
    return;
  }
  setDiagram(createEmptyDiagram(), false);
  showToast('Neues Struktogramm erstellt.');
}

function setDiagram(diagram, dirty, saveToLocalStorage = true) {
  state.diagram = diagram;
  state.selectedElementId = null;
  state.editingElementId = null;
  state.editingBranchKey = null;
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
    version: 3,
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

  if (mappedType === 'switch') {
    const branches = Array.isArray(raw.branches) && raw.branches.length >= 2
      ? raw.branches
      : [
          { label: 'Fall 1', children: [] },
          { label: 'Fall 2', children: [] },
          { label: 'Sonst', children: [] }
        ];
    element.branches = branches.map((branch, index) =>
      normalizeSwitchBranch(branch, index, depth, seenIds)
    );
  }

  if (LOOP_TYPES.has(mappedType)) {
    const children = Array.isArray(raw.children)
      ? raw.children
      : (Array.isArray(raw.body) ? raw.body : []);
    element.children = children.map(child => normalizeElement(child, depth + 1, seenIds));
  }

  return element;
}

function normalizeSwitchBranch(raw, index, depth, seenIds) {
  const branch = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  let id = typeof branch.id === 'string' && branch.id.trim()
    ? branch.id.trim()
    : createBranchId();
  if (seenIds.has(id)) id = createBranchId();
  seenIds.add(id);
  const children = Array.isArray(branch.children) ? branch.children : [];
  return {
    id,
    label: cleanRequiredText(branch.label || `Fall ${index + 1}`, 80),
    children: children.map(child => normalizeElement(child, depth + 1, seenIds))
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

  elements.filter(element => element.type === 'switch').forEach(element => {
    element.branches.forEach(branch => {
      if (branch.children.length === 0) {
        results.push({
          level: 'warning',
          text: `Der Fall „${shorten(branch.label, 32)}“ der Mehrfachverzweigung ist leer.`
        });
      }
    });
  });

  elements.filter(element => LOOP_TYPES.has(element.type)).forEach(element => {
    if (element.children.length === 0) {
      results.push({ level: 'warning', text: `Die Schleife „${shorten(element.text, 44)}“ hat keinen Inhalt.` });
    }
    if (element.type === 'while' && !containsComparisonOperator(element.text)) {
      results.push({ level: 'warning', text: `Die Bedingung „${shorten(element.text, 44)}“ enthält möglicherweise keinen Vergleichsoperator.` });
    }
  });

  const hasInput = elements.some(element => element.type === 'input' || element.type === 'declarationInput');
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
  <rect x="${outerX}" y="2" width="${outerWidth}" height="${titleHeight}" fill="#d8d8d8"/>
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
  if (element.type === 'switch') return layoutSvgSwitch(element, x, y, width);
  if (LOOP_TYPES.has(element.type)) return layoutSvgLoop(element, x, y, width);
  return layoutSvgSimple(element, x, y, width);
}

function layoutSvgSimple(element, x, y, width) {
  const lines = wrapSvgText(element.text, Math.max(12, Math.floor((width - 32) / 8.4)));
  const height = Math.max(58, lines.length * 21 + 24);
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
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#ffffff" stroke="#182230" stroke-width="2"/>
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
      <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#e1e1e1"/>
      <line x1="${x}" y1="${y + headerHeight}" x2="${x + width}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y + headerHeight}" width="${railWidth}" height="${bodyHeight}" fill="#e1e1e1"/>
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
      <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#e1e1e1"/>
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

function layoutSvgSwitch(element, x, y, width) {
  const headerLines = wrapSvgText(element.text, Math.max(12, Math.floor((width - 32) / 8.4)));
  const headerHeight = Math.max(58, headerLines.length * 21 + 24);
  const labelHeight = 34;
  const branchWidth = width / element.branches.length;
  const branchY = y + headerHeight + labelHeight;
  const layouts = element.branches.map((branch, index) =>
    layoutSvgList(branch.children, x + branchWidth * index, branchY, branchWidth)
  );
  const contentHeight = Math.max(62, ...layouts.map(layout => layout.height));
  const totalHeight = headerHeight + labelHeight + contentHeight;
  const headerText = renderSvgText(headerLines, x + 16, y + 28, {
    size: 16,
    lineHeight: 21,
    weight: 700
  });

  const labels = element.branches.map((branch, index) => {
    const center = x + branchWidth * index + branchWidth / 2;
    return `<text x="${center}" y="${y + headerHeight + 22}" text-anchor="middle" font-family="Arial, Segoe UI, sans-serif" font-size="12" font-weight="700" fill="#121926">${escapeXml(branch.label)}</text>`;
  }).join('');

  const dividers = element.branches.slice(1).map((branch, index) => {
    const lineX = x + branchWidth * (index + 1);
    return `<line x1="${lineX}" y1="${y + headerHeight}" x2="${lineX}" y2="${y + totalHeight}" stroke="#182230" stroke-width="2"/>`;
  }).join('');

  return {
    height: totalHeight,
    markup: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${totalHeight}" fill="#ffffff" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="${width}" height="${headerHeight}" fill="#e1e1e1"/>
      <line x1="${x}" y1="${y + headerHeight}" x2="${x + width}" y2="${y + headerHeight}" stroke="#182230" stroke-width="2"/>
      <rect x="${x}" y="${y + headerHeight}" width="${width}" height="${labelHeight}" fill="#f2f2f2"/>
      <line x1="${x}" y1="${branchY}" x2="${x + width}" y2="${branchY}" stroke="#182230" stroke-width="2"/>
      ${dividers}
      ${headerText}
      ${labels}
      ${layouts.map(layout => layout.markup).join('')}
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
    if (state.editingBranchKey) {
      event.preventDefault();
      state.editingBranchKey = null;
      renderDiagram();
      return;
    }
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
    if (element.type === 'switch') {
      element.branches.forEach(branch => {
        result.push(...flattenElements(branch.children));
      });
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
  if (element.type === 'switch') {
    element.branches.forEach(branch => {
      branch.id = createBranchId();
      branch.children.forEach(assignNewIds);
    });
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

function createBranchId() {
  if (window.crypto?.randomUUID) return `branch_${window.crypto.randomUUID()}`;
  return `branch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function createBranchKey(elementId, branchId) {
  return `${elementId}:${branchId}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : max));
}

function getElementIcon(name) {
  const icons = {
    sequence: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="5" width="21" height="18" rx="1.5"/><path d="M7.5 10h8.5M7.5 14h5.5M7.5 18h9.5M18 12l3 2-3 2"/></svg>',
    declarationInitialization: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M8 9h5M8 14h4M16 9v10M19 12h3M20.5 10.5v3M18.5 18h4"/><circle cx="10" cy="18" r="1.5"/></svg>',
    declarationInput: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="12" height="19" rx="1.5"/><path d="M7 9h5M7 13h4M7 17h5M17 14h7M21 10.5l3.5 3.5-3.5 3.5"/></svg>',
    input: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3.5 14h15M14.5 9.5 19 14l-4.5 4.5M21.5 5h3v18h-3"/><path d="M6 9.5v9"/></svg>',
    output: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M24.5 14h-15M13.5 9.5 9 14l4.5 4.5M6.5 5h-3v18h3"/><path d="M22 9.5v9"/></svg>',
    decision: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M3.5 15 14 9l10.5 6M14 9v14"/><path d="M7 19h4M17 19h4"/></svg>',
    switch: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M3.5 11h21M10.5 11v12M17.5 11v12M7 8h14"/><path d="m7 15 1.5 1.5L10 15m4 0 1.5 1.5L17 15m4 0 1.5 1.5L24 15"/></svg>',
    while: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M3.5 11h21M9 11v12M7 8h12"/><path d="M13 16h7M17.5 13.5 20 16l-2.5 2.5"/></svg>',
    for: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M3.5 11h21M9 11v12M7 8h4M14 8h7"/><path d="M13 16h7M17.5 13.5 20 16l-2.5 2.5"/></svg>',
    subroutine: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="4.5" width="21" height="19" rx="1.5"/><path d="M8 4.5v19M20 4.5v19M11 10h6M11 14h4M11 18h6"/></svg>'
  };
  return icons[name] || icons.sequence;
}
