import "./GamePage.css";
import { useMemo, useState } from "react";

const MAX_FULLNESS = 600;
const BASE_ENERGY = 3;

const CARDS = [
  { name: "醤油ラーメン", type: "attack", cost: 1, gram: 120, text: "相手に120g食べさせる" },
  { name: "家系ラーメン", type: "attack", cost: 1, gram: 170, text: "相手に170g食べさせる" },
  { name: "二郎系", type: "attack", cost: 2, gram: 320, selfGram: 40, text: "相手に320g。自分も40g増える" },
  { name: "油そば", type: "attack", cost: 1, gram: 180, text: "相手に180g食べさせる" },
  { name: "味噌ラーメン", type: "attack", cost: 2, gram: 260, text: "相手に260g食べさせる" },
  { name: "つけ麺", type: "attack", cost: 2, gram: 230, draw: 1, text: "230g食べさせ、1枚引く" },
  { name: "替え玉", type: "skill", cost: 0, gram: 80, text: "0コストで80g食べさせる" },
  { name: "ライス追加", type: "skill", cost: 1, gram: 100, text: "相手に100g食べさせる" },
  { name: "チャーハンセット", type: "attack", cost: 2, gram: 280, text: "相手に280g食べさせる" },
  { name: "にんにくマシ", type: "attack", cost: 1, gram: 210, selfGram: 70, text: "相手に210g。自分も70g増える" },
  { name: "黒烏龍茶", type: "skill", cost: 0, heal: 90, text: "自分の満腹度を90g減らす" },
  { name: "胃薬", type: "skill", cost: 1, heal: 170, text: "自分の満腹度を170g減らす" },
  { name: "卓上酢", type: "power", cost: 1, buff: "sour", text: "以後、攻撃カード+40g" },
  { name: "背脂中毒", type: "power", cost: 1, buff: "fat", text: "毎ターン開始時、相手+40g" },
  { name: "常連サービス", type: "power", cost: 1, buff: "regular", text: "毎ターン開始時、1枚追加ドロー" },
];

const STARTER_DECK = [
  CARDS[0],
  CARDS[0],
  CARDS[1],
  CARDS[6],
  CARDS[10],
];

const RELICS = [
  { id: "bowl", name: "割れない丼", text: "戦闘開始時、1枚多く引く", effect: "startDraw" },
  { id: "renge", name: "黒レンゲ", text: "毎ターンのコスト+1", effect: "energyPlus" },
  { id: "ticket", name: "替え玉無料券", text: "0コストカードのg+40", effect: "zeroBoost" },
  { id: "tea", name: "黒烏龍ストック", text: "休憩所の回復量+100g", effect: "restBoost" },
  { id: "garlic", name: "にんにく壺", text: "攻撃時たまに+80g", effect: "garlicChance" },
];

