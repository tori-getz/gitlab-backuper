require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');

const gitlabToken = process.env.GITLAB_API_TOKEN;
const gitlabApiBaseUrl = process.env.GITLAB_API_BASE_URL;
const userId = process.env.GITLAB_USER_ID;

const fetchData = async (url, allData = [], page = 1, dataType = '') => {
    try {
        console.log(`Загрузка данных типа '${dataType}', страница ${page}...`);
        const response = await axios.get(url, {
            headers: { 'PRIVATE-TOKEN': gitlabToken }
        });
        const data = response.data;
        allData.push(...data);

        if (response.headers['x-next-page'] && response.headers['x-next-page'].length > 0) {
            const nextPageUrl = `${url}&page=${response.headers['x-next-page']}`;
            return await fetchData(nextPageUrl, allData, parseInt(response.headers['x-next-page']), dataType);
        } else {
            return allData;
        }
    } catch (error) {
        console.error(`Ошибка при загрузке данных типа '${dataType}':`, error);
        return allData;
    }
};

const getComments = async (type, items) => {
    let comments = [];
    for (const item of items) {
        const url = `${gitlabApiBaseUrl}/projects/${item.project_id}/${type}/${item.iid}/notes`;
        const itemComments = await fetchData(url, [], 1, `${type} comments`);
        comments = [...comments, ...itemComments.filter(comment => comment.author.id == userId)];
    }
    return comments;
};

const saveData = async (data, filename) => {
    try {
        await fs.writeJson(filename, data);
        console.log(`Данные сохранены в файл ${filename}`);
    } catch (error) {
        console.error('Ошибка при сохранении файла:', error);
    }
};

const getUserActivity = async () => {
    // Получаем проекты пользователя
    const projects = await fetchData(`${gitlabApiBaseUrl}/users/${userId}/projects`, [], 1, 'projects');

    // Получаем коммиты пользователя в этих проектах
    let allCommits = [];
    for (const project of projects) {
        const commits = await fetchData(`${gitlabApiBaseUrl}/projects/${project.id}/repository/commits?author_id=${userId}`, [], 1, 'commits');
        allCommits.push(...commits);
    }
    await saveData(allCommits, 'user_commits.json');

    // Получаем merge requests и issues, созданные пользователем
    const mergeRequests = await fetchData(`${gitlabApiBaseUrl}/merge_requests?scope=all&state=all&author_id=${userId}`, [], 1, 'merge requests');
    const issues = await fetchData(`${gitlabApiBaseUrl}/issues?scope=all&state=all&author_id=${userId}`, [], 1, 'issues');

    // Получаем комментарии к merge requests и issues
    const mrComments = await getComments('merge_requests', mergeRequests);
    const issueComments = await getComments('issues', issues);

    // Сохраняем данные
    if (mrComments.length > 0) {
        await saveData(mrComments, 'user_mr_comments.json');
    } else {
        console.log('Нет данных для сохранения комментариев к Merge Requests');
    }

    if (issueComments.length > 0) {
        await saveData(issueComments, 'user_issue_comments.json');
    } else {
        console.log('Нет данных для сохранения комментариев к Issues');
    }
};

getUserActivity();
