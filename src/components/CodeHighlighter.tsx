import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from 'react-native';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  maxHeight?: number;
}

export function CodeHighlighter({ code, language = '', maxHeight }: CodeHighlighterProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Syntax colors (GitHub Dark vs GitHub Light)
  const colors = {
    keyword: isDark ? '#ff7b72' : '#d73a49',
    string: isDark ? '#ffab70' : '#032f62',
    comment: isDark ? '#8b949e' : '#6a737d',
    number: isDark ? '#79c0ff' : '#005cc5',
    type: isDark ? '#4fc1ff' : '#005cc5',
    function: isDark ? '#d2a6ff' : '#6f42c1',
    punctuation: isDark ? '#c9d1d9' : '#24292e',
    text: isDark ? '#e6edf3' : '#24292e',
  };

  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'class', 
    'def', 'if', 'else', 'for', 'while', 'async', 'await', 'try', 'catch', 
    'new', 'from', 'default', 'extends', 'implements', 'interface', 'package',
    'public', 'private', 'protected', 'static', 'yield', 'in', 'of', 'typeof',
    'instanceof', 'throw', 'break', 'continue', 'switch', 'case', 'elif',
    'import', 'as', 'with', 'print'
  ]);

  const builtins = new Set([
    'string', 'number', 'boolean', 'any', 'void', 'Promise', 'console', 
    'log', 'self', 'this', 'window', 'global', 'process', 'require',
    'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Symbol',
    'Map', 'Set', 'JSON', 'Math', 'Error', 'undefined', 'null', 'true', 'false'
  ]);

  // Tokenize using regex (splits while preserving matched delimiters)
  const tokenize = (src: string) => {
    const regex = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`|\b[a-zA-Z_]\w*\b|\b\d+\b|[a-zA-Z_]\w*(?=\()|[\{\}\[\]\(\)\+\-\*\/=!;.,<>|&]+|\s+)/g;
    return src.split(regex).filter(Boolean);
  };

  const tokens = React.useMemo(() => tokenize(code), [code]);

  const renderToken = (token: string, index: number) => {
    // 1. Comments
    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('#')) {
      return (
        <ThemedText key={index} style={{ color: colors.comment, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }
    
    // 2. Strings
    if (
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith('`') && token.endsWith('`'))
    ) {
      return (
        <ThemedText key={index} style={{ color: colors.string, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }

    // 3. Keywords
    if (keywords.has(token)) {
      return (
        <ThemedText key={index} style={{ color: colors.keyword, fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' }}>
          {token}
        </ThemedText>
      );
    }

    // 4. Built-ins / Types
    if (builtins.has(token)) {
      return (
        <ThemedText key={index} style={{ color: colors.type, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }

    // 5. Numbers
    if (/^\d+$/.test(token)) {
      return (
        <ThemedText key={index} style={{ color: colors.number, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }

    // 6. Function calls (matches words followed by opening parenthesis, e.g. console.log() or print())
    // Note: the parenthesis itself is a separate token, so we check if this token matches function pattern
    if (/^[a-zA-Z_]\w*$/.test(token) && index + 1 < tokens.length && tokens[index + 1] === '(') {
      return (
        <ThemedText key={index} style={{ color: colors.function, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }

    // 7. Punctuation & Operators
    if (/^[\{\}\[\]\(\)\+\-\*\/=!;.,<>|&]+$/.test(token)) {
      return (
        <ThemedText key={index} style={{ color: colors.punctuation, fontFamily: 'monospace', fontSize: 12 }}>
          {token}
        </ThemedText>
      );
    }

    // Default: text
    return (
      <ThemedText key={index} style={{ color: colors.text, fontFamily: 'monospace', fontSize: 12 }}>
        {token}
      </ThemedText>
    );
  };

  return (
    <View 
      style={[
        styles.codeContainer, 
        { backgroundColor: isDark ? '#0d1117' : '#f6f8fa' },
        maxHeight ? { maxHeight } : null
      ]}
      accessible={true}
      accessibilityLabel={`Code snippet in ${language || 'plain text'}:\n${code}`}
      accessibilityRole="text"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled>
        <View style={styles.codeRow}>
          <ThemedText style={styles.preformatted}>
            {tokens.map((token, index) => renderToken(token, index))}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  codeContainer: {
    backgroundColor: '#0d1117',
    padding: 12,
    borderRadius: 8,
  },
  codeRow: {
    flexDirection: 'row',
  },
  preformatted: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
