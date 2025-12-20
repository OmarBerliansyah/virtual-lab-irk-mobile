import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/hooks/use-toast';

// --- Regex tester helpers ---
interface MatchResult {
  match: string;
  index: number;
  groups?: string[];
  namedGroups?: Record<string, string>;
}

const highlightMatches = (text: string, regex: RegExp) => {
  const parts: { key: string; text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

  while ((match = globalRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ key: `${lastIndex}-${match.index}`, text: text.slice(lastIndex, match.index), highlighted: false });
    }
    parts.push({ key: `m-${match.index}`, text: match[0], highlighted: true });
    lastIndex = match.index + match[0].length;
    if (match[0].length === 0) {
      globalRegex.lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    parts.push({ key: `tail-${lastIndex}`, text: text.slice(lastIndex), highlighted: false });
  }

  return parts;
};

// --- SLE helpers (Gauss-Jordan + Cramer) ---
const EPSILON = 1e-10;

type SolutionType = 'unique' | 'parametric' | 'none' | '';

type SolutionResult = {
  type: SolutionType;
  solution: string;
  rref: number[][];
};

const determinant = (matrix: number[][]): number => {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  let det = 0;
  for (let col = 0; col < n; col++) {
    const minor = matrix.slice(1).map(row => row.filter((_, idx) => idx !== col));
    det += (col % 2 === 0 ? 1 : -1) * matrix[0][col] * determinant(minor);
  }
  return det;
};

const analyzeRREF = (rref: number[][], numVars: number): SolutionResult => {
  let solutionString = '';
  const pivotCols: number[] = [];
  const freeVars: number[] = [];

  for (const row of rref) {
    const mainCoeffs = row.slice(0, numVars);
    const constant = row[numVars];
    const isAllZeroCoeffs = mainCoeffs.every(val => Math.abs(val) < EPSILON);
    if (isAllZeroCoeffs && Math.abs(constant) > EPSILON) {
      return { type: 'none', solution: 'System has no solution (inconsistent).', rref };
    }
  }

  let validRows = 0;
  for (let r = 0; r < rref.length; r++) {
    for (let c = 0; c < numVars; c++) {
      if (Math.abs(rref[r][c] - 1) < EPSILON || Math.abs(rref[r][c]) > EPSILON) {
        pivotCols[c] = validRows;
        validRows++;
        break;
      }
    }
  }

  for (let i = 0; i < numVars; i++) {
    if (pivotCols[i] === undefined) freeVars.push(i);
  }

  if (freeVars.length === 0) {
    const solution = [] as string[];
    for (let i = 0; i < numVars; i++) {
      solution[i] = rref[pivotCols[i]][numVars].toFixed(4);
      solutionString += `${String.fromCharCode(120 + i)} = ${solution[i]}\n`;
    }
    return { type: 'unique', solution: solutionString, rref };
  }

  let paramIndex = 1;
  const solutionParams = Array(numVars).fill(null) as (string | null)[];
  for (const freeVarIndex of freeVars) {
    solutionParams[freeVarIndex] = `t${paramIndex++}`;
  }

  for (let i = 0; i < numVars; i++) {
    if (solutionParams[i] !== null) continue;
    const pivotRow = rref[pivotCols[i]];
    let paramStr = `${pivotRow[numVars].toFixed(4)}`;
    for (const freeVarIndex of freeVars) {
      const coeff = pivotRow[freeVarIndex];
      if (Math.abs(coeff) > EPSILON) {
        paramStr += ` ${-coeff > 0 ? '+' : ''} ${(-coeff).toFixed(4)}${solutionParams[freeVarIndex]}`;
      }
    }
    solutionParams[i] = paramStr;
  }

  solutionString = solutionParams
    .map((s, i) => `${String.fromCharCode(120 + i)} = ${s}`)
    .join('\n');

  return { type: 'parametric', solution: solutionString, rref };
};

