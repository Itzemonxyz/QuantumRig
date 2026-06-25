const fs = require("fs");
const path = require("path");

const allFiles = [];
function findFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      findFiles(full);
    } else if (full.endsWith(".tsx")) {
      allFiles.push(full);
    }
  }
}
findFiles("src");

for (const file of allFiles) {
  const code = fs.readFileSync(file, "utf8");
  const lines = code.split("\n");
  
  let functionStarts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^(export default )?(async )?function [A-Z]/)) {
      functionStarts.push({ line: i, name: lines[i].match(/function ([A-Za-z]+)/)[1] });
    } else if (lines[i].match(/^(export const [A-Z].*) = (.*)\=\>/)) {
      functionStarts.push({ line: i, name: lines[i].match(/export const ([A-Za-z]+)/)[1] });
    }
  }

  for (let f of functionStarts) {
    let scopeBraces = 0;
    let foundReturn = false;
    let foundHookAfterReturn = false;
    let hookAfterReturnLines = [];

    // Simple heuristic parser
    for (let i = f.line; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("{")) scopeBraces += line.split("{").length - 1;
      if (line.includes("}")) scopeBraces -= line.split("}").length - 1;

      if (scopeBraces === 1 && line.trim().startsWith("return") && !line.includes("=>") && !line.match(/return \(\s*$/)) {
          // If it isn't an early return of a JSX block starting on next line
        foundReturn = true;
      }
      if (scopeBraces === 1 && line.trim().startsWith("if") && line.includes("return")) {
         foundReturn = true;
      }

      if (foundReturn && scopeBraces === 1 && line.match(/use[A-Z]/)) {
        foundHookAfterReturn = true;
        hookAfterReturnLines.push(i+1 + ": " + line);
      }

      if (scopeBraces <= 0 && i > f.line) {
        break; // end of function
      }
    }

    if (foundHookAfterReturn) {
      console.log(`Problem in ${file} at ${f.name}`);
      console.log(hookAfterReturnLines.join("\n"));
    }
  }
}
