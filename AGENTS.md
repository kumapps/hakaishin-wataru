# 作業ルール

- コミット前にGitの作成者名とメールアドレスを確認する。AuthorとCommitterの両方が以下の設定になっていることを確認する。
  - `user.name = kumapps`
  - `user.email = 353929867+kumapps@users.noreply.github.com`
- 個人の本名、個人用メールアドレス、その他の個人情報を、コミット内容やコミットメタデータに含めない。
- コミットには必ず `353929867+kumapps@users.noreply.github.com` を使用する。
- 新しい作業環境でも毎回Git設定を確認し、必要に応じてこのリポジトリのローカル設定に上記の値を設定する。
- コミット前に `git config --get user.name`、`git config --get user.email`、`git var GIT_AUTHOR_IDENT`、`git var GIT_COMMITTER_IDENT` を確認する。
- 既存のGit履歴は変更しない。
