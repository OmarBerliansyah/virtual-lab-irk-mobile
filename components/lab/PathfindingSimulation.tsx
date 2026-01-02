import { Circle, Flag, Info, MapPin, MousePointer, Move, Play, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = 400;
const NODE_RADIUS = 20;
const CLICK_THRESHOLD = NODE_RADIUS * 1.5;

interface Node {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface Edge {
  id: string;
  from: number;
  to: number;
  weight: number;
}

type Mode = 'addNode' | 'addEdge' | 'setStart' | 'setEnd' | 'select';
type Algorithm = 'bfs' | 'dfs' | 'tsp';

interface AlgoStep {
  visited: number[];
  path: number[];
  queue?: number[];
  stack?: number[];
  current?: number;
}

const getDistance = (n1: Node, n2: Node): number => {
  return Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
};

const getNearestNode = (x: number, y: number, nodes: Node[]): Node | null => {
  let nearest: Node | null = null;
  let minDist = Infinity;
  for (const node of nodes) {
    const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
    if (dist < minDist && dist < CLICK_THRESHOLD) {
      minDist = dist;
      nearest = node;
    }
  }
  return nearest;
};

const PathfindingSimulation = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);

  const [mode, setMode] = useState<Mode>('addNode');
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');

  const [isVisualizing, setIsVisualizing] = useState(false);
  const [addEdgeStart, setAddEdgeStart] = useState<number | null>(null);

  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set());

  const [visResult, setVisResult] = useState<{ path: string; cost: number } | null>(null);
  const [visSteps, setVisSteps] = useState<AlgoStep[]>([]);
  const [currentStep, setCurrentStep] = useState<AlgoStep | null>(null);

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<number | null>(null);
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 10; // Minimum pixels to move before considering it a drag
  
  // Use refs to track current values for PanResponder callbacks
  const modeRef = useRef<Mode>(mode);
  const nodesRef = useRef<Node[]>(nodes);
  const handleCanvasPressRef = useRef<((event: any) => void) | null>(null);
  
  // Update refs when state changes
  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const buildAdjList = (): Map<number, { to: number; weight: number }[]> => {
    const adj = new Map<number, { to: number; weight: number }[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      adj.get(e.from)?.push({ to: e.to, weight: e.weight });
      adj.get(e.to)?.push({ to: e.from, weight: e.weight });
    });
    return adj;
  };

  const handleCanvasPress = useCallback(
    (event: any) => {
      if (isVisualizing) return;

      const { locationX, locationY } = event.nativeEvent;
      const clickedNode = getNearestNode(locationX, locationY, nodes);

      switch (mode) {
        case 'addNode':
          if (!clickedNode) {
            const newNodeId = nodes.length > 0 ? Math.max(...nodes.map((n) => n.id)) + 1 : 1;
            setNodes((prevNodes) => [
              ...prevNodes,
              {
                id: newNodeId,
                x: locationX,
                y: locationY,
                label: String.fromCharCode(64 + newNodeId),
              },
            ]);
            Toast.show({
              type: 'success',
              text1: 'Node Added',
              text2: `Node ${String.fromCharCode(64 + newNodeId)} created`,
            });
          }
          break;

        case 'addEdge':
          if (clickedNode) {
            if (addEdgeStart === null) {
              setAddEdgeStart(clickedNode.id);
              Toast.show({
                type: 'info',
                text1: 'Edge Mode',
                text2: `Selected node ${clickedNode.label || clickedNode.id}. Select second node.`,
              });
            } else if (addEdgeStart !== clickedNode.id) {
              const fromNode = nodes.find((n) => n.id === addEdgeStart);
              if (!fromNode) {
                setAddEdgeStart(null);
                return;
              }

              const edgeExists = edges.some(
                (edge) =>
                  (edge.from === addEdgeStart && edge.to === clickedNode.id) ||
                  (edge.from === clickedNode.id && edge.to === addEdgeStart)
              );

              if (!edgeExists) {
                const weight = getDistance(fromNode, clickedNode);
                const newEdge: Edge = {
                  id: `${addEdgeStart}-${clickedNode.id}`,
                  from: addEdgeStart,
                  to: clickedNode.id,
                  weight,
                };
                setEdges((prevEdges) => [...prevEdges, newEdge]);
                Toast.show({
                  type: 'success',
                  text1: 'Edge Created',
                  text2: `Connected ${fromNode.label || addEdgeStart} → ${clickedNode.label || clickedNode.id}`,
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Edge Exists',
                  text2: 'These nodes are already connected',
                });
              }
              setAddEdgeStart(null);
            } else {
              // Clicked the same node, cancel edge creation
              setAddEdgeStart(null);
              Toast.show({
                type: 'info',
                text1: 'Cancelled',
                text2: 'Edge creation cancelled',
              });
            }
          } else {
            // Clicked empty space, cancel edge creation
            if (addEdgeStart !== null) {
              setAddEdgeStart(null);
              Toast.show({
                type: 'info',
                text1: 'Cancelled',
                text2: 'Edge creation cancelled',
              });
            }
          }
          break;

        case 'setStart':
          if (clickedNode) {
            setStartNode(clickedNode.id);
            Toast.show({
              type: 'success',
              text1: 'Start Node Set',
              text2: `Node ${clickedNode.label || clickedNode.id} is now the start`,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'No Node Selected',
              text2: 'Tap on a node to set it as the start',
            });
          }
          break;

        case 'setEnd':
          if (clickedNode) {
            if (algorithm === 'tsp') {
              Toast.show({
                type: 'info',
                text1: 'TSP Mode',
                text2: 'TSP only requires a start node',
              });
              return;
            }
            setEndNode(clickedNode.id);
            Toast.show({
              type: 'success',
              text1: 'End Node Set',
              text2: `Node ${clickedNode.label || clickedNode.id} is now the end`,
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'No Node Selected',
              text2: 'Tap on a node to set it as the end',
            });
          }
          break;

        case 'select':
          if (clickedNode) {
            setSelectedNodes((prevSelected) => {
              const newSelected = new Set(prevSelected);
              if (newSelected.has(clickedNode.id)) {
                newSelected.delete(clickedNode.id);
                Toast.show({
                  type: 'info',
                  text1: 'Node Deselected',
                  text2: `Node ${clickedNode.label || clickedNode.id} deselected`,
                });
              } else {
                newSelected.add(clickedNode.id);
                Toast.show({
                  type: 'info',
                  text1: 'Node Selected',
                  text2: `Node ${clickedNode.label || clickedNode.id} selected`,
                });
              }
              return newSelected;
            });
            setSelectedEdges(new Set());
          } else {
            // Clicked empty space, deselect all
            setSelectedNodes(new Set());
            setSelectedEdges(new Set());
          }
          break;
      }
    },
    [mode, nodes, edges, addEdgeStart, selectedNodes, isVisualizing, algorithm]
  );
  
  // Update the ref whenever handleCanvasPress changes
  React.useEffect(() => {
    handleCanvasPressRef.current = handleCanvasPress;
  }, [handleCanvasPress]);

  const handleLongPress = useCallback(
    (event: any) => {
      if (isVisualizing || mode !== 'select') return;

      const { locationX, locationY } = event.nativeEvent;
      const clickedNode = getNearestNode(locationX, locationY, nodes);

      if (clickedNode) {
        if (startNode === clickedNode.id) {
          setStartNode(null);
        } else if (endNode === clickedNode.id) {
          setEndNode(null);
        } else if (!startNode) {
          setStartNode(clickedNode.id);
        } else if (!endNode && algorithm !== 'tsp') {
          setEndNode(clickedNode.id);
        }
      }
    },
    [nodes, startNode, endNode, mode, algorithm, isVisualizing]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture movement if we're in select mode and have moved enough
        const currentMode = modeRef.current;
        if (currentMode === 'select') {
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          return dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD;
        }
        return false;
      },
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setStartPosition({ x: locationX, y: locationY });
        const currentNodes = nodesRef.current;
        const currentMode = modeRef.current;
        const clickedNode = getNearestNode(locationX, locationY, currentNodes);

        // Only prepare for dragging if in select mode and clicked on a node
        if (clickedNode && currentMode === 'select') {
          setDragNodeId(clickedNode.id);
        } else {
          setDragNodeId(null);
        }

        const timer = setTimeout(() => {
          handleLongPress(event);
        }, 500) as unknown as NodeJS.Timeout;
        setLongPressTimer(timer);
      },
      onPanResponderMove: (event, gestureState) => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        // Check if we've moved enough to consider it a drag
        const currentMode = modeRef.current;
        if (startPosition && dragNodeId !== null && currentMode === 'select') {
          const dx = Math.abs(gestureState.dx);
          const dy = Math.abs(gestureState.dy);
          
          if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            if (!isDragging) {
              setIsDragging(true);
            }
            
            const { locationX, locationY } = event.nativeEvent;
            const currentNodes = nodesRef.current;
            setNodes(
              currentNodes.map((n) =>
                n.id === dragNodeId
                  ? {
                      ...n,
                      x: Math.max(NODE_RADIUS, Math.min(CANVAS_WIDTH - NODE_RADIUS, locationX)),
                      y: Math.max(NODE_RADIUS, Math.min(CANVAS_HEIGHT - NODE_RADIUS, locationY)),
                    }
                  : n
              )
            );
          }
        }
      },
      onPanResponderRelease: (event) => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        // Always handle as tap if we didn't drag (for all modes)
        if (!isDragging && handleCanvasPressRef.current) {
          handleCanvasPressRef.current(event);
        }

        // Reset all drag-related state
        setIsDragging(false);
        setDragNodeId(null);
        setStartPosition(null);
      },
      onPanResponderTerminate: () => {
        // Clean up on termination
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
        setIsDragging(false);
        setDragNodeId(null);
        setStartPosition(null);
      },
    })
  ).current;

  const visualize = (steps: AlgoStep[], finalPath: number[], totalCost: number) => {
    setIsVisualizing(true);
    setVisResult(null);
    setCurrentStep(null);
    let step = 0;

    // Limit steps to prevent memory issues
    const MAX_STEPS = 1000;
    const limitedSteps = steps.slice(0, MAX_STEPS);
    const hasMoreSteps = steps.length > MAX_STEPS;

    const interval = setInterval(() => {
      try {
        if (step < limitedSteps.length) {
          setCurrentStep(limitedSteps[step++]);
        } else {
          clearInterval(interval);
          setIsVisualizing(false);
          const finalStep = limitedSteps[limitedSteps.length - 1] || { visited: [], path: finalPath };
          setCurrentStep({ ...finalStep, path: finalPath });
          setVisResult({
            path: finalPath.join(' → '),
            cost: totalCost,
          });
          Toast.show({
            type: 'success',
            text1: 'Visualization Complete',
            text2: hasMoreSteps 
              ? `Path: ${finalPath.join(' → ')} (showing first ${MAX_STEPS} steps)`
              : `Path: ${finalPath.join(' → ')}`,
          });
        }
      } catch (error) {
        clearInterval(interval);
        setIsVisualizing(false);
        Toast.show({
          type: 'error',
          text1: 'Visualization Error',
          text2: 'An error occurred during visualization',
        });
      }
    }, 200);
  };

  const startVisualization = () => {
    if (!startNode) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No start node selected.',
      });
      return;
    }

    if ((algorithm === 'bfs' || algorithm === 'dfs') && !endNode) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `${algorithm.toUpperCase()} requires both start and end nodes.`,
      });
      return;
    }

    const adj = buildAdjList();
    const steps: AlgoStep[] = [];
    let finalPath: number[] = [];
    let totalCost: number = 0;

    if (algorithm === 'bfs') {
      const q: number[] = [startNode];
      const visited: number[] = [startNode];
      const parent = new Map<number, number | null>([[startNode, null]]);

      steps.push({ visited: [...visited], path: [], queue: [...q] });

      let found = false;
      while (q.length > 0) {
        const current = q.shift()!;
        if (current === endNode) {
          found = true;
          break;
        }

        adj.get(current)?.forEach((neighbor) => {
          if (!visited.includes(neighbor.to)) {
            visited.push(neighbor.to);
            parent.set(neighbor.to, current);
            q.push(neighbor.to);
          }
        });
        steps.push({ visited: [...visited], path: [], queue: [...q], current });
      }

      if (found) {
        let at = endNode;
        while (at !== null) {
          finalPath.unshift(at);
          at = parent.get(at)!;
        }
      }
    } else if (algorithm === 'dfs') {
      const s: number[] = [startNode];
      const visited: number[] = [];
      const parent = new Map<number, number | null>();
      parent.set(startNode, null); // Initialize start node parent

      let found = false;
      let iterations = 0;
      const maxIterations = nodes.length * nodes.length; // Safety limit

      while (s.length > 0 && iterations < maxIterations) {
        iterations++;
        const current = s.pop()!;

        if (visited.includes(current)) continue;
        visited.push(current);
        steps.push({ visited: [...visited], path: [], stack: [...s], current });

        if (current === endNode) {
          found = true;
          break;
        }

        [...(adj.get(current) || [])].reverse().forEach((neighbor) => {
          if (!visited.includes(neighbor.to)) {
            // Only set parent if not already set (first time we discover this node)
            if (!parent.has(neighbor.to)) {
              parent.set(neighbor.to, current);
            }
            s.push(neighbor.to);
          }
        });
      }

      if (found && endNode !== null) {
        let at: number | null = endNode;
        while (at !== null && at !== undefined) {
          finalPath.unshift(at);
          const next = parent.get(at);
          at = next !== undefined ? next : null;
          // Safety check to prevent infinite loops
          if (finalPath.length > nodes.length) {
            break;
          }
        }
      }
    } else if (algorithm === 'tsp') {
      if (nodes.length < 2) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'TSP requires at least 2 nodes.',
        });
        return;
      }

      const unvisited = new Set(nodes.map((n) => n.id));
      let current = startNode;
      unvisited.delete(current);
      finalPath = [current];
      steps.push({ visited: [current], path: [current], current });

      while (unvisited.size > 0) {
        let nearestDist = Infinity;
        let nearestNode: number | null = null;

        const currentNode = nodes.find((n) => n.id === current)!;

        unvisited.forEach((nodeId) => {
          const neighborNode = nodes.find((n) => n.id === nodeId)!;
          const dist = getDistance(currentNode, neighborNode);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestNode = nodeId;
          }
        });

        if (nearestNode) {
          totalCost += nearestDist;
          current = nearestNode;
          unvisited.delete(current);
          finalPath.push(current);
          steps.push({ visited: [...finalPath], path: [...finalPath], current });
        }
      }

      const lastNode = nodes.find((n) => n.id === current)!;
      const start = nodes.find((n) => n.id === startNode)!;
      totalCost += getDistance(lastNode, start);
      finalPath.push(startNode);
      steps.push({ visited: [...finalPath], path: [...finalPath], current: startNode });
    }

    if (finalPath.length > 1 && algorithm !== 'tsp') {
      for (let i = 0; i < finalPath.length - 1; i++) {
        const edge = edges.find(
          (e) =>
            (e.from === finalPath[i] && e.to === finalPath[i + 1]) ||
            (e.from === finalPath[i + 1] && e.to === finalPath[i])
        );
        if (edge) totalCost += edge.weight;
      }
    }

    visualize(steps, finalPath, totalCost);
  };

  const reset = () => {
    setNodes([]);
    setEdges([]);
    setStartNode(null);
    setEndNode(null);
    setIsVisualizing(false);
    setAddEdgeStart(null);
    setCurrentStep(null);
    setVisResult(null);
    setVisSteps([]);
    setSelectedNodes(new Set());
    setSelectedEdges(new Set());
  };

  const getNodeColor = (node: Node): string => {
    if (selectedNodes.has(node.id)) return '#f59e0b';
    if (node.id === startNode) return '#22c55e';
    if (node.id === endNode) return '#ef4444';
    if (currentStep?.current === node.id) return '#f97316';
    if (currentStep?.path.includes(node.id)) return '#ec4899';
    if (currentStep?.visited.includes(node.id)) return '#a855f7';
    if (currentStep?.queue?.includes(node.id) || currentStep?.stack?.includes(node.id))
      return '#06b6d4';
    return '#3b82f6';
  };

  const getEdgeColor = (edge: Edge): string => {
    if (selectedEdges.has(edge.id)) return '#f59e0b';
          if (
            currentStep &&
            currentStep.path &&
            currentStep.path.length > 1 &&
            currentStep.path.some(
              (n, i) =>
                i < currentStep.path.length - 1 &&
                ((n === edge.from && currentStep.path[i + 1] === edge.to) ||
                  (n === edge.to && currentStep.path[i + 1] === edge.from))
            )
          )
            return '#ef4444';
    return '#a1a1aa';
  };

  const modeButtons: { value: Mode; label: string; icon: any }[] = [
    { value: 'addNode', label: 'Node', icon: Circle },
    { value: 'addEdge', label: 'Edge', icon: Move },
    { value: 'setStart', label: 'Start', icon: MapPin },
    { value: 'setEnd', label: 'End', icon: Flag },
    { value: 'select', label: 'Select', icon: MousePointer },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.modeButtons}>
            {modeButtons.map((btn) => (
              <TouchableOpacity
                key={btn.value}
                style={[styles.modeButton, mode === btn.value && styles.modeButtonActive]}
                onPress={() => setMode(btn.value)}
                disabled={isVisualizing || (btn.value === 'setEnd' && algorithm === 'tsp')}>
                <btn.icon size={16} color={mode === btn.value ? '#ffffff' : '#3b82f6'} />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === btn.value && styles.modeButtonTextActive,
                  ]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.algorithmRow}>
          <Text style={styles.algorithmLabel}>Algorithm:</Text>
          <View style={styles.algorithmButtons}>
            {(['bfs', 'dfs', 'tsp'] as Algorithm[]).map((algo) => (
              <TouchableOpacity
                key={algo}
                style={[
                  styles.algorithmButton,
                  algorithm === algo && styles.algorithmButtonActive,
                ]}
                onPress={() => {
                  setAlgorithm(algo);
                  if (algo === 'tsp') setEndNode(null);
                }}
                disabled={isVisualizing}>
                <Text
                  style={[
                    styles.algorithmButtonText,
                    algorithm === algo && styles.algorithmButtonTextActive,
                  ]}>
                  {algo.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startVisualization}
            disabled={isVisualizing}>
            <Play size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>
              {isVisualizing ? 'Visualizing...' : 'Visualize'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={reset}
            disabled={isVisualizing}>
            <RotateCcw size={20} color="#3b82f6" />
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={styles.canvas}>
          {edges.map((edge) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;

            return (
              <React.Fragment key={edge.id}>
                <Line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={getEdgeColor(edge)}
                  strokeWidth={selectedEdges.has(edge.id) ? 3 : 2}
                />
                <SvgText
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 5}
                  fontSize="12"
                  fill="#71717a"
                  textAnchor="middle">
                  {edge.weight.toFixed(0)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {nodes.map((node) => (
            <React.Fragment key={node.id}>
              <SvgCircle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill={getNodeColor(node)}
                stroke="#ffffff"
                strokeWidth={selectedNodes.has(node.id) ? 4 : 3}
              />
              <SvgText
                x={node.x}
                y={node.y + 4}
                fontSize="14"
                fill="#ffffff"
                textAnchor="middle"
                fontWeight="bold">
                {node.label || String(node.id)}
              </SvgText>
            </React.Fragment>
          ))}

          {addEdgeStart !== null && (
            <SvgCircle
              cx={nodes.find((n) => n.id === addEdgeStart)?.x || 0}
              cy={nodes.find((n) => n.id === addEdgeStart)?.y || 0}
              r={NODE_RADIUS + 5}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}
        </Svg>
      </View>

      {visResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Result:</Text>
          <Text style={styles.resultText}>{visResult.path}</Text>
          <Text style={styles.resultLabel}>Total Cost:</Text>
          <Text style={styles.resultText}>{visResult.cost.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Info size={16} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How to use:</Text>
          <Text style={styles.infoText}>• Add Node: Tap on empty space</Text>
          <Text style={styles.infoText}>• Add Edge: Tap two nodes in sequence</Text>
          <Text style={styles.infoText}>• Set Start/End: Use respective modes or long-press in Select mode</Text>
          <Text style={styles.infoText}>• Drag Nodes: Select mode, then drag nodes</Text>
          <Text style={styles.infoText}>
            • TSP Mode: Only requires a Start node. Finds a tour visiting all nodes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  controls: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  algorithmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  algorithmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  algorithmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  algorithmButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  algorithmButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  algorithmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  algorithmButtonTextActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  canvasContainer: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  canvas: {
    backgroundColor: '#ffffff',
  },
  resultBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#0f172a',
    lineHeight: 18,
  },
});

export default PathfindingSimulation;

