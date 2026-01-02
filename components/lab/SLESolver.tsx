import { Book, Calculator, Minus, Plus, Zap } from 'lucide-react-native';
import * as math from 'mathjs';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const EPSILON = 1e-10;

type SolutionType = 'unique' | 'parametric' | 'none' | '';

type SolutionResult = {
  type: SolutionType;
  solution: string;
  rref: number[][];
};

function solveUsingGaussJordan(matrix: number[][]): SolutionResult {
  let m = matrix.map((row) => [...row]);
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

    for (let i = 0; i < numRows; i++) {
      if (i === r) continue;
      val = m[i][lead];
      for (let j = 0; j < numCols; j++) {
        m[i][j] -= val * m[r][j];
      }
    }
    lead++;
  }

  m = m.map((row) => row.map((cell) => (Math.abs(cell) < EPSILON ? 0 : cell)));

  return analyzeRREF(m, numVars);
}

function analyzeRREF(rref: number[][], numVars: number): SolutionResult {
  let solutionString = '';
  const pivotCols: number[] = [];
  const freeVars: number[] = [];

  for (const row of rref) {
    const mainCoeffs = row.slice(0, numVars);
    const constant = row[numVars];
    const isAllZeroCoeffs = mainCoeffs.every((val) => Math.abs(val) < EPSILON);

    if (isAllZeroCoeffs && Math.abs(constant) > EPSILON) {
      return { type: 'none', solution: 'System has no solution (inconsistent).', rref };
    }
  }

  let validRows = 0;
  for (let r = 0; r < rref.length; r++) {
    let pivotFound = false;
    for (let c = 0; c < numVars; c++) {
      if (Math.abs(rref[r][c] - 1) < EPSILON) {
        pivotCols[c] = validRows;
        pivotFound = true;
        validRows++;
        break;
      } else if (Math.abs(rref[r][c]) > EPSILON) {
        pivotFound = true;
        validRows++;
        break;
      }
    }
  }

  for (let i = 0; i < numVars; i++) {
    if (pivotCols[i] === undefined) {
      freeVars.push(i);
    }
  }

  if (freeVars.length === 0) {
    const solution = [];
    for (let i = 0; i < numVars; i++) {
      solution[i] = rref[pivotCols[i]][numVars].toFixed(4);
      solutionString += `${String.fromCharCode(120 + i)} = ${solution[i]}\n`;
    }
    return { type: 'unique', solution: solutionString, rref };
  }

  let paramIndex = 1;
  const solutionParams = Array(numVars).fill(null);
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
        paramStr += ` ${-coeff > 0 ? '+' : ''} ${-coeff.toFixed(4)}${solutionParams[freeVarIndex]}`;
      }
    }
    solutionParams[i] = paramStr;
  }

  solutionString = solutionParams
    .map((s, i) => `${String.fromCharCode(120 + i)} = ${s}`)
    .join('\n');

  return { type: 'parametric', solution: solutionString, rref };
}

