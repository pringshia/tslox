import { useState } from "react";
import { lexer } from "@lib/main";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
// import "prismjs/components/prism-clike";
import "prismjs/themes/prism.css";

function App() {
  const [code, setCode] = useState(
    `// type code here...\nfunction add(a, b) {\n  return a + b;\n}`
  );

  return (
    <div className="app">
      <div className="header">
        <h1>
          <pre>tslox</pre>
        </h1>
      </div>
      <div className="container">
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
        <div className="panel">
          <h2>Tokens</h2>
          {lexer.getTokens(code).result.map((tokens) => (
            <span className="lexed-token" title={tokens.lexeme}>
              {tokens.type}
            </span>
          ))}
          <h2>Errors</h2>
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
