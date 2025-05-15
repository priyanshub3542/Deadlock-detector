function runDetection() {
  const algo = document.getElementById("algorithm").value;
  const inputData = document.getElementById("inputData").value.trim();
  document.getElementById("result").innerText = "";

  if (algo === "wfg") {
    runWFG(inputData);
  } else if (algo === "banker") {
    runBanker(inputData);
  }
}

function runWFG(input) {
  const edges = input.split("\n").map(line => line.trim().split(" ").map(Number));
  const graph = {};
  edges.forEach(([from, to]) => {
    if (!graph[from]) graph[from] = [];
    graph[from].push(to);
  });

  const nodes = Array.from(new Set(edges.flat()));
  const visited = {}, recStack = {};
  let hasCycle = false;
  let cyclePath = [];

  function dfs(node, path) {
    visited[node] = true;
    recStack[node] = true;
    path.push(node);

    for (const neighbor of (graph[node] || [])) {
      if (!visited[neighbor] && dfs(neighbor, path)) return true;
      else if (recStack[neighbor]) {
        path.push(neighbor);
        cyclePath = [...path];
        return true;
      }
    }

    recStack[node] = false;
    path.pop();
    return false;
  }

  for (const node of nodes) {
    if (!visited[node]) {
      if (dfs(node, [])) {
        hasCycle = true;
        break;
      }
    }
  }

  visualizeGraphWFG(edges, cyclePath);
  document.getElementById("result").innerText = hasCycle
    ? "🔴 Deadlock Detected (Cycle Found)"
    : "✅ No Deadlock Detected";
}

function visualizeGraphWFG(edges, cycle) {
  const elements = [];

  const allNodes = Array.from(new Set(edges.flat()));
  allNodes.forEach(id => {
    elements.push({ data: { id: `P${id}`, label: `P${id}` } });
  });

  edges.forEach(([from, to]) => {
    elements.push({
      data: {
        id: `e${from}${to}`,
        source: `P${from}`,
        target: `P${to}`
      }
    });
  });

  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': '#0074D9',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle'
        }
      },
      {
        selector: 'node.highlight',
        style: {
          'background-color': '#FF4136'
        }
      },
      {
        selector: 'edge.highlight',
        style: {
          'line-color': '#FF4136',
          'target-arrow-color': '#FF4136'
        }
      }
    ],
    layout: {
      name: 'circle'
    }
  });

  if (cycle.length > 0) {
    for (let i = 0; i < cycle.length - 1; i++) {
      cy.getElementById(`P${cycle[i]}`).addClass('highlight');
      cy.getElementById(`e${cycle[i]}${cycle[i + 1]}`).addClass('highlight');
    }
  }
}

function runBanker(input) {
  try {
    const data = JSON.parse(input);

    const { available, allocation, request } = data;
    const n = allocation.length;
    const m = available.length;

    const work = [...available];
    const finish = new Array(n).fill(false);

    let deadlockProcesses = [];

    let changed;
    do {
      changed = false;
      for (let i = 0; i < n; i++) {
        if (!finish[i] && request[i].every((r, j) => r <= work[j])) {
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          changed = true;
        }
      }
    } while (changed);

    for (let i = 0; i < n; i++) {
      if (!finish[i]) deadlockProcesses.push(`P${i}`);
    }

    document.getElementById("cy").innerHTML = "";
    document.getElementById("result").innerText = deadlockProcesses.length
      ? `🔴 Deadlock Detected: ${deadlockProcesses.join(", ")}`
      : "✅ No Deadlock Detected";
  } catch (err) {
    alert("Invalid input. Banker's input must be JSON with available, allocation, request.");
  }
}
