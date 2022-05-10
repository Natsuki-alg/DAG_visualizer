<template>
  <div class="row m-1">
    <div class="col-sm-6">
      <div class="card">
        <div class="card-header">Input Form</div>
        <div class="card-body">
          <div class="row">
            <label class="col-sm-2 col-form-label">Node name</label>
            <div class="col-sm-10">
              <input v-model="name" class="form-control" />
              <div class="invalid-feedback" style="display: block">
                {{ msg }}
              </div>
            </div>
          </div>
          <div
            v-for="d in dag"
            :key="d.id"
            class="form-check form-check-inline"
          >
            <input
              class="form-check-input"
              type="checkbox"
              :id="d.id"
              :value="d.id"
              v-model="checkedNodes"
            />
            <label class="form-check-label" :for="d.id" :name="d.name">{{
              d.name
            }}</label>
          </div>
          <div class="d-md-flex justify-content-md-end">
            <button
              type="button"
              class="btn btn-primary me-md-2"
              @click="register"
            >
              register
            </button>
            <button type="button" class="btn btn-secondary" @click="reset">
              reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="card">
        <div class="card-header">Visualizar</div>
        <div class="card-body">
          <div class="text-center">
            <svg version="1.1" width="300" height="600">
              <path
                v-for="path in pathData"
                :key="path.bezierData"
                :d="path.bezierData"
                fill="none"
                :stroke="path.color"
                stroke-width="2"
              />
              <circle
                v-for="node in nodeData"
                :key="node.id"
                :cx="node.cx"
                :cy="node.cy"
                r="3"
                :fill="node.color"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DagVisualizar",
  data: function () {
    return {
      pathData: [],
      nodeData: [],
      dag: [],
      checkedNodes: [],
      name: "",
      msg: "",
    };
  },
  methods: {
    reset: function () {
      this.pathData = [];
      this.nodeData = [];
      this.dag = [];
      this.checkedNodes = [];
      this.name = "";
      this.msg = "";
    },
    register: function () {
      if (!this.name) {
        this.msg = "name is not entred.";
        return;
      } else {
        this.msg = "";
      }
      const obj = {
        id: this.dag.length + 1,
        name: this.name,
        parents: new Set(this.checkedNodes),
        timestamp: new Date(),
      };
      this.dag.push(obj);
      this.name = "";
      this.checkedNodes = [];

      this.drawing();
    },
    drawing: function () {
      const drawingData = convertToDrawingData(this.dag);
      this.pathData = [];
      drawingData.pathData.forEach((path) => {
        let bezierData = "";
        path.subPaths.forEach((subPath) => {
          const fromX = subPath.from.getX();
          const fromY = subPath.from.getY();
          const toX = subPath.to.getX();
          const toY = subPath.to.getY();
          bezierData +=
            "M" +
            fromX +
            "," +
            fromY +
            "C" +
            fromX +
            "," +
            (fromY + toY * 2) / 3 +
            "," +
            toX +
            "," +
            (fromY * 2 + toY) / 3 +
            "," +
            toX +
            "," +
            toY;
        });
        this.pathData.push({
          id: path.id,
          bezierData: bezierData,
          color: colors[path.color],
        });
      });
      this.nodeData = [];
      drawingData.nodeData.forEach((node) => {
        this.nodeData.push({
          id: node.id,
          cx: node.point.getX(),
          cy: node.point.getY(),
          color: colors[node.color],
        });
      });
    },
  },
};

const NODE_POINT = 1;
const VIA_POINT = 2;

const Point = class {
  constructor(x, y) {
    this.xCoord = x * 20 + 10;
    this.yCoord = y * 30 + 10;
  }

  getX() {
    return this.xCoord;
  }

  getY() {
    return this.yCoord;
  }
};

const CheckerSheet = class {
  // コンストラクタ
  // num: 行数
  // 行数分空のArrayを作成する
  constructor(num) {
    // num <= 0 ならエラーを返す処理(いつか書く)
    this.rows = new Array();
    for (let i = 0; i < num; i++) {
      this.rows.push(new Array());
    }
  }

  // 指定された行に指定された種類のセルを追加し、行のセル数を返す
  addCell(rowNum, kind) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.rows[rowNum].push(kind);
  }

  // 指定された行に"通過点"セルを追加し、行のセル数を返す
  addViaPoint(rowNum) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.addCell(rowNum, VIA_POINT);
  }

  // 指定された行に"NODE"セルを追加し、行のセル数を返す
  addNode(rowNum) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.addCell(rowNum, NODE_POINT);
  }

  // 行数を返す
  getLength() {
    return this.rows.length;
  }

  // 指定された行のセル数を返す
  getRowLength(rowNum) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.rows[rowNum].length;
  }

  // 指定された行のNODE存在チェック
  hasNode(rowNum) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.rows[rowNum].some((element) => element == NODE_POINT);
  }

  // 指定された行のNODEセルの位置を返す
  getNodePosition(rowNum) {
    // rowNumがrows.lengh以上ならエラーを返す処理(いつか書く)
    return this.rows[rowNum].indexOf(NODE_POINT);
  }
};

