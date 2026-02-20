// src/components/StudentGrid/ExcelLikeGrid.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download, Upload, Plus, Trash2, Save, Copy, ClipboardPaste,
  Search, Filter, Eye, EyeOff, AlertCircle, CheckCircle, X,
  ChevronDown, Lock, Unlock
} from 'lucide-react';

const COLUMNS = [
  { key: 'sno', label: 'S.No', width: 60, readOnly: true, sticky: true },
  { key: 'name', label: 'Name', width: 180, required: true },
  { key: 'rollNumber', label: 'Roll No', width: 130, required: true },
  { key: 'email', label: 'Email ID', width: 220, required: true, type: 'email' },
  { key: 'role', label: 'Role', width: 120, type: 'select', options: ['student', 'staff', 'admin'], default: 'student' },
  { key: 'password', label: 'Password', width: 140, type: 'password', required: true },
  { key: 'groupId', label: 'Group ID', width: 150, readOnly: true },
];

const generateId = () => `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ExcelLikeGrid = ({
  students = [],
  groupId = '',
  groupName = '',
  onSave,
  onDelete,
  onBulkSave,
  editable = true,
  maxStudents = 100,
  isPro = false,
  readOnly = false,
}) => {
  const [gridData, setGridData] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [copyBuffer, setCopyBuffer] = useState(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null);
  const gridRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const startResizeX = useRef(null);
  const startWidth = useRef(null);

  // Initialize grid data from students prop
  useEffect(() => {
    const data = students.map((s, i) => ({
      _id: s._id || generateId(),
      sno: i + 1,
      name: s.name || '',
      rollNumber: s.rollNumber || '',
      email: s.email || '',
      role: s.role || 'student',
      password: s.password || '',
      groupId: groupId,
      isNew: false,
      isDirty: false,
      hasError: {},
    }));
    setGridData(data);
  }, [students, groupId]);

  const currentCount = gridData.length;
  const canAddMore = isPro || currentCount < maxStudents;

  const validate = (key, value) => {
    if (!value && COLUMNS.find(c => c.key === key)?.required) return 'Required';
    if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
    return '';
  };

  const addEmptyRows = (count = 5) => {
    if (!canAddMore) { setShowLimitWarning(true); return; }
    const available = isPro ? count : Math.min(count, maxStudents - currentCount);
    if (available <= 0) { setShowLimitWarning(true); return; }
    const newRows = Array.from({ length: available }, (_, i) => ({
      _id: generateId(),
      sno: gridData.length + i + 1,
      name: '',
      rollNumber: '',
      email: '',
      role: 'student',
      password: '',
      groupId: groupId,
      isNew: true,
      isDirty: true,
      hasError: {},
    }));
    setGridData(prev => {
      const updated = [...prev, ...newRows];
      return updated.map((r, i) => ({ ...r, sno: i + 1 }));
    });
    setIsDirty(true);
    if (!isPro && currentCount + available >= maxStudents) setShowLimitWarning(true);
  };

  const handleCellClick = (rowIndex, colKey, e) => {
    if (readOnly) return;
    setSelectedCell({ row: rowIndex, col: colKey });
    if (e.shiftKey && selectedCell) {
      const startRow = Math.min(selectedCell.row, rowIndex);
      const endRow = Math.max(selectedCell.row, rowIndex);
      setSelectionRange({ startRow, endRow, col: colKey });
    } else {
      setSelectionRange(null);
    }
  };

  const handleCellDoubleClick = (rowIndex, colKey) => {
    if (readOnly) return;
    const col = COLUMNS.find(c => c.key === colKey);
    if (col?.readOnly) return;
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(colKey === 'password' ? gridData[rowIndex][colKey] : gridData[rowIndex][colKey]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const error = validate(col, editValue);
    setGridData(prev => {
      const updated = [...prev];
      updated[row] = {
        ...updated[row],
        [col]: editValue,
        isDirty: true,
        hasError: { ...updated[row].hasError, [col]: error },
      };
      return updated;
    });
    setEditingCell(null);
    setEditValue('');
    setIsDirty(true);
  };

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell && !editingCell) return;

    if (editingCell) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        const cols = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
        const currentColIdx = cols.indexOf(editingCell.col);
        if (e.key === 'Tab') {
          const nextCol = cols[currentColIdx + 1];
          if (nextCol) {
            setEditingCell({ row: editingCell.row, col: nextCol });
            setEditValue(gridData[editingCell.row][nextCol] || '');
          } else if (editingCell.row < gridData.length - 1) {
            setEditingCell({ row: editingCell.row + 1, col: cols[0] });
            setEditValue(gridData[editingCell.row + 1][cols[0]] || '');
          }
        } else {
          if (editingCell.row < gridData.length - 1) {
            setEditingCell({ row: editingCell.row + 1, col: editingCell.col });
            setEditValue(gridData[editingCell.row + 1][editingCell.col] || '');
          }
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
      return;
    }

    if (e.key === 'F2' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
      const col = COLUMNS.find(c => c.key === selectedCell.col);
      if (col?.readOnly) return;
      setEditingCell(selectedCell);
      setEditValue(e.key.length === 1 ? e.key : gridData[selectedCell.row][selectedCell.col] || '');
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    const colKeys = COLUMNS.map(c => c.key);
    const { row, col } = selectedCell;
    const colIdx = colKeys.indexOf(col);

    const moves = {
      ArrowUp: [Math.max(0, row - 1), col],
      ArrowDown: [Math.min(gridData.length - 1, row + 1), col],
      ArrowLeft: [row, colKeys[Math.max(0, colIdx - 1)]],
      ArrowRight: [row, colKeys[Math.min(colKeys.length - 1, colIdx + 1)]],
    };

    if (moves[e.key]) {
      e.preventDefault();
      setSelectedCell({ row: moves[e.key][0], col: moves[e.key][1] });
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') { handleCopy(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { handlePasteFromClipboard(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const col = COLUMNS.find(c => c.key === selectedCell.col);
      if (!col?.readOnly) {
        setGridData(prev => {
          const updated = [...prev];
          updated[row] = { ...updated[row], [selectedCell.col]: '', isDirty: true };
          return updated;
        });
        setIsDirty(true);
      }
    }
  }, [selectedCell, editingCell, editValue, gridData]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCopy = () => {
    if (!selectedCell) return;
    const value = gridData[selectedCell.row][selectedCell.col];
    navigator.clipboard?.writeText(String(value || ''));
    setCopyBuffer({ value, cell: selectedCell });
  };

  const handlePasteFromClipboard = async () => {
    if (readOnly) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const rows = text.trim().split('\n').map(r => r.split('\t'));
      if (!selectedCell) return;

      const dataKeys = COLUMNS.filter(c => !c.readOnly).map(c => c.key);
      const startColIdx = dataKeys.indexOf(selectedCell.col);
      const startRow = selectedCell.row;

      setGridData(prev => {
        const updated = [...prev];
        rows.forEach((rowValues, ri) => {
          const targetRow = startRow + ri;
          if (targetRow >= updated.length) {
            if (!canAddMore) return;
            updated.push({
              _id: generateId(),
              sno: updated.length + 1,
              name: '', rollNumber: '', email: '', role: 'student', password: '',
              groupId, isNew: true, isDirty: true, hasError: {},
            });
          }
          rowValues.forEach((val, ci) => {
            const colKey = dataKeys[startColIdx + ci];
            if (colKey) {
              updated[targetRow] = {
                ...updated[targetRow],
                [colKey]: val.trim(),
                isDirty: true,
              };
            }
          });
        });
        return updated.map((r, i) => ({ ...r, sno: i + 1 }));
      });
      setIsDirty(true);
    } catch (err) {
      console.error('Paste failed:', err);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
      const keyMap = {
        name: 'name', rollno: 'rollNumber', rollnumber: 'rollNumber',
        email: 'email', emailid: 'email', role: 'role',
        password: 'password', pass: 'password',
      };
      const newRows = lines.slice(1).map((line, i) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {
          _id: generateId(), sno: gridData.length + i + 1,
          name: '', rollNumber: '', email: '', role: 'student', password: '',
          groupId, isNew: true, isDirty: true, hasError: {},
        };
        headers.forEach((h, idx) => {
          const k = keyMap[h];
          if (k) row[k] = values[idx] || '';
        });
        return row;
      }).filter(r => r.name || r.email || r.rollNumber);

      const merged = [...gridData, ...newRows].slice(0, isPro ? Infinity : maxStudents);
      setGridData(merged.map((r, i) => ({ ...r, sno: i + 1 })));
      setIsDirty(true);
      if (!isPro && merged.length >= maxStudents) setShowLimitWarning(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadExcel = () => {
    const headers = ['S.No', 'Name', 'Roll No', 'Email ID', 'Role', 'Password', 'Group ID'];
    const rows = filteredData.map(r => [
      r.sno, r.name, r.rollNumber, r.email, r.role, r.password, r.groupId
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName || 'group'}_students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Name', 'Roll No', 'Email ID', 'Role', 'Password'];
    const sample = [['John Doe', 'CS001', 'john@college.edu', 'student', 'Pass@123']];
    const csv = [headers, ...sample].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteRows = () => {
    if (selectedRows.size === 0) return;
    const toDelete = [...selectedRows].map(i => gridData[i]).filter(r => !r.isNew && r._id);
    if (toDelete.length > 0 && onDelete) {
      toDelete.forEach(r => onDelete(r._id));
    }
    setGridData(prev => prev.filter((_, i) => !selectedRows.has(i)).map((r, i) => ({ ...r, sno: i + 1 })));
    setSelectedRows(new Set());
    setIsDirty(true);
  };

  const handleSave = async () => {
    const dirtyRows = gridData.filter(r => r.isDirty && (r.name || r.email));
    if (dirtyRows.length === 0) return;
    // Validate
    let hasErrors = false;
    const validated = gridData.map(r => {
      const errs = {};
      COLUMNS.forEach(c => {
        if (c.required && !r[c.key] && !c.readOnly) errs[c.key] = 'Required';
        if (c.type === 'email' && r[c.key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r[c.key])) errs[c.key] = 'Invalid';
      });
      if (Object.keys(errs).length) hasErrors = true;
      return { ...r, hasError: errs };
    });
    setGridData(validated);
    if (hasErrors) { setSaveStatus('error'); setTimeout(() => setSaveStatus(''), 3000); return; }
    try {
      if (onBulkSave) await onBulkSave(dirtyRows);
      setSaveStatus('success');
      setIsDirty(false);
      setGridData(prev => prev.map(r => ({ ...r, isDirty: false, isNew: false })));
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleRowCheck = (idx, checked) => {
    setSelectedRows(prev => {
      const s = new Set(prev);
      checked ? s.add(idx) : s.delete(idx);
      return s;
    });
  };

  const handleSelectAll = (checked) => {
    setSelectedRows(checked ? new Set(filteredData.map((_, i) => i)) : new Set());
  };

  const filteredData = searchTerm
    ? gridData.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : gridData;

  const isCellSelected = (row, col) =>
    selectedCell?.row === row && selectedCell?.col === col;

  const isRowSelected = (idx) => selectedRows.has(idx);

  const getCellValue = (row, col) => {
    if (col === 'password' && !showPasswords) return '••••••••';
    return row[col] ?? '';
  };

  // Column resize
  const startResize = (e, colKey) => {
    e.preventDefault();
    setResizing(colKey);
    startResizeX.current = e.clientX;
    startWidth.current = columnWidths[colKey] || COLUMNS.find(c => c.key === colKey)?.width || 120;
    const onMove = (me) => {
      const delta = me.clientX - startResizeX.current;
      setColumnWidths(prev => ({ ...prev, [colKey]: Math.max(60, startWidth.current + delta) }));
    };
    const onUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const colWidth = (key) => columnWidths[key] || COLUMNS.find(c => c.key === key)?.width || 120;

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* Left actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addEmptyRows(1)}
            disabled={!editable || readOnly || !canAddMore}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Add row (Shift+click for 5 rows)"
          >
            <Plus size={13} /> Add Row
          </button>
          <button
            onClick={() => addEmptyRows(5)}
            disabled={!editable || readOnly || !canAddMore}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={13} /> +5 Rows
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePasteFromClipboard}
            disabled={readOnly}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Paste from clipboard (Ctrl+V)"
          >
            <ClipboardPaste size={13} /> Paste
          </button>
          <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 cursor-pointer transition-colors">
            <Upload size={13} /> Upload CSV
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          </label>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            title="Download CSV template"
          >
            <Download size={13} /> Template
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        <button
          onClick={handleDeleteRows}
          disabled={selectedRows.size === 0 || readOnly}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={13} /> Delete ({selectedRows.size})
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
          />
        </div>

        <button
          onClick={() => setShowPasswords(!showPasswords)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
        >
          {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
          {showPasswords ? 'Hide' : 'Show'} Pass
        </button>

        <div className="w-px h-5 bg-gray-300" />

        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          <Download size={13} /> Export
        </button>

        <button
          onClick={handleSave}
          disabled={!isDirty || readOnly}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={13} />
          {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save'}
        </button>
      </div>

      {/* Limit warning */}
      {showLimitWarning && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-xs">
            <AlertCircle size={14} />
            <span>
              {isPro
                ? `${currentCount} students in group`
                : `Free plan: ${currentCount}/${maxStudents} students. Upgrade to Pro for unlimited students.`}
            </span>
          </div>
          <button onClick={() => setShowLimitWarning(false)} className="text-amber-500 hover:text-amber-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Group: {groupName || 'Unknown'}</span>
        <span>ID: <span className="font-mono text-blue-600">{groupId}</span></span>
        <span>{currentCount} students</span>
        {!isPro && <span className="text-amber-600">{maxStudents - currentCount} slots remaining</span>}
        {isDirty && <span className="text-orange-500 font-medium">● Unsaved changes</span>}
        {saveStatus === 'success' && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={11} /> Saved</span>}
        {saveStatus === 'error' && <span className="text-red-600 font-medium flex items-center gap-1"><AlertCircle size={11} /> Fix errors</span>}
        <span className="ml-auto text-gray-400">Double-click to edit · Ctrl+V to paste · Ctrl+S to save</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto relative" ref={gridRef}>
        <table className="border-collapse text-xs select-none" style={{ minWidth: '100%' }}>
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Checkbox column */}
              <th className="sticky left-0 z-30 bg-gray-100 border border-gray-300 p-0 w-8">
                <div className="flex items-center justify-center h-7">
                  <input
                    type="checkbox"
                    className="w-3 h-3 cursor-pointer"
                    onChange={e => handleSelectAll(e.target.checked)}
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  />
                </div>
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`relative bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-left select-none ${col.sticky ? 'sticky left-8 z-30' : ''}`}
                  style={{ width: colWidth(col.key), minWidth: colWidth(col.key) }}
                >
                  <div className="flex items-center justify-between px-2 h-7">
                    <span className="truncate">{col.label}</span>
                    {col.required && <span className="text-red-500 ml-0.5">*</span>}
                    {col.readOnly && <Lock size={9} className="text-gray-400 flex-shrink-0 ml-1" />}
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group"
                    onMouseDown={e => startResize(e, col.key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📋</span>
                    <span>No students yet. Click "Add Row" or paste data from Excel.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={row._id}
                  className={`group ${isRowSelected(rowIndex) ? 'bg-blue-50' : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/60 ${row.isDirty ? 'border-l-2 border-l-orange-300' : ''}`}
                >
                  <td className="sticky left-0 bg-white group-hover:bg-blue-50/60 border border-gray-200 p-0 z-10">
                    <div className="flex items-center justify-center h-7">
                      <input
                        type="checkbox"
                        className="w-3 h-3 cursor-pointer"
                        checked={isRowSelected(rowIndex)}
                        onChange={e => handleRowCheck(rowIndex, e.target.checked)}
                      />
                    </div>
                  </td>
                  {COLUMNS.map((col) => {
                    const isSelected = isCellSelected(rowIndex, col.key);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === col.key;
                    const hasError = row.hasError?.[col.key];
                    const value = getCellValue(row, col.key);

                    return (
                      <td
                        key={col.key}
                        className={`border border-gray-200 p-0 relative cursor-default
                          ${col.sticky ? 'sticky left-8 z-10 bg-white group-hover:bg-blue-50/60' : ''}
                          ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-0 z-10' : ''}
                          ${hasError ? 'bg-red-50' : ''}
                          ${col.readOnly ? 'bg-gray-50/80 text-gray-500' : ''}
                        `}
                        style={{ width: colWidth(col.key), minWidth: colWidth(col.key) }}
                        onClick={e => handleCellClick(rowIndex, col.key, e)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col.key)}
                      >
                        {isEditing && !col.readOnly ? (
                          col.type === 'select' ? (
                            <select
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              className="w-full h-7 px-2 bg-white border-0 outline-none text-xs focus:ring-0"
                            >
                              {col.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              ref={inputRef}
                              type={col.type === 'password' ? (showPasswords ? 'text' : 'password') : col.type || 'text'}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              className="w-full h-7 px-2 bg-white border-0 outline-none text-xs focus:ring-0"
                            />
                          )
                        ) : (
                          <div className="flex items-center px-2 h-7 overflow-hidden">
                            {col.key === 'role' ? (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                value === 'admin' ? 'bg-purple-100 text-purple-700' :
                                value === 'staff' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {value || 'student'}
                              </span>
                            ) : (
                              <span className="truncate">{value}</span>
                            )}
                            {hasError && (
                              <span className="ml-1 text-red-500 flex-shrink-0" title={hasError}>
                                <AlertCircle size={11} />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>{filteredData.length} rows{searchTerm ? ` (filtered from ${gridData.length})` : ''}</span>
          {selectedRows.size > 0 && <span className="text-blue-600">{selectedRows.size} selected</span>}
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${currentCount / maxStudents > 0.9 ? 'bg-red-500' : currentCount / maxStudents > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (currentCount / maxStudents) * 100)}%` }}
                />
              </div>
              <span>{currentCount}/{maxStudents}</span>
            </div>
          )}
          {isPro && <span className="text-purple-600 font-medium flex items-center gap-1"><Unlock size={10} /> Pro</span>}
        </div>
      </div>
    </div>
  );
};

export default ExcelLikeGrid;