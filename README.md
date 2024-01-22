# gitlab-backuper
Скрипт выгружающий все ваше активити (коммиты, ишью комменты, mr комменты)

## Как использовать
Должна быть установлена NodeJS

Сначала подгружаем в файле .env складываем такие переменные
```
GITLAB_API_TOKEN=
GITLAB_API_BASE_URL=https://gitlab.com/api/v4
GITLAB_USER_ID=
```

Устанавливаем зависимости
```bash
npm i
```

И запускаем
```bash
npm start
```

Полученный бэкап сохраняется в user_commits.json, user_issue_comments.json, user_mr_comments.json

Powered by ChatGPT, поэтому что-то может не работать =)
