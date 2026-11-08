# v0.9.25 美術・音の素材記録

## 導入範囲

2026-10-16にユーザーが採用した和風絵巻調の戦闘見本を基準に制作。組み込みは新規透過2D素材と既存Canvas地形描画の組み合わせです。見本の背景全体を一枚絵として使用していません。立体的な地形の描き込み・水面・多方向の歩行／攻撃フレームは今後の制作範囲です。

src/assets/characters-source.png：8体の透過原稿。wataru／sumire／guardian／plant／wind／water／boss／reaper.webp：等分したセルを余白トリム・縮小・圧縮した描画用素材。
src/assets/floor-source.png／floor.webp：真上から描いた石畳の原稿と描画用素材。
src/assets/props-source.png：灯籠・柱・門・紅葉の透過原稿。各webpは分離した描画用素材。

原稿は組み込みの画像生成機能で生成し、透過を保持。CLI画像生成・外部ゲーム素材は使用していません。Sharpでの矩形分離・配布圧縮のみ実施。src/sprites.jsonは旧素材の互換フォールバックとして残しています。

## 最終制作プロンプトセット

1. 人物／敵原稿：Japanese painted picture-scroll fantasy RPG transparent sprite atlas, regular four columns by two rows, full bodies, separate cells, generous alpha gutters, expressive ink outlines and painterly cel shading. Top row Wataru boy age9 teal haori red scarf ivory sash dark trousers sword facing left; Sumire girl age6 purple and ivory shrine-adventurer outfit purple ribbon folding fan facing left; mossy carved stone guardian facing right; tangled root and leaf monster facing right. Bottom row pale jade wind fox; turquoise water spirit; massive fiery stone oni guardian with red sacred rope; violet masked shadow guardian with crescent staff. Child friendly, original characters, no text, no UI, no backdrop.
2. 原稿の配置修正：Preserve all eight identities and style, exact 4x2 grid. Recompose each complete character into its own cell with wide empty transparent gutters, complete weapons and tails, nothing crossing cell boundaries. Feet at consistent baseline. Layout correction only, no redesign.
3. 石畳：Square seamless orthographic directly overhead ancient shrine stone paving texture, muted sand-grey irregular slabs, fine cracks, subtle olive moss, Japanese ink and watercolor/cel shading, even low-contrast lighting, no perspective, no buildings, no actors, no text. Palette warm grey beige, olive, ink grey, pale stone highlights. Walkable flat decorative ground.
4. 背景小物：Transparent regular 2x2 atlas, separate upright objects, elevated three-quarter view, Japanese hand-painted fantasy ink outlines. Top left mossy stone lantern with amber window; top right aged mossy carved stone pillar, no readable writing. Bottom left red-brown shrine gateway with navy ceramic roof and sacred rope, open transparent passage. Bottom right red maple with slender trunk and mossy rock. Whole objects, empty gutters, no text/UI/background.

生成方法：組み込み画像生成。採用見本は会話内の2026-10-16戦闘画面。最終素材はこのZIPのsrc/assets内に同梱。

## 音

src/audio.tsが新規制作の五音音階フレーズをWeb Audioで演奏。探索・通常戦闘・強敵の3系統と勝利フレーズ。短い減衰の三角波／正弦波と低音パルスを使う録音不要の試作音です。実際の琴・笛・太鼓の録音、外部曲、Suno楽曲、歌詞は含みません。

音量・消音はkanji-dungeon.audio.v1へ独立保存。進行セーブの初期化とは別。ユーザーの最初のタップで音声を有効化し、非表示／一時停止中はAudioContextを停止。音声非対応でもゲーム進行は止めません。

完成楽曲・効果音の録音や全方向アニメーションは未完了。ゲーム内で見た目・音の大きさ・煩わしさを確認し、次の制作へ反映します。


## v0.9.26

画像と音はv0.9.25からバイト一致で維持。新規生成／動作素材差替えなし。筆画素材追加はATTRIBUTIONS.mdを参照。
