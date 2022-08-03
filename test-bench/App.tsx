import { useState } from "react";
import { parser } from "@lib/main";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/themes/prism.css";

function App() {
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}`);

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
            Prism.highlight(code, Prism.languages["clike"], "clike")
          }
          padding={10}
          style={{
            flex: 1,
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 24,
            lineHeight: 1.3,
          }}
        />
        <div className="panel">{parser(code)}</div>
      </div>
    </div>
  );
}

export default App;
