import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";



const chuoStations = [
  { id: 1, name: "神田", x: 80, y: 80 },
  { id: 2, name: "新宿", x: 190, y: 80 },
  { id: 3, name: "中野", x: 300, y: 80 },
  { id: 4, name: "高円寺", x: 410, y: 80 },
  { id: 5, name: "荻窪", x: 520, y: 80 },
  { id: 6, name: "吉祥寺", x: 520, y: 230, label: "bottom" },
  { id: 7, name: "三鷹", x: 410, y: 230, label: "bottom" },
  { id: 8, name: "東小金井", x: 300, y: 230, label: "bottom" },
  { id: 9, name: "武蔵小金井", x: 190, y: 230, label: "bottom" },
  { id: 10, name: "国分寺", x: 80, y: 230, label: "bottom"},
];

const yamanoteStations = [
  { id: 1, name: "原宿", x: 200, y: 80, label: "top"},
  { id: 2, name: "新宿", x: 280, y: 80, label: "top" },
  { id: 3, name: "新大久保", x: 360, y: 80, label: "top" },
  { id: 4, name: "高田馬場", x: 400, y: 130, label: "right" },
  { id: 5, name: "池袋", x: 400, y: 190, label: "right" },
  { id: 6, name: "上野", x: 400, y: 250, label: "right" },
  { id: 7, name: "秋葉原", x: 320, y: 280, label: "bottom" },
  { id: 8, name: "東京", x: 260, y: 280, label: "bottom" },
  { id: 9, name: "新橋", x: 200, y: 280, label: "bottom" },
  { id: 10, name: "品川", x: 150, y: 280, label: "bottom" },
  { id: 11, name: "目黒", x: 150, y: 220, label: "right" },
  { id: 12, name: "恵比寿", x: 150, y: 170, label: "right" },
  { id: 13, name: "渋谷", x: 150, y: 120, label: "right" },
];

const denentoshiStations = [
  { id: 1, name: "長津田", x: 80, y: 80 },
  { id: 2, name: "あざみ野", x: 200, y: 80 },
  { id: 3, name: "たまプラーザ", x: 320, y: 80 },
  { id: 4, name: "溝の口", x: 440, y: 80 },
  { id: 5, name: "二子玉川", x: 440, y: 220, label: "right" },
  { id: 6, name: "三軒茶屋", x: 320, y: 220 },
  { id: 7, name: "池尻大橋", x: 200, y: 220 },
  { id: 8, name: "渋谷", x: 80, y: 220 },
  { id: 9, name: "表参道", x: 80, y: 360, label: "bottom" },
  { id: 10, name: "永田町", x: 200, y: 360, label: "bottom" },
  { id: 11, name: "神保町", x: 320, y: 360, label: "bottom" },
  { id: 12, name: "大手町", x: 440, y: 360, label: "bottom" },
];


function App() {
const [selectedLine, setSelectedLine] = useState("中央線");

let stations = chuoStations;

if (selectedLine === "山手線") {
  stations = yamanoteStations;
} else if (selectedLine === "田園都市線・半蔵門線") {
  stations = denentoshiStations;
}

  const [selectedStation, setSelectedStation] = useState("新宿");
  const [shopName, setShopName] = useState("");
  const [genre, setGenre] = useState("家系");
  const [rating, setRating] = useState("");
  const [memo, setMemo] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null); 



if (selectedLine === "山手線") {
  stations = yamanoteStations;
} else if (selectedLine === "田園都市線・半蔵門線") {
  stations = denentoshiStations;
}
  
  const login = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

const logout = async () => {
  await signOut(auth);
};

