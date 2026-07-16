const express = require('express');
app.use(cors({
    origin: "https://willowy-biscuit-14a403.netlify.app/"
}));
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'landing.html'));
});

app.get('/category', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'category.html'));
});

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { posts: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/posts', (req, res) => {
    const data = loadData();
    res.json(data.posts);
});

app.post('/api/posts', (req, res) => {
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    
    const data = loadData();
    const newPost = {
        id: uuidv4(),
        title,
        content,
        category: category || 'general',
        author: 'Anonymous',
        createdAt: new Date().toISOString(),
        replies: [],
        views: 0
    };
    
    data.posts.unshift(newPost);
    saveData(data);
    res.status(201).json(newPost);
});

app.get('/api/posts/:id', (req, res) => {
    const data = loadData();
    const post = data.posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    post.views += 1;
    saveData(data);
    res.json(post);
});

app.post('/api/posts/:id/replies', (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Reply content required' });
    
    const data = loadData();
    const post = data.posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const newReply = {
        id: uuidv4(),
        content,
        author: 'Anonymous',
        createdAt: new Date().toISOString()
    };
    
    post.replies.push(newReply);
    saveData(data);
    res.status(201).json(newReply);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});