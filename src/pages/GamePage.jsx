import "./GamePage.css";
import { useState } from "react";

const MAX_FULLNESS = 600;
const MAX_ENERGY = 2;

const STARTER_DECK = [
  { name: "醤油ラーメン", cost: 1, gram: 140, text: "相手に140g食べさせる" },
  { name: "醤油ラーメン", cost: 1, gram: 140, text: "相手に140g食べさせる" },
  { name: "家系ラーメン", cost: 1, gram: 180, text: "相手に180g食べさせる" },
  { name: "替え玉", cost: 0, gram: 80, text: "0コストで80g食べさせる" },
  { name: "烏龍茶", cost: 1, gram: 0, heal: 120, text: "自分の満腹度を120g減らす" },
];

const CARD_POOL = [
  { name: "二郎系", cost: 2, gram: 330, text: "重い一撃。330g食べさせる" },
  { name: "油そば", cost: 1, gram: 190, text: "相手に190g食べさせる" },
  { name: "つけ麺", cost: 2, gram: 260, draw: 1, text: "260g食べさせて1枚引く" },
  { name: "ライス追加", cost: 1, gram: 120, text: "相手に120g食べさせる" },
  { name: "胃薬", cost: 1, gram: 0, heal: 180, text: "自分の満腹度を180g減らす" },
  { name: "にんにくマシ", cost: 1, gram: 220, selfGram: 60, text: "相手に220g、自分も60g増える" },
];

const MAP_ROUTES = [
  { station: "神田", next: [1, 2] },
  { station: "新宿", next: [3] },
  { station: "中野", next: [3, 4] },
  { station: "高円寺", next: [5] },
  { station: "荻窪", next: [5] },
  { station: "吉祥寺", next: [6, 7] },
  { station: "三鷹", next: [8] },
  { station: "東小金井", next: [8] },
  { station: "武蔵小金井", next: [9] },
  { station: "国分寺", next: [] },
];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function createCard(card) {
  return {
    ...card,
    id: `${card.name}-${Date.now()}-${Math.random()}`,
  };
}

