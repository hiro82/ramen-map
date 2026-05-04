import { useState, useEffect } from "react";

import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";



const stations = [
  { id: 1, name: "池袋", x: 260, y: 80 },
  { id: 2, name: "新宿", x: 180, y: 170 },
  { id: 3, name: "渋谷", x: 210, y: 280 },
  { id: 4, name: "東京", x: 390, y: 230 },
  { id: 5, name: "上野", x: 410, y: 110 },
];

function App() {
  const [selectedStation, setSelectedStation] = useState("新宿");
  const [shopName, setShopName] = useState("");
  const [genre, setGenre] = useState("家系");
  const [rating, setRating] = useState("");
  const [memo, setMemo] = useState("");



 const [posts, setPosts] = useState([]);

import { onSnapshot } from "firebase/firestore";

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPosts(data);
  });

  return () => unsubscribe();
}, []);
  const filteredPosts = posts.filter(
    (post) => post.station === selectedStation
  );

 const addPost = async () => {
  if (!shopName || !rating) return;

  const newPost = {
    station: selectedStation,
    shopName,
    genre,
    rating: Number(rating),
    memo,
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "posts"), newPost);

setPosts([...posts, { id: docRef.id, ...newPost }]);

  setShopName("");
  setGenre("家系");
  setRating("");
  setMemo("");
};

const deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  setPosts(posts.filter((post) => post.id !== id));
};

  const getPostCount = (stationName) => {
    return posts.filter((post) => post.station === stationName).length;
  };

  return (
    <div style={{ maxWidth: "900px", margin: "30px auto", padding: "20px" }}>
      <h1>ラーメン路線図マップ</h1>
      <p>駅を選ぶと、その駅周辺のラーメン記録を見られます。</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <h2>路線図</h2>

          <svg width="520" height="360" style={{ background: "#fafafa" }}>
            <line x1="260" y1="80" x2="180" y2="170" stroke="#333" strokeWidth="4" />
            <line x1="180" y1="170" x2="210" y2="280" stroke="#333" strokeWidth="4" />
            <line x1="260" y1="80" x2="410" y2="110" stroke="#333" strokeWidth="4" />
            <line x1="410" y1="110" x2="390" y2="230" stroke="#333" strokeWidth="4" />
            <line x1="390" y1="230" x2="210" y2="280" stroke="#333" strokeWidth="4" />

            {stations.map((station) => (
              <g
                key={station.id}
                onClick={() => setSelectedStation(station.name)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={station.x}
                  cy={station.y}
                  r="18"
                  fill={selectedStation === station.name ? "#ff7043" : "white"}
                  stroke="#333"
                  strokeWidth="3"
                />
                <text
                  x={station.x}
                  y={station.y - 28}
                  textAnchor="middle"
                  fontSize="14"
                >
                  {station.name}
                </text>
                <text
                  x={station.x}
                  y={station.y + 5}
                  textAnchor="middle"
                  fontSize="12"
                >
                  {getPostCount(station.name)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <h2>{selectedStation}駅周辺</h2>

          <h3>投稿する</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            <input
              placeholder="店名"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />

            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option>家系</option>
              <option>二郎系</option>
              <option>醤油</option>
              <option>味噌</option>
              <option>塩</option>
              <option>豚骨</option>
              <option>つけ麺</option>
              <option>油そば</option>
            </select>

            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="評価 例: 4.5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />

            <textarea
              placeholder="メモ"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />

            <button onClick={addPost}>追加</button>
          </div>

          <hr style={{ margin: "20px 0" }} />

          <h3>投稿一覧</h3>
          {filteredPosts.length === 0 ? (
            <p>まだ投稿がありません。</p>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <strong>{post.shopName}</strong>
                <div>ジャンル: {post.genre}</div>
                <div>評価: ★{post.rating}</div>
                <div>メモ: {post.memo}</div>
                <button onClick={() => deletePost(post.id)}>削除</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;