const solveUsingGaussJordan = (matrix: number[][]): SolutionResult => {
  let m = matrix.map(row => [...row]);
  const numRows = m.length;
  const numCols = m[0].length;
  const numVars = numCols - 1;

  let lead = 0;
  for (let r = 0; r < numRows; r++) {
    if (lead >= numCols) break;
    let i = r;
    while (Math.abs(m[i][lead]) < EPSILON) {
      i++;
      if (i === numRows) {
        i = r;
        lead++;
        if (lead === numCols) return analyzeRREF(m, numVars);
      }
    }
    [m[i], m[r]] = [m[r], m[i]];

    let val = m[r][lead];
    for (let j = 0; j < numCols; j++) {
      m[r][j] /= val;
    }

    for (let ii = 0; ii < numRows; ii++) {
      if (ii === r) continue;
      val = m[ii][lead];
      for (let j = 0; j < numCols; j++) {
        m[ii][j] -= val * m[r][j];
      }
    }
    lead++;
  }

  m = m.map(row => row.map(cell => (Math.abs(cell) < EPSILON ? 0 : cell)));
  return analyzeRREF(m, numVars);
};

// --- Pathfinding helpers ---
interface GraphNode {
  id: number;
  label: string;
}

interface GraphEdge {
  id: string;
  from: number;
  to: number;
  weight: number;
}

const bfs = (nodes: GraphNode[], edges: GraphEdge[], start: number, end: number) => {
  const queue: number[] = [start];
  const visited = new Set<number>([start]);
  const parent = new Map<number, number>();

  while (queue.length) {
    const current = queue.shift()!;
    if (current === end) break;
    edges
      .filter(e => e.from === current)
      .forEach(e => {
        if (!visited.has(e.to)) {
          visited.add(e.to);
          parent.set(e.to, current);
          queue.push(e.to);
        }
      });
  }

  if (!visited.has(end)) return { path: [], visited: Array.from(visited) };
  const path: number[] = [end];
  let cur = end;
  while (parent.has(cur)) {
    cur = parent.get(cur)!;
    path.unshift(cur);
  }
  return { path, visited: Array.from(visited) };
};

const dfsHelper = (edges: GraphEdge[], current: number, end: number, visited: Set<number>, path: number[]): boolean => {
  visited.add(current);
  path.push(current);
  if (current === end) return true;
  for (const edge of edges.filter(e => e.from === current)) {
    if (!visited.has(edge.to)) {
      if (dfsHelper(edges, edge.to, end, visited, path)) return true;
    }
  }
  path.pop();
  return false;
};

const dfs = (nodes: GraphNode[], edges: GraphEdge[], start: number, end: number) => {
  const visited = new Set<number>();
  const path: number[] = [];
  dfsHelper(edges, start, end, visited, path);
  return { path, visited: Array.from(visited) };
};

const tspNearest = (nodes: GraphNode[], edges: GraphEdge[], start: number) => {
  const remaining = new Set(nodes.map(n => n.id));
  const path: number[] = [start];
  remaining.delete(start);
  let current = start;
  let cost = 0;

  while (remaining.size) {
    let bestNext: number | null = null;
    let bestCost = Infinity;
    edges
      .filter(e => e.from === current)
      .forEach(edge => {
        if (remaining.has(edge.to) && edge.weight < bestCost) {
          bestCost = edge.weight;
          bestNext = edge.to;
        }
      });
    if (bestNext === null) break;
    path.push(bestNext);
    remaining.delete(bestNext);
    cost += bestCost;
    current = bestNext;
  }

  return { path, cost };
};