const MAP_NODES = [
  { id: "start", label: "神田", type: "battle", x: 80, y: 360, next: ["n1", "n2"] },
  { id: "n1", label: "新宿", type: "battle", x: 200, y: 270, next: ["n3", "n4"] },
  { id: "n2", label: "休憩", type: "rest", x: 210, y: 440, next: ["n4"] },
  { id: "n3", label: "中野", type: "event", x: 350, y: 220, next: ["n5"] },
  { id: "n4", label: "高円寺", type: "battle", x: 360, y: 360, next: ["n5", "n6"] },
  { id: "n5", label: "荻窪", type: "elite", x: 520, y: 260, next: ["n7"] },
  { id: "n6", label: "屋台", type: "shop", x: 520, y: 430, next: ["n7"] },
  { id: "n7", label: "吉祥寺", type: "battle", x: 680, y: 330, next: ["n8", "n9"] },
  { id: "n8", label: "休憩", type: "rest", x: 820, y: 250, next: ["boss"] },
  { id: "n9", label: "三鷹", type: "event", x: 820, y: 420, next: ["boss"] },
  { id: "boss", label: "国分寺", type: "boss", x: 980, y: 340, next: [] },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeCard(card) {
  return {
    ...card,
    id: `${card.name}-${crypto.randomUUID?.() || Math.random()}`,
  };
}

function nodeIcon(type) {
  return {
    battle: "🍜",
    elite: "🔥",
    rest: "♨",
    event: "？",
    shop: "屋",
    boss: "👑",
  }[type];
}

function GamePage() {
  const [phase, setPhase] = useState("map");
  const [message, setMessage] = useState("中央線ラーメン旅、開始！");
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [visited, setVisited] = useState([]);

  const [playerFull, setPlayerFull] = useState(0);
  const [enemyFull, setEnemyFull] = useState(0);
  const [energy, setEnergy] = useState(BASE_ENERGY);

  const [deck, setDeck] = useState(STARTER_DECK.map(makeCard));
  const [drawPile, setDrawPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  const [rewards, setRewards] = useState([]);
  const [relics, setRelics] = useState([]);
  const [viewPile, setViewPile] = useState(null);
  const [buffs, setBuffs] = useState({ sour: 0, fat: 0, regular: 0 });

  const currentNode = MAP_NODES.find((n) => n.id === currentNodeId);
  const selectable = visited.length === 0 ? ["start"] : currentNode.next;
  const maxEnergy = BASE_ENERGY + (relics.some((r) => r.effect === "energyPlus") ? 1 : 0);
  const enemyMax = currentNode?.type === "boss" ? 900 : currentNode?.type === "elite" ? 750 : MAX_FULLNESS;

  const cardPool = useMemo(() => CARDS.map(makeCard), []);

  function startBattle(nodeId) {
    const node = MAP_NODES.find((n) => n.id === nodeId);
    const openingDraw = relics.some((r) => r.effect === "startDraw") ? 4 : 3;
    const shuffled = shuffle(deck);

    setCurrentNodeId(nodeId);
    setVisited((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
    setHand(shuffled.slice(0, openingDraw));
    setDrawPile(shuffled.slice(openingDraw));
    setDiscardPile([]);
    setEnemyFull(0);
    setEnergy(maxEnergy);
    setPhase("battle");
    setMessage(`${node.label}：${node.type === "boss" ? "ラスボス" : "対戦"}開始！`);
  }

  function selectNode(nodeId) {
    if (!selectable.includes(nodeId)) return;
    const node = MAP_NODES.find((n) => n.id === nodeId);

    setCurrentNodeId(nodeId);
    setVisited((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));

    if (["battle", "elite", "boss"].includes(node.type)) {
      startBattle(nodeId);
      return;
    }

    if (node.type === "rest") {
      const bonus = relics.some((r) => r.effect === "restBoost") ? 100 : 0;
      setPlayerFull((p) => Math.max(0, p - 180 - bonus));
      setMessage(`休憩所。満腹度が${180 + bonus}g減った。`);
      return;
    }

    if (node.type === "event") {
      const eventCard = makeCard({ name: "駅前差し入れ", type: "skill", cost: 0, heal: 120, text: "自分の満腹度を120g減らす" });
      setDeck((d) => [...d, eventCard]);
      setMessage("イベント：駅前で差し入れをもらった。カード追加！");
      return;
    }

    if (node.type === "shop") {
      const relic = RELICS[Math.floor(Math.random() * RELICS.length)];
      if (!relics.some((r) => r.id === relic.id)) setRelics((r) => [...r, relic]);
      setMessage(`屋台でレリック入手：${relic.name}`);
    }
  }

  function drawCards(count) {
    let nextDraw = [...drawPile];
    let nextDiscard = [...discardPile];
    const drawn = [];

    for (let i = 0; i < count; i++) {
      if (nextDraw.length === 0) {
        if (nextDiscard.length === 0) break;
        nextDraw = shuffle(nextDiscard);
        nextDiscard = [];
      }
      drawn.push(nextDraw[0]);
      nextDraw = nextDraw.slice(1);
    }

    setDrawPile(nextDraw);
    setDiscardPile(nextDiscard);
    setHand((h) => [...h, ...drawn]);
  }

  function playCard(card) {
    if (phase !== "battle") return;
    if (energy < card.cost) {
      setMessage("コストが足りない！");
      return;
    }

    setEnergy((e) => e - card.cost);
    setHand((h) => h.filter((c) => c.id !== card.id));
    setDiscardPile((d) => [...d, card]);

    let gram = card.gram || 0;
    if (card.type === "attack") gram += buffs.sour * 40;
    if (card.cost === 0 && relics.some((r) => r.effect === "zeroBoost")) gram += 40;
    if (card.type === "attack" && relics.some((r) => r.effect === "garlicChance") && Math.random() < 0.25) gram += 80;

    if (gram > 0) {
      setEnemyFull((prev) => {
        const next = prev + gram;
        if (next >= enemyMax) winBattle();
        return next;
      });
    }

    if (card.heal) setPlayerFull((p) => Math.max(0, p - card.heal));
    if (card.selfGram) setPlayerFull((p) => p + card.selfGram);
    if (card.draw) drawCards(card.draw);
    if (card.buff) setBuffs((b) => ({ ...b, [card.buff]: b[card.buff] + 1 }));

    setMessage(`${card.name} を使った！`);
  }

  function enemyTurn() {
    const base = currentNode.type === "boss" ? 190 : currentNode.type === "elite" ? 160 : 120;
    const amount = Math.floor(Math.random() * 90) + base;

    setPlayerFull((prev) => {
      const next = prev + amount;
      if (next >= MAX_FULLNESS) {
        setPhase("gameover");
        setMessage("満腹で動けない……ゲームオーバー");
      } else {
        setMessage(`相手が${amount}g食べさせてきた！`);
      }
      return next;
    });
  }

  function endTurn() {
    if (phase !== "battle") return;

    setDiscardPile((d) => [...d, ...hand]);
    setHand([]);
    setEnergy(maxEnergy);

    if (buffs.fat > 0) {
      setEnemyFull((e) => {
        const next = e + buffs.fat * 40;
        if (next >= enemyMax) winBattle();
        return next;
      });
    }

    enemyTurn();

    setTimeout(() => {
      drawCards(3 + buffs.regular);
    }, 120);
  }

  function winBattle() {
    if (currentNode.type === "boss") {
      setPhase("clear");
      setMessage("中央線制覇！ゲームクリア！");
      return;
    }

    setPhase("reward");
    setRewards(shuffle(cardPool).slice(0, 3));
    setMessage("勝利！カードを1枚選んでください。");
  }

  function backToMap(nextDeck) {
    setDeck(nextDeck);
    setRewards([]);
    setPlayerFull((p) => Math.max(0, p - 80));
    setPhase("map");
    setMessage("次の行き先を選んでください。");
  }

  function chooseReward(card) {
    backToMap([...deck, makeCard(card)]);
  }

  function skipReward() {
    backToMap(deck);
  }

  function restart() {
    setPhase("map");
    setMessage("中央線ラーメン旅、開始！");
    setCurrentNodeId("start");
    setVisited([]);
    setPlayerFull(0);
    setEnemyFull(0);
    setDeck(STARTER_DECK.map(makeCard));
    setDrawPile([]);
    setDiscardPile([]);
    setHand([]);
    setRewards([]);
    setRelics([]);
    setBuffs({ sour: 0, fat: 0, regular: 0 });
  }

  return (
    <div className="game">
      <header className="top">
        <h1>RAMEN THE LINE</h1>
        <p>{message}</p>
      </header>

      <div className="relic-bar">
        {relics.length === 0 ? <span>レリックなし</span> : relics.map((r) => <span key={r.id} title={r.text}>🏺 {r.name}</span>)}
      </div>

      {phase === "map" && (
        <section className="map-panel">
          <h2>中央線マップ</h2>
          <svg className="game-map" viewBox="0 0 1080 540">
            {MAP_NODES.map((n) =>
              n.next.map((to) => {
                const t = MAP_NODES.find((x) => x.id === to);
                return <line key={n.id + to} x1={n.x} y1={n.y} x2={t.x} y2={t.y} className="map-line" />;
              })
            )}
            {MAP_NODES.map((n) => {
              const can = selectable.includes(n.id);
              const seen = visited.includes(n.id);
              return (
                <g key={n.id} onClick={() => selectNode(n.id)} className={can ? "node selectable" : "node"}>
                  <circle cx={n.x} cy={n.y} r={n.type === "boss" ? 36 : 29} className={seen ? "node-circle seen" : can ? "node-circle can" : "node-circle"} />
                  <text x={n.x} y={n.y + 9} textAnchor="middle" className="node-icon">{nodeIcon(n.type)}</text>
                  <text x={n.x} y={n.y + 55} textAnchor="middle" className="node-label">{n.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="map-legend">
            <span>🍜 バトル</span><span>🔥 強敵</span><span>♨ 休憩</span><span>？ イベント</span><span>屋 屋台</span><span>👑 ボス</span>
          </div>
        </section>
      )}

      {phase !== "map" && (
        <>
          <main className="battle-field">
            <section className="enemy-area">
              <div className="enemy-card">
                <div className="character enemy-character">🍥</div>
                <h2>{currentNode.label}の大食い客</h2>
                <p>満腹度：{enemyFull} / {enemyMax}g</p>
                <div className="hp-bar"><div className="hp-fill enemy-hp" style={{ width: `${Math.min(100, enemyFull / enemyMax * 100)}%` }} /></div>
              </div>
            </section>

            <section className="player-area">
              <div className="status-card">
                <div className="character player-character">🍜</div>
                <h2>プレイヤー</h2>
                <p>満腹度：{playerFull} / {MAX_FULLNESS}g</p>
                <div className="hp-bar"><div className="hp-fill player-hp" style={{ width: `${Math.min(100, playerFull / MAX_FULLNESS * 100)}%` }} /></div>
                <p className="energy">コスト：{energy} / {maxEnergy}</p>
                <div className="pile-info">
                  <button onClick={() => setViewPile("draw")}>山札：{drawPile.length}</button>
                  <span>手札：{hand.length}</span>
                  <button onClick={() => setViewPile("discard")}>捨て札：{discardPile.length}</button>
                  <button onClick={() => setViewPile("deck")}>デッキ：{deck.length}</button>
                </div>
              </div>
            </section>
          </main>

          {phase === "battle" && (
            <>
              <section className="hand">
                {hand.map((card) => (
                  <button key={card.id} onClick={() => playCard(card)} className={`card ${card.type}`}>
                    <div className="card-cost">{card.cost}</div>
                    <h3>{card.name}</h3>
                    <p>{card.text}</p>
                  </button>
                ))}
              </section>
              <div className="actions"><button className="end-turn" onClick={endTurn}>ターン終了</button></div>
            </>
          )}

          {phase === "reward" && (
            <section className="reward">
              <h2>カード報酬</h2>
              <div className="reward-list">
                {rewards.map((card) => (
                  <button key={card.id} onClick={() => chooseReward(card)} className={`card ${card.type}`}>
                    <div className="card-cost">{card.cost}</div>
                    <h3>{card.name}</h3>
                    <p>{card.text}</p>
                  </button>
                ))}
              </div>
              <button className="skip" onClick={skipReward}>スキップ</button>
            </section>
          )}

          {(phase === "gameover" || phase === "clear") && (
            <section className="result">
              <h2>{phase === "clear" ? "ゲームクリア！" : "ゲームオーバー"}</h2>
              <button onClick={restart}>もう一度</button>
            </section>
          )}
        </>
      )}

      {viewPile && (
        <div className="pile-modal">
          <div className="pile-modal-content">
            <button onClick={() => setViewPile(null)}>閉じる</button>
            <h2>{viewPile === "draw" ? "山札" : viewPile === "discard" ? "捨て札" : "デッキ"}</h2>
            <div className="reward-list">
              {(viewPile === "draw" ? drawPile : viewPile === "discard" ? discardPile : deck).map((card) => (
                <div key={card.id} className={`card ${card.type}`}>
                  <div className="card-cost">{card.cost}</div>
                  <h3>{card.name}</h3>
                  <p>{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;