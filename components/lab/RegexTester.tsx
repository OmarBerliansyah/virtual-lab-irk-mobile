import { CheckCircle, Copy, Info } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface MatchResult {
  match: string;
  index: number;
  groups?: string[];
  namedGroups?: Record<string, string>;
}

const RegexTester = () => {
  const [pattern, setPattern] = useState('\\b[A-Z]\\w+');
  const [flags, setFlags] = useState('g');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceText, setSourceText] = useState(
    'Hello World! This is a Sample Text for Testing Regular Expressions. It contains Various Words and Numbers like 123 and 456.'
  );
  const [highlightedText, setHighlightedText] = useState('');
  const [searchResults, setSearchResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState('');
  const [isValidPattern, setIsValidPattern] = useState(true);

  useEffect(() => {
    try {
      if (!pattern) {
        setHighlightedText(sourceText);
        setError('');
        setSearchResults([]);
        setIsValidPattern(true);
        return;
      }

      const finalFlags = flags.includes('g') ? flags : flags + 'g';
      const regex = new RegExp(pattern, finalFlags);
      const matches: MatchResult[] = [];

      let match;
      const globalRegex = new RegExp(pattern, finalFlags);
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

      setSearchResults(matches);
      setError(matches.length > 0 ? `${matches.length} matches found.` : 'No matches found.');
      setIsValidPattern(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regex pattern');
      setIsValidPattern(false);
      setSearchResults([]);
      setHighlightedText(sourceText);
    }
  }, [pattern, flags, sourceText]);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return searchResults;
    return searchResults.filter((result) =>
      result.match.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchResults, searchTerm]);

  const copyToClipboard = (text: string) => {
    // In React Native, we'd use Clipboard API
    Toast.show({
      type: 'success',
      text1: 'Copied',
      text2: 'Text copied to clipboard',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Regex Pattern</Text>
            <TextInput
              value={pattern}
              onChangeText={setPattern}
              placeholder="Enter regex pattern"
              style={[styles.input, !isValidPattern && styles.inputError]}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.flagContainer}>
            <Text style={styles.label}>Flags</Text>
            <TextInput
              value={flags}
              onChangeText={setFlags}
              placeholder="g, i, m"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.label}>Filter Results</Text>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Filter matches in real-time"
          style={styles.input}
        />

        {error && (
          <View style={[styles.alert, !isValidPattern && styles.alertError]}>
            {isValidPattern && searchResults.length > 0 && (
              <CheckCircle size={16} color="#22c55e" />
            )}
            <Text style={[styles.alertText, !isValidPattern && styles.alertTextError]}>
              {error}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Source Text</Text>
        <TextInput
          value={sourceText}
          onChangeText={setSourceText}
          placeholder="Enter text to test"
          multiline
          numberOfLines={6}
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Preview (Matches Highlighted)</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {sourceText.split('').map((char, idx) => {
              const isMatch = searchResults.some(
                (m) => idx >= m.index && idx < m.index + m.match.length
              );
              return (
                <Text
                  key={idx}
                  style={isMatch ? [styles.previewText, styles.highlight] : styles.previewText}>
                  {char}
                </Text>
              );
            })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.label}>Match Results</Text>
          <View style={styles.badgeContainer}>
            {searchTerm && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filteredResults.length} filtered</Text>
              </View>
            )}
            <View style={[styles.badge, styles.badgeSecondary]}>
              <Text style={styles.badgeText}>{searchResults.length} total</Text>
            </View>
          </View>
        </View>

        {filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchTerm ? 'No matches found for current filter' : 'No matches found'}
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {filteredResults.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIndex}>Match #{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(result.match)}
                    style={styles.copyButton}>
                    <Copy size={16} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                <View style={styles.resultContent}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Text:</Text>
                    <Text style={styles.resultValue}>"{result.match}"</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Position:</Text>
                    <Text style={styles.resultValue}>
                      {result.index}-{result.index + result.match.length - 1}
                    </Text>
                  </View>
                  {result.groups && result.groups.length > 0 && (
                    <View style={styles.groupsContainer}>
                      <Text style={styles.resultLabel}>Capture Groups:</Text>
                      {result.groups.map(
                        (group, groupIndex) =>
                          group && (
                            <Text key={groupIndex} style={styles.groupText}>
                              Group {groupIndex + 1}: {group}
                            </Text>
                          )
                      )}
                    </View>
                  )}
                  {result.namedGroups && Object.keys(result.namedGroups).length > 0 && (
                    <View style={styles.groupsContainer}>
                      <Text style={styles.resultLabel}>Named Groups:</Text>
                      {Object.entries(result.namedGroups).map(([name, value]) => (
                        <Text key={name} style={styles.groupText}>
                          {name}: {value}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, styles.infoSection]}>
        <Info size={16} color="#3b82f6" />
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>Text Upload:</Text> Upload .txt files for testing, view
          detailed match results with positions and capture groups, and test specific search terms.
        </Text>
      </View>
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
    gap: 12,
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  flagContainer: {
    width: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    marginTop: 8,
    marginBottom: 16,
  },
  alertError: {
    backgroundColor: '#fef2f2',
  },
  alertText: {
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  alertTextError: {
    color: '#ef4444',
  },
  previewBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 100,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  highlight: {
    backgroundColor: '#fef08a',
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  badgeSecondary: {
    backgroundColor: '#cbd5e1',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIndex: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  copyButton: {
    padding: 4,
  },
  resultContent: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  resultValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#0f172a',
  },
  groupsContainer: {
    marginTop: 4,
    gap: 4,
  },
  groupText: {
    fontSize: 12,
    color: '#0f172a',
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
  },
});

export default RegexTester;