function GamePage() {
  const [viewPile, setViewPile] = useState(null);

  const [stage, setStage] = useState(0);
  const [playerFull, setPlayerFull] = useState(0);
  const [enemyFull, setEnemyFull] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);

  const [deck, setDeck] = useState(STARTER_DECK.map(createCard));
  const [drawPile, setDrawPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [hand, setHand] = useState([]);

  const [phase, setPhase] = useState("map");
  const [message, setMessage] = useState("中央線ラーメン旅、開始！");
  const [rewards, setRewards] = useState([]);

  function startBattle(currentDeck, currentStage, currentPlayerFull) {
    const shuffled = shuffle(currentDeck);

    setHand(shuffled.slice(0, 3));
    setDrawPile(shuffled.slice(3));
    setDiscardPile([]);
    setEnemyFull(0);
    setEnergy(MAX_ENERGY);
    setPhase("battle");
    setMessage(`${MAP_ROUTES[currentStage].station}駅に到着。対戦開始！`);
    setPlayerFull(currentPlayerFull);
  }

  function selectStation(index) {
    setStage(index);
    startBattle(deck, index, playerFull);
  }

  function drawCards(count) {
    let newDrawPile = [...drawPile];
    let newDiscardPile = [...discardPile];
    const newCards = [];

    for (let i = 0; i < count; i++) {
      if (newDrawPile.length === 0) {
        if (newDiscardPile.length === 0) break;
        newDrawPile = shuffle(newDiscardPile);
        newDiscardPile = [];
      }

      newCards.push(newDrawPile[0]);
      newDrawPile = newDrawPile.slice(1);
    }

    setDrawPile(newDrawPile);
    setDiscardPile(newDiscardPile);
    setHand((prev) => [...prev, ...newCards]);
  }

  function playCard(card) {
    if (phase !== "battle") return;

    if (energy < card.cost) {
      setMessage("コストが足りない！");
      return;
    }

    setEnergy((prev) => prev - card.cost);
    setHand((prev) => prev.filter((c) => c.id !== card.id));
    setDiscardPile((prev) => [...prev, card]);

    if (card.gram) {
      setEnemyFull((prev) => {
        const next = prev + card.gram;

        if (next >= MAX_FULLNESS) {
          winBattle();
        }

        return next;
      });
    }

    if (card.heal) {
      setPlayerFull((prev) => Math.max(0, prev - card.heal));
    }

    if (card.selfGram) {
      setPlayerFull((prev) => {
        const next = prev + card.selfGram;

        if (next >= MAX_FULLNESS) {
          setPhase("gameover");
          setMessage("満腹で動けない……ゲームオーバー");
        }

        return next;
      });
    }

    if (card.draw) {
      drawCards(card.draw);
    }

    setMessage(`${card.name} を使った！`);
  }

  function enemyTurn() {
    const enemyGram = Math.floor(Math.random() * 100) + 120;

    setPlayerFull((prev) => {
      const next = prev + enemyGram;

      if (next >= MAX_FULLNESS) {
        setPhase("gameover");
        setMessage("満腹で動けない……ゲームオーバー");
      } else {
        setMessage(`相手が${enemyGram}g食べさせてきた！`);
      }

      return next;
    });
  }

  function endTurn() {
    if (phase !== "battle") return;

    setDiscardPile((prev) => [...prev, ...hand]);
    setHand([]);
    setEnergy(MAX_ENERGY);

    enemyTurn();

    setTimeout(() => {
      drawCards(3);
    }, 100);
  }

  function winBattle() {
    setPhase("reward");
    setMessage("勝利！カードを1枚選んでください。");
    setRewards(shuffle(CARD_POOL).slice(0, 3).map(createCard));
  }

  function goToMap(nextDeck) {
    const nextStageOptions = MAP_ROUTES[stage].next;

    if (nextStageOptions.length === 0) {
      setPhase("clear");
      setMessage("中央線制覇！ゲームクリア！");
      return;
    }

    const digestedFullness = Math.max(0, playerFull - 100);

    setDeck(nextDeck);
    setPlayerFull(digestedFullness);
    setRewards([]);
    setPhase("map");
    setMessage("次の駅を選んでください。");
  }

  function chooseReward(card) {
    const newDeck = [...deck, card];
    goToMap(newDeck);
  }

  function skipReward() {
    goToMap(deck);
  }

  function restartGame() {
    const freshDeck = STARTER_DECK.map(createCard);

    setDeck(freshDeck);
    setStage(0);
    setPlayerFull(0);
    setEnemyFull(0);
    setRewards([]);
    setDrawPile([]);
    setDiscardPile([]);
    setHand([]);
    setEnergy(MAX_ENERGY);
    setPhase("map");
    setMessage("中央線ラーメン旅、開始！");
  }

  const currentStation = MAP_ROUTES[stage];

  return (
    <div className="game">
      <header className="top">
        <h1>ラーメン・ザ・スパイア</h1>
        <p>{message}</p>
      </header>

      {phase === "map" && (
        <section className="reward">
          <h2>中央線マップ</h2>

          {stage === 0 && hand.length === 0 ? (
            <>
              <p>最初の駅を選んでください。</p>
              <button className="end-turn" onClick={() => selectStation(0)}>
                神田から始める
              </button>
            </>
          ) : (
            <>
              <p>現在地：{currentStation.station}</p>
              <p>次の駅を選んでください。</p>

              <div className="reward-list">
                {currentStation.next.map((nextIndex) => (
                  <button
                    key={nextIndex}
                    className="card skill"
                    onClick={() => selectStation(nextIndex)}
                  >
                    <h3>{MAP_ROUTES[nextIndex].station}</h3>
                    <p>この駅へ進む</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {phase !== "map" && (
        <>
          <main className="battle-field">
            <section className="enemy-area">
              <div className="enemy-card">
                <h2>
                  第{stage + 1}駅：{currentStation.station}
                </h2>

                <p>
                  相手の満腹度：{enemyFull} / {MAX_FULLNESS}g
                </p>

                <div className="hp-bar">
                  <div
                    className="hp-fill enemy-hp"
                    style={{
                      width: `${Math.min(100, (enemyFull / MAX_FULLNESS) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="player-area">
              <div className="status-card">
                <h2>プレイヤー</h2>

                <p>
                  満腹度：{playerFull} / {MAX_FULLNESS}g
                </p>

                <div className="hp-bar">
                  <div
                    className="hp-fill player-hp"
                    style={{
                      width: `${Math.min(100, (playerFull / MAX_FULLNESS) * 100)}%`,
                    }}
                  />
                </div>

                <p className="energy">
                  コスト：{energy} / {MAX_ENERGY}
                </p>

                <div className="pile-info">
                  <button onClick={() => setViewPile("draw")}>
                    山札：{drawPile.length}
                  </button>

                  <span>手札：{hand.length}</span>

                  <button onClick={() => setViewPile("discard")}>
                    捨て札：{discardPile.length}
                  </button>

                  <button onClick={() => setViewPile("deck")}>
                    デッキ：{deck.length}
                  </button>
                </div>
              </div>
            </section>
          </main>

          {phase === "battle" && (
            <>
              <section className="hand">
                {hand.map((card) => (
                  <button
                    key={card.id}
                    className="card attack"
                    onClick={() => playCard(card)}
                  >
                    <div className="card-cost">{card.cost}</div>
                    <h3>{card.name}</h3>
                    {card.gram ? <p>{card.gram}g</p> : null}
                    <p>{card.text}</p>
                  </button>
                ))}
              </section>

              <div className="actions">
                <button className="end-turn" onClick={endTurn}>
                  ターン終了
                </button>
              </div>
            </>
          )}

          {phase === "reward" && (
            <section className="reward">
              <h2>カード獲得</h2>

              <div className="reward-list">
                {rewards.map((card) => (
                  <button
                    key={card.id}
                    className="card skill"
                    onClick={() => chooseReward(card)}
                  >
                    <div className="card-cost">{card.cost}</div>
                    <h3>{card.name}</h3>
                    {card.gram ? <p>{card.gram}g</p> : null}
                    <p>{card.text}</p>
                  </button>
                ))}
              </div>

              <button className="skip" onClick={skipReward}>
                スキップ
              </button>
            </section>
          )}

          {(phase === "gameover" || phase === "clear") && (
            <section className="result">
              <h2>{phase === "clear" ? "ゲームクリア！" : "ゲームオーバー"}</h2>
              <button onClick={restartGame}>もう一度遊ぶ</button>
            </section>
          )}
        </>
      )}

      {viewPile && (
        <div className="pile-modal">
          <div className="pile-modal-content">
            <button onClick={() => setViewPile(null)}>閉じる</button>

            <h2>
              {viewPile === "draw"
                ? "山札"
                : viewPile === "discard"
                ? "捨て札"
                : "デッキ"}
            </h2>

            <div className="reward-list">
              {(viewPile === "draw"
                ? drawPile
                : viewPile === "discard"
                ? discardPile
                : deck
              ).map((card) => (
                <div key={card.id} className="card">
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