function splitter(dag) {
  let nodes = new Map();
  let edges = new Array();

  // DAGをNODEの登録日時の降順でソートする
  dag.sort((e, f) => {
    return e.timestamp.valueOf() > f.timestamp.valueOf() ? -1 : 1;
  });
  
  // NODEのIDと順序の対応表
  dag.forEach((element, index) => {
    nodes.set(element.id, index);
  });
  // DAGをEDGEに分解する
  dag.forEach((element) => {
    // 親NODEを持たないものは端点として登録
    if (element.parents.size === 0) {
      edges.push({
        startNodeID: element.id,
      });
    }
    // 親ID配列をNODEの登録日時順でソートする
    const parents = [...element.parents].sort((id1, id2) => {
      return nodes.get(id1) - nodes.get(id2);
    });
    // 親ID配列を走るループで自IDを始点、親IDを終点として登録
    parents.forEach((parent) => {
      edges.push({
        startNodeID: element.id,
        endNodeID: parent,
      });
    });
  });

  // 並べ替えのロジック
  let searched = new Array();
  let colorCounter = 0;
  edges[0].color = colorCounter;
  for (let cnt = 0; cnt < edges.length - 1; cnt++) {
    // 着目中EDGEが端点、または終点が探索済みなら何もしない
    if (!edges[cnt].endNodeID || searched.includes(edges[cnt].endNodeID)) {
      edges[cnt + 1].color = ++colorCounter;
      continue;
    }
    // 着目中EDGEの終点を始点に持つEDGEを探す
    const endNodeID = edges[cnt].endNodeID;
    const nextEdgeIndex = edges.findIndex((e) => e.startNodeID == endNodeID);
    // 無ければ何もしない(理論上ありえないが)
    if (nextEdgeIndex == -1) {
      colorCounter++;
      continue;
    }
    // 見つけたEDGEを着目EDGEの次に挿入する
    edges.splice(cnt + 1, 0, edges.splice(nextEdgeIndex, 1)[0]);
    searched.push(endNodeID);
    edges[cnt + 1].color = colorCounter;
  }

  return {
    nodes: nodes,
    edges: edges,
  };
}

function convertToDrawingData(dag) {
  let checker = new CheckerSheet(dag.length);
  let nodeData = new Array();
  let pathData = new Array();
  const spDag = splitter(dag);
  let cnt = 0;

  if (!dagChecker(dag)) {
    return;
  }
  
  for (let edge of spDag.edges) {
    const startNodeID = edge.startNodeID;
    const startY = spDag.nodes.get(startNodeID);
    if (!checker.hasNode(startY)) {
      nodeData.push({
        id: startNodeID,
        point: new Point(checker.addNode(startY) - 1, startY),
        color: edge.color,
      });
    }
    const startX = checker.getNodePosition(startY);

    // 端点だった場合は終了して次のEDGEの処理
    if (!edge.endNodeID) {
      continue;
    }
    // 端点でない場合の処理
    const endNodeID = edge.endNodeID;
    // 終点NODEのチェック
    const endY = spDag.nodes.get(endNodeID);
    // 無ければcheckerに登録してnodesにも追加
    if (!checker.hasNode(endY)) {
      nodeData.push({
        id: endNodeID,
        point: new Point(checker.addNode(endY) - 1, endY),
        color: edge.color,
      });
    }
    const endX = checker.getNodePosition(endY);

    let subPaths = new Array();
    let points = new Array();
    // 始点の座標
    points.push(new Point(startX, startY));
    // 経由点の座標
    for (let viaY = startY + 1; viaY < endY; viaY++) {
      let viaX = checker.addViaPoint(viaY) - 1;
      points.push(new Point(viaX, viaY));
    }
    // 終点の座標
    points.push(new Point(endX, endY));

    for (let i = 1; i < points.length; i++) {
      subPaths.push({
        from: points[i - 1],
        to: points[i],
      });
    }

    pathData.push({
      id: cnt++,
      subPaths: subPaths,
      color: edge.color,
    });
  }
  return {
    pathData: pathData,
    nodeData: nodeData,
  };
}

function dagChecker(dag) {
  if (toString.call(dag) !== '[object Array]') {
    return false;
  }
  dag.forEach(element => {
    if (toString.call(element) !== '[object Object]') {
      return false;
    }
    // if (!(element.hasOwnProperty('id')
    //   && element.hasOwnProperty('parents')
    //   && element.hasOwnProperty('typestamp'))
    // ) {
    //   return false;
    // }
    if (toString.call(element.id) !== '[object String]') {
      return false;
    }
    // if (toString.call(element.parents) !== '[object Array]') {
    //   return false;
    // }
    if (toString.call(element.timestamp) !== '[object Date]') {
      return false;
    }
  });
  dag.forEach(node => {
    if (dag.filter(subNode => node.id === subNode.id).length > 1) {
      return false;
    }
  });
  dag.forEach(node => {
    node.parents.forEach(parentID => {
      if (!dag.some(subNode => subNode.id === parentID)) {
        return false;
      }
      if (dag.find(subNode => subNode.id === parentID).timestamp.valueOf() > node.timestamp.valueOf()) {
        return false;
      }
    });
  });

  return true;
}

const colors = [
  "DeepSkyBlue",
  "DeepPink",
  "Lime",
  "DarkOrange",
  "DarkViolet",
  "Red",
  "DarkTurquoise",
  "Magenta",
  "maroon",
  "navy",
  "olive",
  "teal",
  "yellow",
  "green",
  "DeepSkyBlue",
  "DeepPink",
  "Lime",
  "DarkOrange",
  "DarkViolet",
  "Red",
  "DarkTurquoise",
  "Magenta",
  "maroon",
  "navy",
  "olive",
  "teal",
  "yellow",
  "green",
  "DeepSkyBlue",
  "DeepPink",
  "Lime",
  "DarkOrange",
  "DarkViolet",
  "Red",
  "DarkTurquoise",
  "Magenta",
  "maroon",
  "navy",
  "olive",
  "teal",
  "yellow",
  "green",
];
</script>