export default function VirtualLabScreen() {
  const colorScheme = useColorScheme();
  const { toast } = useToast();

  // Regex state
  const [pattern, setPattern] = useState('\\b[A-Z]\\w+');
  const [flags, setFlags] = useState('g');
  const [sourceText, setSourceText] = useState(
    'Hello World! This is a Sample Text for Testing Regular Expressions. It contains Various Words and Numbers like 123 and 456.'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  // SLE state
  const [size, setSize] = useState(3);
  const [method, setMethod] = useState<'gaussian' | 'cramer'>('gaussian');
  const [matrix, setMatrix] = useState<string[][]>(Array(3).fill(null).map(() => Array(4).fill('0')));
  const [solution, setSolution] = useState('');
  const [solutionType, setSolutionType] = useState<SolutionType>('');
  const [solutionMethod, setSolutionMethod] = useState('');
  const [sleError, setSleError] = useState('');

  // Pathfinding state
  const [nodes, setNodes] = useState<GraphNode[]>([{ id: 1, label: 'A' }, { id: 2, label: 'B' }]);
  const [edges, setEdges] = useState<GraphEdge[]>([{ id: 'e-1-2', from: 1, to: 2, weight: 1 }]);
  const [startNode, setStartNode] = useState(1);
  const [endNode, setEndNode] = useState(2);
  const [algo, setAlgo] = useState<'bfs' | 'dfs' | 'tsp'>('bfs');
  const [pathResult, setPathResult] = useState<string>('');

  // Regex computation
  useEffect(() => {
    try {
      const finalFlags = flags.includes('g') ? flags : `${flags}g`;
      const regex = new RegExp(pattern || '.*', finalFlags);
      const matches: MatchResult[] = [];
      let match: RegExpExecArray | null;
      const globalRegex = new RegExp(regex.source, regex.flags);
      while ((match = globalRegex.exec(sourceText)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        });
        if (match[0].length === 0) {
          globalRegex.lastIndex++;
        }
      }
      setRegexError(matches.length ? `${matches.length} matches found.` : 'No matches found.');
      setMatchResults(matches);
    } catch (err) {
      setRegexError(err instanceof Error ? err.message : 'Invalid regex pattern');
      setMatchResults([]);
    }
  }, [pattern, flags, sourceText]);

  const filteredMatches = useMemo(() => {
    if (!searchTerm) return matchResults;
    return matchResults.filter(m => m.match.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [matchResults, searchTerm]);

  const regexParts = useMemo(() => {
    try {
      const finalFlags = flags.includes('g') ? flags : `${flags}g`;
      const regex = new RegExp(pattern || '.*', finalFlags);
      return highlightMatches(sourceText, regex);
    } catch {
      return [{ key: 'all', text: sourceText, highlighted: false }];
    }
  }, [pattern, flags, sourceText]);

  // SLE handlers
  const updateMatrixSize = (delta: number) => {
    const newSize = Math.min(6, Math.max(2, size + delta));
    const newMatrix = Array(newSize)
      .fill(null)
      .map((_, i) =>
        Array(newSize + 1)
          .fill(null)
          .map((_, j) => (matrix[i] && matrix[i][j] !== undefined ? matrix[i][j] : '0'))
      );
    setSize(newSize);
    setMatrix(newMatrix);
  };

  const updateCell = (row: number, col: number, value: string) => {
    const copy = matrix.map(r => [...r]);
    copy[row][col] = value;
    setMatrix(copy);
  };

  const solveSLE = () => {
    try {
      setSleError('');
      setSolution('');
      setSolutionType('');
      setSolutionMethod('');

      const numMatrix = matrix.map(row => row.map(cell => parseFloat(cell) || 0));
      const A = numMatrix.map(row => row.slice(0, -1));
      const b = numMatrix.map(row => row[row.length - 1]);

      if (method === 'gaussian') {
        const result = solveUsingGaussJordan(numMatrix);
        setSolutionType(result.type);
        setSolution(result.solution);
        setSolutionMethod('Gauss-Jordan Elimination');
      } else {
        if (A.length !== A[0].length) {
          throw new Error("Cramer's rule requires a square matrix (N variables, N equations).");
        }
        const detA = determinant(A);
        if (Math.abs(detA) < EPSILON) {
          const result = solveUsingGaussJordan(numMatrix);
          setSolutionType(result.type);
          setSolution(result.solution);
          setSolutionMethod("Cramer's Rule");
          if (result.type === 'none') setSleError('Determinant is zero. System has no solution.');
          if (result.type === 'parametric') setSleError('Determinant is zero. System has infinite solutions.');
        } else {
          const results: number[] = [];
          for (let i = 0; i < size; i++) {
            const Ai = A.map(row => [...row]);
            for (let j = 0; j < size; j++) {
              Ai[j][i] = b[j];
            }
            const detAi = determinant(Ai);
            results.push(detAi / detA);
          }
          const variables = Array.from({ length: size }, (_, i) => String.fromCharCode(120 + i));
          const resultText = results
            .map((val, idx) => `${variables[idx]} = ${val.toFixed(4)}`)
            .join('\n');
          setSolutionType('unique');
          setSolution(resultText);
          setSolutionMethod("Cramer's Rule");
        }
      }
    } catch (err) {
      setSleError(err instanceof Error ? err.message : 'Failed to solve system');
    }
  };

  // Pathfinding handlers
  const addNode = () => {
    const nextId = nodes.length ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
    const label = String.fromCharCode(64 + nextId);
    setNodes([...nodes, { id: nextId, label }]);
    toast({ title: 'Node added', description: `Node ${label} created.` });
  };

  const addEdge = (from: number, to: number, weight: number) => {
    if (from === to) {
      toast({ title: 'Error', description: 'Edge must connect two different nodes', type: 'error' });
      return;
    }
    const id = `e-${from}-${to}`;
    setEdges(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return [...filtered, { id, from, to, weight }];
    });
    toast({ title: 'Edge saved', description: `${from} -> ${to} (w=${weight})` });
  };

  const runAlgo = () => {
    if (nodes.length < 2) {
      setPathResult('Add at least two nodes.');
      return;
    }
    if (algo === 'bfs') {
      const res = bfs(nodes, edges, startNode, endNode);
      setPathResult(`BFS path: ${res.path.join(' -> ') || 'none'}\nVisited: ${res.visited.join(', ')}`);
    } else if (algo === 'dfs') {
      const res = dfs(nodes, edges, startNode, endNode);
      setPathResult(`DFS path: ${res.path.join(' -> ') || 'none'}\nVisited: ${res.visited.join(', ')}`);
    } else {
      const res = tspNearest(nodes, edges, startNode);
      setPathResult(`TSP (nearest-neighbor): ${res.path.join(' -> ')}\nCost ≈ ${res.cost.toFixed(2)}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Virtual Laboratory</Text>
      <Text style={styles.subtitle}>Regex testing, SLE solving, and graph algorithms adapted for mobile.</Text>

      {/* Regex Tester */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Regex Tester</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Pattern</Text>
            <TextInput value={pattern} onChangeText={setPattern} placeholder="Regex pattern" style={styles.input} />
          </View>
          <View style={styles.flagBox}>
            <Text style={styles.label}>Flags</Text>
            <TextInput value={flags} onChangeText={setFlags} placeholder="gim" style={styles.input} />
          </View>
        </View>
        <Text style={styles.label}>Filter matches</Text>
        <TextInput value={searchTerm} onChangeText={setSearchTerm} placeholder="Filter" style={styles.input} />
        <Text style={styles.label}>Source Text</Text>
        <TextInput
          value={sourceText}
          onChangeText={setSourceText}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.multiline]}
        />
        {regexError && <Text style={styles.helper}>{regexError}</Text>}
        <View style={styles.previewBox}>
          <Text style={styles.label}>Preview</Text>
          <Text>
            {regexParts.map(part => (
              <Text key={part.key} style={part.highlighted ? styles.highlight : undefined}>{part.text}</Text>
            ))}
          </Text>
        </View>
        <View style={styles.previewBox}>
          <Text style={styles.label}>Matches</Text>
          {filteredMatches.length === 0 ? (
            <Text style={styles.helper}>No matches</Text>
          ) : (
            filteredMatches.map((m, idx) => (
              <View key={`${m.index}-${idx}`} style={styles.matchRow}>
                <Text style={styles.matchText}>#{idx + 1} “{m.match}” at {m.index}</Text>
                {m.groups && m.groups.length > 0 && (
                  <Text style={styles.helper}>Groups: {m.groups.filter(Boolean).join(', ')}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* SLE Solver */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SLE Solver</Text>
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <Pressable onPress={() => updateMatrixSize(-1)} style={styles.chip}><Text style={styles.chipText}>-</Text></Pressable>
            <Text style={styles.helper}>Size {size} × {size + 1}</Text>
            <Pressable onPress={() => updateMatrixSize(1)} style={styles.chip}><Text style={styles.chipText}>+</Text></Pressable>
          </View>
          <View style={styles.rowCenter}>
            <Pressable onPress={() => setMethod('gaussian')} style={[styles.chip, method === 'gaussian' && styles.chipActive]}>
              <Text style={[styles.chipText, method === 'gaussian' && styles.chipTextActive]}>Gauss-Jordan</Text>
            </Pressable>
            <Pressable onPress={() => setMethod('cramer')} style={[styles.chip, method === 'cramer' && styles.chipActive]}>
              <Text style={[styles.chipText, method === 'cramer' && styles.chipTextActive]}>Cramer</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          {matrix.map((row, i) => (
            <View key={`r-${i}`} style={styles.matrixRow}>
              {row.map((cell, j) => (
                <TextInput
                  key={`c-${i}-${j}`}
                  value={cell}
                  onChangeText={val => updateCell(i, j, val)}
                  keyboardType="numeric"
                  style={[styles.matrixCell, j === row.length - 1 && styles.matrixCellLast]}
                />
              ))}
            </View>
          ))}
        </View>
        <Pressable style={styles.primaryButton} onPress={solveSLE}>
          <Text style={styles.primaryText}>Solve</Text>
        </Pressable>
        {sleError ? <Text style={[styles.helper, styles.error]}>{sleError}</Text> : null}
        {solution ? (
          <View style={styles.previewBox}>
            <Text style={styles.label}>{solutionMethod} ({solutionType || 'result'})</Text>
            <Text style={styles.code}>{solution}</Text>
          </View>
        ) : null}
      </View>

      {/* Pathfinding */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pathfinding</Text>
        <Text style={styles.helper}>Lightweight graph planner with BFS/DFS/TSP (nearest neighbor).</Text>
        <View style={styles.rowBetween}>
          <Pressable style={styles.secondaryButton} onPress={addNode}>
            <Text style={styles.secondaryText}>Add Node</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => addEdge(startNode, endNode, 1)}>
            <Text style={styles.secondaryText}>Connect {startNode}→{endNode}</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Nodes</Text>
        <Text style={styles.helper}>{nodes.map(n => `${n.id}:${n.label}`).join('  ') || 'None'}</Text>
        <Text style={styles.label}>Edges (from→to w)</Text>
        <Text style={styles.helper}>
          {edges.map(e => `${e.from}→${e.to} (${e.weight})`).join(' | ') || 'None'}
        </Text>
        <View style={styles.rowBetween}>
          <TextInput
            value={String(startNode)}
            onChangeText={v => setStartNode(parseInt(v || '0', 10) || 1)}
            keyboardType="numeric"
            style={[styles.input, styles.smallInput]}
            placeholder="Start"
          />
          <TextInput
            value={String(endNode)}
            onChangeText={v => setEndNode(parseInt(v || '0', 10) || 1)}
            keyboardType="numeric"
            style={[styles.input, styles.smallInput]}
            placeholder="End"
          />
          <View style={styles.rowCenter}>
            {(['bfs', 'dfs', 'tsp'] as const).map(option => (
              <Pressable
                key={option}
                onPress={() => setAlgo(option)}
                style={[styles.chip, algo === option && styles.chipActive]}
              >
                <Text style={[styles.chipText, algo === option && styles.chipTextActive]}>{option.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable style={styles.primaryButton} onPress={runAlgo}>
          <Text style={styles.primaryText}>Run</Text>
        </Pressable>
        {pathResult ? (
          <View style={styles.previewBox}>
            <Text style={styles.code}>{pathResult}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  flagBox: {
    width: 90,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  smallInput: {
    width: 90,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  previewBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  highlight: {
    backgroundColor: '#fef08a',
    fontWeight: '700',
  },
  helper: {
    color: '#6b7280',
    fontSize: 12,
  },
  matchRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  matrixCell: {
    width: 60,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  matrixCellLast: {
    borderLeftWidth: 2,
    borderLeftColor: '#2563eb',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  secondaryText: {
    fontWeight: '600',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  error: {
    color: '#dc2626',
    marginTop: 4,
  },
});
