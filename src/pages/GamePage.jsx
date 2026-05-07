import { useState, useEffect } from "react";

function GamePage() {
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [energy, setEnergy] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState("");
  const [rewardCards, setRewardCards] = useState([]);
  const [stage, setStage] = useState(1);

  const starterDeck = [
  {
    name: "家系ラーメン",
    cost: 1,
    gram: 180,
  },
  {
    name: "二郎系",
    cost: 2,
    gram: 320,
  },
  {
    name: "替え玉",
    cost: 0,
    gram: 100,
  },
  {
    name: "醤油ラーメン",
    cost: 1,
    gram: 140,
  },
  {
    name: "油そば",
    cost: 1,
    gram: 160,
  },
];

const [deck, setDeck] = useState(starterDeck);
const [hand, setHand] = useState([]);

useEffect(() => {
  drawCards(3);
}, []);

useEffect(() => {
  if (enemyHp >= 600) {
    setGameOver(true);
    setResult("勝利！");
    generateRewards();
  }
}, [enemyHp]);

useEffect(() => {
  if (playerHp >= 600) {
    setGameOver(true);
    setResult("敗北...");
  }
}, [playerHp]);



const drawCards = (count) => {
  let newDeck = [...deck];
  let newHand = [...hand];

  for (let i = 0; i < count; i++) {
    if (newDeck.length === 0) break;

    const randomIndex = Math.floor(Math.random() * newDeck.length);

    const card = newDeck[randomIndex];

    newHand.push(card);

    newDeck.splice(randomIndex, 1);
  }

  setDeck(newDeck);
  setHand(newHand);
};
  
const playCard = (card) => {
  if (gameOver) return;
  if (energy < card.cost) return;
  setEnergy(energy - card.cost);
  setEnemyHp(enemyHp + card.gram);
  setHand(hand.filter((c) => c !== card));
};

const enemyTurn = () => {
  if (gameOver) return;
  const enemyAttack = Math.floor(Math.random() * 120) + 80;

  setPlayerHp((prev) => prev + enemyAttack);
};

const generateRewards = () => {
  const shuffled = [...starterDeck].sort(
    () => Math.random() - 0.5
  );

  setRewardCards(shuffled.slice(0, 3));
};

const addCardToDeck = (card) => {
  setDeck((prev) => [...prev, card]);

  setRewardCards([]);
  setEnemyHp(0);
  setPlayerHp(0);
  setEnergy(2);
  setHand([]);
  setGameOver(false);
  setResult("");
  setStage((prev) => prev + 1);

  setTimeout(() => {
    drawCards(3);
  }, 0);
};

const endTurn = () => {
  setEnergy(2);
  drawCards(1);

  enemyTurn();

  
};

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>ラーメン・ザ・スパイア</h1>

      {/* 敵 */}
      <div
        style={{
          border: "2px solid #333",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {gameOver && (

    

  <div
    style={{
      fontSize: "32px",
      fontWeight: "bold",
      marginBottom: "20px",
    }}
  >
    {result}
  </div>
)}

{rewardCards.length > 0 && (
  <div style={{ marginBottom: "20px" }}>
    <h2>カード獲得</h2>

    <div
      style={{
        display: "flex",
        gap: "12px",
      }}
    >
      {rewardCards.map((card, index) => (
        <div
          key={index}
          onClick={() => addCardToDeck(card)}
          style={{
            width: "160px",
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "12px",
            cursor: "pointer",
            background: "#fff8e1",
          }}
        >
          <h3>{card.name}</h3>

          <div>コスト: {card.cost}</div>

          <div>{card.gram}g</div>
        </div>
      ))}
    </div>
  </div>
)}

        <h2>第{stage}駅：大食いサラリーマン</h2>

        <div>満腹度: {enemyHp} / 600g</div>
      </div>

      {/* プレイヤー情報 */}
      <div
        style={{
          border: "2px solid #333",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>プレイヤー</h2>

        <div>満腹度: {playerHp} / 600g</div>

        <div>コスト: {energy}</div>
      </div>

      {/* 手札 */}
      <h2>手札</h2>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {hand.map((card, index) => (
           <div
    key={index}
    onClick={() => playCard(card)}
    style={{
            width: "160px",
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "12px",
            background: "white",
            cursor: "pointer",
            }}
          >
            <h3>{card.name}</h3>

            <div>コスト: {card.cost}</div>

            <div>{card.gram}g</div>
          </div>
        ))}
      </div>

      {/* ターン終了 */}
      <button
  onClick={endTurn}
  style={{
          marginTop: "20px",
          padding: "12px 20px",
        }}
      >
        ターン終了
      </button>
    </div>
  );
}

export default GamePage;