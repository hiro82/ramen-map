import { useState, useEffect } from "react";

import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
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

  // 🔥 リアルタイム取得
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

  // 🔥 投稿
  const addPost = async () => {
    if (!shopName || !rating) {
      alert("入力して");
      return;
    }

    const newPost = {
      station: selectedStation,
      shopName,
      genre,
      rating: Number(rating),
      memo,
      createdAt: new Date(),
    };

    try {
      const docRef = await addDoc(collection(db, "posts"), newPost);

      setPosts([...posts, { id: docRef.id, ...newPost }]);

      setShopName("");
      setGenre("家系");
      setRating("");
      setMemo("");
    } catch (e) {
      console.error(e);
      alert("投稿失敗");
    }
  };

  // 🔥 削除
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
        }}
      >
        <div style={{ border: "1px solid #ddd", padding: "16px" }}>
          <h2>路線図</h2>

          <svg width="520" height="360">
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
                />
                <text x={station.x} y={station.y - 25} textAnchor="middle">
                  {station.name}
                </text>
                <text x={station.x} y={station.y + 5} textAnchor="middle">
                  {getPostCount(station.name)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div style={{ border: "1px solid #ddd", padding: "16px" }}>
          <h2>{selectedStation}駅</h2>

          <input
            placeholder="店名"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option>家系</option>
            <option>二郎系</option>
            <option>醤油</option>
          </select>

          <input
            placeholder="評価"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />

          <textarea
            placeholder="メモ"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <button onClick={addPost}>追加</button>

          {filteredPosts.map((post) => (
            <div key={post.id}>
              <strong>{post.shopName}</strong>
              <button onClick={() => deletePost(post.id)}>削除</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;