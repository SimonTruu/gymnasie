(() => {

  /************************************************************
   * GLOBAL STATE
   ************************************************************/
  let network = null;
  let currentDataset = null;
  let wallet = 200;
  let selectedTree = null;

  const lockedColor = "#444";
  const unlockedColor = "#ccc";
  const selectedColorDefault = "#33C3F0";

  const container = document.getElementById("skilltree");
  const walletDisplay = document.getElementById("wallet");

  const overlay = document.getElementById("skillOverlay");
  const choiceModal = document.getElementById("choiceModal");
  const buyBtn = document.getElementById("buyUpgrade");
  const backBtn = document.getElementById("backBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const choices = document.querySelectorAll(".choice");

  /************************************************************
   * UI FLOW
   ************************************************************/

  buyBtn?.addEventListener("click", () => {
    choiceModal.classList.remove("hidden");
  });

  choices.forEach(choice => {
    choice.addEventListener("click", () => {
      selectedTree = choice.dataset.tree;
      choiceModal.classList.add("hidden");
      overlay.classList.remove("hidden");
      loadSkillTree(selectedTree);
    });
  });

  backBtn?.addEventListener("click", () => {
    overlay.classList.add("hidden");
    choiceModal.classList.remove("hidden");
    destroyNetwork();
  });

  confirmBtn?.addEventListener("click", () => {
    overlay.classList.add("hidden");
    destroyNetwork();
    console.log("Confirmed tree:", selectedTree);
  });

  /************************************************************
   * TREE LOADER
   ************************************************************/

  function loadSkillTree(type) {
    destroyNetwork();

    if (type === "cat") currentDataset = buildCatTree();
    if (type === "dead") currentDataset = buildDeathTree();
    if (type === "sun") currentDataset = buildSunTree();

    initVisTree(currentDataset);
  }

  function destroyNetwork() {
    if (network) {
      network.destroy();
      network = null;
    }
  }

  /************************************************************
   * TREE INITIALIZER
   ************************************************************/

  function initVisTree(dataset) {

    walletDisplay.innerText = wallet;

    const data = {
      nodes: dataset.nodes,
      edges: dataset.edges
    };

   const options = {
  layout: {
    hierarchical: {
      direction: "UD",
      levelSeparation: 120,
      nodeSpacing: 120
    }
  },
  interaction: {
    hover: true
  },
  nodes: {
    shape: "dot",
    size: 18,
    font: { color: "#666" }
  },
  edges: {
    dashes: true,
    smooth: true
  },
  tooltip: {
    delay: 100,
    overflowMethod: "cap"
  }
};


    network = new vis.Network(container, data, options);

    updateNodeStates(dataset);

    network.on("click", params => {
      if (!params.nodes.length) return;

      const id = params.nodes[0];
      const node = dataset.nodes.get(id);

      if (node.locked) return;
      if (node.selected) return;

      if (wallet < node.value) return;

      wallet -= node.value;
      node.selected = true;

      dataset.nodes.update({
        id: id,
        color: dataset.theme,
      });

      walletDisplay.innerText = wallet;

      animateIncomingEdges(id, dataset);
      updateNodeStates(dataset);
    });

    addHoverTooltips(dataset);
  }

  /************************************************************
   * NODE LOCK LOGIC
   ************************************************************/

  function updateNodeStates(dataset) {

    dataset.nodes.forEach(node => {

      const parents = getParents(node.id, dataset);

      const locked = parents.some(p => !dataset.nodes.get(p).selected);

      node.locked = locked;

      if (node.selected) {
        node.color = dataset.theme;
      } else if (locked) {
        node.color = lockedColor;
      } else {
        node.color = unlockedColor;
      }

      dataset.nodes.update(node);
    });
  }

  function getParents(nodeId, dataset) {
    return dataset.edges
      .get()
      .filter(edge => edge.to === nodeId)
      .map(edge => edge.from);
  }

  /************************************************************
   * EDGE ANIMATION
   ************************************************************/

  function animateIncomingEdges(nodeId, dataset) {

    dataset.edges.forEach(edge => {
      if (edge.to === nodeId) {
        animateEdge(edge.id, dataset);
      }
    });
  }

  function animateEdge(edgeId, dataset) {

    let progress = 0;

    const interval = setInterval(() => {

      progress += 0.08;

      dataset.edges.update({
        id: edgeId,
        dashes: false,
        color: {
          color: dataset.theme,
          opacity: progress
        }
      });

      if (progress >= 1) clearInterval(interval);

    }, 40);
  }

  /************************************************************
   * TOOLTIPS
   ************************************************************/

  function addHoverTooltips(dataset) {
  dataset.nodes.forEach(node => {
    dataset.nodes.update({
      id: node.id,
      title: `
        <b>${node.name}</b><br>
        Cost: ${node.value}<br>
        <span style="color:#33C3F0">${node.stat}</span>
      `
    });
  });
}


  /************************************************************
   * GOD TREES
   ************************************************************/

  function buildCatTree() {

  let id = 1;
  const nodes = [];
  const edges = [];

  // 17 small stat nodes (Level 4)
  for (let i = 0; i < 17; i++) {
    nodes.push({
      id: id,
      level: 4,
      name: "Feline Instinct " + (i+1),
      label: "+2%",
      value: 10,
      stat: "+2% food production"
    });

    // connect to random medium later
    edges.push({
      from: id,
      to: 18 + (i % 5),
      arrows: "to"
    });

    id++;
  }

  // 5 medium impactful nodes (Level 3)
  for (let i = 0; i < 5; i++) {
    nodes.push({
      id: id,
      level: 3,
      name: "Sacred Paw " + (i+1),
      label: "Paw",
      value: 50,
      stat: "+10% production & +5% luck"
    });

    edges.push({
      from: id,
      to: 23 + (i % 3),
      arrows: "to"
    });

    id++;
  }

  // 3 major nodes (Level 2)
  for (let i = 0; i < 3; i++) {
    nodes.push({
      id: id,
      level: 2,
      name: "Nine Lives Ascension " + (i+1),
      label: "Ascend",
      value: 120,
      stat: "Game-changing divine blessing"
    });

    edges.push({
      from: id,
      to: 26,
      arrows: "to"
    });

    id++;
  }

  // Final God Form (Level 1)
  nodes.push({
    id: id,
    level: 1,
    name: "Avatar of the Divine Cat",
    label: "GOD",
    value: 250,
    stat: "+50% global production & divine luck"
  });

  return {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
    theme: "#f4c542"
  };
}


  function buildDeathTree() {

    const nodes = new vis.DataSet([
      { id: 1, level: 3, name: "Grave Pact", label: "Grave\n(30)", value: 30, stat: "Sacrifice villagers for power" },
      { id: 2, level: 3, name: "Soul Harvest", label: "Harvest\n(50)", value: 50, stat: "+1 power per death" },
      { id: 3, level: 2, name: "Undead Labor", label: "Undead\n(80)", value: 80, stat: "Dead villagers produce 50%" },
      { id: 4, level: 1, name: "Avatar of Death", label: "Avatar\n(150)", value: 150, stat: "Deaths generate faith" }
    ]);

    const edges = new vis.DataSet([
      { id: 1, from: 1, to: 3, arrows: "to" },
      { id: 2, from: 2, to: 3, arrows: "to" },
      { id: 3, from: 3, to: 4, arrows: "to" }
    ]);

    return { nodes, edges, theme: "#888888" };
  }

  function buildSunTree() {

    const nodes = new vis.DataSet([
      { id: 1, level: 3, name: "Solar Prayer", label: "Prayer\n(20)", value: 20, stat: "+15% temple output" },
      { id: 2, level: 3, name: "Radiance", label: "Radiance\n(45)", value: 45, stat: "Faith grows 10% faster" },
      { id: 3, level: 2, name: "Divine Wrath", label: "Wrath\n(90)", value: 90, stat: "Click burst: +200% for 10s" },
      { id: 4, level: 1, name: "Sun Incarnate", label: "Incarnate\n(140)", value: 140, stat: "All bonuses doubled at noon" }
    ]);

    const edges = new vis.DataSet([
      { id: 1, from: 1, to: 3, arrows: "to" },
      { id: 2, from: 2, to: 3, arrows: "to" },
      { id: 3, from: 3, to: 4, arrows: "to" }
    ]);

    return { nodes, edges, theme: "#ffcc00" };
  }

})();
