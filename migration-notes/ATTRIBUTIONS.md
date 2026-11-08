# v0.9.26 追加出典

追加115字はKanjiVG © Ulrich Apel and contributors、CC BY-SA 3.0。
固定リビジョン：70a0b7ae0c18ceb5cb358274b029cce0234a43bc。
元SVGの筆画d属性をJSON化し、既存と同じ109座標系で下書き・ガイド・書き順に使用。
変更部分の筆画データも同じCC BY-SA 3.0で提供。原SVG・SOURCE.json・COPYINGはreference/kanjivg。
https://kanjivg.tagaini.net/
https://creativecommons.org/licenses/by-sa/3.0/

以下は採用した独立AI v0.4の出典記録。独立画面の説明は当時の成果物についてです。

# 出典と一式の範囲

## 手書き認識・表示コード

漢字ダンジョンのゲームv0.9.3から、認識比較に必要な部分だけをコピーした検証用コードです。ゲーム本体はこの一式に含みません。
v0.2の判定はまだ厳しい旧基準です。最新の方針は `HANDOVER.md` を参照してください。

## 実行基盤

ONNX Runtime Web 1.20.1、Microsoft and contributors、MIT。
`src/assets/ORT_LICENSE.txt` および単独HTML内にライセンス本文があります。
配布元：https://github.com/microsoft/onnxruntime

## お手本

KanjiVG © Ulrich Apel and contributors、CC BY-SA 3.0。
https://kanjivg.tagaini.net/
https://creativecommons.org/licenses/by-sa/3.0/

ゲームの認識用データに変換した71字のSVGパスが `src/assets/legacy-recognizer.js` に含まれます。水の追加形状や認識ロジックは検証用の独自処理です。

## AIモデル

LT8 / japanese-handwriting-onnx。モデル重みはこの一式に同梱しません。固定した取得先・サイズ・ハッシュは `MODEL_INFO.json` を参照してください。
https://huggingface.co/LT8/japanese-handwriting-onnx
モデル学習元：ETL Character Database（AIST）。
Electrotechnical Laboratory, Japanese Technical Committee for Optical Character Recognition, ETL Character Database, 1973–1984。
https://etlcdb.db.aist.go.jp/download2/

モデルの再配布や本番への利用条件は別途確認が必要です。元の学習画像も同梱しません。

## 開発テスト用の依存

`svg-path-properties` はSVGの軌跡サンプリングを行う単体テスト用です。ライブラリのバイナリは一式に同梱せず、必要なら開発環境へインストールしてください。
HTMLを使うだけの場合は不要です。実機の自動操作を行うブラウザ環境も含みません。

## 含まないもの

ユーザーの写真、実際の手書き結果JSON、ゲームのセーブ、モデル重み、ETL原画像、以前の一時作業フォルダ、保存用の認証情報は含みません。
`qa/` の結果は、お手本・合成入力の確認結果です。子どもの手書き精度の測定ではありません。