const defaultPosts = [
  {
    id: 1,
    station: "新宿",
    shopName: "らぁ麺 はやし田",
    genre: "醤油",
    rating: 4.2,
    memo: "綺麗めな醤油。駅近で行きやすい。",
  },
];



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

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();
}, []);

  const filteredPosts = posts.filter(
    (post) => post.station === selectedStation
  );

 const addPost = async () => {
  console.log("追加ボタン押された");

  if (!shopName || !rating) {
    alert("店名と評価を入力して");
    return;
  }

  let imageUrl = "";

if (imageFile) {
  const imageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
  await uploadBytes(imageRef, imageFile);
  imageUrl = await getDownloadURL(imageRef);
}

  const newPost = {
    station: selectedStation,
    shopName,
    genre,
    rating: Number(rating),
    memo,
    imageUrl,
    createdAt: new Date(),
    userId: user.uid,
    userName: user.displayName || "名前なし",
  };

  try {
    await addDoc(collection(db, "posts"), newPost);
    console.log("Firebase保存成功"); 

    setShopName("");
    setGenre("家系");
    setRating("");
    setMemo("");
    setImageFile(null);
  } catch (error) {
    console.error("投稿エラー:", error);
    alert("投稿に失敗しました");
  }
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

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
  <button
    onClick={() => setSelectedLine("中央線")}
    style={{
      background: selectedLine === "中央線" ? "#ff7043" : "#eee",
    }}
  >
    中央線
  </button>

  <button
    onClick={() => setSelectedLine("山手線")}
    style={{
      background: selectedLine === "山手線" ? "#ff7043" : "#eee",
    }}
  >
    山手線
  </button>

  <button
    onClick={() => setSelectedLine("田園都市線・半蔵門線")}
    style={{
      background:
        selectedLine === "田園都市線・半蔵門線" ? "#ff7043" : "#eee",
    }}
  >
    田園都市線・半蔵門線
  </button>
</div>

{user ? (
  <div>
    <span>{user.displayName}</span>
  <button onClick={logout}>ログアウト</button>
  </div>
) : (
  <button onClick={login}>Googleでログイン</button>
)}

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

          <svg width="620" height="430" style={{ background: "#fafafa" }}>
          {selectedLine === "中央線" && (
  <>
    {/* 上段 */}
    <line x1="80" y1="80" x2="520" y2="80" stroke="#333" strokeWidth="4" />
    {/* 右の縦 */}
    <line x1="520" y1="80" x2="520" y2="230" stroke="#333" strokeWidth="4" />
    {/* 下段 */}
    <line x1="520" y1="230" x2="80" y2="230" stroke="#333" strokeWidth="4" />
  </>
)}
{selectedLine === "山手線" && (
  <>
    {/* 上 */}
    <line x1="150" y1="80" x2="400" y2="80" stroke="#333" strokeWidth="4" />
    {/* 右 */}
    <line x1="400" y1="80" x2="400" y2="280" stroke="#333" strokeWidth="4" />
    {/* 下 */}
    <line x1="400" y1="280" x2="150" y2="280" stroke="#333" strokeWidth="4" />
    {/* 左 */}
    <line x1="150" y1="280" x2="150" y2="80" stroke="#333" strokeWidth="4" />
  </>
)}
{selectedLine === "田園都市線・半蔵門線" && (
  <>
    <line x1="80" y1="80" x2="440" y2="80" stroke="#333" strokeWidth="4" />
    <line x1="440" y1="80" x2="440" y2="220" stroke="#333" strokeWidth="4" />
    <line x1="440" y1="220" x2="80" y2="220" stroke="#333" strokeWidth="4" />
    <line x1="80" y1="220" x2="80" y2="360" stroke="#333" strokeWidth="4" />
    <line x1="80" y1="360" x2="440" y2="360" stroke="#333" strokeWidth="4" />
  </>
)}
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
                  x={
                    station.label === "left"
                      ? station.x - 30
                      : station.label === "right"
                      ? station.x + 30
                      : station.x
                  }
                  y={
                    station.label === "bottom"
                      ? station.y + 36
                      : station.label === "left" || station.label === "right"
                      ? station.y + 5
                      : station.y - 28
                  }
                  textAnchor={
                    station.label === "left"
                      ? "end"
                      : station.label === "right"
                      ? "start"
                      : "middle"
                  }
                  fontSize="14"
>               
                  {station.name}
</                text>
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
        {!user && <p>投稿するにはログインしてください</p>}

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
            {/*  戻したら画像追加できる　一枚０．３円とか
            <input
               type="file"
               accept="image/*"
               onChange={(e) => setImageFile(e.target.files[0])}
/>
            */}
            <button onClick={addPost} disabled={!user}>
              追加
            </button>
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
                <div>投稿者: {post.userName || "不明"}</div>
                <div>ジャンル: {post.genre}</div>
                <div>評価: ★{post.rating}</div>
                <div>メモ: {post.memo}</div>

              {post.imageUrl && (
               <img
               src={post.imageUrl}
               alt={post.shopName}
               style={{
                        width: "100%",
                        maxWidth: "300px",
                        borderRadius: "8px",
                        marginTop: "8px",
                     }}
  />
             )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;