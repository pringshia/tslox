import { useState, useCallback } from "react";
import { lexer } from "@lib/main";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
// import "prismjs/components/prism-clike";
import "prismjs/themes/prism.css";

function App() {
  const codeSamples = [
    `// type code here...\nfun add(a, b) {\n  return a + b;\n}`,
    `var myString = "\n\tsome\n\ttext"\n`,
    `var myString = "\n\tsome\n\ttext\n`,
    `var results = 4 + 5 # 2`,
  ];

  const [code, setCode] = useState(codeSamples[0]);

  const showPreset = useCallback(
    (index: number) => {
      setCode(codeSamples[index]);
    },
    [codeSamples, setCode]
  );

  return (
    <div className="app">
      <div className="header">
        <h1>
          <pre>tslox</pre>
        </h1>
      </div>
      <div className="container">
        <div className="editor">
          <ul className="quicklinks">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  showPreset(0);
                  e.preventDefault();
                }}
              >
                Basic
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  showPreset(1);
                  e.preventDefault();
                }}
              >
                Multi-line strings
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  showPreset(2);
                  e.preventDefault();
                }}
              >
                Unterminated strings
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  showPreset(3);
                  e.preventDefault();
                }}
              >
                Unknown identifier
              </a>
            </li>
          </ul>
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={(code) =>
              // Prism.highlight(code, Prism.languages["clike"], "clike")
              code
            }
            padding={10}
            style={{
              flex: 1,
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 24,
              lineHeight: 1.3,
            }}
          />
        </div>
        <div className="panel">
          <h2>Tokens</h2>
          {lexer.getTokens(code).result.map((tokens) => (
            <span className="lexed-token" title={tokens.lexeme}>
              {tokens.type}
            </span>
          ))}
          {!lexer.getTokens(code).errors?.length ? null : <h2>Errors</h2>}
          {lexer.getTokens(code).errors?.map((error) => (
            <span className="lexed-token">
              L{error.line}: {error.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