const SLESolver = () => {
  const [size, setSize] = useState(3);
  const [method, setMethod] = useState<'gaussian' | 'cramer'>('gaussian');
  const [matrix, setMatrix] = useState<string[][]>(
    Array(3)
      .fill(null)
      .map(() => Array(4).fill('0'))
  );
  const [solution, setSolution] = useState<string>('');
  const [solutionType, setSolutionType] = useState<SolutionType>('');
  const [solutionMethod, setSolutionMethod] = useState<string>('');
  const [error, setError] = useState('');

  const methodInfo = useMemo(() => {
    switch (method) {
      case 'gaussian':
        return {
          title: 'Gauss-Jordan Elimination',
          description:
            'Uses row operations to reduce matrix to reduced row echelon form (RREF). Works for all system types.',
          advantages: [
            'Handles any system size and type',
            'Can determine unique, infinite, or no solutions',
            'Shows complete solution analysis',
            'Works with non-square matrices',
          ],
          limitations: [
            'More computational steps than Cramers rule for unique solutions',
            'Requires careful handling of floating-point precision',
          ],
          complexity: 'O(n³) operations',
          bestFor: 'General purpose, educational understanding of solution types',
          icon: null as ReactElement | null,
        };
      case 'cramer':
        return {
          title: 'Cramers Rule',
          description:
            'Uses determinants to solve square systems. Only works when the system has a unique solution.',
          advantages: [
            'Direct formula for unique solutions',
            'Fast for small systems (n ≤ 3)',
            'Elegant mathematical approach',
            'Each variable solved independently',
          ],
          limitations: [
            'Only works for square matrices (n×n)',
            'Requires non-zero determinant',
            'Cannot handle infinite or no-solution cases',
            'Computationally expensive for large n',
          ],
          complexity: 'O(n!·n) for determinant calculation',
          bestFor: 'Small square systems with guaranteed unique solutions',
          icon: null as ReactElement | null,
        };
      default:
        return null;
    }
  }, [method]);

  const updateMatrixSize = (newSize: number) => {
    setSize(newSize);
    const newMatrix = Array(newSize)
      .fill(null)
      .map((_, i) =>
        Array(newSize + 1)
          .fill(null)
          .map((_, j) => (matrix[i] && matrix[i][j] ? matrix[i][j] : '0'))
      );
    setMatrix(newMatrix);
  };

  const updateCell = (row: number, col: number, value: string) => {
    const newMatrix = [...matrix];
    newMatrix[row][col] = value;
    setMatrix(newMatrix);
  };

  const solveSLE = () => {
    try {
      setError('');
      setSolution('');
      setSolutionType('');
      setSolutionMethod('');

      const numMatrix = matrix.map((row) => row.map((cell) => parseFloat(cell) || 0));
      const A = numMatrix.map((row) => row.slice(0, -1));
      const b = numMatrix.map((row) => row[row.length - 1]);

      if (method === 'gaussian') {
        const result = solveUsingGaussJordan(numMatrix);
        setSolutionType(result.type);
        setSolution(result.solution);
        setSolutionMethod('Gauss-Jordan Elimination');
      } else if (method === 'cramer') {
        if (A.length !== A[0].length) {
          throw new Error("Cramer's rule requires a square matrix (N variables, N equations).");
        }
        const detA = math.det(A);

        if (Math.abs(detA) < EPSILON) {
          const result = solveUsingGaussJordan(numMatrix);
          setSolutionType(result.type);
          setSolution(result.solution);
          setSolutionMethod("Cramer's Rule");
          if (result.type === 'none') setError('Determinant is zero. System has no solution.');
          if (result.type === 'parametric')
            setError('Determinant is zero. System has infinite solutions.');
        } else {
          const cramerResult = [];
          for (let i = 0; i < size; i++) {
            const Ai = A.map((row) => [...row]);
            for (let j = 0; j < size; j++) {
              Ai[j][i] = b[j];
            }
            const detAi = math.det(Ai);
            cramerResult.push(detAi / detA);
          }

          const variables = Array.from({ length: size }, (_, i) => String.fromCharCode(120 + i));
          const resultText = cramerResult
            .map((val, idx) => `${variables[idx]} = ${val.toFixed(4)}`)
            .join('\n');

          setSolutionType('unique');
          setSolution(resultText);
          setSolutionMethod("Cramer's Rule");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve system');
      setSolution('');
      setSolutionType('');
      setSolutionMethod('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Matrix Size (N × N+1)</Text>
            <View style={styles.sizeControls}>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => updateMatrixSize(Math.max(2, size - 1))}
                disabled={size <= 2}>
                <Minus size={20} color={size <= 2 ? '#94a3b8' : '#0f172a'} />
              </TouchableOpacity>
              <View style={styles.sizeDisplay}>
                <Text style={styles.sizeText}>
                  {size} × {size + 1}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => updateMatrixSize(Math.min(6, size + 1))}
                disabled={size >= 6}>
                <Plus size={20} color={size >= 6 ? '#94a3b8' : '#0f172a'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.flex1}>
            <Text style={styles.label}>Solving Method</Text>
            <View style={styles.methodButtons}>
              <TouchableOpacity
                style={[styles.methodButton, method === 'gaussian' && styles.methodButtonActive]}
                onPress={() => setMethod('gaussian')}>
                <Text
                  style={[
                    styles.methodButtonText,
                    method === 'gaussian' && styles.methodButtonTextActive,
                  ]}>
                  Gauss-Jordan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, method === 'cramer' && styles.methodButtonActive]}
                onPress={() => setMethod('cramer')}>
                <Text
                  style={[
                    styles.methodButtonText,
                    method === 'cramer' && styles.methodButtonTextActive,
                  ]}>
                  Cramer's Rule
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Augmented Matrix [A|b]</Text>
        <Text style={styles.helper}>The last column represents the constants (right-hand side)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.matrixContainer}>
            {matrix.map((row, i) => (
              <View key={i} style={styles.matrixRow}>
                {row.map((cell, j) => (
                  <TextInput
                    key={`${i}-${j}`}
                    value={cell}
                    onChangeText={(val) => updateCell(i, j, val)}
                    keyboardType="numeric"
                    style={[
                      styles.matrixCell,
                      j === row.length - 1 && styles.matrixCellLast,
                    ]}
                    placeholder="0"
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.solveButton} onPress={solveSLE}>
          <Calculator size={20} color="#ffffff" />
          <Text style={styles.solveButtonText}>Calculate Solution</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.section}>
          <View style={styles.errorAlert}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      {solution && (
        <View style={styles.section}>
          <Text style={styles.label}>
            {solutionMethod} (
            {solutionType === 'unique' && 'Unique Solution'}
            {solutionType === 'parametric' && 'Infinite Solutions'}
            {solutionType === 'none' && 'No Solution'})
          </Text>
          <View style={styles.solutionBox}>
            <Text style={styles.solutionText}>{solution}</Text>
          </View>
        </View>
      )}

      {methodInfo && (
        <View style={[styles.section, styles.infoSection]}>
          <View style={styles.infoHeader}>
            {method === 'gaussian' ? (
              <Book size={16} color="#3b82f6" />
            ) : (
              <Zap size={16} color="#3b82f6" />
            )}
            <Text style={styles.infoTitle}>{methodInfo.title}</Text>
          </View>
          <Text style={styles.infoDescription}>{methodInfo.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoSubtitle}>Advantages:</Text>
              {methodInfo.advantages.map((advantage, i) => (
                <Text key={i} style={styles.infoItem}>
                  • {advantage}
                </Text>
              ))}
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoSubtitle}>Limitations:</Text>
              {methodInfo.limitations.map((limitation, i) => (
                <Text key={i} style={styles.infoItem}>
                  • {limitation}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.infoFooter}>
            <Text style={styles.infoMeta}>
              <Text style={styles.infoMetaLabel}>Complexity:</Text> {methodInfo.complexity}
            </Text>
            <Text style={styles.infoMeta}>
              <Text style={styles.infoMetaLabel}>Best for:</Text> {methodInfo.bestFor}
            </Text>
          </View>

          {method === 'cramer' && size !== matrix[0]?.length - 1 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                <Text style={styles.warningBold}>Note:</Text> Cramer's rule requires a square
                matrix. Current matrix is {size}×{size + 1}.
                {size > matrix[0]?.length - 1
                  ? ' Reduce matrix size or use Gauss-Jordan.'
                  : ' Matrix size is appropriate.'}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  sizeDisplay: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  methodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  methodButtonTextActive: {
    color: '#ffffff',
  },
  matrixContainer: {
    marginTop: 12,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  matrixCell: {
    width: 70,
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    fontSize: 14,
    color: '#0f172a',
  },
  matrixCellLast: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  solveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  solveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorAlert: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  solutionBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  solutionText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#0f172a',
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoDescription: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoColumn: {
    flex: 1,
    gap: 8,
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  infoItem: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  infoFooter: {
    gap: 8,
    marginBottom: 12,
  },
  infoMeta: {
    fontSize: 12,
    color: '#0f172a',
  },
  infoMetaLabel: {
    fontWeight: '700',
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: '700',
  },
});

export default SLESolver;

